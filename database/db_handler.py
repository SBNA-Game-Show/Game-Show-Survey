# =============================================================================
# FILE: database/db_handler.py (FIXED - Direct Question Updates)
# =============================================================================

import logging
from pymongo import MongoClient
from bson import ObjectId
from config.settings import Config
from typing import List, Dict, Optional

logger = logging.getLogger('survey_analytics')

class DatabaseHandler:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        self._connect()
    
    def _connect(self):
        """Establish database connection"""
        try:
            logger.info("Connecting to MongoDB")
            
            self.client = MongoClient(
                Config.MONGO_CONNECTION_STRING,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            
            # Test connection
            self.client.admin.command('ping')
            
            self.db = self.client[Config.DB_NAME]
            self.collection = self.db[Config.COLLECTION_NAME]
            
            logger.info(f"Connected to MongoDB: {Config.DB_NAME}.{Config.COLLECTION_NAME}")
            
        except Exception as e:
            logger.error(f"MongoDB connection failed: {str(e)}")
            raise
    
    def test_connection(self) -> bool:
        """Test if database connection is healthy"""
        try:
            self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"Database connection test failed: {str(e)}")
            return False
    
    def fetch_all_questions(self) -> List[Dict]:
        """Fetch all questions from database with consistent ID handling"""
        try:
            logger.info("Fetching all questions from database")
            
            questions = []
            cursor = self.collection.find({})
            
            for question in cursor:
                # Convert ObjectId to string consistently
                question['_id'] = str(question['_id'])
                
                # Ensure answers field exists
                if 'answers' not in question or question['answers'] is None:
                    question['answers'] = []
                
                # Standardize answer fields
                for answer in question['answers']:
                    if '_id' in answer and answer['_id']:
                        answer['_id'] = str(answer['_id'])
                    
                    # Set default values for missing fields
                    answer.setdefault('answer', '')
                    answer.setdefault('isCorrect', False)
                    answer.setdefault('responseCount', 0)
                    answer.setdefault('rank', 0)
                    answer.setdefault('score', 0)
                
                questions.append(question)
            
            logger.info(f"Fetched {len(questions)} questions")
            return questions
            
        except Exception as e:
            logger.error(f"Failed to fetch questions: {str(e)}")
            raise
    
    def update_question_answers(self, question_id: str, answers: List[Dict]) -> bool:
        """Update answers for a specific question - FIXED for your data structure"""
        try:
            # Use the question_id directly as string (UUID format)
            query = {"_id": question_id}
            
            # Prepare answers for database storage
            formatted_answers = []
            for answer in answers:
                formatted_answer = {
                    'answer': answer.get('answer', ''),
                    'isCorrect': bool(answer.get('isCorrect', False)),
                    'responseCount': int(answer.get('responseCount', 0)),
                    'rank': int(answer.get('rank', 0)),
                    'score': int(answer.get('score', 0))
                }
                
                # Keep _id field if present
                if '_id' in answer and answer['_id']:
                    formatted_answer['_id'] = answer['_id']
                
                formatted_answers.append(formatted_answer)
            
            # Debug logging
            logger.debug(f"Updating question {question_id}")
            logger.debug(f"Query: {query}")
            logger.debug(f"Setting {len(formatted_answers)} answers")
            
            # Update the question's answers array directly
            result = self.collection.update_one(
                query,
                {"$set": {"answers": formatted_answers}}
            )
            
            logger.debug(f"Update result - matched: {result.matched_count}, modified: {result.modified_count}")
            
            if result.modified_count > 0:
                logger.debug(f"✓ Successfully updated question {question_id} with {len(answers)} answers")
                return True
            elif result.matched_count > 0:
                logger.debug(f"Question {question_id} found but no changes made (data might be identical)")
                return True
            else:
                logger.warning(f"❌ No document found for question ID: {question_id}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to update question {question_id}: {str(e)}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return False
    
    def bulk_update_questions(self, questions: List[Dict]) -> Dict:
        """Bulk update multiple questions efficiently"""
        try:
            logger.info(f"Bulk updating {len(questions)} questions")
            
            updated_count = 0
            failed_count = 0
            
            for question in questions:
                question_id = question['_id']
                answers = question['answers']
                
                if self.update_question_answers(question_id, answers):
                    updated_count += 1
                else:
                    failed_count += 1
                    logger.warning(f"Failed to update question: {question_id}")
            
            logger.info(f"Bulk update completed: {updated_count} updated, {failed_count} failed")
            
            return {
                "updated_count": updated_count,
                "failed_count": failed_count,
                "total_processed": len(questions)
            }
            
        except Exception as e:
            logger.error(f"Bulk update failed: {str(e)}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Database connection closed")