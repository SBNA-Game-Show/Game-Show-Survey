import difflib

def normalize(text):
    return text.lower().strip()

def merge_similar_answers(answers, cutoff=0.75):
    """
    Merge similar answers based on text similarity.
    Priority rules:
    1. If one answer has isCorrect=True, use its answerId and text
    2. If both have isCorrect=False, use the one with higher count
    3. Add up the counts of merged answers
    """
    merged_answers = []
    processed_indices = set()
    
    for i, answer in enumerate(answers):
        if i in processed_indices:
            continue
            
        current_answer = {
            'answerId': answer.get('answerId', ''),  # Handle missing answerId
            'answer': answer.get('answer', ''),
            'isCorrect': answer.get('isCorrect', False),
            'responseCount': answer.get('responseCount', 0),
            'rank': answer.get('rank', 0),
            'score': answer.get('score', 0)
        }
        
        # Find similar answers to merge with current answer
        similar_indices = [i]
        processed_indices.add(i)
        
        for j, other_answer in enumerate(answers):
            if j <= i or j in processed_indices:
                continue
                
            # Check similarity
            similarity = difflib.SequenceMatcher(
                None, 
                normalize(answer.get('answer', '')), 
                normalize(other_answer.get('answer', ''))
            ).ratio()
            
            if similarity >= cutoff:
                similar_indices.append(j)
                processed_indices.add(j)
                
                # Merge logic
                current_answer['responseCount'] += other_answer.get('responseCount', 0)
                
                # Determine which answer text and ID to keep
                if other_answer.get('isCorrect', False) and not current_answer['isCorrect']:
                    # Other answer is correct, current is not - use other answer's details
                    current_answer['answerId'] = other_answer.get('answerId', '')
                    current_answer['answer'] = other_answer.get('answer', '')
                    current_answer['isCorrect'] = True
                elif current_answer['isCorrect'] and not other_answer.get('isCorrect', False):
                    # Current answer is correct, other is not - keep current
                    pass
                elif not current_answer['isCorrect'] and not other_answer.get('isCorrect', False):
                    # Both are incorrect - use the one with higher original count
                    if other_answer.get('responseCount', 0) > answer.get('responseCount', 0):
                        current_answer['answerId'] = other_answer.get('answerId', '')
                        current_answer['answer'] = other_answer.get('answer', '')
                # If both are correct, keep the first one (current)
        
        merged_answers.append(current_answer)
    
    return merged_answers

def rank_and_score_answers(merged_answers):
    """
    Rank answers with priority to isCorrect=True, then by count.
    Score only top 5 answers, rest get score=0.
    Rank starts from 1 (as per schema: min: 1)
    """
    # Sort answers: first by isCorrect (True first), then by responseCount (descending), then by original order
    sorted_answers = sorted(
        merged_answers, 
        key=lambda x: (not x.get('isCorrect', False), -x.get('responseCount', 0))
    )
    
    # Assign ranks and scores (rank starts from 1 as per schema)
    score_map = {1: 100, 2: 80, 3: 60, 4: 40, 5: 20}
    
    for i, answer in enumerate(sorted_answers):
        rank = i + 1  # Start rank from 1 (schema requirement: min: 1)
        answer['rank'] = rank
        answer['score'] = score_map.get(rank, 0)  # Top 5 get scores, rest get 0
    
    return sorted_answers

def process_question_answers(question_data):
    """
    Process a single question's answers:
    1. Merge similar answers based on 75% similarity
    2. Rank all answers (isCorrect=True first, then by count)
    3. Score top 5 answers only
    """
    if not question_data.get('answers'):
        return question_data
    
    # Step 1: Merge similar answers
    merged_answers = merge_similar_answers(question_data['answers'])
    
    # Step 2: Rank and score answers
    processed_answers = rank_and_score_answers(merged_answers)
    
    # Update the question data
    question_data['answers'] = processed_answers
    
    return question_data

def process_all_questions(questions_data):
    """
    Process all questions from the database
    """
    processed_questions = []
    
    for question in questions_data:
        processed_question = process_question_answers(question)
        processed_questions.append(processed_question)
    
    return processed_questions