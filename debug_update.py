from mongodb_setup import MongoDBHandler
from similarity_processor import process_all_questions_similarity
from ranking_processor import process_all_questions_ranking
import json

def debug_similarity_processing():
    """Debug the similarity processing step by step"""
    print("DEBUGGING SIMILARITY PROCESSING")
    print("=" * 60)
    
    mongo_handler = MongoDBHandler()
    
    try:
        # Step 1: Connect
        if not mongo_handler.connect():
            print("ERROR: Connection failed")
            return False
        
        print("SUCCESS: Connected to MongoDB")
        
        # Step 2: Fetch one question for testing
        questions = list(mongo_handler.collection.find({}).limit(1))
        
        if not questions:
            print("ERROR: No questions found")
            return False
        
        original_question = questions[0]
        print(f"SUCCESS: Fetched test question: {original_question['_id']}")
        
        # Convert ObjectId to string for processing
        original_question['_id'] = str(original_question['_id'])
        
        # Handle datetime fields
        if 'createdAt' in original_question and original_question['createdAt']:
            original_question['createdAt'] = original_question['createdAt'].isoformat()
        if 'updatedAt' in original_question and original_question['updatedAt']:
            original_question['updatedAt'] = original_question['updatedAt'].isoformat()
        
        # Ensure answers have all required fields
        for answer in original_question.get('answers', []):
            if 'answerId' not in answer:
                answer['answerId'] = ""
            if 'answer' not in answer:
                answer['answer'] = ""
            if 'isCorrect' not in answer:
                answer['isCorrect'] = False
            if 'responseCount' not in answer:
                answer['responseCount'] = 0
            if 'rank' not in answer:
                answer['rank'] = 0
            if 'score' not in answer:
                answer['score'] = 0
        
        print(f"Original question answers: {len(original_question.get('answers', []))}")
        
        # Step 3: Process the question for similarity
        print("Processing question for similarity merging...")
        processed_questions = process_all_questions_similarity([original_question])
        processed_question = processed_questions[0]
        
        print(f"After similarity processing: {len(processed_question.get('answers', []))} answers")
        
        # Show the changes
        print("\n--- SIMILARITY PROCESSING CHANGES ---")
        original_answers = original_question.get('answers', [])
        processed_answers = processed_question.get('answers', [])
        
        print("Before similarity processing:")
        for i, answer in enumerate(original_answers):
            print(f"  {i+1}. '{answer.get('answer', '')}' (count: {answer.get('responseCount', 0)})")
        
        print("After similarity processing:")
        for i, answer in enumerate(processed_answers):
            print(f"  {i+1}. '{answer.get('answer', '')}' (count: {answer.get('responseCount', 0)})")
        
        # Step 4: Test update
        print("\n--- TESTING SIMILARITY UPDATE ---")
        question_id = processed_question['_id']
        updated_answers = processed_question['answers']
        
        print(f"Updating question ID: {question_id}")
        print(f"Number of answers to update: {len(updated_answers)}")
        
        # Test the update
        success = mongo_handler.update_question_answers(question_id, updated_answers)
        
        if success:
            print("SUCCESS: Similarity processing update successful!")
            return True
        else:
            print("ERROR: Similarity processing update failed")
            return False
            
    except Exception as e:
        print(f"ERROR: Similarity processing debug failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False
    
    finally:
        mongo_handler.close()

def debug_ranking_processing():
    """Debug the ranking processing step by step"""
    print("\nDEBUGGING RANKING PROCESSING")
    print("=" * 60)
    
    mongo_handler = MongoDBHandler()
    
    try:
        # Step 1: Connect
        if not mongo_handler.connect():
            print("ERROR: Connection failed")
            return False
        
        print("SUCCESS: Connected to MongoDB")
        
        # Step 2: Find a question with isCorrect flags set (admin approved)
        questions = list(mongo_handler.collection.find({
            "answers.isCorrect": {"$exists": True}
        }).limit(1))
        
        if not questions:
            print("ERROR: No questions with admin approval found")
            print("Tip: Run similarity processing first, then set isCorrect flags manually")
            return False
        
        original_question = questions[0]
        print(f"SUCCESS: Fetched admin-approved question: {original_question['_id']}")
        
        # Convert ObjectId to string for processing
        original_question['_id'] = str(original_question['_id'])
        
        # Handle datetime fields
        if 'createdAt' in original_question and original_question['createdAt']:
            original_question['createdAt'] = original_question['createdAt'].isoformat()
        if 'updatedAt' in original_question and original_question['updatedAt']:
            original_question['updatedAt'] = original_question['updatedAt'].isoformat()
        
        # Ensure answers have all required fields
        for answer in original_question.get('answers', []):
            if 'answerId' not in answer:
                answer['answerId'] = ""
            if 'answer' not in answer:
                answer['answer'] = ""
            if 'isCorrect' not in answer:
                answer['isCorrect'] = False
            if 'responseCount' not in answer:
                answer['responseCount'] = 0
            if 'rank' not in answer:
                answer['rank'] = 0
            if 'score' not in answer:
                answer['score'] = 0
        
        # Check admin approval status
        correct_answers = [a for a in original_question.get('answers', []) if a.get('isCorrect', False)]
        print(f"Question has {len(correct_answers)} admin-approved correct answers")
        
        if len(correct_answers) == 0:
            print("ERROR: No correct answers found - admin approval needed")
            return False
        
        # Step 3: Process the question for ranking
        print("Processing question for ranking and scoring...")
        processed_questions = process_all_questions_ranking([original_question])
        processed_question = processed_questions[0]
        
        # Show the changes
        print("\n--- RANKING PROCESSING CHANGES ---")
        original_answers = original_question.get('answers', [])
        processed_answers = processed_question.get('answers', [])
        
        print("Before ranking processing:")
        for i, answer in enumerate(original_answers):
            print(f"  {i+1}. '{answer.get('answer', '')}' (correct: {answer.get('isCorrect', False)}, count: {answer.get('responseCount', 0)}, rank: {answer.get('rank', 0)}, score: {answer.get('score', 0)})")
        
        print("After ranking processing:")
        for i, answer in enumerate(processed_answers):
            print(f"  {i+1}. '{answer.get('answer', '')}' (correct: {answer.get('isCorrect', False)}, count: {answer.get('responseCount', 0)}, rank: {answer.get('rank', 0)}, score: {answer.get('score', 0)})")
        
        # Step 4: Test update
        print("\n--- TESTING RANKING UPDATE ---")
        question_id = processed_question['_id']
        updated_answers = processed_question['answers']
        
        print(f"Updating question ID: {question_id}")
        print(f"Number of answers to update: {len(updated_answers)}")
        
        # Test the update
        success = mongo_handler.update_question_answers(question_id, updated_answers)
        
        if success:
            print("SUCCESS: Ranking processing update successful!")
            
            # Verify the update by fetching the question again
            from bson import ObjectId
            updated_question = mongo_handler.collection.find_one({"_id": ObjectId(question_id)})
            
            if updated_question:
                print(f"SUCCESS: Verification: Question has {len(updated_question.get('answers', []))} answers")
                
                # Check if ranks and scores were actually updated
                updated_answers_from_db = updated_question.get('answers', [])
                ranks_updated = any(answer.get('rank', 0) > 0 for answer in updated_answers_from_db)
                scores_updated = any(answer.get('score', 0) > 0 for answer in updated_answers_from_db)
                
                print(f"SUCCESS: Ranks updated: {ranks_updated}")
                print(f"SUCCESS: Scores updated: {scores_updated}")
                
                if ranks_updated and scores_updated:
                    print("SUCCESS: RANKING PROCESSING COMPLETELY SUCCESSFUL!")
                    return True
                else:
                    print("WARNING: Update saved but ranks/scores might not be correct")
                    return False
            else:
                print("ERROR: Could not verify update")
                return False
        else:
            print("ERROR: Ranking processing update failed")
            return False
            
    except Exception as e:
        print(f"ERROR: Ranking processing debug failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False
    
    finally:
        mongo_handler.close()

def debug_complete_workflow():
    """Debug the complete workflow: similarity → admin approval → ranking"""
    print("\nDEBUGGING COMPLETE WORKFLOW")
    print("=" * 60)
    
    print("Flask Workflow:")
    print("1. Participants submit answers")
    print("2. Run /api/process-similarity to merge similar answers")
    print("3. Admin sets isCorrect=True/False for answers")
    print("4. Run /api/process-ranking to rank and score approved answers")
    print("5. Analytics data ready!")
    
    print("\nTesting similarity processing...")
    similarity_success = debug_similarity_processing()
    
    if similarity_success:
        print("\nTesting ranking processing...")
        ranking_success = debug_ranking_processing()
        
        if ranking_success:
            print("\nSUCCESS: COMPLETE WORKFLOW TEST SUCCESSFUL!")
            print("Both similarity and ranking processing work correctly.")
        else:
            print("\nWARNING: Similarity works, but ranking needs admin approval first")
            print("Tip: Set isCorrect flags manually in database, then run ranking")
    else:
        print("\nERROR: Similarity processing failed - check your data")

if __name__ == "__main__":
    debug_complete_workflow()