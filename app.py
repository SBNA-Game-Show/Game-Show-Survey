print("Importing Flask...")
from flask import Flask, jsonify
print("Importing MongoClient...")
from pymongo import MongoClient
print("Importing analytics...")
from analytics import process_top_5_answers
import os
from dotenv import load_dotenv

print("Loading .env...")

# from flask import Flask, jsonify
# from pymongo import MongoClient
# from analytics import process_top_5_answers
# import os
# from dotenv import load_dotenv

# Load environment variables
load_dotenv()


app = Flask(__name__)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = "questions"

print(f"MONGO_URI loaded: {MONGO_URI}")
print(f"DB_NAME loaded: {DB_NAME}")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "Flask server running"})


@app.route('/api/top-answers', methods=['GET'])
def top_answers():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    questions_collection = db[COLLECTION_NAME]

    questions = list(questions_collection.find({}, {"_id": 1, "question": 1, "answers": 1}))

    processed_data = process_top_5_answers(questions)

    return jsonify({"success": True, "data": processed_data})
print("Starting Flask app...")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
