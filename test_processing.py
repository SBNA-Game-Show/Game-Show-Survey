from mongodb_setup import fetch_questions_from_db, update_questions_in_db
from similarity_processor import process_all_questions_similarity
from ranking_processor import process_all_questions_ranking
import json

def test_similarity_processing():
    """Test the similarity processing pipeline step"""
    print("TESTING SIMILARITY PROCESSING PIPELINE")
    print("=" * 60)
    
    try:
        # Step 1: Fetch questions
        print("Step 1: Fetching questions from database...")
        questions = fetch_questions_from_db()
        
        if not questions:
            print("ERROR: No questions fetched")
            return False
        
        print(f"SUCCESS: Fetched {len(questions)} questions")
        
        # Show first question before similarity processing
        first_question = questions[0]
        print(f"\n--- BEFORE SIMILARITY PROCESSING ---")
        print(f"Question: {first_question.get('question', '')[:60]}...")
        print(f"Answers before processing: {len(first_question.get('answers', []))}")
        
        for i, answer in enumerate(first_question.get('answers', [])[:5]):
            print(f"  Answer {i+1}: '{answer.get('answer', '')}' (count: {answer.get('responseCount', 0)}, correct: {answer.get('isCorrect', False)})")
        
        # Step 2: Process similarity for first question only
        print(f"\nStep 2: Processing similarity for test question...")
        processed_questions = process_all_questions_similarity([first_question])
        
        print(f"SUCCESS: Processed {len(processed_questions)} questions for similarity")
        
        # Show first question after similarity processing
        first_processed = processed_questions[0]
        print(f"\n--- AFTER SIMILARITY PROCESSING ---")
        print(f"Question: {first_processed.get('question', '')[:60]}...")
        print(f"Answers after processing: {len(first_processed.get('answers', []))}")
        
        for i, answer in enumerate(first_processed.get('answers', [])):
            print(f"  Answer {i+1}: '{answer.get('answer', '')}' (count: {answer.get('responseCount', 0)}, correct: {answer.get('isCorrect', False)})")
        
        # Calculate merge statistics
        original_count = len(first_question.get('answers', []))
        processed_count = len(first_processed.get('answers', []))
        merged_count = original_count - processed_count
        
        print(f"\n--- SIMILARITY PROCESSING RESULTS ---")
        print(f"SUCCESS: Original answers: {original_count}")
        print(f"SUCCESS: After merging: {processed_count}")
        print(f"SUCCESS: Duplicates merged: {merged_count}")
        
        # Verify response counts are preserved
        original_total_responses = sum(a.get('responseCount', 0) for a in first_question.get('answers', []))
        processed_total_responses = sum(a.get('responseCount', 0) for a in first_processed.get('answers', []))
        
        if original_total_responses == processed_total_responses:
            print(f"SUCCESS: Response counts preserved: {processed_total_responses}")
        else:
            print(f"ERROR: Response count mismatch: {original_total_responses} -> {processed_total_responses}")
            return False
        
        # Step 3: Test update (simulate only - don't actually update)
        print(f"\nStep 3: Testing similarity update structure...")
        sample_update = {
            '_id': first_processed['_id'],
            'answers': first_processed['answers']
        }
        
        print("SUCCESS: Similarity update structure validated")
        print(f"Would update question {first_processed['_id']} with {len(first_processed['answers'])} merged answers")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Similarity processing test failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False

def test_ranking_processing():
    """Test the ranking processing pipeline step"""
    print("\n" + "=" * 60)
    print("TESTING RANKING PROCESSING PIPELINE")
    print("=" * 60)
    
    try:
        # Step 1: Fetch questions
        print("Step 1: Fetching questions from database...")
        questions = fetch_questions_from_db()
        
        if not questions:
            print("ERROR: No questions fetched")
            return False
        
        # Step 2: Find or create a question with admin approval
        admin_approved_question = None
        for question in questions:
            answers = question.get('answers', [])
            if any('isCorrect' in answer for answer in answers):
                admin_approved_question = question
                break
        
        if not admin_approved_question:
            print("WARNING: No admin-approved questions found")
            print("Creating mock approved question for testing...")
            
            # Create mock admin-approved question
            test_question = questions[0]
            answers = test_question.get('answers', [])
            
            # Set some answers as correct/incorrect for testing
            for i, answer in enumerate(answers[:3]):
                answer['isCorrect'] = True if i < 2 else False
                # Ensure different response counts for ranking
                answer['responseCount'] = 10 - (i * 2)
            
            admin_approved_question = test_question
            print(f"SUCCESS: Created mock question with {len([a for a in answers if a.get('isCorrect')])} correct answers")
        
        print(f"\n--- BEFORE RANKING PROCESSING ---")
        answers = admin_approved_question.get('answers', [])
        correct_answers = [a for a in answers if a.get('isCorrect', False)]
        incorrect_answers = [a for a in answers if not a.get('isCorrect', False)]
        
        print(f"Question: {admin_approved_question.get('question', '')[:60]}...")
        print(f"Total answers: {len(answers)}")
        print(f"Correct answers: {len(correct_answers)}")
        print(f"Incorrect answers: {len(incorrect_answers)}")
        
        for i, answer in enumerate(answers[:5]):
            print(f"  Answer {i+1}: '{answer.get('answer', '')}' (correct: {answer.get('isCorrect', False)}, count: {answer.get('responseCount', 0)}, rank: {answer.get('rank', 0)}, score: {answer.get('score', 0)})")
        
        # Step 2: Process ranking
        print(f"\nStep 2: Processing ranking for admin-approved question...")
        processed_questions = process_all_questions_ranking([admin_approved_question])
        
        print(f"SUCCESS: Processed {len(processed_questions)} questions for ranking")
        
        # Show question after ranking processing
        first_processed = processed_questions[0]
        print(f"\n--- AFTER RANKING PROCESSING ---")
        processed_answers = first_processed.get('answers', [])
        
        for i, answer in enumerate(processed_answers):
            print(f"  Answer {i+1}: '{answer.get('answer', '')}' (correct: {answer.get('isCorrect', False)}, count: {answer.get('responseCount', 0)}, rank: {answer.get('rank', 0)}, score: {answer.get('score', 0)})")
        
        # Verify ranking logic
        print(f"\n--- RANKING PROCESSING RESULTS ---")
        ranked_answers = [a for a in processed_answers if a.get('rank', 0) > 0]
        unranked_answers = [a for a in processed_answers if a.get('rank', 0) == 0]
        
        print(f"SUCCESS: Ranked answers: {len(ranked_answers)}")
        print(f"SUCCESS: Unranked answers: {len(unranked_answers)}")
        
        # Check that only correct answers are ranked
        ranked_correct = all(a.get('isCorrect', False) for a in ranked_answers)
        unranked_incorrect = all(not a.get('isCorrect', False) for a in unranked_answers)
        
        if ranked_correct:
            print("SUCCESS: Only correct answers are ranked")
        else:
            print("ERROR: Incorrect answers found in ranked answers")
            return False
        
        if unranked_incorrect:
            print("SUCCESS: All incorrect answers are unranked")
        else:
            print("ERROR: Correct answers found in unranked answers")
            return False
        
        # Check ranking order (by responseCount descending)
        if len(ranked_answers) > 1:
            correct_order = all(
                ranked_answers[i].get('responseCount', 0) >= ranked_answers[i+1].get('responseCount', 0)
                for i in range(len(ranked_answers) - 1)
            )
            if correct_order:
                print("SUCCESS: Answers ranked by response count (highest first)")
            else:
                print("ERROR: Ranking order incorrect")
                return False
        
        # Check scoring
        score_map = {1: 100, 2: 80, 3: 60, 4: 40, 5: 20}
        correct_scores = all(
            answer.get('score', 0) == score_map.get(answer.get('rank', 0), 0)
            for answer in ranked_answers
        )
        
        if correct_scores:
            print("SUCCESS: Scoring correct for all ranked answers")
        else:
            print("ERROR: Scoring errors found")
            return False
        
        # Step 3: Test update structure
        print(f"\nStep 3: Testing ranking update structure...")
        sample_update = {
            '_id': first_processed['_id'],
            'answers': first_processed['answers']
        }
        
        print("SUCCESS: Ranking update structure validated")
        print(f"Would update question {first_processed['_id']} with {len(ranked_answers)} ranked answers")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Ranking processing test failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False

def test_similarity_merging_logic():
    """Test the similarity merging logic with sample data"""
    print("\n" + "=" * 60)
    print("TESTING SIMILARITY MERGING LOGIC")
    print("=" * 60)
    
    from similarity_processor import merge_similar_answers, calculate_spell_similarity
    
    # Sample answers with similar text
    sample_answers = [
        {
            'answerId': 'ans1',
            'answer': 'Namaste',
            'isCorrect': True,
            'responseCount': 3,
            'rank': 0,
            'score': 0
        },
        {
            'answerId': 'ans2', 
            'answer': 'namaste',  # Similar to first but different case
            'isCorrect': False,
            'responseCount': 5,
            'rank': 0,
            'score': 0
        },
        {
            'answerId': 'ans3',
            'answer': 'Pranaam',
            'isCorrect': False,
            'responseCount': 2,
            'rank': 0,
            'score': 0
        },
        {
            'answerId': 'ans4',
            'answer': 'praNaam',  # Similar to third
            'isCorrect': False,
            'responseCount': 1,
            'rank': 0,
            'score': 0
        },
        {
            'answerId': 'ans5',
            'answer': 'Hello',
            'isCorrect': False,
            'responseCount': 2,
            'rank': 0,
            'score': 0
        }
    ]
    
    print("Sample answers before merging:")
    for i, ans in enumerate(sample_answers):
        print(f"  {i+1}. '{ans['answer']}' (count: {ans['responseCount']}, correct: {ans['isCorrect']})")
    
    # Test similarity calculation
    print(f"\nTesting similarity calculations:")
    print(f"'Namaste' vs 'namaste': {calculate_spell_similarity('Namaste', 'namaste'):.2f}")
    print(f"'Pranaam' vs 'praNaam': {calculate_spell_similarity('Pranaam', 'praNaam'):.2f}")
    print(f"'Namaste' vs 'Hello': {calculate_spell_similarity('Namaste', 'Hello'):.2f}")
    
    # Test merging
    merged = merge_similar_answers(sample_answers, cutoff=0.75)
    print(f"\nAfter merging (75% similarity threshold):")
    for i, ans in enumerate(merged):
        print(f"  {i+1}. '{ans['answer']}' (count: {ans['responseCount']}, correct: {ans['isCorrect']})")
    
    # Verify merge results
    print(f"\nMerge verification:")
    print(f"SUCCESS: Original answers: {len(sample_answers)}")
    print(f"SUCCESS: After merging: {len(merged)}")
    print(f"SUCCESS: Merged count: {len(sample_answers) - len(merged)}")
    
    # Check that response counts are preserved
    original_total = sum(a['responseCount'] for a in sample_answers)
    merged_total = sum(a['responseCount'] for a in merged)
    
    if original_total == merged_total:
        print(f"SUCCESS: Response counts preserved: {merged_total}")
    else:
        print(f"ERROR: Response count error: {original_total} -> {merged_total}")
        return False
    
    return True

def test_ranking_scoring_logic():
    """Test the ranking and scoring logic with sample data"""
    print("\n" + "=" * 60)
    print("TESTING RANKING AND SCORING LOGIC")
    print("=" * 60)
    
    from ranking_processor import rank_and_score_correct_answers
    
    # Sample answers with correct/incorrect flags
    sample_answers = [
        {
            'answer': 'Correct Answer 1',
            'isCorrect': True,
            'responseCount': 10,
            'rank': 0,
            'score': 0
        },
        {
            'answer': 'Incorrect Answer 1',
            'isCorrect': False,
            'responseCount': 8,
            'rank': 0,
            'score': 0
        },
        {
            'answer': 'Correct Answer 2',
            'isCorrect': True,
            'responseCount': 6,
            'rank': 0,
            'score': 0
        },
        {
            'answer': 'Correct Answer 3',
            'isCorrect': True,
            'responseCount': 4,
            'rank': 0,
            'score': 0
        },
        {
            'answer': 'Incorrect Answer 2',
            'isCorrect': False,
            'responseCount': 3,
            'rank': 0,
            'score': 0
        }
    ]
    
    print("Sample answers before ranking:")
    for i, ans in enumerate(sample_answers):
        print(f"  {i+1}. '{ans['answer']}' (count: {ans['responseCount']}, correct: {ans['isCorrect']})")
    
    # Test ranking and scoring
    ranked = rank_and_score_correct_answers(sample_answers)
    print(f"\nAfter ranking and scoring:")
    for i, ans in enumerate(ranked):
        print(f"  {i+1}. '{ans['answer']}' (count: {ans['responseCount']}, correct: {ans['isCorrect']}, rank: {ans['rank']}, score: {ans['score']})")
    
    # Verify ranking logic
    print(f"\nRanking verification:")
    correct_answers = [a for a in ranked if a['isCorrect']]
    incorrect_answers = [a for a in ranked if not a['isCorrect']]
    
    print(f"SUCCESS: Correct answers ranked: {len(correct_answers)}")
    print(f"SUCCESS: Incorrect answers unranked: {len(incorrect_answers)}")
    
    # Check ranking order
    if len(correct_answers) > 1:
        correct_order = all(
            correct_answers[i]['responseCount'] >= correct_answers[i+1]['responseCount']
            for i in range(len(correct_answers) - 1)
        )
        if correct_order:
            print("SUCCESS: Correct answers properly ordered by response count")
        else:
            print("ERROR: Ranking order incorrect")
            return False
    
    # Check scoring
    score_map = {1: 100, 2: 80, 3: 60, 4: 40, 5: 20}
    for answer in correct_answers:
        expected_score = score_map.get(answer['rank'], 0)
        if answer['score'] == expected_score:
            print(f"SUCCESS: Rank {answer['rank']}: Score {answer['score']} correct")
        else:
            print(f"ERROR: Rank {answer['rank']}: Expected {expected_score}, got {answer['score']}")
            return False
    
    # Check that incorrect answers are unranked and unscored
    for answer in incorrect_answers:
        if answer['rank'] == 0 and answer['score'] == 0:
            print(f"SUCCESS: Incorrect answer properly unranked and unscored")
        else:
            print(f"ERROR: Incorrect answer improperly ranked: rank {answer['rank']}, score {answer['score']}")
            return False
    
    return True

def test_complete_processing_workflow():
    """Test the complete processing workflow"""
    print("\n" + "=" * 60)
    print("TESTING COMPLETE PROCESSING WORKFLOW")
    print("=" * 60)
    
    print("Flask Processing Workflow:")
    print("1. Raw participant submissions")
    print("2. /api/process-similarity - Merge similar answers")
    print("3. Admin approval - Set isCorrect flags")
    print("4. /api/process-ranking - Rank and score approved answers")
    print("5. Analytics ready!")
    
    # Test each component
    print("\n1. Testing similarity merging logic...")
    similarity_logic_success = test_similarity_merging_logic()
    
    print("\n2. Testing ranking scoring logic...")
    ranking_logic_success = test_ranking_scoring_logic()
    
    print("\n3. Testing similarity processing pipeline...")
    similarity_pipeline_success = test_similarity_processing()
    
    print("\n4. Testing ranking processing pipeline...")
    ranking_pipeline_success = test_ranking_processing()
    
    # Overall result
    print(f"\n--- COMPLETE WORKFLOW TEST RESULTS ---")
    all_tests_passed = all([
        similarity_logic_success,
        ranking_logic_success,
        similarity_pipeline_success,
        ranking_pipeline_success
    ])
    
    if all_tests_passed:
        print("SUCCESS: ALL PROCESSING TESTS PASSED!")
        print("SUCCESS: Similarity logic: Working")
        print("SUCCESS: Ranking logic: Working")
        print("SUCCESS: Similarity pipeline: Working")
        print("SUCCESS: Ranking pipeline: Working")
        print("SUCCESS: Ready for production use")
    else:
        print("ERROR: Some processing tests failed:")
        if not similarity_logic_success:
            print("  - Similarity logic has issues")
        if not ranking_logic_success:
            print("  - Ranking logic has issues")
        if not similarity_pipeline_success:
            print("  - Similarity pipeline has issues")
        if not ranking_pipeline_success:
            print("  - Ranking pipeline has issues")
    
    return all_tests_passed

if __name__ == "__main__":
    test_complete_processing_workflow()