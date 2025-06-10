import logging
from flask import Flask, jsonify
from config.settings import Config
from database.db_handler import DatabaseHandler
# from services.similarity_service import SimilarityService  # Commented out - not using for now
from services.ranking_service import RankingService
from utils.logger import setup_logger
import time

app = Flask(__name__)
app.config.from_object(Config)

# Setup logging
logger = setup_logger()

# Initialize services
db_handler = DatabaseHandler()
# similarity_service = SimilarityService(db_handler)  # Commented out - not using similarity for now
ranking_service = RankingService(db_handler)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        is_db_healthy = db_handler.test_connection()
        
        if is_db_healthy:
            return jsonify({
                "status": "healthy",
                "database": "connected",
                "services": ["ranking"]  # Only ranking service active
            }), 200
        else:
            return jsonify({
                "status": "unhealthy",
                "database": "disconnected"
            }), 500
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

# @app.route('/api/process-similarity', methods=['POST'])
# def process_similarity():
#     """Process all questions for similarity merging and update database"""
#     start_time = time.time()
    
#     try:
#         logger.info("Starting similarity processing for all questions")
        
#         # Process similarity for all questions
#         result = similarity_service.process_all_questions()
        
#         processing_time = round(time.time() - start_time, 2)
        
#         logger.info(f"Similarity processing completed in {processing_time}s")
        
#         return jsonify({
#             "status": "success",
#             "results": {
#                 "total_questions": result["total_questions"],
#                 "processed": result["processed_count"],
#                 "skipped": result["skipped_count"],
#                 "updated_in_db": result["updated_count"],
#                 "failed_updates": result["failed_count"],
#                 "processing_time": f"{processing_time}s",
#                 "duplicates_merged": result["duplicates_merged"]
#             }
#         }), 200
        
#     except Exception as e:
#         processing_time = round(time.time() - start_time, 2)
#         logger.error(f"Similarity processing failed after {processing_time}s: {str(e)}")
        
#         return jsonify({
#             "status": "error",
#             "error": str(e),
#             "processing_time": f"{processing_time}s"
#         }), 500

@app.route('/api/process-ranking', methods=['POST'])
def process_ranking():
    """Process all questions for ranking and scoring, then update database"""
    start_time = time.time()
    
    try:
        logger.info("Starting ranking processing for all questions")
        
        # Process ranking for all questions
        result = ranking_service.process_all_questions()
        
        processing_time = round(time.time() - start_time, 2)
        
        logger.info(f"Ranking processing completed in {processing_time}s")
        
        return jsonify({
            "status": "success",
            "results": {
                "total_questions": result["total_questions"],
                "processed": result["processed_count"],
                "skipped": result["skipped_count"],
                "updated_in_db": result["updated_count"],
                "failed_updates": result["failed_count"],
                "processing_time": f"{processing_time}s",
                "answers_ranked": result["answers_ranked"],
                "answers_scored": result["answers_scored"]
            }
        }), 200
        
    except Exception as e:
        processing_time = round(time.time() - start_time, 2)
        logger.error(f"Ranking processing failed after {processing_time}s: {str(e)}")
        
        return jsonify({
            "status": "error",
            "error": str(e),
            "processing_time": f"{processing_time}s"
        }), 500

@app.route('/api/get-processed-questions', methods=['GET'])
def get_processed_questions():
    """Fetch all processed questions from database to verify updates"""
    start_time = time.time()
    
    try:
        logger.info("Fetching all processed questions from database")
        
        # Fetch all questions from database
        questions = db_handler.fetch_all_questions()
        
        processing_time = round(time.time() - start_time, 2)
        
        if not questions:
            return jsonify({
                "status": "success",
                "results": {
                    "total_questions": 0,
                    "questions_with_answers": 0,
                    "similarity_processed": 0,
                    "admin_approved": 0,
                    "ranking_processed": 0,
                    "processing_time": f"{processing_time}s"
                },
                "data": []
            }), 200
        
        # Analyze processing status
        questions_with_answers = 0
        similarity_processed = 0
        admin_approved = 0
        ranking_processed = 0
        total_answers = 0
        total_ranked_answers = 0
        
        for question in questions:
            answers = question.get('answers', [])
            if answers:
                questions_with_answers += 1
                total_answers += len(answers)
                
                # Check if similarity processed (fewer answers than typical raw submissions)
                if len(answers) <= 10:  # Assuming similarity merging reduces duplicates
                    similarity_processed += 1
                
                # Check if admin approved (has isCorrect flags)
                if any(a.get('isCorrect') is True or a.get('isCorrect') is False for a in answers):
                    admin_approved += 1
                
                # Check if ranking processed (has ranks > 0)
                ranked_answers = [a for a in answers if a.get('rank', 0) > 0]
                if ranked_answers:
                    ranking_processed += 1
                    total_ranked_answers += len(ranked_answers)
        
        logger.info(f"Fetched and analyzed {len(questions)} questions in {processing_time}s")
        
        return jsonify({
            "status": "success",
            "results": {
                "total_questions": len(questions),
                "questions_with_answers": questions_with_answers,
                "similarity_processed": similarity_processed,
                "admin_approved": admin_approved,
                "ranking_processed": ranking_processed,
                "total_answers": total_answers,
                "total_ranked_answers": total_ranked_answers,
                "processing_time": f"{processing_time}s"
            },
            "data": questions
        }), 200
        
    except Exception as e:
        processing_time = round(time.time() - start_time, 2)
        logger.error(f"Failed to fetch processed questions after {processing_time}s: {str(e)}")
        
        return jsonify({
            "status": "error",
            "error": str(e),
            "processing_time": f"{processing_time}s"
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "status": "error",
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "status": "error",
        "error": "Internal server error"
    }), 500

if __name__ == '__main__':
    logger.info("Starting Flask application")
    app.run(host='0.0.0.0', port=5000, debug=False)