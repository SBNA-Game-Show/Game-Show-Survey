
from typing import Dict, List, Optional
from constants import QuestionFields, AnswerFields, Defaults


class AnswerFormatter:
    """Utility class for formatting answer data"""
    
    @staticmethod
    def format_for_api(answer: Dict) -> Dict:
        """Format answer for API submission"""
        return {
            AnswerFields.ANSWER: str(answer.get(AnswerFields.ANSWER, Defaults.ANSWER_TEXT)),
            AnswerFields.IS_CORRECT: bool(answer.get(AnswerFields.IS_CORRECT, Defaults.IS_CORRECT)),
            AnswerFields.RESPONSE_COUNT: int(answer.get(AnswerFields.RESPONSE_COUNT, Defaults.RESPONSE_COUNT)),
            AnswerFields.RANK: int(answer.get(AnswerFields.RANK, Defaults.RANK)),
            AnswerFields.SCORE: int(answer.get(AnswerFields.SCORE, Defaults.SCORE)),
            AnswerFields.ANSWER_ID: str(answer.get(AnswerFields.ANSWER_ID) or answer.get(AnswerFields.ID, ''))
        }
    
    @staticmethod
    def ensure_defaults(answer: Dict) -> Dict:
        """Ensure answer has all required fields with defaults"""
        answer.setdefault(AnswerFields.ANSWER, Defaults.ANSWER_TEXT)
        answer.setdefault(AnswerFields.IS_CORRECT, Defaults.IS_CORRECT)
        answer.setdefault(AnswerFields.RESPONSE_COUNT, Defaults.RESPONSE_COUNT)
        answer.setdefault(AnswerFields.RANK, Defaults.RANK)
        answer.setdefault(AnswerFields.SCORE, Defaults.SCORE)
        return answer
    
    @staticmethod
    def copy_id_fields(answer: Dict) -> Dict:
        """Copy _id to answerID for API compatibility"""
        if AnswerFields.ID in answer:
            answer[AnswerFields.ANSWER_ID] = answer[AnswerFields.ID]
        return answer


class QuestionFormatter:
    """Utility class for formatting question data"""
    
    @staticmethod
    def format_for_api(question: Dict) -> Dict:
        """Format question for API submission"""
        answers = question.get(QuestionFields.ANSWERS, [])
        formatted_answers = [AnswerFormatter.format_for_api(answer) for answer in answers]
        
        return {
            QuestionFields.QUESTION_ID: str(question.get(QuestionFields.ID) or question.get(QuestionFields.QUESTION_ID)),
            QuestionFields.QUESTION: str(question.get(QuestionFields.QUESTION, '')),
            QuestionFields.QUESTION_TYPE: str(question.get(QuestionFields.QUESTION_TYPE, '')),
            QuestionFields.QUESTION_CATEGORY: str(question.get(QuestionFields.QUESTION_CATEGORY, '')),
            QuestionFields.QUESTION_LEVEL: str(question.get(QuestionFields.QUESTION_LEVEL, '')),
            QuestionFields.TIMES_SKIPPED: int(question.get(QuestionFields.TIMES_SKIPPED, 0)),
            QuestionFields.TIMES_ANSWERED: int(question.get(QuestionFields.TIMES_ANSWERED, 0)),
            QuestionFields.ANSWERS: formatted_answers
        }
    
    @staticmethod
    def ensure_compatibility(question: Dict) -> Dict:
        """Ensure question has all required fields for internal processing"""
        # Copy _id to questionID for API compatibility
        if QuestionFields.ID in question:
            question[QuestionFields.QUESTION_ID] = question[QuestionFields.ID]
        
        # Ensure answers field exists
        if QuestionFields.ANSWERS not in question or question[QuestionFields.ANSWERS] is None:
            question[QuestionFields.ANSWERS] = []
        
        # Process answers
        for answer in question[QuestionFields.ANSWERS]:
            AnswerFormatter.copy_id_fields(answer)
            AnswerFormatter.ensure_defaults(answer)
        
        return question
    
    @staticmethod
    def get_question_id(question: Dict) -> str:
        """Get question ID from either _id or questionID field"""
        return question.get(QuestionFields.ID) or question.get(QuestionFields.QUESTION_ID, 'UNKNOWN')


class DataValidator:
    """Utility class for validating data structures"""
    
    @staticmethod
    def validate_answer(answer: Dict, question_id: str, answer_index: int) -> bool:
        """Validate individual answer structure"""
        required_checks = [
            (AnswerFields.ANSWER, str, "answer field must be string"),
            (AnswerFields.IS_CORRECT, bool, "isCorrect field must be boolean"),
            (AnswerFields.RESPONSE_COUNT, int, "responseCount field must be integer"),
            (AnswerFields.RANK, int, "rank field must be integer"),
            (AnswerFields.SCORE, int, "score field must be integer")
        ]
        
        for field, expected_type, error_msg in required_checks:
            if not isinstance(answer.get(field), expected_type):
                from utils.logger import setup_logger
                logger = setup_logger()
                logger.error(f"Question {question_id}, answer {answer_index}: {error_msg}")
                return False
        
        return True
    
    @staticmethod
    def validate_question(question: Dict) -> bool:
        """Validate complete question structure"""
        question_id = QuestionFormatter.get_question_id(question)
        
        if not question_id or question_id == 'UNKNOWN':
            from utils.logger import setup_logger
            logger = setup_logger()
            logger.error(f"Question missing ID: {question}")
            return False
        
        if not question.get(QuestionFields.ANSWERS):
            from utils.logger import setup_logger
            logger = setup_logger()
            logger.warning(f"Question {question_id} has no answers")
            return False
        
        # Validate each answer
        for i, answer in enumerate(question[QuestionFields.ANSWERS]):
            if not DataValidator.validate_answer(answer, question_id, i):
                return False
        
        from utils.logger import setup_logger
        logger = setup_logger()
        logger.debug(f"Question {question_id} validation passed")
        return True


class ResponseProcessor:
    """Utility class for processing API responses"""
    
    @staticmethod
    def extract_questions_from_response(response_data) -> List[Dict]:
        """Extract questions list from various API response formats"""
        if isinstance(response_data, dict):
            # Handle API response structure: {statusCode, data, message, success}
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
        
        return questions
    
    @staticmethod
    def is_success_response(response_data) -> bool:
        """Check if API response indicates success"""
        if not isinstance(response_data, dict):
            return True  # Assume success if not a dict
        
        return (
            (response_data.get('success', False) and response_data.get('statusCode') == 200) or
            response_data.get('statusCode') == 200 or
            'data' in response_data
        )