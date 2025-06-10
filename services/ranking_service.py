import logging
from typing import List, Dict
from config.settings import Config

logger = logging.getLogger('survey_analytics')

class RankingService:
    def __init__(self, db_handler):
        self.db = db_handler
        self.scoring_values = Config.SCORING_VALUES
        logger.info(f"RankingService initialized with scoring values: {self.scoring_values}")
    
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
            
            logger.debug(f"Ranked answer '{answer.get('answer', '')[:30]}...' - "
                        f"rank: {rank}, score: {answer['score']}, responseCount: {answer.get('responseCount', 0)}")
        
        # Set incorrect answers to rank=0, score=0
        for answer in incorrect_answers:
            answer['rank'] = 0
            answer['score'] = 0
        
        # Combine: correct answers first (ranked), then incorrect answers
        all_answers = correct_answers + incorrect_answers
        
        return all_answers, answers_ranked, answers_scored
    
    def process_question_ranking(self, question: Dict) -> tuple:
        """Process ranking for a single question"""
        question_id = question.get('_id', 'UNKNOWN')
        
        if not question.get('answers'):
            logger.debug(f"Skipping question {question_id} - no answers")
            return question, 0, 0
        
        # Check if question has any correct answers
        has_correct_answers = any(a.get('isCorrect', False) for a in question['answers'])
        
        if not has_correct_answers:
            logger.debug(f"Skipping question {question_id} - no correct answers marked")
            return question, 0, 0
        
        logger.debug(f"Processing ranking for question {question_id} with {len(question['answers'])} answers")
        
        ranked_answers, answers_ranked, answers_scored = self.rank_and_score_answers(question['answers'])
        question['answers'] = ranked_answers
        
        logger.debug(f"Question {question_id}: ranked {answers_ranked} answers, scored {answers_scored} answers")
        
        return question, answers_ranked, answers_scored
    
    def process_all_questions(self) -> Dict:
        """Process ranking for all questions that have correct answers"""
        try:
            logger.info("Starting ranking process for all questions")
            
            # Fetch all questions from API
            questions = self.db.fetch_all_questions()
            
            if not questions:
                logger.warning("No questions found in API")
                return {
                    "total_questions": 0,
                    "processed_count": 0,
                    "skipped_count": 0,
                    "updated_count": 0,
                    "failed_count": 0,
                    "answers_ranked": 0,
                    "answers_scored": 0
                }
            
            logger.info(f"Found {len(questions)} questions to process")
            
            processed_questions = []
            total_answers_ranked = 0
            total_answers_scored = 0
            processed_count = 0
            skipped_count = 0
            
            # Process each question
            for question in questions:
                question_id = question.get('_id', 'UNKNOWN')
                
                if question.get('answers'):
                    # Check if question has admin-approved answers
                    has_correct = any(a.get('isCorrect', False) for a in question['answers'])
                    
                    if has_correct:
                        processed_question, answers_ranked, answers_scored = self.process_question_ranking(question)
                        processed_questions.append(processed_question)
                        total_answers_ranked += answers_ranked
                        total_answers_scored += answers_scored
                        processed_count += 1
                        logger.debug(f"✅ Processed question {question_id}")
                    else:
                        skipped_count += 1
                        logger.debug(f"⏭️ Skipped question {question_id} - no correct answers")
                else:
                    skipped_count += 1
                    logger.debug(f"⏭️ Skipped question {question_id} - no answers")
            
            logger.info(f"Processing complete: {processed_count} processed, {skipped_count} skipped")
            logger.info(f"Total answers ranked: {total_answers_ranked}, scored: {total_answers_scored}")
            
            # Update API with processed questions
            if processed_questions:
                logger.info(f"Updating {len(processed_questions)} questions in API")
                update_result = self.db.bulk_update_questions(processed_questions)
            else:
                logger.warning("No questions to update")
                update_result = {"updated_count": 0, "failed_count": 0}
            
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