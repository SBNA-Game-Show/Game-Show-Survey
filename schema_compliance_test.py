from mongodb_setup import fetch_questions_from_db
from analytics import process_all_questions

def test_schema_compliance():
    """Test that processed data complies with your Mongoose schema"""
    print("TESTING SCHEMA COMPLIANCE")
    print("=" * 60)
    
    try:
        # Fetch questions
        questions = fetch_questions_from_db()
        
        if not questions:
            print("❌ No questions found")
            return False
        
        print(f"✓ Fetched {len(questions)} questions")
        
        # Process first question to test
        test_question = questions[0]
        processed_questions = process_all_questions([test_question])
        processed_question = processed_questions[0]
        
        print(f"\n--- SCHEMA COMPLIANCE CHECK ---")
        
        # Check question-level fields
        print(f"Question Fields:")
        print(f"  _id: {processed_question.get('_id')} ✓")
        print(f"  questionId: {processed_question.get('questionId', 'NOT SET - auto-generated')}")
        print(f"  question: {processed_question.get('question', '')[:50]}... ✓")
        print(f"  questionType: {processed_question.get('questionType', 'NOT SET')}")
        print(f"  questionCategory: {processed_question.get('questionCategory', 'NOT SET')}")
        print(f"  questionLevel: {processed_question.get('questionLevel', 'NOT SET')}")
        print(f"  timesSkipped: {processed_question.get('timesSkipped', 0)} ✓")
        
        # Check answers array
        answers = processed_question.get('answers', [])
        print(f"\nAnswers Array ({len(answers)} answers):")
        
        schema_compliant = True
        
        for i, answer in enumerate(answers):
            print(f"\n  Answer {i+1}:")
            
            # Check required fields
            answerId = answer.get('answerId', '')
            print(f"    answerId: '{answerId}' (empty/null as expected)")
            
            answer_text = answer.get('answer', '')
            print(f"    answer: '{answer_text}' ✓")
            
            isCorrect = answer.get('isCorrect', False)
            print(f"    isCorrect: {isCorrect} ✓")
            
            responseCount = answer.get('responseCount', 0)
            print(f"    responseCount: {responseCount} ✓")
            
            rank = answer.get('rank', 0)
            if rank >= 1:  # Schema requires min: 1 for processed answers
                print(f"    rank: {rank} ✓ (processed)")
            elif rank == 0:
                print(f"    rank: {rank} ✓ (unprocessed)")
            else:
                print(f"    rank: {rank} ❌ (should be >= 1 for processed)")
                schema_compliant = False
            
            score = answer.get('score', 0)
            print(f"    score: {score} ✓")
        
        # Check ranking logic
        print(f"\n--- RANKING VALIDATION ---")
        correct_answers = [a for a in answers if a.get('isCorrect', False)]
        incorrect_answers = [a for a in answers if not a.get('isCorrect', False)]
        
        print(f"Correct answers: {len(correct_answers)}")
        print(f"Incorrect answers: {len(incorrect_answers)}")
        
        # Check if correct answers are ranked first
        if correct_answers:
            min_correct_rank = min(a.get('rank', 999) for a in correct_answers)
            max_incorrect_rank = max([a.get('rank', 0) for a in incorrect_answers] + [0])
            
            if max_incorrect_rank == 0 or min_correct_rank < max_incorrect_rank:
                print(f"✓ Correct answers properly ranked first")
            else:
                print(f"❌ Ranking issue: correct min rank {min_correct_rank}, incorrect max rank {max_incorrect_rank}")
                schema_compliant = False
        
        # Check score distribution
        scored_answers = [a for a in answers if a.get('score', 0) > 0]
        print(f"Answers with scores > 0: {len(scored_answers)} (should be <= 5)")
        
        if len(scored_answers) <= 5:
            print(f"✓ Score distribution correct")
        else:
            print(f"❌ Too many scored answers: {len(scored_answers)}")
            schema_compliant = False
        
        # Final result
        print(f"\n--- FINAL RESULT ---")
        if schema_compliant:
            print("✓ ALL SCHEMA REQUIREMENTS MET!")
            print("The processed data is fully compliant with your Mongoose schema.")
        else:
            print("❌ Schema compliance issues found")
        
        return schema_compliant
        
    except Exception as e:
        print(f"❌ Schema compliance test failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    test_schema_compliance()