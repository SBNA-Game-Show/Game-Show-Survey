import pymongo
from pymongo import MongoClient
import json
from bson import ObjectId

# MongoDB Configuration
MONGO_CONNECTION_STRING = "mongodb+srv://SBNAadmin:8PYSMXyZ%40zp4uwF@cluster1-production.v4anhjy.mongodb.net"
DB_NAME = "database_Test_Ninja"
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
        print("✓ MongoDB connection successful!")
        
        # Get database
        db = client[DB_NAME]
        print(f"✓ Using database: {DB_NAME}")
        
        # Get collection
        collection = db[COLLECTION_NAME]
        print(f"✓ Using collection: {COLLECTION_NAME}")
        
        # Count documents
        count = collection.count_documents({})
        print(f"✓ Total documents in collection: {count}")
        
        # List all collections in database
        collections = db.list_collection_names()
        print(f"✓ Available collections: {collections}")
        
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
                else:
                    print(f"{key}: {type(value).__name__} - {str(value)[:100]}...")
        else:
            print("No documents found in collection")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
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
        
        print(f"✓ Fetched {len(questions)} questions")
        
        for i, question in enumerate(questions):
            print(f"\nQuestion {i+1}:")
            print(f"  _id: {question['_id']} (type: {type(question['_id'])})")
            print(f"  questionId: {question.get('questionId', 'NOT FOUND')}")
            print(f"  question: {question.get('question', 'NOT FOUND')[:50]}...")
            
            answers = question.get('answers', [])
            print(f"  answers: {len(answers)} answers found")
            
            if answers:
                first_answer = answers[0]
                print(f"    First answer fields: {list(first_answer.keys())}")
                print(f"    answerId: {first_answer.get('answerId', 'NOT FOUND')}")
                print(f"    answer: {first_answer.get('answer', 'NOT FOUND')}")
                print(f"    isCorrect: {first_answer.get('isCorrect', 'NOT FOUND')}")
                print(f"    responseCount: {first_answer.get('responseCount', 'NOT FOUND')}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Question fetching failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("MONGODB CONNECTION AND DATA STRUCTURE DEBUG")
    print("=" * 60)
    
    # Test basic connection
    if test_basic_connection():
        # Test question fetching
        test_fetch_questions()
    else:
        print("Cannot proceed with question testing - connection failed")