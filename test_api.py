#!/usr/bin/env python3
"""
Test script to verify API connection using environment variables
Run this before starting your applications
"""

import os
import requests
import json
import sys
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_api_with_env():
    """Test API using environment variables"""
    
    # Get configuration from environment
    base_url = os.getenv('API_BASE_URL')
    api_key = os.getenv('API_KEY')
    endpoint = os.getenv('API_ENDPOINT')
    
    if not all([base_url, api_key, endpoint]):
        print("❌ Missing environment variables!")
        print("Required: API_BASE_URL, API_KEY, API_ENDPOINT")
        print("Check your .env file")
        return False
    
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }
    
    print("🧪 API Test with Environment Variables")
    print("=" * 60)
    print(f"Base URL: {base_url}")
    print(f"Endpoint: {endpoint}")
    print(f"API Key: {api_key[:8]}...")
    print(f"Full URL: {base_url}{endpoint}")
    print()
    
    # Test 1: Basic connectivity
    print("1️⃣ Testing basic connectivity...")
    try:
        response = requests.get(base_url, timeout=10)
        print(f"   ✅ Base URL accessible: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Base URL failed: {e}")
        return False
    
    # Test 2: GET request to survey endpoint
    print("\n2️⃣ Testing GET request to survey endpoint...")
    try:
        url = f"{base_url}{endpoint}"
        response = requests.get(url, headers=headers, timeout=15)
        
        print(f"   📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ GET request successful!")
            
            try:
                data = response.json()
                print(f"   📊 Response type: {type(data)}")
                
                if isinstance(data, dict):
                    print(f"   🔑 Response keys: {list(data.keys())}")
                    
                    # Check for questions
                    questions = None
                    if 'questions' in data:
                        questions = data['questions']
                        print(f"   📝 Found {len(questions)} questions in 'questions' field")
                    elif 'data' in data:
                        questions = data['data']
                        print(f"   📝 Found {len(questions)} questions in 'data' field")
                    
                    if questions and len(questions) > 0:
                        first_question = questions[0]
                        q_id = first_question.get('questionID', first_question.get('_id', 'NO_ID'))
                        q_text = first_question.get('question', 'NO_QUESTION')[:50]
                        answers = first_question.get('answers', [])
                        
                        print(f"   🎯 Sample question ID: {q_id}")
                        print(f"   🎯 Sample question: {q_text}...")
                        print(f"   🎯 Sample has {len(answers)} answers")
                        
                        # Check for correct answers
                        correct_answers = [a for a in answers if a.get('isCorrect')]
                        print(f"   🏆 Correct answers found: {len(correct_answers)}")
                
                elif isinstance(data, list):
                    print(f"   📝 Direct list with {len(data)} items")
                
            except json.JSONDecodeError as e:
                print(f"   ❌ Invalid JSON response: {e}")
                
        elif response.status_code == 401:
            print("   ❌ Unauthorized - check API key in .env file")
            return False
        elif response.status_code == 404:
            print("   ❌ Endpoint not found - check API_ENDPOINT in .env file")
            return False
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ GET request failed: {e}")
        return False
    
    # Test 3: Performance test
    print("\n3️⃣ Testing response time...")
    try:
        start_time = time.time()
        response = requests.get(f"{base_url}{endpoint}", headers=headers, timeout=10)
        end_time = time.time()
        
        response_time = round((end_time - start_time) * 1000, 2)
        print(f"   ⏱️ Response time: {response_time}ms")
        
        if response_time < 1000:
            print("   ✅ Good response time")
        elif response_time < 3000:
            print("   ⚠️ Acceptable response time")
        else:
            print("   ❌ Slow response time")
            
    except Exception as e:
        print(f"   ❌ Performance test failed: {e}")
    
    # Summary
    print("\n📋 TEST SUMMARY")
    print("=" * 60)
    
    if response.status_code == 200:
        print("✅ API is accessible and responding correctly")
        print("✅ Environment variables are configured properly")
        print("\n🚀 Ready to run applications:")
        print("1. One-time processor: python ranking_processor.py")
        print("2. Debug UI: python debug_ui.py")
        return True
    else:
        print("❌ API connection issues detected")
        print("\n🔧 Check your .env file:")
        print("- API_BASE_URL should be the full base URL")
        print("- API_KEY should be your authentication key")
        print("- API_ENDPOINT should be the endpoint path")
        return False

def check_env_file():
    """Check if .env file exists and has required variables"""
    if not os.path.exists('.env'):
        print("❌ .env file not found!")
        print("Create a .env file with:")
        print("API_BASE_URL=https://your-api-url.com")
        print("API_KEY=your-api-key")
        print("API_ENDPOINT=/api/v1/admin/survey")
        return False
    
    required_vars = ['API_BASE_URL', 'API_KEY', 'API_ENDPOINT']
    missing = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        print("Add them to your .env file")
        return False
    
    print("✅ .env file found with required variables")
    return True

if __name__ == "__main__":
    print("🔍 Environment & API Configuration Test")
    print("=" * 60)
    
    # Check .env file first
    if not check_env_file():
        sys.exit(1)
    
    # Test API connection
    success = test_api_with_env()
    
    print(f"\n{'='*60}")
    if success:
        print("🎉 All tests passed! Your configuration is ready.")
    else:
        print("⚠️ Some tests failed. Fix the issues above.")
    
    sys.exit(0 if success else 1)