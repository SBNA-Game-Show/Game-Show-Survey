import pymongo
from pymongo import MongoClient
import json
from bson import ObjectId

# MongoDB Configuration
MONGO_CONNECTION_STRING = "mongodb+srv://SBNAadmin:8PYSMXyZ%40zp4uwF@cluster1-production.v4anhjy.mongodb.net"
DB_NAME = "database_Test_Ninja2"  # Updated to match mongodb_setup.py
COLLECTION_NAME = "questions"

def test_basic_connection():
    """Test basic MongoDB connection"""
    try:
        print("Testing basic MongoDB connection...")
        
        # Connect with longer timeout
        client = MongoClient(
            MONGO_CONNECTION_STRING,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000
        )
        
        # Test connection
        client.admin.command('ping')
        print("SUCCESS: MongoDB connection successful!")
        
        # Get database
        db = client[DB_NAME]
        print(f"SUCCESS: Using database: {DB_NAME}")
        
        # Get collection
        collection = db[COLLECTION_NAME]
        print(f"SUCCESS: Using collection: {COLLECTION_NAME}")
        
        # Count documents
        count = collection.count_documents({})
        print(f"SUCCESS: Total documents in collection: {count}")
        
        # List all collections in database
        collections = db.list_collection_names()
        print(f"SUCCESS: Available collections: {collections}")
        
        # Get one sample document to see structure
        sample_doc = collection.find_one({})
        if sample_doc:
            print(f"\n--- SAMPLE DOCUMENT STRUCTURE ---")
            print(f"Document ID type: {type(sample_doc['_id'])}")
            print(f"Fields in document: {list(sample_doc.keys())}")
            
            # Convert ObjectId to string for printing
            sample_doc['_id'] = str(sample_doc['_id'])
            
            # Print document structure (first level only)
            for key, value in sample_doc.items():
                if key == 'answers' and isinstance(value, list):
                    print(f"{key}: [list with {len(value)} items]")
                    if len(value) > 0:
                        print(f"  First answer structure: {list(value[0].keys()) if value[0] else 'Empty'}")
                        # Show processing status
                        first_answer = value[0]
                        has_rank = first_answer.get('rank', 0) > 0
                        has_score = first_answer.get('score', 0) > 0
                        has_correct_flag = 'isCorrect' in first_answer
                        print(f"  Processing status - Rank: {has_rank}, Score: {has_score}, IsCorrect flag: {has_correct_flag}")
                else:
                    print(f"{key}: {type(value).__name__} - {str(value)[:100]}...")
        else:
            print("No documents found in collection")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"ERROR: Connection failed: {str(e)}")
        return False

def test_fetch_questions():
    """Test fetching questions with proper ObjectId handling"""
    try:
        print("\n--- TESTING QUESTION FETCHING ---")
        
        client = MongoClient(
            MONGO_CONNECTION_STRING,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000
        )
        
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        # Fetch first 3 questions only for testing
        questions = list(collection.find({}).limit(3))
        
        print(f"SUCCESS: Fetched {len(questions)} questions")
        
        for i, question in enumerate(questions):
            print(f"\nQuestion {i+1}:")
            print(f"  _id: {question['_id']} (type: {type(question['_id'])})")
            print(f"  questionId: {question.get('questionId', 'NOT FOUND')}")
            print(f"  question: {question.get('question', 'NOT FOUND')[:50]}...")
            
            answers = question.get('answers', [])
            print(f"  answers: {len(answers)} answers found")
            
            if answers:
                # Check processing status
                similarity_processed = len(answers) < 10  # Assume similarity merged if fewer answers
                ranking_processed = any(answer.get('rank', 0) > 0 for answer in answers)
                admin_approved = any('isCorrect' in answer for answer in answers)
                
                print(f"  Processing status:")
                print(f"    Similarity processed: {similarity_processed}")
                print(f"    Admin approved: {admin_approved}")
                print(f"    Ranking processed: {ranking_processed}")
                
                first_answer = answers[0]
                print(f"    First answer fields: {list(first_answer.keys())}")
                print(f"    answerId: {first_answer.get('answerId', 'NOT SET')}")
                print(f"    answer: {first_answer.get('answer', 'NOT FOUND')}")
                print(f"    isCorrect: {first_answer.get('isCorrect', 'NOT SET')}")
                print(f"    responseCount: {first_answer.get('responseCount', 'NOT FOUND')}")
                print(f"    rank: {first_answer.get('rank', 'NOT SET')}")
                print(f"    score: {first_answer.get('score', 'NOT SET')}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"ERROR: Question fetching failed: {str(e)}")
        return False

def test_processing_readiness():
    """Test if data is ready for similarity and ranking processing"""
    try:
        print("\n--- TESTING PROCESSING READINESS ---")
        
        client = MongoClient(
            MONGO_CONNECTION_STRING,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000
        )
        
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        # Count questions by processing stage
        total_questions = collection.count_documents({})
        questions_with_answers = collection.count_documents({
            "answers": {"$exists": True, "$not": {"$size": 0}}
        })
        questions_with_ranks = collection.count_documents({
            "answers.rank": {"$gt": 0}
        })
        questions_with_correct_flags = collection.count_documents({
            "answers.isCorrect": {"$exists": True}
        })
        
        print(f"Processing Pipeline Status:")
        print(f"  Total questions: {total_questions}")
        print(f"  Questions with answers: {questions_with_answers}")
        print(f"  Questions with admin approval (isCorrect flags): {questions_with_correct_flags}")
        print(f"  Questions with ranking: {questions_with_ranks}")
        
        print(f"\nReady for processing:")
        print(f"  Ready for similarity processing: {questions_with_answers - questions_with_ranks}")
        print(f"  Ready for ranking processing: {questions_with_correct_flags - questions_with_ranks}")
        print(f"  Fully processed: {questions_with_ranks}")
        
        # Workflow recommendations
        if questions_with_answers > questions_with_correct_flags:
            print(f"\nRecommendation: Run /api/process-similarity to merge similar answers")
        
        if questions_with_correct_flags > questions_with_ranks:
            print(f"Recommendation: Run /api/process-ranking to rank approved answers")
        
        if questions_with_ranks > 0:
            print(f"Ready: {questions_with_ranks} questions ready for analytics")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"ERROR: Processing readiness test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("MONGODB CONNECTION AND PROCESSING STATUS DEBUG")
    print("=" * 60)
    
    # Test basic connection
    if test_basic_connection():
        # Test question fetching
        if test_fetch_questions():
            # Test processing readiness
            test_processing_readiness()
    else:
        print("Cannot proceed with further testing - connection failed")