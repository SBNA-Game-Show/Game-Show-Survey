import pymongo
from pymongo import MongoClient
import os
from datetime import datetime
import json

# MongoDB Configuration
MONGO_CONNECTION_STRING = "mongodb+srv://SBNAadmin:8PYSMXyZ%40zp4uwF@cluster1-production.v4anhjy.mongodb.net"
DB_NAME = "database_Test_Ninja"  # Updated database name
COLLECTION_NAME = "processed_survey_results"  # New collection for your processed data

class MongoDBSetup:
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
            
            # Get/create collection
            self.collection = self.db[COLLECTION_NAME]
            print(f"Using collection: {COLLECTION_NAME}")
            
            # List existing collections to verify
            existing_collections = self.db.list_collection_names()
            print(f"Existing collections in database: {existing_collections}")
            
            return True
            
        except Exception as e:
            print(f"MongoDB connection failed: {str(e)}")
            return False
    
    def create_schema_indexes(self):
        """Create indexes for better performance (optional but recommended)"""
        try:
            print("Creating indexes...")
            
            # Create index on timestamp for faster queries
            self.collection.create_index([("timestamp", -1)])
            
            # Create index on question_ids within the data array
            self.collection.create_index([("data.question_id", 1)])
            
            print("Indexes created successfully!")
            return True
            
        except Exception as e:
            print(f"Index creation failed (not critical): {str(e)}")
            return False
    
    def store_processed_data(self, processed_data):
        """
        Store processed survey data in MongoDB (REPLACE MODE - overwrites all existing data)
        Args:
            processed_data: List from your analytics.py process_top_5_answers function
        Returns:
            dict: Storage result
        """
        try:
            print(f"Replacing collection data with {len(processed_data)} processed questions...")
            
            # STEP 1: Clear all existing documents in the collection
            delete_result = self.collection.delete_many({})
            print(f"Deleted {delete_result.deleted_count} existing documents")
            
            # STEP 2: Create new document with current data
            document = {
                "timestamp": datetime.utcnow(),
                "total_questions": len(processed_data),
                "processing_status": "completed",
                "data": processed_data,  # This is your exact response.json data structure
                "created_by": "analytics_processor",
                "mode": "replace"
            }
            
            # STEP 3: Insert the new document
            result = self.collection.insert_one(document)
            
            print(f"Data replaced successfully!")
            print(f"New Document ID: {result.inserted_id}")
            print(f"Collection now contains 1 document with {len(processed_data)} questions")
            
            return {
                "success": True,
                "message": f"Replaced collection with {len(processed_data)} questions",
                "document_id": str(result.inserted_id),
                "timestamp": document["timestamp"].isoformat(),
                "collection": COLLECTION_NAME,
                "database": DB_NAME,
                "deleted_count": delete_result.deleted_count,
                "mode": "replace"
            }
            
        except Exception as e:
            print(f"Failed to replace data: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_latest_results(self, limit=5):
        """Get the latest stored results"""
        try:
            print(f"Retrieving latest {limit} results...")
            
            # Get latest documents sorted by timestamp
            cursor = self.collection.find().sort("timestamp", -1).limit(limit)
            results = list(cursor)
            
            # Convert ObjectId to string for JSON serialization
            for result in results:
                result["_id"] = str(result["_id"])
                if "timestamp" in result:
                    result["timestamp"] = result["timestamp"].isoformat()
            
            print(f"Retrieved {len(results)} documents")
            return results
            
        except Exception as e:
            print(f"Failed to retrieve data: {str(e)}")
            return []
    
    def get_collection_stats(self):
        """Get statistics about the collection"""
        try:
            count = self.collection.count_documents({})
            
            # Get the single document (since we're in replace mode)
            latest_doc = self.collection.find_one(sort=[("timestamp", -1)])
            latest_timestamp = None
            total_questions = 0
            
            if latest_doc:
                if "timestamp" in latest_doc:
                    latest_timestamp = latest_doc["timestamp"].isoformat()
                total_questions = latest_doc.get("total_questions", 0)
            
            return {
                "total_documents": count,
                "collection_name": COLLECTION_NAME,
                "database_name": DB_NAME,
                "latest_timestamp": latest_timestamp,
                "total_questions_in_latest": total_questions,
                "mode": "replace_mode"
            }
            
        except Exception as e:
            print(f"Failed to get stats: {str(e)}")
            return {}
    
    def test_with_sample_data(self):
        """Test storing and retrieving sample data"""
        print("\n" + "="*60)
        print("TESTING WITH SAMPLE DATA")
        print("="*60)
        
        # Sample data matching your response.json structure exactly
        sample_data = [
            {
                "question_id": "test_683c685a3599ec36cc34c386",
                "question_text": "What is the Sanskrit word for 'peace'?",
                "top_answers": [
                    {
                        "answer_text": "Shanti",
                        "count": 5,
                        "rank": 1,
                        "score": 100
                    },
                    {
                        "answer_text": "Shaantih",
                        "count": 3,
                        "rank": 2,
                        "score": 80
                    }
                ]
            },
            {
                "question_id": "test_683c685a3599ec36cc34c385",
                "question_text": "What is the Sanskrit word for 'truth'?",
                "top_answers": [
                    {
                        "answer_text": "Satya",
                        "count": 7,
                        "rank": 1,
                        "score": 100
                    }
                ]
            }
        ]
        
        print(f"Sample data structure:")
        print(json.dumps(sample_data, indent=2))
        
        # Store the sample data
        storage_result = self.store_processed_data(sample_data)
        print(f"\n Storage result: {storage_result}")
        
        if storage_result["success"]:
            # Test retrieval    ``
            latest_results = self.get_latest_results(1)
            if latest_results:
                print(f"\n Successfully retrieved stored data!")
                print(f"Document contains {latest_results[0]['total_questions']} questions")
                
                # Show first question from retrieved data
                if latest_results[0]['data']:
                    first_q = latest_results[0]['data'][0]
                    print(f"First question: {first_q['question_text']}")
                    print(f"Top answer: {first_q['top_answers'][0]['answer_text']}")
            
            # Get collection stats
            stats = self.get_collection_stats()
            print(f"\nCollection stats: {stats}")
            
            return True
        else:
            print("Sample data test failed")
            return False
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

# Convenience functions for your app.py
def store_survey_data(processed_data):
    """
    Simple function to store processed survey data
    Args:
        processed_data: Output from your analytics.py
    Returns:
        dict: Storage result
    """
    mongo_setup = MongoDBSetup()
    
    try:
        if mongo_setup.connect():
            result = mongo_setup.store_processed_data(processed_data)
            return result
        else:
            return {
                "success": False,
                "error": "Failed to connect to MongoDB"
            }
    finally:
        mongo_setup.close()

def get_latest_survey_results(limit=5):
    """
    Get latest stored survey results
    Args:
        limit: Number of results to retrieve
    Returns:
        list: Latest results
    """
    mongo_setup = MongoDBSetup()
    
    try:
        if mongo_setup.connect():
            results = mongo_setup.get_latest_results(limit)
            return results
        else:
            return []
    finally:
        mongo_setup.close()

def test_mongodb_setup():
    """Main test function"""
    print("MONGODB SETUP AND TEST")
    print("="*60)
    
    mongo_setup = MongoDBSetup()
    
    try:
        # Step 1: Connect
        if not mongo_setup.connect():
            print("Cannot proceed - connection failed")
            return False
        
        # Step 2: Create indexes (optional)
        mongo_setup.create_schema_indexes()
        
        # Step 3: Test with sample data
        if not mongo_setup.test_with_sample_data():
            print("Sample data test failed")
            return False
        
        print("\n ALL TESTS PASSED! MongoDB is ready for your data.")
        return True
        
    finally:
        mongo_setup.close()

if __name__ == "__main__":
    test_mongodb_setup()