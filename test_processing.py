from mongodb_setup import fetch_questions_from_db, update_questions_in_db
from analytics import process_all_questions
import json

def test_processing():
    """Test the complete processing pipeline"""
    print("TESTING COMPLETE PROCESSING PIPELINE")
    print("=" * 60)
    
    try:
        # Step 1: Fetch questions
        print("Step 1: Fetching questions from database...")
        questions = fetch_questions_from_db()
        
        if not questions:
            print("❌ No questions fetched")
            return False
        
        print(f"✓ Fetched {len(questions)} questions")
        
        # Show first question before processing
        first_question = questions[0]
        print(f"\n--- BEFORE PROCESSING ---")
        print(f"Question: {first_question.get('question', '')[:60]}...")
        print(f"Answers before processing: {len(first_question.get('answers', []))}")
        
        for i, answer in enumerate(first_question.get('answers', [])[:3]):
            print(f"  Answer {i+1}: '{answer.get('answer', '')}' (count: {answer.get('responseCount', 0)}, correct: {answer.get('isCorrect', False)}, rank: {answer.get('rank', 0)}, score: {answer.get('score', 0)})")
        
        # Step 2: Process questions
        print(f"\nStep 2: Processing questions...")
        processed_questions = process_all_questions(questions[:2])  # Process only first 2 for testing
        
        print(f"✓ Processed {len(processed_questions)} questions")
        
        # Show first question after processing
        first_processed = processed_questions[0]
        print(f"\n--- AFTER PROCESSING ---")
        print(f"Question: {first_processed.get('question', '')[:60]}...")
        print(f"Answers after processing: {len(first_processed.get('answers', []))}")
        
        for i, answer in enumerate(first_processed.get('answers', [])):
            print(f"  Answer {i+1}: '{answer.get('answer', '')}' (count: {answer.get('responseCount', 0)}, correct: {answer.get('isCorrect', False)}, rank: {answer.get('rank', 0)}, score: {answer.get('score', 0)})")
        
        # Step 3: Test update (but don't actually update - just simulate)
        print(f"\nStep 3: Testing update structure...")
        
        # Show what would be updated
        sample_update = {
            '_id': first_processed['_id'],
            'answers': first_processed['answers']
        }
        
        print("✓ Update structure looks good")
        print(f"Would update question {first_processed['_id']} with {len(first_processed['answers'])} processed answers")
        
        return True
        
    except Exception as e:
        print(f"❌ Processing test failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False

def test_similarity_merging():
    """Test the similarity merging logic with sample data"""
    print("\n" + "=" * 60)
    print("TESTING SIMILARITY MERGING LOGIC")
    print("=" * 60)
    
    from analytics import merge_similar_answers, rank_and_score_answers
    
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
        }
    ]
    
    print("Sample answers before merging:")
    for i, ans in enumerate(sample_answers):
        print(f"  {i+1}. '{ans['answer']}' (count: {ans['responseCount']}, correct: {ans['isCorrect']})")
    
    # Test merging
    merged = merge_similar_answers(sample_answers, cutoff=0.75)
    print(f"\nAfter merging (75% similarity):")
    for i, ans in enumerate(merged):
        print(f"  {i+1}. '{ans['answer']}' (count: {ans['responseCount']}, correct: {ans['isCorrect']}, id: {ans['answerId']})")
    
    # Test ranking and scoring
    ranked = rank_and_score_answers(merged)
    print(f"\nAfter ranking and scoring:")
    for i, ans in enumerate(ranked):
        print(f"  Rank {ans['rank']}: '{ans['answer']}' (count: {ans['responseCount']}, correct: {ans['isCorrect']}, score: {ans['score']})")

if __name__ == "__main__":
    # Test similarity merging first
    test_similarity_merging()
    
    # Test complete processing
    test_processing()