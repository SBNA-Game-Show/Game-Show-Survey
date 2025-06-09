print("Importing Flask...")
from flask import Flask, jsonify, render_template
print("Importing analytics...")
from analytics import process_all_questions
from similarity_processor import process_all_questions_similarity
from ranking_processor import process_all_questions_ranking
import os
from dotenv import load_dotenv

# Import MongoDB functions
try:
    print("Importing MongoDB setup...")
    from mongodb_setup import fetch_questions_from_db, update_questions_in_db, test_mongodb_connection
    MONGODB_AVAILABLE = True
    print("MongoDB module loaded successfully")
except ImportError as e:
    print(f"MongoDB module not available: {e}")
    MONGODB_AVAILABLE = False

print("Loading .env...")

# Load environment variables
load_dotenv()

app = Flask(__name__)

print(f"MongoDB available: {MONGODB_AVAILABLE}")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "Flask server running",
        "mongodb_available": MONGODB_AVAILABLE,
        "processing_type": "direct_database_processing"
    })

@app.route('/api/process-questions', methods=['GET'])
def process_questions():
    """
    Main endpoint to process all questions:
    1. Fetch all questions from database
    2. Process answers (merge similar, rank, score)
    3. Update questions back to database
    """
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        }), 500
    
    try:
        print("Starting question processing...")
        
        # Step 1: Fetch all questions from database
        print("Fetching questions from database...")
        questions = fetch_questions_from_db()
        
        if not questions:
            return jsonify({
                "success": False,
                "error": "No questions found in database or connection failed"
            }), 404
        
        print(f"Fetched {len(questions)} questions from database")
        
        # Step 2: Process all questions
        print("Processing questions (merging similar answers, ranking, scoring)...")
        processed_questions = process_all_questions(questions)
        
        print(f"Processed {len(processed_questions)} questions")
        
        # Step 3: Update questions back to database
        print("Updating questions in database...")
        update_result = update_questions_in_db(processed_questions)
        
        if update_result["success"]:
            return jsonify({
                "success": True,
                "message": "Questions processed and updated successfully",
                "processing_summary": {
                    "total_questions": len(questions),
                    "questions_processed": len(processed_questions),
                    "questions_updated": update_result["updated_count"],
                    "questions_failed": update_result["failed_count"]
                },
                "update_result": update_result
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to update questions in database",
                "details": update_result
            }), 500
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Internal server error during processing",
            "details": str(e)
        }), 500

@app.route('/api/test-connection', methods=['GET'])
def test_connection():
    """Test MongoDB connection and show data structure"""
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB module not available"
        })
    
    try:
        print("Testing MongoDB connection...")
        test_result = test_mongodb_connection()
        
        return jsonify({
            "success": test_result,
            "message": "MongoDB connection test completed",
            "details": "Check server logs for detailed test results"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"MongoDB connection test failed: {str(e)}",
            "details": str(e)
        })

@app.route('/api/fetch-questions', methods=['GET'])
def fetch_questions():
    """Fetch all questions from database without processing"""
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        })
    
    try:
        print("Fetching questions from database...")
        
        # Use direct MongoDB connection with proper serialization
        from mongodb_setup import MongoDBHandler
        import json
        from bson import json_util
        
        mongo_handler = MongoDBHandler()
        
        if not mongo_handler.connect():
            return jsonify({
                "success": False,
                "error": "Failed to connect to MongoDB"
            }), 500
        
        try:
            # Fetch questions using MongoDB's JSON utility for proper serialization
            cursor = mongo_handler.collection.find({})
            
            # Convert to JSON using MongoDB's json_util, then parse back
            questions_json = json_util.dumps(list(cursor))
            questions = json.loads(questions_json)
            
            # Convert MongoDB's special $oid format to simple strings
            for question in questions:
                if '_id' in question and '$oid' in str(question['_id']):
                    question['_id'] = question['_id']['$oid']
                
                # Handle datetime fields
                for date_field in ['createdAt', 'updatedAt']:
                    if date_field in question and question[date_field] and '$date' in str(question[date_field]):
                        question[date_field] = question[date_field]['$date']
                
                # Ensure answers field exists
                if 'answers' not in question or question['answers'] is None:
                    question['answers'] = []
            
            mongo_handler.close()
            
            if not questions:
                return jsonify({
                    "success": False,
                    "error": "No questions found in database"
                }), 404
            
            # Prepare summary
            questions_with_answers = [q for q in questions if q.get('answers')]
            total_answers = sum(len(q.get('answers', [])) for q in questions)
            
            return jsonify({
                "success": True,
                "data": questions,
                "summary": {
                    "total_questions": len(questions),
                    "questions_with_answers": len(questions_with_answers),
                    "total_answers": total_answers
                }
            })
            
        finally:
            mongo_handler.close()
        
    except Exception as e:
        print(f"Fetch questions error: {str(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            "success": False,
            "error": "Failed to fetch questions",
            "details": str(e)
        }), 500

@app.route('/api/sample-process', methods=['GET'])
def sample_process():
    """Process only a few questions for testing"""
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        })
    
    try:
        print("Fetching sample questions for testing...")
        all_questions = fetch_questions_from_db()
        
        if not all_questions:
            return jsonify({
                "success": False,
                "error": "No questions found in database"
            })
        
        # Take only first 3 questions for testing
        sample_questions = all_questions[:3]
        
        print(f"Processing {len(sample_questions)} sample questions...")
        processed_questions = process_all_questions(sample_questions)
        
        return jsonify({
            "success": True,
            "message": f"Sample processing completed for {len(processed_questions)} questions",
            "sample_data": processed_questions,
            "note": "This is a sample - use /api/process-questions to process all questions"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Sample processing failed",
            "details": str(e)
        })

@app.route('/api/view-processed-data', methods=['GET'])
def view_processed_data():
    """View how the processed data looks in the database"""
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        })
    
    try:
        print("Fetching processed questions to show structure...")
        questions = fetch_questions_from_db()
        
        if not questions:
            return jsonify({
                "success": False,
                "error": "No questions found in database"
            })
        
        # Take first 2 questions to show structure
        sample_questions = questions[:2]
        
        # Format the response to clearly show the processed structure
        formatted_data = []
        
        for question in sample_questions:
            formatted_question = {
                "question_id": question['_id'],
                "questionId": question.get('questionId', 'Auto-generated or not set'),
                "question_text": question.get('question', ''),
                "question_type": question.get('questionType', ''),
                "question_category": question.get('questionCategory', ''),
                "question_level": question.get('questionLevel', ''),
                "times_skipped": question.get('timesSkipped', 0),
                "total_answers": len(question.get('answers', [])),
                "processed_answers": []
            }
            
            # Show each answer with its processed fields
            for answer in question.get('answers', []):
                processed_answer = {
                    "answerId": answer.get('answerId', ''),
                    "answer_text": answer.get('answer', ''),
                    "isCorrect": answer.get('isCorrect', False),
                    "responseCount": answer.get('responseCount', 0),
                    "rank": answer.get('rank', 0),
                    "score": answer.get('score', 0)
                }
                formatted_question["processed_answers"].append(processed_answer)
            
            # Sort answers by rank to show ranking clearly
            formatted_question["processed_answers"].sort(key=lambda x: x["rank"])
            
            formatted_data.append(formatted_question)
        
        return jsonify({
            "success": True,
            "message": "Showing processed data structure from database",
            "total_questions_in_db": len(questions),
            "sample_size": len(formatted_data),
            "processed_data_structure": formatted_data,
            "explanation": {
                "ranking": "Answers ranked by isCorrect=True first, then by responseCount",
                "scoring": "Top 5 answers get scores (100, 80, 60, 40, 20), rest get 0",
                "merging": "Similar answers (75% similarity) have been merged",
                "priority": "When merging, isCorrect=True answers take priority",
                "rank_system": "Processed answers ranked 1, 2, 3... (schema min: 1), unprocessed have rank: 0",
                "answerId": "Currently empty/null, using answer text for processing"
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to view processed data",
            "details": str(e)
        })

@app.route('/similarity')
def similarity_page():
    if not MONGODB_AVAILABLE:
        return "MongoDB not available", 500
    questions = fetch_questions_from_db()
    processed = process_all_questions_similarity(questions)
    return render_template('similarity.html', questions=processed)

@app.route('/ranking')
def ranking_page():
    if not MONGODB_AVAILABLE:
        return "MongoDB not available", 500
    questions = fetch_questions_from_db()
    processed = process_all_questions_ranking(questions)
    return render_template('ranking.html', questions=processed)

print("Starting Flask app...")

if __name__ == '__main__':
    # Test MongoDB on startup if available
    if MONGODB_AVAILABLE:
        print("\nTesting MongoDB connection on startup...")
        try:
            success = test_mongodb_connection()
            if success:
                print("MongoDB ready for use!")
            else:
                print("MongoDB test failed - check connection")
        except Exception as e:
            print(f"MongoDB startup test error: {e}")
    
    print(f"\nServer starting on http://localhost:5000")
    print(f"Main processing endpoint: http://localhost:5000/api/process-questions")
    print(f"Test connection: http://localhost:5000/api/test-connection")
    print(f"Fetch questions: http://localhost:5000/api/fetch-questions")
    print(f"Sample process: http://localhost:5000/api/sample-process")
    print(f"View processed data: http://localhost:5000/api/view-processed-data")
    
    app.run(host='0.0.0.0', port=5000, debug=True)