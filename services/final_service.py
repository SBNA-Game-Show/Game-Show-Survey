"""
Final Service - Handles the /api/v1/admin/survey/final endpoint operations
"""

import json
import logging
from typing import List, Dict, Tuple
from config.settings import Config
from utils.api_handler import APIHandler
from utils.data_formatters import QuestionFormatter, ResponseProcessor
from constants import QuestionFields, AnswerFields, APIKeys

logger = logging.getLogger('survey_analytics')


class FinalEndpointHandler:
    """Handles API communication with the /final endpoint"""
    
    def __init__(self):
        self.api = APIHandler(
            base_url=Config.API_BASE_URL,
            api_key=Config.API_KEY,
            endpoint="/api/v1/admin/survey/final"
        )
    
    def fetch_final_questions(self) -> List[Dict]:
        """Fetch all questions from the final endpoint"""
        try:
            logger.info("📥 Fetching questions from final endpoint...")
            response_data = self.api.make_request("GET")
            
            # Handle empty database case
            if response_data.get("_empty_database"):
                logger.info("📭 Final endpoint is empty")
                return []
            
            questions = ResponseProcessor.extract_questions_from_response(response_data)
            logger.info(f"✅ Found {len(questions)} questions in final endpoint")
            return questions
            
        except Exception as e:
            if "404" in str(e) or "not found" in str(e).lower():
                logger.info("📭 Final endpoint is empty (404)")
                return []
            logger.error(f"❌ Failed to fetch final questions: {str(e)}")
            raise
    
    def post_new_questions(self, questions: List[Dict]) -> bool:
        """POST new questions to the final endpoint"""
        try:
            if not questions:
                return True
            
            logger.info(f"📤 POSTing {len(questions)} new questions to final endpoint")
            
            # Format questions for API
            formatted_questions = [self._format_question_for_final_api(q) for q in questions]
            payload = {APIKeys.QUESTIONS: formatted_questions}
            
            # DEBUG: Log the payload structure we're sending
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
    
    def put_updated_questions(self, questions: List[Dict]) -> bool:
        """PUT updated questions to the final endpoint"""
        try:
            if not questions:
                return True
            
            logger.info(f"📤 PUTting {len(questions)} updated questions to final endpoint")
            
            # Format questions for API (include questionID for PUT)
            formatted_questions = [self._format_question_for_final_api(q, include_question_id=True) for q in questions]
            payload = {APIKeys.QUESTIONS: formatted_questions}
            
            response = self.api.make_request("PUT", payload)
            
            if ResponseProcessor.is_success_response(response):
                logger.info(f"✅ Successfully updated {len(questions)} questions in final endpoint")
                return True
            else:
                error_msg = response.get(APIKeys.MESSAGE, str(response))
                logger.error(f"❌ Failed to update questions in final endpoint: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Exception updating questions in final endpoint: {str(e)}")
            return False
    
    def _format_question_for_final_api(self, question: Dict, include_question_id: bool = False) -> Dict:
        """Format question for final endpoint API submission"""
        formatted_question = {
            QuestionFields.QUESTION: question.get(QuestionFields.QUESTION, ''),
            QuestionFields.QUESTION_TYPE: question.get(QuestionFields.QUESTION_TYPE, ''),
            QuestionFields.QUESTION_CATEGORY: question.get(QuestionFields.QUESTION_CATEGORY, ''),
            QuestionFields.QUESTION_LEVEL: question.get(QuestionFields.QUESTION_LEVEL, ''),
            QuestionFields.TIMES_SKIPPED: question.get(QuestionFields.TIMES_SKIPPED, 0),
            QuestionFields.TIMES_ANSWERED: question.get(QuestionFields.TIMES_ANSWERED, 0),
            QuestionFields.ANSWERS: [self._format_answer_for_final_api(a, include_answer_id=include_question_id) for a in question.get(QuestionFields.ANSWERS, [])]
        }
        
        # Include questionID for PUT requests
        if include_question_id:
            formatted_question[QuestionFields.QUESTION_ID] = QuestionFormatter.get_question_id(question)
        
        return formatted_question
    
    def _format_answer_for_final_api(self, answer: Dict, include_answer_id: bool = False) -> Dict:
        """Format answer for final endpoint API submission"""
        formatted_answer = {
            AnswerFields.ANSWER: answer.get(AnswerFields.ANSWER, ''),
            AnswerFields.IS_CORRECT: answer.get(AnswerFields.IS_CORRECT, False),
            AnswerFields.RESPONSE_COUNT: answer.get(AnswerFields.RESPONSE_COUNT, 0),
            AnswerFields.RANK: answer.get(AnswerFields.RANK, 0),
            AnswerFields.SCORE: answer.get(AnswerFields.SCORE, 0)
        }
        
        # Include answerID only for PUT requests (when include_answer_id=True)
        if include_answer_id:
            answer_id = answer.get(AnswerFields.ID) or answer.get(AnswerFields.ANSWER_ID)
            if answer_id:
                formatted_answer[AnswerFields.ANSWER_ID] = answer_id
        
        return formatted_answer


class QuestionValidator:
    """Validates questions for final endpoint requirements"""
    
    @staticmethod
    def validate_question_for_final(question: Dict) -> Tuple[bool, str]:
        """Validate if question meets final endpoint requirements"""
        question_type = question.get(QuestionFields.QUESTION_TYPE, '').lower()
        answers = question.get(QuestionFields.ANSWERS, [])
        
        if question_type == 'input':
            return QuestionValidator._validate_input_question(answers)
        elif question_type == 'mcq':
            return QuestionValidator._validate_mcq_question(answers)
        else:
            return False, f"Unknown question type: {question_type}"
    
    @staticmethod
    def _validate_input_question(answers: List[Dict]) -> Tuple[bool, str]:
        """Validate Input type question - needs at least 3 correct answers"""
        correct_answers = [a for a in answers if a.get(AnswerFields.IS_CORRECT, False)]
        
        if len(correct_answers) < 3:
            return False, f"Input question needs at least 3 correct answers, found {len(correct_answers)}"
        
        return True, "Valid Input question"
    
    @staticmethod
    def _validate_mcq_question(answers: List[Dict]) -> Tuple[bool, str]:
        """Validate MCQ type question - needs exactly 4 answers with 1 correct"""
        if len(answers) != 4:
            return False, f"MCQ question needs exactly 4 answers, found {len(answers)}"
        
        correct_answers = [a for a in answers if a.get(AnswerFields.IS_CORRECT, False)]
        
        if len(correct_answers) != 1:
            return False, f"MCQ question needs exactly 1 correct answer, found {len(correct_answers)}"
        
        return True, "Valid MCQ question"


class AnswerFilter:
    """Filters answers based on question type for final endpoint"""
    
    @staticmethod
    def filter_answers_for_final(question: Dict) -> Dict:
        """Filter answers based on question type"""
        question_type = question.get(QuestionFields.QUESTION_TYPE, '').lower()
        answers = question.get(QuestionFields.ANSWERS, [])
        
        if question_type == 'input':
            # Input: Only correct answers
            filtered_answers = [a for a in answers if a.get(AnswerFields.IS_CORRECT, False)]
        elif question_type == 'mcq':
            # MCQ: All answers
            filtered_answers = answers
        else:
            # Unknown type: Keep all answers
            filtered_answers = answers
        
        # Create a copy of the question with filtered answers
        filtered_question = question.copy()
        filtered_question[QuestionFields.ANSWERS] = filtered_answers
        
        return filtered_question


class QuestionComparator:
    """Compares questions to determine if updates are needed"""
    
    @staticmethod
    def compare_questions(main_question: Dict, final_question: Dict) -> bool:
        """
        Compare questions to see if main question has changes vs final question
        Returns True if questions are different (need update), False if same
        """
        # Only compare answers as per requirement
        main_answers = main_question.get(QuestionFields.ANSWERS, [])
        final_answers = final_question.get(QuestionFields.ANSWERS, [])
        
        # If different number of answers, definitely different
        if len(main_answers) != len(final_answers):
            return True
        
        # Compare each answer
        for main_answer, final_answer in zip(main_answers, final_answers):
            if QuestionComparator._compare_answers(main_answer, final_answer):
                return True  # Found a difference
        
        return False  # No differences found
    
    @staticmethod
    def _compare_answers(main_answer: Dict, final_answer: Dict) -> bool:
        """
        Compare individual answers
        Returns True if answers are different, False if same
        """
        # Fields to compare
        fields_to_compare = [
            AnswerFields.ANSWER,
            AnswerFields.IS_CORRECT,
            AnswerFields.RESPONSE_COUNT,
            AnswerFields.RANK,
            AnswerFields.SCORE
        ]
        
        for field in fields_to_compare:
            main_value = main_answer.get(field)
            final_value = final_answer.get(field)
            
            if main_value != final_value:
                return True  # Found a difference
        
        return False  # No differences found


class FinalService:
    """Main service for handling final endpoint operations"""
    
    def __init__(self, db_handler):
        self.db = db_handler
        self.final_api = FinalEndpointHandler()
        self.validator = QuestionValidator()
        self.answer_filter = AnswerFilter()
        self.comparator = QuestionComparator()
    
    def process_final_endpoint_sync(self, main_questions: List[Dict]) -> Dict:
        """
        Process synchronization with final endpoint
        - POST new questions
        - PUT updated questions  
        - Skip unchanged questions
        """
        try:
            logger.info("🎯 Starting final endpoint synchronization...")
            
            # Fetch existing final questions
            final_questions = self.final_api.fetch_final_questions()
            final_questions_dict = {QuestionFormatter.get_question_id(q): q for q in final_questions}
            
            # Process main questions
            result = self._categorize_questions(main_questions, final_questions_dict)
            
            # Execute operations
            post_success = self._execute_post_operations(result['new_questions'])
            put_success = self._execute_put_operations(result['updated_questions'])
            
            # Compile final result
            return self._compile_final_result(result, post_success, put_success)
            
        except Exception as e:
            logger.error(f"❌ Final endpoint synchronization failed: {str(e)}")
            raise
    
    def _categorize_questions(self, main_questions: List[Dict], final_questions_dict: Dict) -> Dict:
        """Categorize questions into new, updated, unchanged, and invalid"""
        new_questions = []
        updated_questions = []
        unchanged_count = 0
        invalid_count = 0
        
        for question in main_questions:
            question_id = QuestionFormatter.get_question_id(question)
            
            # Validate question for final endpoint
            is_valid, validation_msg = self.validator.validate_question_for_final(question)
            
            if not is_valid:
                logger.debug(f"⏭️ Skipping question {question_id}: {validation_msg}")
                invalid_count += 1
                continue
            
            # Filter answers based on question type
            filtered_question = self.answer_filter.filter_answers_for_final(question)
            
            # Check if question exists in final endpoint
            if question_id in final_questions_dict:
                # Question exists - check if it needs updating
                final_question = final_questions_dict[question_id]
                
                if self.comparator.compare_questions(filtered_question, final_question):
                    # Question has changes - needs PUT
                    # IMPORTANT: Use the final endpoint's question ID and answer IDs for PUT
                    updated_question = self._prepare_question_for_update(filtered_question, final_question)
                    
                    updated_questions.append(updated_question)
                    final_question_id = QuestionFormatter.get_question_id(final_question)
                    logger.debug(f"📝 Question {question_id} needs update (final ID: {final_question_id})")
                else:
                    # Question unchanged - skip
                    unchanged_count += 1
                    logger.debug(f"✅ Question {question_id} unchanged")
            else:
                # Question doesn't exist - needs POST
                new_questions.append(filtered_question)
                logger.debug(f"🆕 Question {question_id} is new")
        
        logger.info(f"📊 Final sync analysis: {len(new_questions)} new, {len(updated_questions)} updated, {unchanged_count} unchanged, {invalid_count} invalid")
        
        return {
            'new_questions': new_questions,
            'updated_questions': updated_questions,
            'unchanged_count': unchanged_count,
            'invalid_count': invalid_count
        }
    
    def _prepare_question_for_update(self, main_question: Dict, final_question: Dict) -> Dict:
        """Prepare question for PUT request using final endpoint IDs"""
        updated_question = main_question.copy()
        
        # Use final endpoint's question ID
        final_question_id = QuestionFormatter.get_question_id(final_question)
        updated_question['_id'] = final_question_id
        updated_question['questionID'] = final_question_id
        
        # Map answers to use final endpoint answer IDs
        final_answers = final_question.get(QuestionFields.ANSWERS, [])
        main_answers = updated_question.get(QuestionFields.ANSWERS, [])
        
        # Create a mapping of answer text to final answer ID
        final_answer_map = {}
        for final_answer in final_answers:
            answer_text = final_answer.get(AnswerFields.ANSWER, '')
            answer_id = final_answer.get(AnswerFields.ID) or final_answer.get(AnswerFields.ANSWER_ID)
            if answer_text and answer_id:
                final_answer_map[answer_text] = answer_id
        
        # Update main answers with final endpoint answer IDs where matches exist
        for main_answer in main_answers:
            answer_text = main_answer.get(AnswerFields.ANSWER, '')
            if answer_text in final_answer_map:
                main_answer['_id'] = final_answer_map[answer_text]
                main_answer[AnswerFields.ANSWER_ID] = final_answer_map[answer_text]
        
        return updated_question
    
    def _execute_post_operations(self, new_questions: List[Dict]) -> bool:
        """Execute POST operations for new questions"""
        if not new_questions:
            logger.info("📭 No new questions to POST to final endpoint")
            return True
        
        return self.final_api.post_new_questions(new_questions)
    
    def _execute_put_operations(self, updated_questions: List[Dict]) -> bool:
        """Execute PUT operations for updated questions"""
        if not updated_questions:
            logger.info("📭 No questions to PUT to final endpoint")
            return True
        
        return self.final_api.put_updated_questions(updated_questions)
    
    def _compile_final_result(self, categorization_result: Dict, post_success: bool, put_success: bool) -> Dict:
        """Compile final result statistics"""
        new_count = len(categorization_result['new_questions'])
        updated_count = len(categorization_result['updated_questions'])
        
        return {
            'new_questions_count': new_count,
            'updated_questions_count': updated_count,
            'unchanged_questions_count': categorization_result['unchanged_count'],
            'invalid_questions_count': categorization_result['invalid_count'],
            'post_success': post_success,
            'put_success': put_success,
            'final_submitted_count': (new_count if post_success else 0) + (updated_count if put_success else 0),
            'final_failed_count': (new_count if not post_success else 0) + (updated_count if not put_success else 0)
        }