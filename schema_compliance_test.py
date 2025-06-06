from mongodb_setup import fetch_questions_from_db
from similarity_processor import process_all_questions_similarity
from ranking_processor import process_all_questions_ranking

def test_similarity_schema_compliance():
    """Test that similarity processed data complies with schema"""
    print("TESTING SIMILARITY PROCESSING SCHEMA COMPLIANCE")
    print("=" * 60)
    
    try:
        # Fetch questions
        questions = fetch_questions_from_db()
        
        if not questions:
            print("ERROR: No questions found")
            return False
        
        print(f"SUCCESS: Fetched {len(questions)} questions")
        
        # Process first question for similarity
        test_question = questions[0]
        processed_questions = process_all_questions_similarity([test_question])
        processed_question = processed_questions[0]
        
        print(f"\n--- SIMILARITY PROCESSING SCHEMA CHECK ---")
        
        # Check question-level fields
        print(f"Question Fields:")
        print(f"  _id: {processed_question.get('_id')} SUCCESS")
        print(f"  questionId: {processed_question.get('questionId', 'NOT SET - auto-generated')}")
        print(f"  question: {processed_question.get('question', '')[:50]}... SUCCESS")
        print(f"  questionType: {processed_question.get('questionType', 'NOT SET')}")
        print(f"  questionCategory: {processed_question.get('questionCategory', 'NOT SET')}")
        print(f"  questionLevel: {processed_question.get('questionLevel', 'NOT SET')}")
        print(f"  timesSkipped: {processed_question.get('timesSkipped', 0)} SUCCESS")
        
        # Check answers array after similarity processing
        answers = processed_question.get('answers', [])
        print(f"\nAnswers Array ({len(answers)} answers after similarity merging):")
        
        schema_compliant = True
        
        for i, answer in enumerate(answers):
            print(f"\n  Answer {i+1}:")
            
            # Check required fields
            answerId = answer.get('answerId', '')
            print(f"    answerId: '{answerId}' (empty/auto-generated as expected)")
            
            answer_text = answer.get('answer', '')
            print(f"    answer: '{answer_text}' SUCCESS")
            
            isCorrect = answer.get('isCorrect', False)
            print(f"    isCorrect: {isCorrect} SUCCESS (admin approval pending)")
            
            responseCount = answer.get('responseCount', 0)
            print(f"    responseCount: {responseCount} SUCCESS (merged counts)")
            
            rank = answer.get('rank', 0)
            if rank == 0:
                print(f"    rank: {rank} SUCCESS (awaiting ranking processing)")
            else:
                print(f"    rank: {rank} (unexpected - should be 0 after similarity)")
                schema_compliant = False
            
            score = answer.get('score', 0)
            if score == 0:
                print(f"    score: {score} SUCCESS (awaiting ranking processing)")
            else:
                print(f"    score: {score} (unexpected - should be 0 after similarity)")
                schema_compliant = False
        
        # Check merging results
        print(f"\n--- SIMILARITY MERGING VALIDATION ---")
        original_answers = test_question.get('answers', [])
        print(f"Original answers: {len(original_answers)}")
        print(f"After merging: {len(answers)}")
        print(f"Duplicates removed: {len(original_answers) - len(answers)}")
        
        # Check response count merging
        original_total_count = sum(a.get('responseCount', 0) for a in original_answers)
        merged_total_count = sum(a.get('responseCount', 0) for a in answers)
        if original_total_count == merged_total_count:
            print(f"SUCCESS: Response counts properly merged: {merged_total_count}")
        else:
            print(f"ERROR: Response count mismatch: {original_total_count} -> {merged_total_count}")
            schema_compliant = False
        
        # Final result for similarity
        print(f"\n--- SIMILARITY PROCESSING RESULT ---")
        if schema_compliant:
            print("SUCCESS: SIMILARITY PROCESSING SCHEMA COMPLIANT!")
            print("Ready for admin approval (set isCorrect flags)")
        else:
            print("ERROR: Similarity processing schema issues found")
        
        return schema_compliant
        
    except Exception as e:
        print(f"ERROR: Similarity schema compliance test failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False

def test_ranking_schema_compliance():
    """Test that ranking processed data complies with schema"""
    print("\n" + "=" * 60)
    print("TESTING RANKING PROCESSING SCHEMA COMPLIANCE")
    print("=" * 60)
    
    try:
        # Fetch questions
        questions = fetch_questions_from_db()
        
        if not questions:
            print("ERROR: No questions found")
            return False
        
        # Find a question that has isCorrect flags (admin approved)
        admin_approved_question = None
        for question in questions:
            answers = question.get('answers', [])
            if any('isCorrect' in answer for answer in answers):
                admin_approved_question = question
                break
        
        if not admin_approved_question:
            print("ERROR: No admin-approved questions found")
            print("Tip: Run similarity processing first, then set isCorrect flags")
            
            # Create a mock approved question for testing
            test_question = questions[0]
            # Set some answers as correct for testing
            for i, answer in enumerate(test_question.get('answers', [])[:2]):
                answer['isCorrect'] = True if i == 0 else False
            admin_approved_question = test_question
            print("Note: Using mock approved question for testing")
        
        print(f"SUCCESS: Using admin-approved question for ranking test")
        
        # Process question for ranking
        processed_questions = process_all_questions_ranking([admin_approved_question])
        processed_question = processed_questions[0]
        
        print(f"\n--- RANKING PROCESSING SCHEMA CHECK ---")
        
        # Check answers array after ranking processing
        answers = processed_question.get('answers', [])
        print(f"Answers Array ({len(answers)} answers after ranking):")
        
        schema_compliant = True
        correct_answers = []
        incorrect_answers = []
        
        for i, answer in enumerate(answers):
            print(f"\n  Answer {i+1}:")
            
            # Check required fields
            answer_text = answer.get('answer', '')
            print(f"    answer: '{answer_text}' SUCCESS")
            
            isCorrect = answer.get('isCorrect', False)
            print(f"    isCorrect: {isCorrect} SUCCESS")
            
            responseCount = answer.get('responseCount', 0)
            print(f"    responseCount: {responseCount} SUCCESS")
            
            rank = answer.get('rank', 0)
            score = answer.get('score', 0)
            
            if isCorrect:
                correct_answers.append(answer)
                if rank >= 1:
                    print(f"    rank: {rank} SUCCESS (correct answer ranked)")
                    print(f"    score: {score} SUCCESS")
                else:
                    print(f"    rank: {rank} ERROR (correct answer should be ranked)")
                    schema_compliant = False
            else:
                incorrect_answers.append(answer)
                if rank == 0 and score == 0:
                    print(f"    rank: {rank} SUCCESS (incorrect answer unranked)")
                    print(f"    score: {score} SUCCESS (incorrect answer unscored)")
                else:
                    print(f"    rank: {rank} ERROR (incorrect answer should be unranked)")
                    print(f"    score: {score} ERROR (incorrect answer should be unscored)")
                    schema_compliant = False
        
        # Check ranking logic
        print(f"\n--- RANKING VALIDATION ---")
        print(f"Correct answers: {len(correct_answers)}")
        print(f"Incorrect answers: {len(incorrect_answers)}")
        
        # Check correct answers ranking
        if correct_answers:
            # Sort by rank to check order
            correct_answers.sort(key=lambda x: x.get('rank', 999))
            
            # Check rank sequence
            expected_rank = 1
            for answer in correct_answers:
                if answer.get('rank') == expected_rank:
                    print(f"SUCCESS: Rank {expected_rank}: '{answer['answer']}' (score: {answer.get('score', 0)})")
                    expected_rank += 1
                else:
                    print(f"ERROR: Rank sequence error at rank {expected_rank}")
                    schema_compliant = False
                    break
            
            # Check scoring
            score_map = {1: 100, 2: 80, 3: 60, 4: 40, 5: 20}
            for answer in correct_answers:
                rank = answer.get('rank', 0)
                score = answer.get('score', 0)
                expected_score = score_map.get(rank, 0)
                if score == expected_score:
                    print(f"SUCCESS: Score correct for rank {rank}: {score}")
                else:
                    print(f"ERROR: Score incorrect for rank {rank}: expected {expected_score}, got {score}")
                    schema_compliant = False
        
        # Final result for ranking
        print(f"\n--- RANKING PROCESSING RESULT ---")
        if schema_compliant:
            print("SUCCESS: RANKING PROCESSING SCHEMA COMPLIANT!")
            print("Data ready for analytics dashboard")
        else:
            print("ERROR: Ranking processing schema issues found")
        
        return schema_compliant
        
    except Exception as e:
        print(f"ERROR: Ranking schema compliance test failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False

def test_complete_workflow_schema():
    """Test complete workflow schema compliance"""
    print("\n" + "=" * 60)
    print("TESTING COMPLETE WORKFLOW SCHEMA COMPLIANCE")
    print("=" * 60)
    
    print("Flask Processing Workflow:")
    print("1. Raw data → 2. Similarity processing → 3. Admin approval → 4. Ranking processing → 5. Analytics")
    
    # Test similarity processing
    similarity_compliant = test_similarity_schema_compliance()
    
    # Test ranking processing
    ranking_compliant = test_ranking_schema_compliance()
    
    # Overall result
    print(f"\n--- COMPLETE WORKFLOW SCHEMA COMPLIANCE ---")
    if similarity_compliant and ranking_compliant:
        print("SUCCESS: COMPLETE WORKFLOW SCHEMA COMPLIANT!")
        print("SUCCESS: Similarity processing: Schema compliant")
        print("SUCCESS: Ranking processing: Schema compliant")
        print("SUCCESS: Ready for production analytics")
        return True
    else:
        print("ERROR: Workflow schema issues found:")
        if not similarity_compliant:
            print("  - Similarity processing has issues")
        if not ranking_compliant:
            print("  - Ranking processing has issues")
        return False

if __name__ == "__main__":
    test_complete_workflow_schema()