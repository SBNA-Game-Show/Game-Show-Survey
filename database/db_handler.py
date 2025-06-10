import logging
import requests
from typing import List, Dict, Optional
from config.settings import Config
#test
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
            
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers, timeout=self.timeout)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=self.headers, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            logger.debug(f"Response status: {response.status_code}")
            
            # Handle different status codes
            if response.status_code == 404:
                logger.error(f"❌ API endpoint not found: {url}")
                raise Exception(f"API endpoint not found (404): {self.endpoint}")
            elif response.status_code == 401:
                logger.error(f"❌ Unauthorized access - check API key: {self.api_key}")
                raise Exception(f"Unauthorized (401): Check API key")
            elif response.status_code == 403:
                logger.error(f"❌ Forbidden access - insufficient permissions")
                raise Exception(f"Forbidden (403): Insufficient permissions")
            elif response.status_code == 500:
                logger.error(f"❌ Server error - check API service logs")
                raise Exception(f"Server error (500): API service error")
            elif response.status_code not in [200, 201]:
                logger.error(f"❌ Unexpected status code {response.status_code}")
                raise Exception(f"API returned status {response.status_code}")
            
            # Parse JSON response
            try:
                return response.json()
            except ValueError as e:
                logger.error(f"❌ Invalid JSON response")
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
            
            # Handle API response structure
            if isinstance(response_data, dict):
                if 'questions' in response_data:
                    # Format: {questions: [...]}
                    questions = response_data['questions']
                elif 'data' in response_data:
                    # Format: {statusCode, data, message, success}
                    if not response_data.get('success', True):
                        raise Exception(f"API returned error: {response_data.get('message', 'Unknown error')}")
                    questions = response_data['data']
                else:
                    # Single question or unknown format
                    questions = [response_data] if 'questionID' in response_data or '_id' in response_data else []
                
                if not isinstance(questions, list):
                    questions = [questions] if questions else []
            elif isinstance(response_data, list):
                # Direct list response
                questions = response_data
            else:
                questions = []
            
            # Process questions to ensure consistent format
            processed_questions = []
            for question in questions:
                # Handle both questionID and _id formats
                if 'questionID' in question:
                    question['_id'] = str(question['questionID'])
                elif '_id' in question:
                    question['_id'] = str(question['_id'])
                
                # Ensure answers field exists
                if 'answers' not in question or question['answers'] is None:
                    question['answers'] = []
                
                # Standardize answer fields
                for answer in question['answers']:
                    # Handle both answerID and _id formats
                    if 'answerID' in answer:
                        answer['_id'] = str(answer['answerID'])
                    elif '_id' in answer and answer['_id']:
                        answer['_id'] = str(answer['_id'])
                    
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
        """Update answers for a specific question via API"""
        try:
            # Prepare answers for API submission
            formatted_answers = []
            for answer in answers:
                formatted_answer = {
                    'answer': answer.get('answer', ''),
                    'isCorrect': bool(answer.get('isCorrect', False)),
                    'responseCount': int(answer.get('responseCount', 0)),
                    'rank': int(answer.get('rank', 0)),
                    'score': int(answer.get('score', 0))
                }
                
                # Handle both answerID and _id formats
                if 'answerID' in answer and answer['answerID']:
                    formatted_answer['answerID'] = answer['answerID']
                elif '_id' in answer and answer['_id']:
                    formatted_answer['answerID'] = answer['_id']
                
                formatted_answers.append(formatted_answer)
            
            # Prepare request data in expected format: {questions: [...]}
            update_data = {
                "questions": [{
                    "questionID": question_id,
                    "answers": formatted_answers
                }]
            }
            
            logger.debug(f"Updating question {question_id} with {len(formatted_answers)} answers")
            
            # Make API request
            response = self._make_request("PUT", update_data)
            
            # Check if update was successful
            if isinstance(response, dict):
                # Check for various success indicators
                if (response.get('success', False) and response.get('statusCode') == 200) or \
                   response.get('statusCode') == 200 or \
                   'questions' in response:
                    logger.debug(f"✅ Successfully updated question {question_id}")
                    return True
                else:
                    error_msg = response.get('message', str(response))
                    logger.warning(f"❌ API update failed for question {question_id}: {error_msg}")
                    return False
            else:
                # Assume success if no error was thrown
                logger.debug(f"✅ Successfully updated question {question_id}")
                return True
                
        except Exception as e:
            logger.error(f"❌ Failed to update question {question_id}: {str(e)}")
            return False
    
    def bulk_update_questions(self, questions: List[Dict]) -> Dict:
        """Bulk update multiple questions via single API call"""
        try:
            logger.info(f"Bulk updating {len(questions)} questions via API")
            
            # Prepare bulk data in expected format
            bulk_questions = []
            for question in questions:
                question_data = {
                    "questionID": question['_id'],
                    "answers": []
                }
                
                # Format answers for bulk update
                for answer in question['answers']:
                    formatted_answer = {
                        'answer': answer.get('answer', ''),
                        'isCorrect': bool(answer.get('isCorrect', False)),
                        'responseCount': int(answer.get('responseCount', 0)),
                        'rank': int(answer.get('rank', 0)),
                        'score': int(answer.get('score', 0))
                    }
                    
                    # Handle both answerID and _id formats
                    if 'answerID' in answer and answer['answerID']:
                        formatted_answer['answerID'] = answer['answerID']
                    elif '_id' in answer and answer['_id']:
                        formatted_answer['answerID'] = answer['_id']
                    
                    question_data['answers'].append(formatted_answer)
                
                bulk_questions.append(question_data)
            
            # Send all questions in one PUT request
            updated_count = 0
            failed_count = 0
            
            try:
                bulk_update_data = {"questions": bulk_questions}
                response = self._make_request("PUT", bulk_update_data)
                
                # Handle bulk response
                if isinstance(response, dict):
                    if (response.get('success', False) and response.get('statusCode') == 200) or \
                       response.get('statusCode') == 200 or \
                       'questions' in response:
                        updated_count = len(questions)
                        logger.info(f"✅ Bulk update successful: {updated_count} questions updated")
                    else:
                        error_msg = response.get('message', str(response))
                        logger.error(f"❌ Bulk update failed: {error_msg}")
                        failed_count = len(questions)
                else:
                    # Assume success if no error thrown
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