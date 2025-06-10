#!/usr/bin/env python3
"""
Test the EXACT format you provided:
- Complete question structure
- All fields included
- Only rank and score updated
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_exact_format():
    base_url = os.getenv('API_BASE_URL')
    api_key = os.getenv('API_KEY')
    endpoint = os.getenv('API_ENDPOINT')
    
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }
    
    url = f"{base_url}{endpoint}"
    
    print("🧪 Testing EXACT API Format (Complete Question Structure)")
    print("=" * 70)
    
    # Get current data
    print("1️⃣ Getting current data...")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"❌ GET failed: {response.status_code}")
            return
        
        data = response.json()
        questions = data['data']
        sample = questions[0]
        
        print(f"✅ Got {len(questions)} questions")
        print(f"Sample question: {sample['_id']}")
        print(f"Has {len(sample['answers'])} answers")
        
        # Show current rank/score values
        print("\nCurrent answer ranking:")
        for i, answer in enumerate(sample['answers']):
            print(f"  Answer {i+1}: '{answer.get('answer', '')[:20]}...' - "
                  f"isCorrect: {answer.get('isCorrect')}, "
                  f"responseCount: {answer.get('responseCount', 0)}, "
                  f"rank: {answer.get('rank', 0)}, "
                  f"score: {answer.get('score', 0)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test with EXACT format you provided
    print("\n2️⃣ Testing with EXACT API format...")
    
    # Calculate new rankings based on correct answers and responseCount
    ranked_answers = []
    correct_answers = [a for a in sample['answers'] if a.get('isCorrect', False)]
    incorrect_answers = [a for a in sample['answers'] if not a.get('isCorrect', False)]
    
    # Sort correct answers by responseCount (highest first)
    correct_answers.sort(key=lambda x: x.get('responseCount', 0), reverse=True)
    
    # Assign ranks and scores to correct answers
    scoring_values = [100, 80, 60, 40, 20]
    for i, answer in enumerate(correct_answers):
        rank = i + 1
        score = scoring_values[i] if i < len(scoring_values) else 0
        
        formatted_answer = {
            "answer": answer.get('answer', ''),
            "isCorrect": answer.get('isCorrect', False),
            "responseCount": answer.get('responseCount', 0),
            "rank": rank,
            "score": score,
            "answerID": answer.get('_id', '')
        }
        ranked_answers.append(formatted_answer)
    
    # Add incorrect answers with rank=0, score=0
    for answer in incorrect_answers:
        formatted_answer = {
            "answer": answer.get('answer', ''),
            "isCorrect": answer.get('isCorrect', False),
            "responseCount": answer.get('responseCount', 0),
            "rank": 0,
            "score": 0,
            "answerID": answer.get('_id', '')
        }
        ranked_answers.append(formatted_answer)
    
    # Build the EXACT payload structure
    exact_payload = {
        "questions": [{
            "questionID": sample['_id'],
            "question": sample.get('question', ''),
            "questionType": sample.get('questionType', ''),
            "questionCategory": sample.get('questionCategory', ''),
            "questionLevel": sample.get('questionLevel', ''),
            "timesSkipped": sample.get('timesSkipped', 0),
            "timesAnswered": sample.get('timesAnswered', 0),
            "answers": ranked_answers
        }]
    }
    
    print("📋 EXACT payload (with updated rankings):")
    print(json.dumps(exact_payload, indent=2))
    
    print("\nNew rankings calculated:")
    for i, answer in enumerate(exact_payload['questions'][0]['answers']):
        print(f"  Answer {i+1}: '{answer['answer'][:20]}...' - "
              f"rank: {answer['rank']}, score: {answer['score']}")
    
    print("\n📤 Sending PUT request with EXACT format...")
    try:
        response = requests.put(url, headers=headers, json=exact_payload, timeout=15)
        print(f"📡 Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS! EXACT format works!")
            try:
                resp_data = response.json()
                print("📊 Success response:")
                print(json.dumps(resp_data, indent=2))
            except:
                print(f"📊 Response text: {response.text}")
        else:
            print(f"❌ Failed with status {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type')}")
            print(f"Response: {response.text[:500]}...")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
    
    print("\n" + "="*70)
    print("📊 SUMMARY")
    print("="*70)
    print("✅ Use the COMPLETE question structure with ALL fields:")
    print("   - questionID, question, questionType, questionCategory, questionLevel")
    print("   - timesSkipped, timesAnswered")
    print("   - Complete answers array with ALL fields")
    print("   - Only rank and score values should be updated")

if __name__ == "__main__":
    test_exact_format()