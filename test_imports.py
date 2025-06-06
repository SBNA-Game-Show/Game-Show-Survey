#!/usr/bin/env python3
"""
Simple test to verify all imports work correctly
"""

def test_imports():
    """Test all imports used in the project"""
    print("Testing imports...")
    
    try:
        print("Testing mongodb_setup...")
        from mongodb_setup import fetch_questions_from_db, update_questions_in_db
        print("SUCCESS: mongodb_setup imports work")
    except Exception as e:
        print(f"ERROR: mongodb_setup import failed: {e}")
        return False
    
    try:
        print("Testing similarity_processor...")
        from similarity_processor import process_all_questions_similarity, merge_similar_answers, calculate_spell_similarity
        print("SUCCESS: similarity_processor imports work")
    except Exception as e:
        print(f"ERROR: similarity_processor import failed: {e}")
        return False
    
    try:
        print("Testing ranking_processor...")
        from ranking_processor import process_all_questions_ranking, rank_and_score_correct_answers
        print("SUCCESS: ranking_processor imports work")
    except Exception as e:
        print(f"ERROR: ranking_processor import failed: {e}")
        return False
    
    print("SUCCESS: All imports work correctly!")
    return True

def test_basic_functionality():
    """Test basic functionality of processors"""
    print("\nTesting basic functionality...")
    
    try:
        from similarity_processor import calculate_spell_similarity, merge_similar_answers
        from ranking_processor import rank_and_score_correct_answers
        
        # Test similarity calculation
        similarity = calculate_spell_similarity("hello", "helo")
        print(f"Similarity test: 'hello' vs 'helo' = {similarity:.2f}")
        
        # Test answer merging
        sample_answers = [
            {'answer': 'Hello', 'isCorrect': False, 'responseCount': 5, 'rank': 0, 'score': 0},
            {'answer': 'hello', 'isCorrect': True, 'responseCount': 3, 'rank': 0, 'score': 0}
        ]
        
        merged = merge_similar_answers(sample_answers)
        print(f"Merge test: {len(sample_answers)} answers -> {len(merged)} answers")
        
        # Test ranking
        ranking_answers = [
            {'answer': 'Answer 1', 'isCorrect': True, 'responseCount': 10, 'rank': 0, 'score': 0},
            {'answer': 'Answer 2', 'isCorrect': False, 'responseCount': 5, 'rank': 0, 'score': 0},
            {'answer': 'Answer 3', 'isCorrect': True, 'responseCount': 7, 'rank': 0, 'score': 0}
        ]
        
        ranked = rank_and_score_correct_answers(ranking_answers)
        ranked_count = len([a for a in ranked if a.get('rank', 0) > 0])
        print(f"Ranking test: {ranked_count} answers ranked")
        
        print("SUCCESS: Basic functionality tests passed!")
        return True
        
    except Exception as e:
        print(f"ERROR: Basic functionality test failed: {e}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("TESTING IMPORTS AND BASIC FUNCTIONALITY")
    print("=" * 60)
    
    # Test imports first
    if test_imports():
        # Test basic functionality
        test_basic_functionality()
    else:
        print("Cannot test functionality - imports failed")