import pymongo
from pymongo import MongoClient
import os
from datetime import datetime
import json

# MongoDB Configuration
MONGO_CONNECTION_STRING = "mongodb+srv://SBNAadmin:8PYSMXyZ%40zp4uwF@cluster1-production.v4anhjy.mongodb.net"
DB_NAME = "database_Test_Ninja"
COLLECTION_NAME = "questions"

class MongoDBHandler:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
    
    def connect(self):
        """Connect to MongoDB and set up database/collection"""
        try:
            print("Connecting to MongoDB...")
            
            # Connect with timeout
            self.client = MongoClient(
                MONGO_CONNECTION_STRING,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            
            # Test connection
            self.client.admin.command('ping')
            print("MongoDB connection successful!")
            
            # Get database
            self.db = self.client[DB_NAME]
            print(f"Using database: {DB_NAME}")
            
            # Get collection
            self.collection = self.db[COLLECTION_NAME]
            print(f"Using collection: {COLLECTION_NAME}")
            
            return True
            
        except Exception as e:
            print(f"MongoDB connection failed: {str(e)}")
            return False
    
    def fetch_all_questions(self):
        """Fetch all questions from the database"""
        try:
            print("Fetching all questions from database...")
            
            # Fetch all questions
            cursor = self.collection.find({})
            questions = []
            
            for question in cursor:
                # Handle each document individually to catch ObjectId issues
                try:
                    # Convert ObjectId to string immediately
                    question['_id'] = str(question['_id'])
                    
                    # Handle datetime fields safely
                    for date_field in ['createdAt', 'updatedAt']:
                        if date_field in question and question[date_field]:
                            if hasattr(question[date_field], 'isoformat'):
                                question[date_field] = question[date_field].isoformat()
                            else:
                                question[date_field] = str(question[date_field])
                    
                    # Handle any other potential ObjectId fields
                    def convert_objectids(obj):
                        if isinstance(obj, dict):
                            for key, value in obj.items():
                                if hasattr(value, 'binary'):  # ObjectId detection
                                    obj[key] = str(value)
                                elif isinstance(value, (dict, list)):
                                    convert_objectids(value)
                        elif isinstance(obj, list):
                            for i, item in enumerate(obj):
                                if hasattr(item, 'binary'):  # ObjectId detection
                                    obj[i] = str(item)
                                elif isinstance(item, (dict, list)):
                                    convert_objectids(item)
                    
                    convert_objectids(question)
                    
                    # Ensure answers field exists and is a list
                    if 'answers' not in question:
                        question['answers'] = []
                    elif question['answers'] is None:
                        question['answers'] = []
                    
                    # Check each answer has required fields matching schema
                    for answer in question.get('answers', []):
                        # Set default values for missing fields to match schema
                        if 'answerId' not in answer or answer['answerId'] is None:
                            answer['answerId'] = ""  # Keep empty as per your requirement
                        if 'answer' not in answer or answer['answer'] is None:
                            answer['answer'] = ""  # Schema: required: false, so empty is OK
                        if 'isCorrect' not in answer:
                            answer['isCorrect'] = False  # Schema default: false
                        if 'responseCount' not in answer:
                            answer['responseCount'] = 0  # Schema default: 0
                        if 'rank' not in answer:
                            answer['rank'] = 0  # Unprocessed answers have rank 0, processed start from 1
                        if 'score' not in answer:
                            answer['score'] = 0  # Schema default: 0
                    
                    questions.append(question)
                    
                except Exception as doc_error:
                    print(f"Error processing document {question.get('_id', 'unknown')}: {doc_error}")
                    continue
            
            print(f"Fetched {len(questions)} questions from database")
            return questions
            
        except Exception as e:
            print(f"Failed to fetch questions: {str(e)}")
            import traceback
            print(f"Full error: {traceback.format_exc()}")
            return []
    
    def update_question_answers(self, question_id, updated_answers):
        """Update answers for a specific question"""
        try:
            # Convert string _id back to ObjectId for update
            from bson import ObjectId
            
            if isinstance(question_id, str):
                try:
                    object_id = ObjectId(question_id)
                except Exception as e:
                    print(f"Invalid ObjectId format: {question_id}")
                    return False
            else:
                object_id = question_id
            
            # Ensure updated_answers is properly formatted
            formatted_answers = []
            for answer in updated_answers:
                formatted_answer = {
                    'answerId': answer.get('answerId', ''),
                    'answer': answer.get('answer', ''),
                    'isCorrect': answer.get('isCorrect', False),
                    'responseCount': int(answer.get('responseCount', 0)),
                    'rank': int(answer.get('rank', 0)),
                    'score': int(answer.get('score', 0))
                }
                formatted_answers.append(formatted_answer)
            
            print(f"Updating question {question_id} with {len(formatted_answers)} answers")
            
            # Update the question's answers
            result = self.collection.update_one(
                {"_id": object_id},
                {"$set": {"answers": formatted_answers}}
            )
            
            if result.modified_count > 0:
                print(f"✓ Successfully updated question {question_id}")
                return True
            elif result.matched_count > 0:
                print(f"Question {question_id} found but no changes made (data might be identical)")
                return True
            else:
                print(f"❌ No document found for question ID: {question_id}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to update question {question_id}: {str(e)}")
            import traceback
            print(f"Full error: {traceback.format_exc()}")
            return False
    
    def update_all_questions(self, processed_questions):
        """Update all processed questions back to database"""
        try:
            print(f"Updating {len(processed_questions)} questions in database...")
            
            updated_count = 0
            failed_count = 0
            
            for question in processed_questions:
                question_id = question['_id']
                updated_answers = question['answers']
                
                if self.update_question_answers(question_id, updated_answers):
                    updated_count += 1
                else:
                    failed_count += 1
            
            print(f"Update completed: {updated_count} successful, {failed_count} failed")
            
            return {
                "success": True,
                "updated_count": updated_count,
                "failed_count": failed_count,
                "total_processed": len(processed_questions)
            }
            
        except Exception as e:
            print(f"Failed to update questions: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_collection_stats(self):
        """Get statistics about the collection"""
        try:
            total_questions = self.collection.count_documents({})
            
            # Get questions with answers
            questions_with_answers = self.collection.count_documents({
                "answers": {"$exists": True, "$not": {"$size": 0}}
            })
            
            # Get sample question to show structure
            sample_question = self.collection.find_one({})
            sample_structure = None
            if sample_question:
                sample_structure = {
                    "_id": str(sample_question.get("_id")),
                    "questionId": sample_question.get("questionId", "Auto-generated or not set"),
                    "question": sample_question.get("question"),
                    "answers_count": len(sample_question.get("answers", [])),
                    "questionType": sample_question.get("questionType"),
                    "questionCategory": sample_question.get("questionCategory"),
                    "questionLevel": sample_question.get("questionLevel"),
                    "timesSkipped": sample_question.get("timesSkipped", 0)
                }
            
            return {
                "total_questions": total_questions,
                "questions_with_answers": questions_with_answers,
                "collection_name": COLLECTION_NAME,
                "database_name": DB_NAME,
                "sample_structure": sample_structure
            }
            
        except Exception as e:
            print(f"Failed to get stats: {str(e)}")
            return {}
    
    def test_connection_and_data(self):
        """Test connection and show sample data"""
        print("\n" + "="*60)
        print("TESTING MONGODB CONNECTION AND DATA STRUCTURE")
        print("="*60)
        
        try:
            # Get collection stats
            stats = self.get_collection_stats()
            print(f"Collection Stats: {json.dumps(stats, indent=2)}")
            
            # Get a sample question with answers
            sample_question = self.collection.find_one({"answers": {"$exists": True, "$not": {"$size": 0}}})
            
            if sample_question:
                print(f"\nSample Question Structure:")
                print(f"Question ID: {sample_question.get('questionId')}")
                print(f"Question Text: {sample_question.get('question')}")
                print(f"Number of Answers: {len(sample_question.get('answers', []))}")
                
                # Show first few answers
                answers = sample_question.get('answers', [])[:3]
                print(f"Sample Answers:")
                for i, answer in enumerate(answers):
                    print(f"  Answer {i+1}:")
                    print(f"    ID: {answer.get('answerId')}")
                    print(f"    Text: {answer.get('answer')}")
                    print(f"    Count: {answer.get('responseCount')}")
                    print(f"    IsCorrect: {answer.get('isCorrect')}")
                    print(f"    Rank: {answer.get('rank')}")
                    print(f"    Score: {answer.get('score')}")
                
                return True
            else:
                print("No questions with answers found in collection")
                return False
                
        except Exception as e:
            print(f"Test failed: {str(e)}")
            return False
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

# Convenience functions
def fetch_questions_from_db():
    """Fetch all questions from database"""
    mongo_handler = MongoDBHandler()
    
    try:
        if mongo_handler.connect():
            questions = mongo_handler.fetch_all_questions()
            return questions
        else:
            return []
    finally:
        mongo_handler.close()

def update_questions_in_db(processed_questions):
    """Update processed questions back to database"""
    mongo_handler = MongoDBHandler()
    
    try:
        if mongo_handler.connect():
            result = mongo_handler.update_all_questions(processed_questions)
            return result
        else:
            return {
                "success": False,
                "error": "Failed to connect to MongoDB"
            }
    finally:
        mongo_handler.close()

def test_mongodb_connection():
    """Test MongoDB connection and data structure"""
    mongo_handler = MongoDBHandler()
    
    try:
        if mongo_handler.connect():
            success = mongo_handler.test_connection_and_data()
            return success
        else:
            return False
    finally:
        mongo_handler.close()

if __name__ == "__main__":
    test_mongodb_connection()