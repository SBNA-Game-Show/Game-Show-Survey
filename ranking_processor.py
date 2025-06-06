def rank_and_score_correct_answers(answers):
    """
    Rank and score only answers with isCorrect=True.
    - Only correct answers (isCorrect=True) get ranked and scored
    - Ranking based on responseCount (highest count = rank 1)
    - Scoring: rank 1=100, rank 2=80, rank 3=60, rank 4=40, rank 5=20, rank 6+=0
    - Incorrect answers (isCorrect=False) keep rank=0 and score=0
    """
    if not answers:
        return answers
    
    # Separate correct and incorrect answers
    correct_answers = [answer for answer in answers if answer.get('isCorrect', False)]
    incorrect_answers = [answer for answer in answers if not answer.get('isCorrect', False)]
    
    # Sort correct answers by responseCount (descending - highest count first)
    correct_answers.sort(key=lambda x: x.get('responseCount', 0), reverse=True)
    
    # Score mapping
    score_map = {1: 100, 2: 80, 3: 60, 4: 40, 5: 20}
    
    # Assign ranks and scores to correct answers only
    for i, answer in enumerate(correct_answers):
        rank = i + 1  # Rank starts from 1
        answer['rank'] = rank
        answer['score'] = score_map.get(rank, 0)  # Rank 6+ gets score 0
    
    # Ensure incorrect answers have rank=0 and score=0
    for answer in incorrect_answers:
        answer['rank'] = 0
        answer['score'] = 0
    
    # Combine back: correct answers first (sorted by rank), then incorrect answers
    return correct_answers + incorrect_answers

def process_question_ranking(question_data):
    """
    Process a single question's answers for ranking and scoring:
    1. Only rank and score answers where isCorrect=True
    2. Rank by responseCount (highest = rank 1)
    3. Score top 5 ranks, rest get score 0
    """
    if not question_data.get('answers'):
        return question_data
    
    # Rank and score only correct answers
    processed_answers = rank_and_score_correct_answers(question_data['answers'])
    
    # Update the question data
    question_data['answers'] = processed_answers
    
    return question_data

def process_all_questions_ranking(questions_data):
    """
    Process all questions for ranking and scoring
    """
    processed_questions = []
    
    for question in questions_data:
        processed_question = process_question_ranking(question)
        processed_questions.append(processed_question)
    
    return processed_questions