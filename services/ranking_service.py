"""
Updated Ranking Service - Only processes Input questions, no automatic final endpoint
"""

import logging
from typing import List, Dict, Tuple
from config.settings import Config
from utils.data_formatters import QuestionFormatter, DataValidator
from constants import AnswerFields, LogMessages, ErrorMessages, QuestionFields

logger = logging.getLogger('survey_analytics')


class AnswerRanker:
    """Handles the core ranking logic for answers"""
    
    def __init__(self, scoring_values: List[int]):
        self.scoring_values = scoring_values
    
    def rank_answers(self, answers: List[Dict]) -> Tuple[List[Dict], int, int]:
        """Rank all correct answers by responseCount, keep incorrect answers unranked"""
        if not answers:
            return answers, 0, 0
        
        logger.debug(f"Processing {len(answers)} answers for ranking")
        
        correct_answers, incorrect_answers = self._separate_answers(answers)
        ranked_correct, answers_ranked, answers_scored = self._rank_correct_answers(correct_answers)
        processed_incorrect = self._reset_incorrect_answers(incorrect_answers)
        
        # Combine: correct answers first (ranked), then incorrect answers
        all_answers = ranked_correct + processed_incorrect
        
        logger.debug(f"Ranking complete: {answers_ranked} ranked, {answers_scored} scored")
        return all_answers, answers_ranked, answers_scored
    
    def _separate_answers(self, answers: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Separate correct and incorrect answers"""
        correct_answers = [a for a in answers if a.get(AnswerFields.IS_CORRECT, False)]
        incorrect_answers = [a for a in answers if not a.get(AnswerFields.IS_CORRECT, False)]
        
        logger.debug(f"Found {len(correct_answers)} correct answers, {len(incorrect_answers)} incorrect answers")
        return correct_answers, incorrect_answers
    
    def _rank_correct_answers(self, correct_answers: List[Dict]) -> Tuple[List[Dict], int, int]:
        """Rank and score correct answers by responseCount"""
        if not correct_answers:
            return [], 0, 0
        
        # Sort by responseCount (highest first)
        correct_answers.sort(key=lambda x: x.get(AnswerFields.RESPONSE_COUNT, 0), reverse=True)
        
        answers_ranked = 0
        answers_scored = 0
        
        for i, answer in enumerate(correct_answers):
            rank = i + 1
            score = self.scoring_values[i] if i < len(self.scoring_values) else 0
            
            answer[AnswerFields.RANK] = rank
            answer[AnswerFields.SCORE] = score
            answers_ranked += 1
            
            if score > 0:
                answers_scored += 1
            
            self._log_answer_ranking(answer, rank, score)
        
        return correct_answers, answers_ranked, answers_scored
    
    def _reset_incorrect_answers(self, incorrect_answers: List[Dict]) -> List[Dict]:
        """Set incorrect answers to rank=0, score=0"""
        for answer in incorrect_answers:
            answer[AnswerFields.RANK] = 0
            answer[AnswerFields.SCORE] = 0
            logger.debug(f"Set incorrect answer '{answer.get(AnswerFields.ANSWER, '')[:30]}...' to rank=0, score=0")
        
        return incorrect_answers
    
    def _log_answer_ranking(self, answer: Dict, rank: int, score: int) -> None:
        """Log individual answer ranking details"""
        logger.debug(f"Ranked answer '{answer.get(AnswerFields.ANSWER, '')[:30]}...' - "
                    f"rank: {rank}, score: {score}, responseCount: {answer.get(AnswerFields.RESPONSE_COUNT, 0)}")


class QuestionProcessor:
    """Handles processing of individual questions - Input questions only"""
    
    def __init__(self, answer_ranker: AnswerRanker):
        self.answer_ranker = answer_ranker
    
    def process_question(self, question: Dict) -> Tuple[Dict, int, int]:
        """Process ranking for a single question"""
        question_id = QuestionFormatter.get_question_id(question)
        
        if not self._should_process_question(question, question_id):
            return question, 0, 0
        
        self._log_question_processing_start(question, question_id)
        
        ranked_answers, answers_ranked, answers_scored = self.answer_ranker.rank_answers(question['answers'])
        question['answers'] = ranked_answers
        
        self._log_question_processing_complete(question_id, answers_ranked, answers_scored)
        
        return question, answers_ranked, answers_scored
    
    def _should_process_question(self, question: Dict, question_id: str) -> bool:
        """Check if question should be processed - Input questions only"""
        question_type = question.get(QuestionFields.QUESTION_TYPE, '').lower()
        
        # Skip MCQ questions
        if question_type == 'mcq':
            logger.debug(f"⏭️ Skipping MCQ question {question_id}")
            return False
        
        # Only process Input questions
        if question_type != 'input':
            logger.debug(f"⏭️ Skipping {question_type} question {question_id} - only Input questions are processed")
            return False
        
        if not question.get('answers'):
            logger.debug(f"⏭️ Skipping Input question {question_id} - no answers")
            return False
        
        correct_answers = [a for a in question['answers'] if a.get(AnswerFields.IS_CORRECT, False)]
        if len(correct_answers) < 3:
            logger.error(f"❌ Skipping Input question {question_id} - needs at least 3 correct answers, found {len(correct_answers)}")
            return False
        
        has_correct_answers = any(a.get(AnswerFields.IS_CORRECT, False) for a in question['answers'])
        if not has_correct_answers:
            logger.debug(f"⏭️ Skipping Input question {question_id} - {ErrorMessages.NO_CORRECT_ANSWERS}")
            return False
        
        return True
    
    def _log_question_processing_start(self, question: Dict, question_id: str) -> None:
        """Log details before processing question"""
        logger.debug(f"Processing ranking for Input question {question_id} with {len(question['answers'])} answers")
        
        for i, answer in enumerate(question['answers']):
            logger.debug(f"Answer {i}: '{answer.get(AnswerFields.ANSWER, '')[:50]}...' - "
                        f"isCorrect: {answer.get(AnswerFields.IS_CORRECT)}, "
                        f"responseCount: {answer.get(AnswerFields.RESPONSE_COUNT, 0)}")
    
    def _log_question_processing_complete(self, question_id: str, answers_ranked: int, answers_scored: int) -> None:
        """Log completion details"""
        logger.debug(f"Input question {question_id}: ranked {answers_ranked} answers, scored {answers_scored} answers")


class RankingService:
    """Main service for handling answer ranking operations - Input questions only"""
    
    def __init__(self, db_handler):
        self.db = db_handler
        self.answer_ranker = AnswerRanker(Config.SCORING_VALUES)
        self.question_processor = QuestionProcessor(self.answer_ranker)
        
        logger.info(f"RankingService initialized with scoring values: {Config.SCORING_VALUES}")
        logger.info("✅ Processing Input questions only (MCQ questions will be skipped)")
    
    def rank_and_score_answers(self, answers: List[Dict]) -> Tuple[List[Dict], int, int]:
        """Rank all correct answers by responseCount, keep incorrect answers unranked"""
        return self.answer_ranker.rank_answers(answers)
    
    def process_question_ranking(self, question: Dict) -> Tuple[Dict, int, int]:
        """Process ranking for a single question"""
        return self.question_processor.process_question(question)
    
    def validate_question_data(self, question: Dict) -> bool:
        """Validate question data before sending to API"""
        return DataValidator.validate_question(question)
    
    def process_all_questions(self) -> Dict:
        """Process ranking for Input questions only that have 3+ correct answers"""
        try:
            logger.info("⚙️ Starting ranking process for Input questions only...")
            
            questions = self._fetch_questions()
            if not questions:
                return self._create_empty_result()
            
            logger.info(f"Found {len(questions)} total questions")
            
            processing_result = self._process_questions_batch(questions)
            update_result = self._update_processed_questions(processing_result['processed_questions'])
            
            return self._combine_results(processing_result, update_result, len(questions))
            
        except Exception as e:
            logger.error(LogMessages.PROCESSING_FAILED.format(error=str(e)))
            logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
            raise
    
    def _fetch_questions(self) -> List[Dict]:
        """Fetch all questions from database"""
        questions = self.db.fetch_all_questions()
        
        if not questions:
            logger.warning("No questions found in API")
        
        return questions
    
    def _create_empty_result(self) -> Dict:
        """Create empty result when no questions found"""
        return {
            "total_questions": 0,
            "processed_count": 0,
            "skipped_count": 0,
            "skipped_mcq": 0,
            "skipped_insufficient": 0,
            "updated_count": 0,
            "failed_count": 0,
            "answers_ranked": 0,
            "answers_scored": 0
        }
    
    def _process_questions_batch(self, questions: List[Dict]) -> Dict:
        """Process a batch of questions for ranking"""
        processed_questions = []
        total_answers_ranked = 0
        total_answers_scored = 0
        processed_count = 0
        skipped_mcq = 0
        skipped_insufficient = 0
        skipped_other = 0
        validation_failed = 0
        
        for question in questions:
            result = self._process_single_question_in_batch(question)
            
            if result['processed']:
                processed_questions.append(result['question'])
                total_answers_ranked += result['answers_ranked']
                total_answers_scored += result['answers_scored']
                processed_count += 1
            elif result['skipped_mcq']:
                skipped_mcq += 1
            elif result['skipped_insufficient']:
                skipped_insufficient += 1
            elif result['validation_failed']:
                validation_failed += 1
            else:
                skipped_other += 1
        
        total_skipped = skipped_mcq + skipped_insufficient + skipped_other
        
        logger.info(f"✅ Processing complete:")
        logger.info(f"   • {processed_count} Input questions processed")
        logger.info(f"   • {skipped_mcq} MCQ questions skipped")
        logger.info(f"   • {skipped_insufficient} Input questions skipped (insufficient correct answers)")
        logger.info(f"   • {skipped_other} other questions skipped")
        logger.info(f"   • {validation_failed} validation failed")
        logger.info(f"   • Total answers ranked: {total_answers_ranked}, scored: {total_answers_scored}")
        
        return {
            'processed_questions': processed_questions,
            'processed_count': processed_count,
            'skipped_count': total_skipped,
            'skipped_mcq': skipped_mcq,
            'skipped_insufficient': skipped_insufficient,
            'skipped_other': skipped_other,
            'validation_failed': validation_failed,
            'total_answers_ranked': total_answers_ranked,
            'total_answers_scored': total_answers_scored
        }
    
    def _process_single_question_in_batch(self, question: Dict) -> Dict:
        """Process a single question within a batch"""
        question_id = QuestionFormatter.get_question_id(question)
        question_type = question.get(QuestionFields.QUESTION_TYPE, '').lower()
        
        # Track MCQ questions separately
        if question_type == 'mcq':
            logger.debug(f"⏭️ Skipped MCQ question {question_id}")
            return {'processed': False, 'skipped_mcq': True, 'skipped_insufficient': False, 'validation_failed': False}
        
        # Only process Input questions
        if question_type != 'input':
            logger.debug(f"⏭️ Skipped {question_type} question {question_id} - only Input questions processed")
            return {'processed': False, 'skipped_mcq': False, 'skipped_insufficient': False, 'validation_failed': False}
        
        # Check if question has answers
        if not question.get('answers'):
            logger.debug(f"⏭️ Skipped Input question {question_id} - no answers")
            return {'processed': False, 'skipped_mcq': False, 'skipped_insufficient': False, 'validation_failed': False}
        
        # Check for at least 3 correct answers
        correct_answers = [a for a in question['answers'] if a.get(AnswerFields.IS_CORRECT, False)]
        if len(correct_answers) < 3:
            logger.error(f"❌ Skipped Input question {question_id} - needs at least 3 correct answers, found {len(correct_answers)}")
            return {'processed': False, 'skipped_mcq': False, 'skipped_insufficient': True, 'validation_failed': False}
        
        # Process the question
        logger.debug(f"Processing Input question {question_id}...")
        processed_question, answers_ranked, answers_scored = self.question_processor.process_question(question)
        
        # Validate the processed question
        if not DataValidator.validate_question(processed_question):
            logger.error(ErrorMessages.VALIDATION_FAILED.format(id=question_id))
            return {'processed': False, 'skipped_mcq': False, 'skipped_insufficient': False, 'validation_failed': True}
        
        logger.debug(f"✅ Processed Input question {question_id}")
        return {
            'processed': True,
            'skipped_mcq': False,
            'skipped_insufficient': False,
            'validation_failed': False,
            'question': processed_question,
            'answers_ranked': answers_ranked,
            'answers_scored': answers_scored
        }
    
    def _update_processed_questions(self, processed_questions: List[Dict]) -> Dict:
        """Update processed questions in the database"""
        if not processed_questions:
            logger.warning("No Input questions to update")
            return {"updated_count": 0, "failed_count": 0}
        
        logger.info(f"📤 Updating {len(processed_questions)} Input questions in /admin/survey")
        
        # Log sample question structure
        self._log_sample_question_structure(processed_questions[0])
        
        return self.db.bulk_update_questions(processed_questions)
    
    def _log_sample_question_structure(self, sample_question: Dict) -> None:
        """Log sample question structure for debugging"""
        import json
        logger.debug("Sample Input question structure being sent:")
        sample_structure = {
            "questionID": sample_question.get('_id') or sample_question.get('questionID'),
            "questionType": sample_question.get(QuestionFields.QUESTION_TYPE),
            "answers": [{
                "answer": a.get(AnswerFields.ANSWER),
                "isCorrect": a.get(AnswerFields.IS_CORRECT),
                "responseCount": a.get(AnswerFields.RESPONSE_COUNT),
                "rank": a.get(AnswerFields.RANK),
                "score": a.get(AnswerFields.SCORE),
                "answerID": a.get('_id') or a.get('answerID', 'NO_ID')
            } for a in sample_question.get('answers', [])[:2]]  # First 2 answers for brevity
        }
        logger.debug(json.dumps(sample_structure, indent=2))
    
    def _combine_results(self, processing_result: Dict, update_result: Dict, total_questions: int) -> Dict:
        """Combine processing and update results"""
        return {
            "total_questions": total_questions,
            "processed_count": processing_result['processed_count'],
            "skipped_count": processing_result['skipped_count'],
            "skipped_mcq": processing_result['skipped_mcq'],
            "skipped_insufficient": processing_result['skipped_insufficient'],
            "updated_count": update_result["updated_count"],
            "failed_count": update_result["failed_count"],
            "answers_ranked": processing_result['total_answers_ranked'],
            "answers_scored": processing_result['total_answers_scored'],
            "validation_failed": processing_result['validation_failed']
        }