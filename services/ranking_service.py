import logging
from typing import List, Dict
from config.settings import Config

logger = logging.getLogger('survey_analytics')

class RankingService:
    def __init__(self, db_handler):
        self.db = db_handler
        self.scoring_values = Config.SCORING_VALUES
    
    def rank_and_score_answers(self, answers: List[Dict]) -> tuple:
        """Rank all correct answers by responseCount, keep incorrect answers unranked"""
        if not answers:
            return answers, 0, 0
        
        # Separate correct and incorrect answers
        correct_answers = [a for a in answers if a.get('isCorrect', False)]
        incorrect_answers = [a for a in answers if not a.get('isCorrect', False)]
        
        # Sort correct answers by responseCount (highest first)
        correct_answers.sort(key=lambda x: x.get('responseCount', 0), reverse=True)
        
        answers_ranked = 0
        answers_scored = 0
        
        # Rank and score correct answers
        for i, answer in enumerate(correct_answers):
            rank = i + 1
            answer['rank'] = rank
            answer['score'] = self.scoring_values[i] if i < len(self.scoring_values) else 0
            answers_ranked += 1
            if answer['score'] > 0:
                answers_scored += 1
        
        # Set incorrect answers to rank=0, score=0
        for answer in incorrect_answers:
            answer['rank'] = 0
            answer['score'] = 0
        
        # Combine: correct answers first (ranked), then incorrect answers
        all_answers = correct_answers + incorrect_answers
        
        return all_answers, answers_ranked, answers_scored
    
    def process_question_ranking(self, question: Dict) -> tuple:
        """Process ranking for a single question"""
        if not question.get('answers'):
            return question, 0, 0
        
        # Check if question has any correct answers
        has_correct_answers = any(a.get('isCorrect', False) for a in question['answers'])
        
        if not has_correct_answers:
            return question, 0, 0
        
        ranked_answers, answers_ranked, answers_scored = self.rank_and_score_answers(question['answers'])
        question['answers'] = ranked_answers
        
        return question, answers_ranked, answers_scored
    
    def process_all_questions(self) -> Dict:
        """Process ranking for all questions that have correct answers"""
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
                    "answers_ranked": 0,
                    "answers_scored": 0
                }
            
            processed_questions = []
            total_answers_ranked = 0
            total_answers_scored = 0
            processed_count = 0
            skipped_count = 0
            
            # Process each question
            for question in questions:
                if question.get('answers'):
                    # Check if question has admin-approved answers
                    has_correct = any(a.get('isCorrect', False) for a in question['answers'])
                    
                    if has_correct:
                        processed_question, answers_ranked, answers_scored = self.process_question_ranking(question)
                        processed_questions.append(processed_question)
                        total_answers_ranked += answers_ranked
                        total_answers_scored += answers_scored
                        processed_count += 1
                    else:
                        skipped_count += 1
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
                "answers_ranked": total_answers_ranked,
                "answers_scored": total_answers_scored
            }
            
        except Exception as e:
            logger.error(f"Ranking processing failed: {str(e)}")
            raise