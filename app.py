print("Importing Flask...")
from flask import Flask, jsonify
print("Importing similarity and ranking processors...")
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
        "processing_type": "separate_similarity_and_ranking_processing",
        "available_endpoints": {
            "similarity_processing": "/api/process-similarity",
            "ranking_processing": "/api/process-ranking", 
            "test_connection": "/api/test-connection",
            "fetch_questions": "/api/fetch-questions",
            "view_ranked_answers": "/api/view-ranked-answers",
            "view_processing_status": "/api/view-processing-status",
            "view_processed_data": "/api/view-processed-data"
        }
    })

@app.route('/api/process-similarity', methods=['GET'])
def process_similarity():
    """
    Process similarity and merging for all questions:
    1. Fetch all questions from database
    2. Merge similar answers (delete duplicates, combine responseCounts)
    3. Update questions back to database
    
    Purpose: Run after participant submissions to merge similar answers
    """
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        }), 500
    
    try:
        print("Starting similarity processing...")
        
        # Step 1: Fetch all questions from database
        print("Fetching questions from database...")
        questions = fetch_questions_from_db()
        
        if not questions:
            return jsonify({
                "success": False,
                "error": "No questions found in database or connection failed"
            }), 404
        
        print(f"Fetched {len(questions)} questions from database")
        
        # Step 2: Process similarity merging
        print("Processing similarity merging (removing duplicates, combining counts)...")
        processed_questions = process_all_questions_similarity(questions)
        
        print(f"Processed {len(processed_questions)} questions for similarity")
        
        # Step 3: Update questions back to database
        print("Updating questions in database...")
        update_result = update_questions_in_db(processed_questions)
        
        if update_result["success"]:
            return jsonify({
                "success": True,
                "message": "Similarity processing completed successfully",
                "processing_summary": {
                    "total_questions": len(questions),
                    "questions_processed": len(processed_questions),
                    "questions_updated": update_result["updated_count"],
                    "questions_failed": update_result["failed_count"]
                },
                "update_result": update_result,
                "note": "Similar answers have been merged. Use /api/process-ranking after admin approval."
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to update questions in database after similarity processing",
                "details": update_result
            }), 500
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Internal server error during similarity processing",
            "details": str(e)
        }), 500

@app.route('/api/process-ranking', methods=['GET'])
def process_ranking():
    """
    Process ranking and scoring for approved answers:
    1. Fetch all questions from database
    2. Rank and score only answers where isCorrect=True
    3. Update questions back to database
    
    Purpose: Run after admin approval to rank and score correct answers
    """
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        }), 500
    
    try:
        print("Starting ranking and scoring processing...")
        
        # Step 1: Fetch all questions from database
        print("Fetching questions from database...")
        questions = fetch_questions_from_db()
        
        if not questions:
            return jsonify({
                "success": False,
                "error": "No questions found in database or connection failed"
            }), 404
        
        print(f"Fetched {len(questions)} questions from database")
        
        # Step 2: Process ranking and scoring for approved answers
        print("Processing ranking and scoring (only for isCorrect=True answers)...")
        processed_questions = process_all_questions_ranking(questions)
        
        print(f"Processed {len(processed_questions)} questions for ranking")
        
        # Step 3: Update questions back to database
        print("Updating questions in database...")
        update_result = update_questions_in_db(processed_questions)
        
        if update_result["success"]:
            return jsonify({
                "success": True,
                "message": "Ranking and scoring completed successfully",
                "processing_summary": {
                    "total_questions": len(questions),
                    "questions_processed": len(processed_questions),
                    "questions_updated": update_result["updated_count"],
                    "questions_failed": update_result["failed_count"]
                },
                "update_result": update_result,
                "note": "Only answers with isCorrect=True have been ranked and scored. Analytics ready."
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to update questions in database after ranking processing",
                "details": update_result
            }), 500
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Internal server error during ranking processing",
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
                else:
                    # Handle answer _id fields
                    for answer in question['answers']:
                        if '_id' in answer and '$oid' in str(answer['_id']):
                            answer['_id'] = answer['_id']['$oid']
            
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

@app.route('/api/view-ranked-answers', methods=['GET'])
def view_ranked_answers():
    """
    Show only questions that have ranked answers (rank > 0).
    This endpoint helps you see which answers have been processed through both:
    1. Similarity processing (merged)
    2. Ranking processing (ranked and scored)
    """
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        })
    
    try:
        print("Fetching questions with ranked answers...")
        questions = fetch_questions_from_db()
        
        if not questions:
            return jsonify({
                "success": False,
                "error": "No questions found in database"
            })
        
        # Filter questions that have ranked answers
        questions_with_rankings = []
        total_ranked_answers = 0
        
        for question in questions:
            answers = question.get('answers', [])
            ranked_answers = [answer for answer in answers if answer.get('rank', 0) > 0]
            
            if ranked_answers:
                # Sort ranked answers by rank
                ranked_answers.sort(key=lambda x: x.get('rank', 0))
                
                formatted_question = {
                    "question_id": question['_id'],
                    "question_text": question.get('question', ''),
                    "question_category": question.get('questionCategory', ''),
                    "question_level": question.get('questionLevel', ''),
                    "total_answers": len(answers),
                    "ranked_answers_count": len(ranked_answers),
                    "ranked_answers": []
                }
                
                for answer in ranked_answers:
                    ranked_answer = {
                        "rank": answer.get('rank', 0),
                        "answer_text": answer.get('answer', ''),
                        "score": answer.get('score', 0),
                        "response_count": answer.get('responseCount', 0),
                        "is_correct": answer.get('isCorrect', False)
                    }
                    formatted_question["ranked_answers"].append(ranked_answer)
                
                questions_with_rankings.append(formatted_question)
                total_ranked_answers += len(ranked_answers)
        
        return jsonify({
            "success": True,
            "message": "Showing questions with ranked answers",
            "summary": {
                "total_questions_in_db": len(questions),
                "questions_with_rankings": len(questions_with_rankings),
                "total_ranked_answers": total_ranked_answers,
                "questions_without_rankings": len(questions) - len(questions_with_rankings)
            },
            "ranked_questions": questions_with_rankings,
            "explanation": {
                "what_this_shows": "Questions where answers have been ranked (rank > 0)",
                "ranking_means": "Answers processed through both similarity merging AND admin approval + ranking",
                "workflow_status": "These answers are ready for analytics display",
                "next_step": "Use this data for your analytics dashboard"
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to fetch ranked answers",
            "details": str(e)
        })

@app.route('/api/view-processing-status', methods=['GET'])
def view_processing_status():
    """
    Show the processing status of all questions:
    - Which questions have been similarity processed (merged answers)
    - Which questions have been ranking processed (ranked answers)
    - Which questions need admin approval
    """
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        })
    
    try:
        print("Analyzing processing status of all questions...")
        questions = fetch_questions_from_db()
        
        if not questions:
            return jsonify({
                "success": False,
                "error": "No questions found in database"
            })
        
        processing_status = {
            "raw_submissions": [],          # No processing done
            "similarity_processed": [],     # Merged, awaiting admin approval
            "admin_approved": [],          # isCorrect flags set, awaiting ranking
            "fully_processed": []          # Ranked and scored, ready for analytics
        }
        
        for question in questions:
            question_info = {
                "question_id": question['_id'],
                "question_text": question.get('question', '')[:60] + "...",
                "total_answers": len(question.get('answers', [])),
                "answers_with_correct_flags": 0,
                "ranked_answers": 0
            }
            
            answers = question.get('answers', [])
            
            # Count answers with isCorrect flags set (admin approved)
            approved_answers = [a for a in answers if 'isCorrect' in a and a['isCorrect'] is not False]
            question_info["answers_with_correct_flags"] = len(approved_answers)
            
            # Count ranked answers
            ranked_answers = [a for a in answers if a.get('rank', 0) > 0]
            question_info["ranked_answers"] = len(ranked_answers)
            
            # Categorize based on processing stage
            if len(ranked_answers) > 0:
                # Has ranked answers = fully processed
                processing_status["fully_processed"].append(question_info)
            elif len(approved_answers) > 0:
                # Has admin approval but no ranking = awaiting ranking
                processing_status["admin_approved"].append(question_info)
            elif len(answers) > 0:
                # Has answers but no approval = awaiting admin approval
                processing_status["similarity_processed"].append(question_info)
            else:
                # No answers = raw submission
                processing_status["raw_submissions"].append(question_info)
        
        return jsonify({
            "success": True,
            "message": "Processing status analysis completed",
            "workflow_stages": {
                "stage_1_raw": {
                    "count": len(processing_status["raw_submissions"]),
                    "description": "Questions with no answers submitted yet",
                    "questions": processing_status["raw_submissions"]
                },
                "stage_2_similarity_processed": {
                    "count": len(processing_status["similarity_processed"]),
                    "description": "Answers merged, awaiting admin approval",
                    "next_action": "Admin needs to set isCorrect flags",
                    "questions": processing_status["similarity_processed"]
                },
                "stage_3_admin_approved": {
                    "count": len(processing_status["admin_approved"]),
                    "description": "Admin approved, awaiting ranking processing",
                    "next_action": "Run /api/process-ranking endpoint",
                    "questions": processing_status["admin_approved"]
                },
                "stage_4_fully_processed": {
                    "count": len(processing_status["fully_processed"]),
                    "description": "Ranked and scored, ready for analytics",
                    "next_action": "Display in analytics dashboard",
                    "questions": processing_status["fully_processed"]
                }
            },
            "summary": {
                "total_questions": len(questions),
                "ready_for_analytics": len(processing_status["fully_processed"]),
                "awaiting_admin_approval": len(processing_status["similarity_processed"]),
                "awaiting_ranking": len(processing_status["admin_approved"]),
                "completion_percentage": round((len(processing_status["fully_processed"]) / len(questions)) * 100, 1)
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to analyze processing status",
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
                    "_id": answer.get('_id', ''),
                    "answer_text": answer.get('answer', ''),
                    "isCorrect": answer.get('isCorrect', False),
                    "responseCount": answer.get('responseCount', 0),
                    "rank": answer.get('rank', 0),
                    "score": answer.get('score', 0)
                }
                formatted_question["processed_answers"].append(processed_answer)
            
            # Sort answers by rank to show ranking clearly (correct answers first)
            formatted_question["processed_answers"].sort(key=lambda x: (x["rank"] == 0, x["rank"]))
            
            formatted_data.append(formatted_question)
        
        return jsonify({
            "success": True,
            "message": "Showing processed data structure from database",
            "total_questions_in_db": len(questions),
            "sample_size": len(formatted_data),
            "processed_data_structure": formatted_data,
            "explanation": {
                "similarity_processing": "Similar answers merged, duplicates removed, responseCounts combined",
                "ranking_processing": "Only isCorrect=True answers ranked by responseCount (highest=rank 1)",
                "scoring": "Rank 1=100, 2=80, 3=60, 4=40, 5=20, 6+=0 points",
                "incorrect_answers": "isCorrect=False answers keep rank=0 and score=0",
                "workflow": "1. Participants submit → 2. Run similarity processing → 3. Admin approval → 4. Run ranking processing → 5. Analytics ready"
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to view processed data",
            "details": str(e)
        })

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
    print(f"\nAvailable endpoints:")
    print(f"  Health check: http://localhost:5000")
    print(f"  Similarity processing: http://localhost:5000/api/process-similarity")
    print(f"  Ranking processing: http://localhost:5000/api/process-ranking")
    print(f"  Test connection: http://localhost:5000/api/test-connection")
    print(f"  Fetch questions: http://localhost:5000/api/fetch-questions")
    print(f"  View ranked answers: http://localhost:5000/api/view-ranked-answers")
    print(f"  View processing status: http://localhost:5000/api/view-processing-status")
    print(f"  View processed data: http://localhost:5000/api/view-processed-data")
    print(f"\nWorkflow:")
    print(f"  1. Participants submit answers")
    print(f"  2. Run /api/process-similarity to merge similar answers")
    print(f"  3. Admin approves answers (sets isCorrect=true/false)")
    print(f"  4. Run /api/process-ranking to rank and score approved answers")
    print(f"  5. Analytics data ready!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)