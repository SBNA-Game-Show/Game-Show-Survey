import logging
import requests
import json
from typing import List, Dict, Optional
from config.settings import Config

logger = logging.getLogger('survey_analytics')

class DatabaseHandler:
    def __init__(self):
        self.base_url = Config.API_BASE_URL
        self.api_key = Config.API_KEY
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        self.timeout = 30
        self.endpoint = Config.API_ENDPOINT
    
    def _make_request(self, method: str, data: dict = None) -> dict:
        """Make HTTP request to the single API endpoint with error handling"""
        url = f"{self.base_url}{self.endpoint}"
        
        try:
            logger.debug(f"Making {method} request to {url}")
            logger.debug(f"Headers: {self.headers}")
            if data:
                logger.debug(f"Request data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                # Show actual data being sent
                logger.debug(f"Full request data: {json.dumps(data, indent=2)}")
            
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers, timeout=self.timeout)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=self.headers, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            logger.debug(f"Response status: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            
            # Handle different status codes
            if response.status_code == 404:
                logger.error(f"❌ API endpoint not found: {url}")
                raise Exception(f"API endpoint not found (404): {self.endpoint}")
            elif response.status_code == 401:
                logger.error(f"❌ Unauthorized access - check API key")
                raise Exception(f"Unauthorized (401): Check API key")
            elif response.status_code == 403:
                logger.error(f"❌ Forbidden access - insufficient permissions")
                raise Exception(f"Forbidden (403): Insufficient permissions")
            elif response.status_code == 400:
                logger.error(f"❌ Bad Request (400)")
                logger.error(f"❌ Response content type: {response.headers.get('content-type', 'unknown')}")
                logger.error(f"❌ Response body: {response.text[:500]}")
                if data:
                    logger.error(f"❌ Sent data: {json.dumps(data, indent=2)}")
                raise Exception(f"Bad Request (400): {response.text[:200]}")
            elif response.status_code == 500:
                logger.error(f"❌ Server error: {response.text[:500]}")
                raise Exception(f"Server error (500): API service error")
            elif response.status_code not in [200, 201]:
                logger.error(f"❌ Unexpected status code {response.status_code}")
                logger.error(f"❌ Response: {response.text[:500]}")
                raise Exception(f"API returned status {response.status_code}")
            
            # Parse JSON response
            try:
                response_data = response.json()
                logger.debug(f"Response data type: {type(response_data)}")
                if isinstance(response_data, dict):
                    logger.debug(f"Response keys: {list(response_data.keys())}")
                return response_data
            except ValueError as e:
                logger.error(f"❌ Invalid JSON response: {response.text[:500]}")
                raise Exception(f"Invalid JSON response: {str(e)}")
            
        except requests.exceptions.Timeout:
            logger.error(f"❌ Request timeout after {self.timeout}s")
            raise Exception(f"API request timeout")
        except requests.exceptions.ConnectionError:
            logger.error(f"❌ Connection error - server may be down")
            raise Exception(f"API connection error: Cannot reach {self.base_url}")
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Request error: {str(e)}")
            raise Exception(f"API request error: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Unexpected error: {str(e)}")
            raise
    
    def test_connection(self) -> bool:
        """Test if API connection is healthy"""
        try:
            logger.info("Testing API connection...")
            response = self._make_request("GET")
            logger.info("✅ API connection test successful")
            return True
        except Exception as e:
            logger.error(f"❌ API connection test failed: {str(e)}")
            return False
    
    def fetch_all_questions(self) -> List[Dict]:
        """Fetch all questions from API endpoint"""
        try:
            logger.info("Fetching all questions from API")
            
            response_data = self._make_request("GET")
            
            # Handle API response structure: {statusCode, data, message, success}
            if isinstance(response_data, dict):
                if 'data' in response_data:
                    if not response_data.get('success', True):
                        raise Exception(f"API returned error: {response_data.get('message', 'Unknown error')}")
                    questions = response_data['data']
                elif 'questions' in response_data:
                    questions = response_data['questions']
                else:
                    questions = [response_data] if '_id' in response_data else []
                
                if not isinstance(questions, list):
                    questions = [questions] if questions else []
            elif isinstance(response_data, list):
                questions = response_data
            else:
                questions = []
            
            # Process questions for internal use
            processed_questions = []
            for question in questions:
                # Copy _id to questionID for API compatibility
                if '_id' in question:
                    question['questionID'] = question['_id']
                
                # Ensure answers field exists
                if 'answers' not in question or question['answers'] is None:
                    question['answers'] = []
                
                # Process answers
                for answer in question['answers']:
                    # Copy _id to answerID for API compatibility
                    if '_id' in answer:
                        answer['answerID'] = answer['_id']
                    
                    # Set default values for missing fields
                    answer.setdefault('answer', '')
                    answer.setdefault('isCorrect', False)
                    answer.setdefault('responseCount', 0)
                    answer.setdefault('rank', 0)
                    answer.setdefault('score', 0)
                
                processed_questions.append(question)
            
            logger.info(f"Fetched {len(processed_questions)} questions from API")
            return processed_questions
            
        except Exception as e:
            logger.error(f"Failed to fetch questions from API: {str(e)}")
            raise
    
    def update_question_answers(self, question_id: str, answers: List[Dict]) -> bool:
        """Update answers for a specific question via API - EXACT API FORMAT"""
        try:
            # Get the original question data to build the complete structure
            questions = self.fetch_all_questions()
            target_question = None
            
            for q in questions:
                if q.get('_id') == question_id or q.get('questionID') == question_id:
                    target_question = q
                    break
            
            if not target_question:
                logger.error(f"Question {question_id} not found")
                return False
            
            # Build the EXACT format your API expects
            formatted_answers = []
            for answer in answers:
                # Use the EXACT structure from your example
                formatted_answer = {
                    "answer": str(answer.get('answer', '')),
                    "isCorrect": bool(answer.get('isCorrect', False)),
                    "responseCount": int(answer.get('responseCount', 0)),
                    "rank": int(answer.get('rank', 0)),
                    "score": int(answer.get('score', 0)),
                    "answerID": str(answer.get('answerID') or answer.get('_id', ''))
                }
                formatted_answers.append(formatted_answer)
            
            # Build the complete question structure as shown in your example
            update_data = {
                "questions": [{
                    "questionID": str(target_question.get('_id') or target_question.get('questionID')),
                    "question": str(target_question.get('question', '')),
                    "questionType": str(target_question.get('questionType', '')),
                    "questionCategory": str(target_question.get('questionCategory', '')),
                    "questionLevel": str(target_question.get('questionLevel', '')),
                    "timesSkipped": int(target_question.get('timesSkipped', 0)),
                    "timesAnswered": int(target_question.get('timesAnswered', 0)),
                    "answers": formatted_answers
                }]
            }
            
            logger.debug(f"Updating question {question_id} with exact API format:")
            logger.debug(json.dumps(update_data, indent=2))
            
            # Make API request
            response = self._make_request("PUT", update_data)
            
            # Check if update was successful
            if isinstance(response, dict):
                if (response.get('success', False) and response.get('statusCode') == 200) or \
                   response.get('statusCode') == 200 or \
                   'data' in response:
                    logger.debug(f"✅ Successfully updated question {question_id}")
                    return True
                else:
                    error_msg = response.get('message', str(response))
                    logger.warning(f"❌ API update failed for question {question_id}: {error_msg}")
                    return False
            else:
                logger.debug(f"✅ Successfully updated question {question_id}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Failed to update question {question_id}: {str(e)}")
            return False
    
    def bulk_update_questions(self, questions: List[Dict]) -> Dict:
        """Bulk update multiple questions via single API call - EXACT API FORMAT"""
        try:
            logger.info(f"Bulk updating {len(questions)} questions via API")
            
            # Build the complete API payload matching your exact format
            bulk_questions = []
            for question in questions:
                question_id = question.get('questionID') or question.get('_id')
                if not question_id:
                    logger.warning(f"Question missing ID: {question}")
                    continue
                
                # Build complete question data in EXACT API format
                question_data = {
                    "questionID": str(question_id),
                    "question": str(question.get('question', '')),
                    "questionType": str(question.get('questionType', '')),
                    "questionCategory": str(question.get('questionCategory', '')),
                    "questionLevel": str(question.get('questionLevel', '')),
                    "timesSkipped": int(question.get('timesSkipped', 0)),
                    "timesAnswered": int(question.get('timesAnswered', 0)),
                    "answers": []
                }
                
                # Format answers in EXACT API format
                for answer in question['answers']:
                    formatted_answer = {
                        "answer": str(answer.get('answer', '')),
                        "isCorrect": bool(answer.get('isCorrect', False)),
                        "responseCount": int(answer.get('responseCount', 0)),
                        "rank": int(answer.get('rank', 0)),
                        "score": int(answer.get('score', 0)),
                        "answerID": str(answer.get('answerID') or answer.get('_id', ''))
                    }
                    question_data['answers'].append(formatted_answer)
                
                bulk_questions.append(question_data)
            
            if not bulk_questions:
                logger.warning("No valid questions to update")
                return {"updated_count": 0, "failed_count": 0, "total_processed": 0}
            
            # Log the exact API format being sent
            logger.info(f"Sending complete question data for {len(bulk_questions)} questions")
            logger.debug(f"Sample question structure (exact API format):")
            logger.debug(json.dumps(bulk_questions[0], indent=2))
            
            # Send complete question data
            updated_count = 0
            failed_count = 0
            
            try:
                bulk_update_data = {"questions": bulk_questions}
                
                response = self._make_request("PUT", bulk_update_data)
                
                # Handle bulk response
                if isinstance(response, dict):
                    logger.debug(f"Bulk update response: {json.dumps(response, indent=2)}")
                    if (response.get('success', False) and response.get('statusCode') == 200) or \
                       response.get('statusCode') == 200 or \
                       'data' in response:
                        updated_count = len(questions)
                        logger.info(f"✅ Bulk update successful: {updated_count} questions updated")
                    else:
                        error_msg = response.get('message', str(response))
                        logger.error(f"❌ Bulk update failed: {error_msg}")
                        failed_count = len(questions)
                else:
                    updated_count = len(questions)
                    logger.info(f"✅ Bulk update successful: {updated_count} questions updated")
                    
            except Exception as bulk_error:
                logger.error(f"❌ Bulk update failed: {str(bulk_error)}")
                failed_count = len(questions)
            
            logger.info(f"Bulk update completed: {updated_count} updated, {failed_count} failed")
            
            return {
                "updated_count": updated_count,
                "failed_count": failed_count,
                "total_processed": len(questions)
            }
            
        except Exception as e:
            logger.error(f"Bulk update failed: {str(e)}")
            raise
    
    def close(self):
        """Close API connection (no-op for REST API)"""
        logger.info("API handler closed")