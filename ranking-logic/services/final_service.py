"""
Final Service - Handles GET, DELETE, then POST for Input questions with 3+ correct answers
"""

import json
import logging
from typing import List, Dict, Tuple
from config.settings import Config
from utils.api_handler import APIHandler
from utils.data_formatters import QuestionFormatter
from utils.response_processor import ResponseProcessor
from constants import QuestionFields, AnswerFields, APIKeys

logger = logging.getLogger('survey_analytics')


class FinalEndpointHandler:
    """Handles API communication with the /final endpoint - GET, DELETE, and POST"""
    
    def __init__(self):
        self.api = APIHandler(
            base_url=Config.API_BASE_URL,
            api_key=Config.API_KEY,
            endpoint="/api/v1/admin/survey/final"
        )
    
    def get_existing_questions(self) -> List[Dict]:
        """GET existing questions from final endpoint"""
        try:
            logger.info("📥 Getting existing questions from final endpoint")
            
            response = self.api.make_request("GET")
            
            # Extract questions from response
            questions = ResponseProcessor.extract_questions_from_response(response)
            
            logger.info(f"✅ Found {len(questions)} existing questions in final endpoint")
            return questions
            
        except Exception as e:
            # If GET fails (e.g., 404 for empty), treat as no existing questions
            if "404" in str(e) or "not found" in str(e).lower():
                logger.info("📭 No existing questions found in final endpoint (empty)")
                return []
            else:
                logger.error(f"❌ Failed to get existing questions from final endpoint: {str(e)}")
                raise
    
    def delete_existing_questions(self, existing_questions: List[Dict]) -> bool:
        """DELETE existing questions from final endpoint"""
        try:
            if not existing_questions:
                logger.info("⏭️ No existing questions to delete")
                return True
            
            logger.info(f"🗑️ Deleting {len(existing_questions)} existing questions from final endpoint")
            
            # Build delete payload using _id from GET response as questionID
            delete_payload = {
                "questions": [
                    {"questionID": question.get("_id")} 
                    for question in existing_questions 
                    if question.get("_id")
                ]
            }
            
            if not delete_payload["questions"]:
                logger.warning("⚠️ No valid question IDs found for deletion")
                return True
            
            logger.debug(f"DELETE payload: {json.dumps(delete_payload, indent=2)}")
            
            response = self.api.make_request("DELETE", delete_payload)
            
            if ResponseProcessor.is_success_response(response):
                logger.info(f"✅ Successfully deleted {len(delete_payload['questions'])} questions from final endpoint")
                return True
            else:
                error_msg = response.get(APIKeys.MESSAGE, str(response))
                logger.error(f"❌ Failed to delete questions from final endpoint: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Exception deleting questions from final endpoint: {str(e)}")
            return False
    
    def post_questions(self, questions: List[Dict]) -> bool:
        """POST questions to the final endpoint"""
        try:
            if not questions:
                logger.warning("No questions to POST to final endpoint")
                return True
            
            logger.info(f"📤 POSTing {len(questions)} questions to final endpoint")
            
            # Format questions for API
            formatted_questions = [self._format_question_for_final_api(q) for q in questions]
            payload = {APIKeys.QUESTIONS: formatted_questions}
            
            # DEBUG: Log the payload structure
            logger.debug(f"POST payload structure: {json.dumps(payload, indent=2, default=str)[:500]}...")
            
            response = self.api.make_request("POST", payload)
            
            if ResponseProcessor.is_success_response(response):
                logger.info(f"✅ Successfully posted {len(questions)} questions to final endpoint")
                return True
            else:
                error_msg = response.get(APIKeys.MESSAGE, str(response))
                logger.error(f"❌ Failed to post questions to final endpoint: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Exception posting questions to final endpoint: {str(e)}")
            return False
    
    def _format_question_for_final_api(self, question: Dict) -> Dict:
        """Format question for final endpoint API submission"""
        formatted_question = {
            QuestionFields.QUESTION: question.get(QuestionFields.QUESTION, ''),
            QuestionFields.QUESTION_TYPE: question.get(QuestionFields.QUESTION_TYPE, ''),
            QuestionFields.QUESTION_CATEGORY: question.get(QuestionFields.QUESTION_CATEGORY, ''),
            QuestionFields.QUESTION_LEVEL: question.get(QuestionFields.QUESTION_LEVEL, ''),
            QuestionFields.TIMES_SKIPPED: question.get(QuestionFields.TIMES_SKIPPED, 0),
            QuestionFields.TIMES_ANSWERED: question.get(QuestionFields.TIMES_ANSWERED, 0),
            QuestionFields.ANSWERS: [self._format_answer_for_final_api(a) for a in question.get(QuestionFields.ANSWERS, [])]
        }
        
        return formatted_question
    
    def _format_answer_for_final_api(self, answer: Dict) -> Dict:
        """Format answer for final endpoint API submission"""
        return {
            AnswerFields.ANSWER: answer.get(AnswerFields.ANSWER, ''),
            AnswerFields.RESPONSE_COUNT: answer.get(AnswerFields.RESPONSE_COUNT, 0),
            AnswerFields.IS_CORRECT: answer.get(AnswerFields.IS_CORRECT, False),
            AnswerFields.RANK: answer.get(AnswerFields.RANK, 0),
            AnswerFields.SCORE: answer.get(AnswerFields.SCORE, 0)
        }


class QuestionValidator:
    """Validates questions for final endpoint requirements"""
    
    @staticmethod
    def validate_question_for_final(question: Dict) -> Tuple[bool, str]:
        """Validate if question meets final endpoint requirements"""
        question_type = question.get(QuestionFields.QUESTION_TYPE, '').lower()
        answers = question.get(QuestionFields.ANSWERS, [])
        
        # Only process Input questions
        if question_type != 'input':
            return False, f"Skipping {question_type} question - only Input questions are processed"
        
        # Check for at least 3 correct answers
        correct_answers = [a for a in answers if a.get(AnswerFields.IS_CORRECT, False)]
        
        if len(correct_answers) < 1:
            return False, f"Input question needs at least 1 correct answer, found {len(correct_answers)}"
        
        return True, "Valid Input question"


class AnswerFilter:
    """Filters answers for final endpoint - only correct answers"""
    
    @staticmethod
    def filter_answers_for_final(question: Dict) -> Dict:
        """Filter to include only correct answers"""
        answers = question.get(QuestionFields.ANSWERS, [])
        
        # Only include correct answers
        filtered_answers = [a for a in answers if a.get(AnswerFields.IS_CORRECT, False)]
        
        # Create a copy of the question with filtered answers
        filtered_question = question.copy()
        filtered_question[QuestionFields.ANSWERS] = filtered_answers
        
        return filtered_question


class FinalService:
    """Main service for handling final endpoint GET, DELETE, and POST operations"""
    
    def __init__(self, db_handler):
        self.db = db_handler
        self.final_api = FinalEndpointHandler()
        self.validator = QuestionValidator()
        self.answer_filter = AnswerFilter()
    
    def post_to_final_endpoint(self, main_questions: List[Dict]) -> Dict:
        """
        Complete flow: GET existing questions, DELETE them, then POST new questions
        Only processes Input questions with 3+ correct answers
        Only includes correct answers in the POST
        """
        try:
            logger.info("🎯 Starting final endpoint operation: GET → DELETE → POST")
            
            # Step 1: GET existing questions from final endpoint
            existing_questions = self.final_api.get_existing_questions()
            
            # Step 2: DELETE existing questions if any found
            if existing_questions:
                delete_success = self.final_api.delete_existing_questions(existing_questions)
                if not delete_success:
                    logger.error("❌ Failed to delete existing questions - aborting POST")
                    return self._create_result_with_deletion({}, False, 0, len(existing_questions), False)
            else:
                logger.info("⏭️ No existing questions to delete - proceeding to POST")
            
            # Step 3: Process and filter new questions for POST
            valid_questions = self._filter_and_process_questions(main_questions)
            
            if not valid_questions['questions_to_post']:
                logger.warning("No valid questions to POST to final endpoint")
                return self._create_result_with_deletion(valid_questions, True, 0, len(existing_questions), True)
            
            # Step 4: Execute POST operation
            post_success = self.final_api.post_questions(valid_questions['questions_to_post'])
            
            # Compile result
            return self._create_result_with_deletion(
                valid_questions, 
                post_success, 
                len(valid_questions['questions_to_post']), 
                len(existing_questions),
                len(existing_questions) == 0 or delete_success
            )
            
        except Exception as e:
            logger.error(f"❌ Final endpoint operation failed: {str(e)}")
            raise
    
    def _filter_and_process_questions(self, main_questions: List[Dict]) -> Dict:
        """Filter and process questions for final endpoint"""
        questions_to_post = []
        skipped_mcq = 0          
        skipped_insufficient = 0

        for question in main_questions:
            question_id = QuestionFormatter.get_question_id(question)
            question_type = (question.get(QuestionFields.QUESTION_TYPE) or "").lower()

            #MCQ: send directly to finalQuestions without ranking/validation
            if question_type == "mcq":
                logger.debug(f"✅ Passing MCQ question {question_id} directly to final")
                questions_to_post.append(question)
                # we *do* stay inside the loop, just move to next question
                continue

            #Validate Input questions for final endpoint
            is_valid, validation_msg = self.validator.validate_question_for_final(question)

            if not is_valid:
                if "at least" in validation_msg.lower():
                    logger.error(f"❌ Question {question_id}: {validation_msg}")
                    skipped_insufficient += 1
                else:
                    logger.debug(f"⏭️ Question {question_id}: {validation_msg}")
                continue

            #Filter to only correct answers for Input questions
            filtered_question = self.answer_filter.filter_answers_for_final(question)
            questions_to_post.append(filtered_question)

            logger.debug(
                f"✅ Question {question_id} ready for POST "
                f"({len(filtered_question[QuestionFields.ANSWERS])} correct answers)"
            )

        logger.info(
            f"📊 Final POST analysis: {len(questions_to_post)} to post, "
            f"{skipped_mcq} MCQ skipped, {skipped_insufficient} insufficient answers"
        )

        return {
            "questions_to_post": questions_to_post,
            "skipped_mcq": skipped_mcq,
            "skipped_insufficient": skipped_insufficient,
        }


    
    def _create_result_with_deletion(self, filter_result: Dict, post_success: bool, posted_count: int, deleted_count: int, delete_success: bool) -> Dict:
        """Create result dictionary including deletion information"""
        return {
            'questions_posted': posted_count if post_success else 0,
            'questions_failed': posted_count if not post_success else 0,
            'questions_deleted': deleted_count if delete_success else 0,
            'skipped_mcq': filter_result.get('skipped_mcq', 0),
            'skipped_insufficient': filter_result.get('skipped_insufficient', 0),
            'post_success': post_success,
            'delete_success': delete_success,
            'total_processed': len(filter_result.get('questions_to_post', [])) + filter_result.get('skipped_mcq', 0) + filter_result.get('skipped_insufficient', 0)
        }