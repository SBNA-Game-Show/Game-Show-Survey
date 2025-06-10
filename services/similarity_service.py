# =============================================================================
# FILE: services/similarity_service.py (FIXED)
# =============================================================================

import logging
from typing import List, Dict
from config.settings import Config

logger = logging.getLogger('survey_analytics')

class SimilarityService:
    def __init__(self, db_handler):
        self.db = db_handler
        self.similarity_threshold = Config.SIMILARITY_THRESHOLD
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
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
        
        # Levenshtein distance calculation
        matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]
        
        for i in range(len1 + 1):
            matrix[i][0] = i
        for j in range(len2 + 1):
            matrix[0][j] = j
        
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
    
    def merge_similar_answers(self, answers: List[Dict]) -> tuple:
        """Merge similar answers based on similarity threshold - PRESERVES RANK/SCORE"""
        if not answers:
            return [], 0
        
        merged_answers = []
        processed_indices = set()
        duplicates_merged = 0
        
        for i, answer in enumerate(answers):
            if i in processed_indices:
                continue
            
            # PRESERVE existing rank and score data
            current_answer = {
                'answer': answer.get('answer', ''),
                'isCorrect': answer.get('isCorrect', False),
                'responseCount': answer.get('responseCount', 0),
                'rank': answer.get('rank', 0),        # ← PRESERVE existing rank
                'score': answer.get('score', 0)       # ← PRESERVE existing score
            }
            
            if '_id' in answer and answer['_id']:
                current_answer['_id'] = answer['_id']
            
            processed_indices.add(i)
            
            # Find similar answers to merge
            for j, other_answer in enumerate(answers):
                if j <= i or j in processed_indices:
                    continue
                
                similarity = self.calculate_similarity(
                    answer.get('answer', ''),
                    other_answer.get('answer', '')
                )
                
                if similarity >= self.similarity_threshold:
                    processed_indices.add(j)
                    duplicates_merged += 1
                    
                    # Merge response counts
                    current_answer['responseCount'] += other_answer.get('responseCount', 0)
                    
                    # Priority logic: isCorrect=True takes precedence
                    if other_answer.get('isCorrect', False) and not current_answer['isCorrect']:
                        current_answer['answer'] = other_answer.get('answer', '')
                        current_answer['isCorrect'] = True
                        # Use other answer's rank/score if it has better ranking
                        if other_answer.get('rank', 0) > current_answer.get('rank', 0):
                            current_answer['rank'] = other_answer.get('rank', 0)
                            current_answer['score'] = other_answer.get('score', 0)
                        if '_id' in other_answer and other_answer['_id']:
                            current_answer['_id'] = other_answer['_id']
                    elif not current_answer['isCorrect'] and not other_answer.get('isCorrect', False):
                        # Both incorrect, use higher response count
                        if other_answer.get('responseCount', 0) > answer.get('responseCount', 0):
                            current_answer['answer'] = other_answer.get('answer', '')
                            if '_id' in other_answer and other_answer['_id']:
                                current_answer['_id'] = other_answer['_id']
                    # If both correct, keep current (first one wins)
            
            merged_answers.append(current_answer)
        
        return merged_answers, duplicates_merged
    
    def process_question_similarity(self, question: Dict) -> tuple:
        """Process similarity for a single question - SAFE FOR MULTIPLE RUNS"""
        if not question.get('answers'):
            return question, 0
        
        merged_answers, duplicates_merged = self.merge_similar_answers(question['answers'])
        question['answers'] = merged_answers
        
        return question, duplicates_merged
    
    def process_all_questions(self) -> Dict:
        """Process similarity for all questions and update database - IDEMPOTENT"""
        try:
            # Fetch all questions
            questions = self.db.fetch_all_questions()
            
            if not questions:
                return {
                    "total_questions": 0,
                    "processed_count": 0,
                    "skipped_count": 0,
                    "updated_count": 0,
                    "failed_count": 0,
                    "duplicates_merged": 0
                }
            
            processed_questions = []
            total_duplicates_merged = 0
            processed_count = 0
            skipped_count = 0
            
            # Process each question
            for question in questions:
                if question.get('answers'):
                    processed_question, duplicates_merged = self.process_question_similarity(question)
                    processed_questions.append(processed_question)
                    total_duplicates_merged += duplicates_merged
                    processed_count += 1
                else:
                    skipped_count += 1
            
            # Update database
            update_result = self.db.bulk_update_questions(processed_questions)
            
            return {
                "total_questions": len(questions),
                "processed_count": processed_count,
                "skipped_count": skipped_count,
                "updated_count": update_result["updated_count"],
                "failed_count": update_result["failed_count"],
                "duplicates_merged": total_duplicates_merged
            }
            
        except Exception as e:
            logger.error(f"Similarity processing failed: {str(e)}")
            raise