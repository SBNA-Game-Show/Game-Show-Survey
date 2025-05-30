print("Importing Flask...")
from flask import Flask, jsonify
print("Importing requests...")
import requests
print("Importing analytics...")
from analytics import process_top_5_answers
import os
from dotenv import load_dotenv

print("Loading .env...")

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Backend API configuration
BACKEND_BASE_URL = "https://sbnabackendnew.onrender.com"
API_KEY = os.getenv("API_KEY")

print(f"BACKEND_BASE_URL: {BACKEND_BASE_URL}")
print(f"API_KEY loaded: {'Yes' if API_KEY else 'No'}")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "Flask server running"})

@app.route('/api/top-answers', methods=['GET'])
def top_answers():
    try:
        # Make API call to backend to get questions and answers
        headers = {
            'x-api-key': API_KEY
        }
        
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
        
        # Extract questions data from backend response
        if isinstance(backend_data, dict) and 'data' in backend_data:
            questions = backend_data['data']
        else:
            questions = backend_data
        
        # Process the data using your analytics algorithm
        processed_data = process_top_5_answers(questions)
        
        return jsonify({"success": True, "data": processed_data})
        
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

print("Starting Flask app...")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)