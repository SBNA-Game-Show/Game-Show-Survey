import logging
import json
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
        
        logger.debug(f"Processing {len(answers)} answers for ranking")
        
        # Separate correct and incorrect answers
        correct_answers = [a for a in answers if a.get('isCorrect', False)]
        incorrect_answers = [a for a in answers if not a.get('isCorrect', False)]
        
        logger.debug(f"Found {len(correct_answers)} correct answers, {len(incorrect_answers)} incorrect answers")
        
        # Sort correct answers by responseCount (highest first)
        correct_answers.sort(key=lambda x: x.get('responseCount', 0), reverse=True)
        
        answers_ranked = 0
        answers_scored = 0
        
        # Rank and score correct answers
        for i, answer in enumerate(correct_answers):
            rank = i + 1
            score = self.scoring_values[i] if i < len(self.scoring_values) else 0
            
            answer['rank'] = rank
            answer['score'] = score
            answers_ranked += 1
            
            if score > 0:
                answers_scored += 1
            
            logger.debug(f"Ranked answer '{answer.get('answer', '')[:30]}...' - "
                        f"rank: {rank}, score: {score}, responseCount: {answer.get('responseCount', 0)}")
        
        # Set incorrect answers to rank=0, score=0
        for answer in incorrect_answers:
            answer['rank'] = 0
            answer['score'] = 0
            logger.debug(f"Set incorrect answer '{answer.get('answer', '')[:30]}...' to rank=0, score=0")
        
        # Combine: correct answers first (ranked), then incorrect answers
        all_answers = correct_answers + incorrect_answers
        
        logger.debug(f"Ranking complete: {answers_ranked} ranked, {answers_scored} scored")
        return all_answers, answers_ranked, answers_scored
    
    def process_question_ranking(self, question: Dict) -> tuple:
        """Process ranking for a single question"""
        question_id = question.get('_id', question.get('questionID', 'UNKNOWN'))
        
        if not question.get('answers'):
            logger.debug(f"Skipping question {question_id} - no answers")
            return question, 0, 0
        
        # Check if question has any correct answers
        has_correct_answers = any(a.get('isCorrect', False) for a in question['answers'])
        
        if not has_correct_answers:
            logger.debug(f"Skipping question {question_id} - no correct answers marked")
            return question, 0, 0
        
        logger.debug(f"Processing ranking for question {question_id} with {len(question['answers'])} answers")
        
        # Log the answers before processing
        for i, answer in enumerate(question['answers']):
            logger.debug(f"Answer {i}: '{answer.get('answer', '')[:50]}...' - "
                        f"isCorrect: {answer.get('isCorrect')}, "
                        f"responseCount: {answer.get('responseCount', 0)}")
        
        ranked_answers, answers_ranked, answers_scored = self.rank_and_score_answers(question['answers'])
        question['answers'] = ranked_answers
        
        logger.debug(f"Question {question_id}: ranked {answers_ranked} answers, scored {answers_scored} answers")
        
        # Log the final ranking
        for i, answer in enumerate(question['answers']):
            logger.debug(f"Final Answer {i}: rank={answer.get('rank', 0)}, score={answer.get('score', 0)}")
        
        return question, answers_ranked, answers_scored
    
    def validate_question_data(self, question: Dict) -> bool:
        """Validate question data before sending to API"""
        question_id = question.get('_id') or question.get('questionID')
        
        if not question_id:
            logger.error(f"Question missing ID: {question}")
            return False
        
        if not question.get('answers'):
            logger.warning(f"Question {question_id} has no answers")
            return False
        
        # Validate each answer
        for i, answer in enumerate(question['answers']):
            if not isinstance(answer.get('answer'), str):
                logger.error(f"Question {question_id}, answer {i}: 'answer' field must be string")
                return False
            
            if not isinstance(answer.get('isCorrect'), bool):
                logger.error(f"Question {question_id}, answer {i}: 'isCorrect' field must be boolean")
                return False
            
            if not isinstance(answer.get('responseCount'), int):
                logger.error(f"Question {question_id}, answer {i}: 'responseCount' field must be integer")
                return False
            
            if not isinstance(answer.get('rank'), int):
                logger.error(f"Question {question_id}, answer {i}: 'rank' field must be integer")
                return False
            
            if not isinstance(answer.get('score'), int):
                logger.error(f"Question {question_id}, answer {i}: 'score' field must be integer")
                return False
        
        logger.debug(f"Question {question_id} validation passed")
        return True
    
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
            validation_failed = 0
            
            # Process each question
            for question in questions:
                question_id = question.get('_id', question.get('questionID', 'UNKNOWN'))
                
                if question.get('answers'):
                    # Check if question has admin-approved answers
                    has_correct = any(a.get('isCorrect', False) for a in question['answers'])
                    
                    if has_correct:
                        logger.debug(f"Processing question {question_id}...")
                        processed_question, answers_ranked, answers_scored = self.process_question_ranking(question)
                        
                        # Validate the processed question before adding to update list
                        if self.validate_question_data(processed_question):
                            processed_questions.append(processed_question)
                            total_answers_ranked += answers_ranked
                            total_answers_scored += answers_scored
                            processed_count += 1
                            logger.debug(f"✅ Processed question {question_id}")
                        else:
                            validation_failed += 1
                            logger.error(f"❌ Validation failed for question {question_id}")
                    else:
                        skipped_count += 1
                        logger.debug(f"⏭️ Skipped question {question_id} - no correct answers")
                else:
                    skipped_count += 1
                    logger.debug(f"⏭️ Skipped question {question_id} - no answers")
            
            logger.info(f"Processing complete: {processed_count} processed, {skipped_count} skipped, {validation_failed} validation failed")
            logger.info(f"Total answers ranked: {total_answers_ranked}, scored: {total_answers_scored}")
            
            # Update API with processed questions
            if processed_questions:
                logger.info(f"Updating {len(processed_questions)} questions in API")
                
                # Log sample question structure before sending
                if len(processed_questions) > 0:
                    sample = processed_questions[0]
                    logger.debug(f"Sample question structure being sent:")
                    logger.debug(json.dumps({
                        "questionID": sample.get('_id') or sample.get('questionID'),
                        "answers": [{
                            "answer": a.get('answer'),
                            "isCorrect": a.get('isCorrect'),
                            "responseCount": a.get('responseCount'),
                            "rank": a.get('rank'),
                            "score": a.get('score'),
                            "answerID": a.get('_id') or a.get('answerID', 'NO_ID')
                        } for a in sample.get('answers', [])[:1]]  # Just first answer for brevity
                    }, indent=2))
                
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
                "answers_scored": total_answers_scored,
                "validation_failed": validation_failed
            }
            
        except Exception as e:
            logger.error(f"Ranking processing failed: {str(e)}")
            logger.error(f"Exception details: {type(e).__name__}: {str(e)}")
            raise