print("Importing Flask...")
from flask import Flask, jsonify
print("Importing requests...")
import requests
print("Importing analytics...")
from analytics import process_top_5_answers
import os
from dotenv import load_dotenv

# Import MongoDB functions
try:
    print("Importing MongoDB setup...")
    from mongodb_setup import store_survey_data, get_latest_survey_results, test_mongodb_setup
    MONGODB_AVAILABLE = True
    print(" MongoDB module loaded successfully")
except ImportError as e:
    print(f"MongoDB module not available: {e}")
    MONGODB_AVAILABLE = False

print("Loading .env...")

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Backend API configuration
BACKEND_BASE_URL = "https://sbnabackendnew.onrender.com"
API_KEY = os.getenv("API_KEY")

print(f"BACKEND_BASE_URL: {BACKEND_BASE_URL}")
print(f"API_KEY loaded: {'Yes' if API_KEY else 'No'}")
print(f"MongoDB available: {MONGODB_AVAILABLE}")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "Flask server running",
        "mongodb_available": MONGODB_AVAILABLE,
        "storage_type": "mongodb" if MONGODB_AVAILABLE else "none"
    })

@app.route('/api/top-answers', methods=['GET'])
def top_answers():
    try:
        print("Processing survey data request...")
        
        # Make API call to backend to get questions and answers
        headers = {
            'x-api-key': API_KEY
        }
        
        print("Calling backend API...")
        response = requests.get(
            f"{BACKEND_BASE_URL}/api/v1/admin/survey",
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 200:
            return jsonify({
                "success": False, 
                "error": f"Backend API returned status {response.status_code}",
                "message": response.text
            }), response.status_code
        
        backend_data = response.json()
        print(f"Received data from backend")
        
        # Extract questions data from backend response
        if isinstance(backend_data, dict) and 'data' in backend_data:
            questions = backend_data['data']
        else:
            questions = backend_data
        
        print(f"Processing {len(questions)} questions...")
        
        # Process the data using your analytics algorithm
        processed_data = process_top_5_answers(questions)
        print(f"Analytics completed - processed {len(processed_data)} questions")
        
        # Store in MongoDB if available
        storage_result = {"success": False, "message": "MongoDB not available"}
        
        if MONGODB_AVAILABLE:
            try:
                print("Storing data in MongoDB (REPLACE MODE - will overwrite existing data)...")
                storage_result = store_survey_data(processed_data)
                print(f"Storage result: {storage_result['success']}")
                if storage_result['success']:
                    print(f"Replaced {storage_result.get('deleted_count', 0)} old documents with new data")
            except Exception as e:
                print(f"MongoDB storage failed: {e}")
                storage_result = {
                    "success": False,
                    "error": f"MongoDB storage failed: {str(e)}"
                }
        
        # Return the processed data
        response_data = {
            "success": True, 
            "data": processed_data,
            "storage": storage_result,
            "message": f"Successfully processed {len(processed_data)} questions",
            "analytics_summary": {
                "total_questions": len(processed_data),
                "questions_with_answers": len([q for q in processed_data if q.get('top_answers')])
            }
        }
        
        return jsonify(response_data)
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            "success": False, 
            "error": "Failed to connect to backend API",
            "details": str(e)
        }), 500
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": "Internal server error",
            "details": str(e)
        }), 500

@app.route('/api/stored-results', methods=['GET'])
def get_stored_results():
    """Get the latest stored results from MongoDB"""
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        })
    
    try:
        print("Retrieving stored results from MongoDB...")
        results = get_latest_survey_results(5)  # Get last 5 results
        
        return jsonify({
            "success": True,
            "results": results,
            "count": len(results),
            "message": f"Retrieved {len(results)} stored result sets"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Failed to retrieve stored results",
            "details": str(e)
        }), 500

@app.route('/api/test-mongodb', methods=['GET'])
def test_mongodb_endpoint():
    """Test MongoDB connection and functionality"""
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB module not available"
        })
    
    try:
        print("Running MongoDB test...")
        test_result = test_mongodb_setup()
        
        return jsonify({
            "success": test_result,
            "message": "MongoDB test completed",
            "details": "Check server logs for detailed test results"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"MongoDB test failed: {str(e)}",
            "details": str(e)
        })

@app.route('/api/sample-test', methods=['GET'])
def sample_test():
    """Test with sample data that matches your response.json format"""
    if not MONGODB_AVAILABLE:
        return jsonify({
            "success": False,
            "error": "MongoDB not available"
        })
    
    try:
        # Sample data exactly matching your response.json structure
        sample_processed_data = [
            {
                "question_id": "683c685a3599ec36cc34c386",
                "question_text": "Name a Sanskrit grammatical case.",
                "top_answers": [
                    {
                        "answer_text": "Prathama",
                        "count": 1,
                        "rank": 1,
                        "score": 100
                    },
                    {
                        "answer_text": "Vibhakti",
                        "count": 1,
                        "rank": 2,
                        "score": 80
                    }
                ]
            },
            {
                "question_id": "683c685a3599ec36cc34c385",
                "question_text": "Name a Sanskrit word that has entered English vocabulary.",
                "top_answers": [
                    {
                        "answer_text": "Avatar",
                        "count": 1,
                        "rank": 1,
                        "score": 100
                    },
                    {
                        "answer_text": "Yoga",
                        "count": 1,
                        "rank": 2,
                        "score": 80
                    }
                ]
            }
        ]
        
        print("Testing with sample data...")
        storage_result = store_survey_data(sample_processed_data)
        
        return jsonify({
            "success": storage_result["success"],
            "storage_result": storage_result,
            "sample_data": sample_processed_data,
            "message": "Sample test completed"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Sample test failed: {str(e)}"
        })

print("Starting Flask app...")

if __name__ == '__main__':
    # Test MongoDB on startup if available
    if MONGODB_AVAILABLE:
        print("\n🔧 Testing MongoDB connection on startup...")
        try:
            success = test_mongodb_setup()
            if success:
                print("MongoDB ready for use!")
            else:
                print("MongoDB test failed - check connection")
        except Exception as e:
            print(f"MongoDB startup test error: {e}")
    
    print(f"\n Server starting on http://localhost:5000")
    print(f" Analytics endpoint: http://localhost:5000/api/top-answers")
    print(f" Test MongoDB: http://localhost:5000/api/test-mongodb")
    print(f" Sample test: http://localhost:5000/api/sample-test")
    
    app.run(host='0.0.0.0', port=5000)