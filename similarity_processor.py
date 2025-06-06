def normalize_text(text):
    """
    Normalize text for similarity comparison - universal for any language.
    Only handles case differences, whitespace, and basic cleanup.
    """
    if not text:
        return ""
    
    # Convert to lowercase and strip whitespace - universal normalization
    return text.lower().strip()

def calculate_spell_similarity(text1, text2):
    """
    Calculate similarity using Levenshtein distance - universal for any language.
    Handles typos, missing letters, and case differences.
    Returns similarity as a value between 0 and 1.
    """
    # Normalize both texts (case insensitive, whitespace trimmed)
    s1 = normalize_text(text1)
    s2 = normalize_text(text2)
    
    if s1 == s2:
        return 1.0
    
    if not s1 or not s2:
        return 0.0
    
    len1, len2 = len(s1), len(s2)
    
    # Create matrix for dynamic programming (Levenshtein distance)
    matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    
    # Initialize first row and column
    for i in range(len1 + 1):
        matrix[i][0] = i
    for j in range(len2 + 1):
        matrix[0][j] = j
    
    # Fill the matrix
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i-1] == s2[j-1] else 1
            matrix[i][j] = min(
                matrix[i-1][j] + 1,      # deletion
                matrix[i][j-1] + 1,      # insertion
                matrix[i-1][j-1] + cost  # substitution
            )
    
    # Convert edit distance to similarity percentage
    edit_distance = matrix[len1][len2]
    max_length = max(len1, len2)
    
    if max_length == 0:
        return 1.0
    
    similarity = 1 - (edit_distance / max_length)
    return max(0, similarity)

def merge_similar_answers(answers, cutoff=0.75):
    """
    Merge similar answers based on text similarity using answer text as identifier.
    Priority rules:
    1. If one answer has isCorrect=True, use its text and properties
    2. If both have isCorrect=False, use the one with higher responseCount
    3. Add up the responseCount of merged answers
    4. Use answer text as the primary identifier (not _id)
    """
    if not answers:
        return []
    
    merged_answers = []
    processed_indices = set()
    
    for i, answer in enumerate(answers):
        if i in processed_indices:
            continue
            
        # Create current answer with all required fields
        current_answer = {
            'answer': answer.get('answer', ''),
            'isCorrect': answer.get('isCorrect', False),
            'responseCount': answer.get('responseCount', 0),
            'rank': answer.get('rank', 0),
            'score': answer.get('score', 0)
        }
        
        # Preserve _id if it exists, otherwise don't include it
        if '_id' in answer and answer['_id']:
            current_answer['_id'] = answer['_id']
        
        processed_indices.add(i)
        
        # Find similar answers to merge with current answer
        for j, other_answer in enumerate(answers):
            if j <= i or j in processed_indices:
                continue
                
            # Check similarity between answer texts using universal spell-check algorithm
            similarity = calculate_spell_similarity(
                answer.get('answer', ''), 
                other_answer.get('answer', '')
            )
            
            if similarity >= cutoff:
                processed_indices.add(j)
                
                # Merge response counts
                current_answer['responseCount'] += other_answer.get('responseCount', 0)
                
                # Determine which answer text and properties to keep based on priority
                if other_answer.get('isCorrect', False) and not current_answer['isCorrect']:
                    # Other answer is correct, current is not - use other answer's details
                    current_answer['answer'] = other_answer.get('answer', '')
                    current_answer['isCorrect'] = True
                    # Update _id if other answer has one
                    if '_id' in other_answer and other_answer['_id']:
                        current_answer['_id'] = other_answer['_id']
                elif current_answer['isCorrect'] and not other_answer.get('isCorrect', False):
                    # Current answer is correct, other is not - keep current
                    pass
                elif not current_answer['isCorrect'] and not other_answer.get('isCorrect', False):
                    # Both are incorrect - use the one with higher original responseCount
                    if other_answer.get('responseCount', 0) > answer.get('responseCount', 0):
                        current_answer['answer'] = other_answer.get('answer', '')
                        # Update _id if other answer has one
                        if '_id' in other_answer and other_answer['_id']:
                            current_answer['_id'] = other_answer['_id']
                # If both are correct, keep the first one (current)
        
        merged_answers.append(current_answer)
    
    return merged_answers

def process_question_similarity(question_data):
    """
    Process a single question's answers for similarity:
    1. Merge similar answers based on 75% similarity using universal algorithm
    2. Return processed question with merged answers (duplicates removed)
    3. Works with any language - handles case differences, typos, extra characters
    """
    if not question_data.get('answers'):
        return question_data
    
    # Merge similar answers using text-based comparison
    merged_answers = merge_similar_answers(question_data['answers'])
    
    # Update the question data with merged answers
    question_data['answers'] = merged_answers
    
    return question_data

def process_all_questions_similarity(questions_data):
    """
    Process all questions for similarity merging.
    Universal algorithm - works with any language and answer types.
    """
    processed_questions = []
    
    for question in questions_data:
        processed_question = process_question_similarity(question)
        processed_questions.append(processed_question)
    
    return processed_questions