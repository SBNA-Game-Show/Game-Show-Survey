from similarity_processor import process_all_questions_similarity
from ranking_processor import process_all_questions_ranking

def process_all_questions(questions_data):
    """
    Process all questions through both similarity and ranking steps:
    1. First merge similar answers using similarity processor
    2. Then rank and score answers using ranking processor
    """
    # Step 1: Process similarity (merge similar answers)
    questions_after_similarity = process_all_questions_similarity(questions_data)
    
    # Step 2: Process ranking and scoring
    final_processed_questions = process_all_questions_ranking(questions_after_similarity)
    
    return final_processed_questions 