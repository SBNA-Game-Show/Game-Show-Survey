"""
Refactored Database Handler - Clean and focused
"""

import logging
from typing import List, Dict
from config.settings import Config
from utils.api_handler import APIHandler
from utils.data_formatters import (
    QuestionFormatter, 
    ResponseProcessor, 
    DataValidator
)
from constants import LogMessages, ErrorMessages, APIKeys

logger = logging.getLogger('survey_analytics')


class DatabaseHandler:
    """Handles all database/API operations with clean separation of concerns"""
    
    def __init__(self):
        self.api = APIHandler(
            base_url=Config.API_BASE_URL,
            api_key=Config.API_KEY,
            endpoint=Config.API_ENDPOINT
        )
    
    def test_connection(self) -> bool:
        """Test if API connection is healthy"""
        return self.api.test_connection()
    
    def fetch_all_questions(self) -> List[Dict]:
        """Fetch all questions from API endpoint"""
        try:
            logger.info(LogMessages.FETCHING_QUESTIONS)
            
            response_data = self.api.make_request("GET")
            questions = ResponseProcessor.extract_questions_from_response(response_data)
            
            # Process questions for internal use
            processed_questions = self._process_fetched_questions(questions)
            
            logger.info(LogMessages.QUESTIONS_FETCHED.format(count=len(processed_questions)))
            return processed_questions
            
        except Exception as e:
            logger.error(LogMessages.QUESTIONS_FETCH_FAILED.format(error=str(e)))
            raise
    
    def _process_fetched_questions(self, questions: List[Dict]) -> List[Dict]:
        """Process raw questions from API for internal use"""
        processed_questions = []
        
        for question in questions:
            processed_question = QuestionFormatter.ensure_compatibility(question)
            processed_questions.append(processed_question)
        
        return processed_questions
    
    def update_question_answers(self, question_id: str, answers: List[Dict]) -> bool:
        """Update answers for a specific question via API"""
        try:
            target_question = self._find_question_by_id(question_id)
            if not target_question:
                logger.error(ErrorMessages.QUESTION_NOT_FOUND.format(id=question_id))
                return False
            
            # Update the question with new answers
            target_question[Config.QuestionFields.ANSWERS] = answers
            
            # Format for API submission
            update_data = self._build_single_question_payload(target_question)
            
            logger.debug(f"Updating question {question_id} with exact API format:")
            logger.debug(f"Update payload: {update_data}")
            
            # Make API request
            response = self.api.make_request("PUT", update_data)
            
            # Check if update was successful
            if ResponseProcessor.is_success_response(response):
                logger.debug(LogMessages.UPDATE_SUCCESS.format(id=question_id))
                return True
            else:
                error_msg = response.get(APIKeys.MESSAGE, str(response))
                logger.warning(LogMessages.UPDATE_FAILED.format(id=question_id, error=error_msg))
                return False
                
        except Exception as e:
            logger.error(LogMessages.UPDATE_FAILED.format(id=question_id, error=str(e)))
            return False
    
    def _find_question_by_id(self, question_id: str) -> Dict:
        """Find question by ID from API"""
        questions = self.fetch_all_questions()
        
        for question in questions:
            if (question.get('_id') == question_id or 
                question.get('questionID') == question_id):
                return question
        
        return None
    
    def _build_single_question_payload(self, question: Dict) -> Dict:
        """Build API payload for single question update"""
        formatted_question = QuestionFormatter.format_for_api(question)
        return {APIKeys.QUESTIONS: [formatted_question]}
    
    def bulk_update_questions(self, questions: List[Dict]) -> Dict:
        """Bulk update multiple questions via single API call"""
        try:
            logger.info(LogMessages.BULK_UPDATE_START.format(count=len(questions)))
            
            # Validate and format questions
            valid_questions = self._prepare_questions_for_bulk_update(questions)
            
            if not valid_questions:
                logger.warning("No valid questions to update")
                return self._create_update_result(0, 0, 0)
            
            # Perform bulk update
            return self._execute_bulk_update(valid_questions, len(questions))
            
        except Exception as e:
            logger.error(LogMessages.BULK_UPDATE_FAILED.format(error=str(e)))
            raise
    
    def _prepare_questions_for_bulk_update(self, questions: List[Dict]) -> List[Dict]:
        """Prepare and validate questions for bulk update"""
        valid_questions = []
        
        for question in questions:
            question_id = QuestionFormatter.get_question_id(question)
            
            if not question_id or question_id == 'UNKNOWN':
                logger.warning(f"Question missing ID: {question}")
                continue
            
            if DataValidator.validate_question(question):
                formatted_question = QuestionFormatter.format_for_api(question)
                valid_questions.append(formatted_question)
            else:
                logger.error(ErrorMessages.VALIDATION_FAILED.format(id=question_id))
        
        return valid_questions
    
    def _execute_bulk_update(self, formatted_questions: List[Dict], original_count: int) -> Dict:
        """Execute the bulk update API call"""
        try:
            bulk_update_data = {APIKeys.QUESTIONS: formatted_questions}
            
            logger.info(f"Sending complete question data for {len(formatted_questions)} questions")
            logger.debug(f"Sample question structure: {formatted_questions[0] if formatted_questions else 'None'}")
            
            response = self.api.make_request("PUT", bulk_update_data)
            
            if ResponseProcessor.is_success_response(response):
                updated_count = len(formatted_questions)
                logger.info(LogMessages.BULK_UPDATE_SUCCESS.format(count=updated_count))
                return self._create_update_result(updated_count, 0, original_count)
            else:
                error_msg = response.get(APIKeys.MESSAGE, str(response))
                logger.error(LogMessages.BULK_UPDATE_FAILED.format(error=error_msg))
                return self._create_update_result(0, len(formatted_questions), original_count)
                
        except Exception as e:
            logger.error(LogMessages.BULK_UPDATE_FAILED.format(error=str(e)))
            return self._create_update_result(0, len(formatted_questions), original_count)
    
    def _create_update_result(self, updated: int, failed: int, total: int) -> Dict:
        """Create standardized update result dictionary"""
        return {
            "updated_count": updated,
            "failed_count": failed,
            "total_processed": total
        }
    
    def close(self):
        """Close API connection (no-op for REST API)"""
        logger.info("API handler closed")