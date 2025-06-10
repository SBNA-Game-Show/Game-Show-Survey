import pymongo
from pymongo import MongoClient
import os
from datetime import datetime
import json
from bson import ObjectId

# MongoDB Configuration
MONGO_CONNECTION_STRING = "mongodb+srv://SBNAadmin:8PYSMXyZ%40zp4uwF@cluster1-production.v4anhjy.mongodb.net"
DB_NAME = "Ninja_Demo"
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
        """Fetch all questions from the database with proper _id handling"""
        try:
            print("Fetching all questions from database...")
            
            # Fetch all questions
            cursor = self.collection.find({})
            questions = []
            
            for question in cursor:
                # Handle each document individually to catch ObjectId issues
                try:
                    # Convert question ObjectId to string immediately
                    question['_id'] = str(question['_id'])
                    
                    # Handle datetime fields safely
                    for date_field in ['createdAt', 'updatedAt']:
                        if date_field in question and question[date_field]:
                            if hasattr(question[date_field], 'isoformat'):
                                question[date_field] = question[date_field].isoformat()
                            else:
                                question[date_field] = str(question[date_field])
                    
                    # Ensure answers field exists and is a list
                    if 'answers' not in question:
                        question['answers'] = []
                    elif question['answers'] is None:
                        question['answers'] = []
                    
                    # Process each answer with flexible _id handling
                    for answer in question.get('answers', []):
                        # Handle _id field flexibly - it may or may not exist
                        if '_id' in answer and answer['_id']:
                            if isinstance(answer['_id'], ObjectId):
                                answer['_id'] = str(answer['_id'])
                            elif hasattr(answer['_id'], 'binary'):  # ObjectId detection
                                answer['_id'] = str(answer['_id'])
                            # If _id is already a string, keep it as is
                        # Don't require _id field - similarity processor will work without it
                        
                        # Set default values for missing fields to match schema
                        if 'answer' not in answer or answer['answer'] is None:
                            answer['answer'] = ""
                        if 'isCorrect' not in answer:
                            answer['isCorrect'] = False
                        if 'responseCount' not in answer:
                            answer['responseCount'] = 0
                        if 'rank' not in answer:
                            answer['rank'] = 0
                        if 'score' not in answer:
                            answer['score'] = 0
                    
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
        """Update answers for a specific question with flexible _id handling"""
        try:
            # Handle different _id formats (ObjectId, UUID, or string)
            if isinstance(question_id, str):
                # Try ObjectId format first (24 chars, no hyphens)
                if len(question_id) == 24 and '-' not in question_id:
                    try:
                        object_id = ObjectId(question_id)
                    except Exception as e:
                        print(f"Invalid ObjectId format: {question_id}")
                        return False
                else:
                    # UUID or other string format - use as string directly
                    object_id = question_id
            else:
                object_id = question_id
            
            # Ensure updated_answers is properly formatted with flexible _id handling
            formatted_answers = []
            for answer in updated_answers:
                formatted_answer = {
                    'answer': answer.get('answer', ''),
                    'isCorrect': answer.get('isCorrect', False),
                    'responseCount': int(answer.get('responseCount', 0)),
                    'rank': int(answer.get('rank', 0)),
                    'score': int(answer.get('score', 0))
                }
                
                # Handle answer _id field - support both ObjectId and UUID formats
                if '_id' in answer and answer['_id']:
                    answer_id = answer['_id']
                    try:
                        # If it's a 24-character hex string without hyphens, convert to ObjectId
                        if isinstance(answer_id, str) and len(answer_id) == 24 and '-' not in answer_id:
                            formatted_answer['_id'] = ObjectId(answer_id)
                        elif isinstance(answer_id, ObjectId):
                            formatted_answer['_id'] = answer_id
                        else:
                            # UUID or other string format - keep as string
                            formatted_answer['_id'] = str(answer_id)
                    except:
                        # If conversion fails, store as string
                        formatted_answer['_id'] = str(answer_id)
                # If no _id provided, MongoDB will auto-generate one during insert
                
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
            
            # Get questions with approved answers (isCorrect = true)
            questions_with_approved_answers = self.collection.count_documents({
                "answers.isCorrect": True
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
                
                # Show sample answer structure
                if sample_question.get("answers"):
                    first_answer = sample_question["answers"][0]
                    sample_structure["sample_answer"] = {
                        "_id": str(first_answer.get("_id", "")) if first_answer.get("_id") else "auto-generated",
                        "answer": first_answer.get("answer", ""),
                        "isCorrect": first_answer.get("isCorrect", False),
                        "responseCount": first_answer.get("responseCount", 0),
                        "rank": first_answer.get("rank", 0),
                        "score": first_answer.get("score", 0)
                    }
            
            return {
                "total_questions": total_questions,
                "questions_with_answers": questions_with_answers,
                "questions_with_approved_answers": questions_with_approved_answers,
                "collection_name": COLLECTION_NAME,
                "database_name": DB_NAME,
                "sample_structure": sample_structure
            }
            
        except Exception as e:
            print(f"Failed to get stats: {str(e)}")
            return {}
    
    def test_connection_and_data(self):
        """Test connection and show sample data with answer _id handling"""
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
                
                # Show first few answers with _id information
                answers = sample_question.get('answers', [])[:3]
                print(f"Sample Answers:")
                for i, answer in enumerate(answers):
                    print(f"  Answer {i+1}:")
                    print(f"    _id: {answer.get('_id', 'NOT SET')} (type: {type(answer.get('_id', ''))})")
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