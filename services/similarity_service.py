"""
Refactored Similarity Service - Clean and modular
"""

import logging
from typing import List, Dict, Tuple
from config.settings import Config
from utils.data_formatters import QuestionFormatter
from constants import AnswerFields, LogMessages

logger = logging.getLogger('survey_analytics')


class SimilarityCalculator:
    """Handles similarity calculations between texts"""
    
    @staticmethod
    def calculate_similarity(text1: str, text2: str) -> float:
        """Calculate similarity between two texts using Levenshtein distance"""
        if not text1 or not text2:
            return 0.0
        
        # Normalize texts
        s1 = text1.lower().strip()
        s2 = text2.lower().strip()
        
        if s1 == s2:
            return 1.0
        
        len1, len2 = len(s1), len(s2)
        if len1 == 0 or len2 == 0:
            return 0.0
        
        return SimilarityCalculator._calculate_levenshtein_similarity(s1, s2, len1, len2)
    
    @staticmethod
    def _calculate_levenshtein_similarity(s1: str, s2: str, len1: int, len2: int) -> float:
        """Calculate Levenshtein distance-based similarity"""
        # Levenshtein distance calculation
        matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]
        
        # Initialize matrix
        for i in range(len1 + 1):
            matrix[i][0] = i
        for j in range(len2 + 1):
            matrix[0][j] = j
        
        # Fill matrix
        for i in range(1, len1 + 1):
            for j in range(1, len2 + 1):
                cost = 0 if s1[i-1] == s2[j-1] else 1
                matrix[i][j] = min(
                    matrix[i-1][j] + 1,      # deletion
                    matrix[i][j-1] + 1,      # insertion
                    matrix[i-1][j-1] + cost  # substitution
                )
        
        edit_distance = matrix[len1][len2]
        max_length = max(len1, len2)
        similarity = 1 - (edit_distance / max_length)
        
        return max(0, similarity)


class AnswerMerger:
    """Handles merging of similar answers"""
    
    def __init__(self, similarity_threshold: float):
        self.similarity_threshold = similarity_threshold
        self.similarity_calculator = SimilarityCalculator()
    
    def merge_similar_answers(self, answers: List[Dict]) -> Tuple[List[Dict], int]:
        """Merge similar answers based on similarity threshold - PRESERVES RANK/SCORE"""
        if not answers:
            return [], 0
        
        merged_answers = []
        processed_indices = set()
        duplicates_merged = 0
        
        for i, answer in enumerate(answers):
            if i in processed_indices:
                continue
            
            current_answer = self._create_base_answer(answer)
            processed_indices.add(i)
            
            # Find similar answers to merge
            similar_answers = self._find_similar_answers(
                answer, answers, i, processed_indices
            )
            
            if similar_answers:
                current_answer = self._merge_answers(current_answer, similar_answers)
                duplicates_merged += len(similar_answers)
                processed_indices.update(idx for idx, _ in similar_answers)
            
            merged_answers.append(current_answer)
        
        return merged_answers, duplicates_merged
    
    def _create_base_answer(self, answer: Dict) -> Dict:
        """Create base answer preserving existing rank and score data"""
        current_answer = {
            AnswerFields.ANSWER: answer.get(AnswerFields.ANSWER, ''),
            AnswerFields.IS_CORRECT: answer.get(AnswerFields.IS_CORRECT, False),
            AnswerFields.RESPONSE_COUNT: answer.get(AnswerFields.RESPONSE_COUNT, 0),
            AnswerFields.RANK: answer.get(AnswerFields.RANK, 0),        # PRESERVE existing rank
            AnswerFields.SCORE: answer.get(AnswerFields.SCORE, 0)       # PRESERVE existing score
        }
        
        if '_id' in answer and answer['_id']:
            current_answer['_id'] = answer['_id']
        
        return current_answer
    
    def _find_similar_answers(self, base_answer: Dict, all_answers: List[Dict], 
                             base_index: int, processed_indices: set) -> List[Tuple[int, Dict]]:
        """Find answers similar to the base answer"""
        similar_answers = []
        
        for j, other_answer in enumerate(all_answers):
            if j <= base_index or j in processed_indices:
                continue
            
            similarity = self.similarity_calculator.calculate_similarity(
                base_answer.get(AnswerFields.ANSWER, ''),
                other_answer.get(AnswerFields.ANSWER, '')
            )
            
            if similarity >= self.similarity_threshold:
                similar_answers.append((j, other_answer))
        
        return similar_answers
    
    def _merge_answers(self, current_answer: Dict, similar_answers: List[Tuple[int, Dict]]) -> Dict:
        """Merge similar answers into the current answer"""
        for _, other_answer in similar_answers:
            # Merge response counts
            current_answer[AnswerFields.RESPONSE_COUNT] += other_answer.get(AnswerFields.RESPONSE_COUNT, 0)
            
            # Apply priority logic for correct answers
            current_answer = self._apply_merge_priority_logic(current_answer, other_answer)
        
        return current_answer
    
    def _apply_merge_priority_logic(self, current_answer: Dict, other_answer: Dict) -> Dict:
        """Apply priority logic when merging answers"""
        current_is_correct = current_answer.get(AnswerFields.IS_CORRECT, False)
        other_is_correct = other_answer.get(AnswerFields.IS_CORRECT, False)
        
        # Priority logic: isCorrect=True takes precedence
        if other_is_correct and not current_is_correct:
            current_answer = self._use_other_answer_as_primary(current_answer, other_answer)
        elif not current_is_correct and not other_is_correct:
            # Both incorrect, use higher response count
            current_response_count = current_answer.get(AnswerFields.RESPONSE_COUNT, 0) - other_answer.get(AnswerFields.RESPONSE_COUNT, 0)
            if other_answer.get(AnswerFields.RESPONSE_COUNT, 0) > current_response_count:
                current_answer = self._use_other_answer_as_primary(current_answer, other_answer, preserve_response_count=True)
        # If both correct, keep current (first one wins)
        
        return current_answer
    
    def _use_other_answer_as_primary(self, current_answer: Dict, other_answer: Dict, 
                                   preserve_response_count: bool = False) -> Dict:
        """Use other answer as the primary, preserving merged response count"""
        original_response_count = current_answer[AnswerFields.RESPONSE_COUNT]
        
        current_answer[AnswerFields.ANSWER] = other_answer.get(AnswerFields.ANSWER, '')
        current_answer[AnswerFields.IS_CORRECT] = other_answer.get(AnswerFields.IS_CORRECT, False)
        
        if preserve_response_count:
            current_answer[AnswerFields.RESPONSE_COUNT] = original_response_count
        
        # Use other answer's rank/score if it has better ranking
        if other_answer.get(AnswerFields.RANK, 0) > current_answer.get(AnswerFields.RANK, 0):
            current_answer[AnswerFields.RANK] = other_answer.get(AnswerFields.RANK, 0)
            current_answer[AnswerFields.SCORE] = other_answer.get(AnswerFields.SCORE, 0)
        
        if '_id' in other_answer and other_answer['_id']:
            current_answer['_id'] = other_answer['_id']
        
        return current_answer


class QuestionSimilarityProcessor:
    """Handles similarity processing for individual questions"""
    
    def __init__(self, answer_merger: AnswerMerger):
        self.answer_merger = answer_merger
    
    def process_question_similarity(self, question: Dict) -> Tuple[Dict, int]:
        """Process similarity for a single question - SAFE FOR MULTIPLE RUNS"""
        if not question.get(AnswerFields.ANSWERS):
            return question, 0
        
        merged_answers, duplicates_merged = self.answer_merger.merge_similar_answers(question[AnswerFields.ANSWERS])
        question[AnswerFields.ANSWERS] = merged_answers
        
        return question, duplicates_merged


class SimilarityService:
    """Main service for handling answer similarity operations"""
    
    def __init__(self, db_handler):
        self.db = db_handler
        self.similarity_threshold = Config.SIMILARITY_THRESHOLD
        self.answer_merger = AnswerMerger(self.similarity_threshold)
        self.question_processor = QuestionSimilarityProcessor(self.answer_merger)
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using Levenshtein distance"""
        return SimilarityCalculator.calculate_similarity(text1, text2)
    
    def merge_similar_answers(self, answers: List[Dict]) -> Tuple[List[Dict], int]:
        """Merge similar answers based on similarity threshold - PRESERVES RANK/SCORE"""
        return self.answer_merger.merge_similar_answers(answers)
    
    def process_question_similarity(self, question: Dict) -> Tuple[Dict, int]:
        """Process similarity for a single question - SAFE FOR MULTIPLE RUNS"""
        return self.question_processor.process_question_similarity(question)
    
    def process_all_questions(self) -> Dict:
        """Process similarity for all questions and update database - IDEMPOTENT"""
        try:
            logger.info("Starting similarity processing for all questions")
            
            questions = self._fetch_questions()
            if not questions:
                return self._create_empty_result()
            
            logger.info(f"Found {len(questions)} questions to process for similarity")
            
            processing_result = self._process_questions_for_similarity(questions)
            update_result = self._update_processed_questions(processing_result['processed_questions'])
            
            return self._combine_results(processing_result, update_result, len(questions))
            
        except Exception as e:
            logger.error(f"Similarity processing failed: {str(e)}")
            raise
    
    def _fetch_questions(self) -> List[Dict]:
        """Fetch all questions from database"""
        questions = self.db.fetch_all_questions()
        
        if not questions:
            logger.warning("No questions found in API for similarity processing")
        
        return questions
    
    def _create_empty_result(self) -> Dict:
        """Create empty result when no questions found"""
        return {
            "total_questions": 0,
            "processed_count": 0,
            "skipped_count": 0,
            "updated_count": 0,
            "failed_count": 0,
            "duplicates_merged": 0
        }
    
    def _process_questions_for_similarity(self, questions: List[Dict]) -> Dict:
        """Process questions for similarity merging"""
        processed_questions = []
        total_duplicates_merged = 0
        processed_count = 0
        skipped_count = 0
        
        for question in questions:
            if question.get(AnswerFields.ANSWERS):
                processed_question, duplicates_merged = self.question_processor.process_question_similarity(question)
                processed_questions.append(processed_question)
                total_duplicates_merged += duplicates_merged
                processed_count += 1
                
                question_id = QuestionFormatter.get_question_id(question)
                logger.debug(f"Processed question {question_id}: merged {duplicates_merged} duplicates")
            else:
                skipped_count += 1
                logger.debug(f"Skipped question without answers")
        
        logger.info(f"Similarity processing complete: {processed_count} processed, {skipped_count} skipped")
        logger.info(f"Total duplicates merged: {total_duplicates_merged}")
        
        return {
            'processed_questions': processed_questions,
            'processed_count': processed_count,
            'skipped_count': skipped_count,
            'total_duplicates_merged': total_duplicates_merged
        }
    
    def _update_processed_questions(self, processed_questions: List[Dict]) -> Dict:
        """Update processed questions in the database"""
        if not processed_questions:
            logger.warning("No questions to update after similarity processing")
            return {"updated_count": 0, "failed_count": 0}
        
        logger.info(f"Updating {len(processed_questions)} questions after similarity processing")
        return self.db.bulk_update_questions(processed_questions)
    
    def _combine_results(self, processing_result: Dict, update_result: Dict, total_questions: int) -> Dict:
        """Combine processing and update results"""
        return {
            "total_questions": total_questions,
            "processed_count": processing_result['processed_count'],
            "skipped_count": processing_result['skipped_count'],
            "updated_count": update_result["updated_count"],
            "failed_count": update_result["failed_count"],
            "duplicates_merged": processing_result['total_duplicates_merged']
        }