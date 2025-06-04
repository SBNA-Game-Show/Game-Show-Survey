from mongodb_setup import MongoDBHandler
from analytics import process_all_questions
import json

def debug_update_process():
    """Debug the update process step by step"""
    print("DEBUGGING UPDATE PROCESS")
    print("=" * 60)
    
    mongo_handler = MongoDBHandler()
    
    try:
        # Step 1: Connect
        if not mongo_handler.connect():
            print("❌ Connection failed")
            return False
        
        print("✓ Connected to MongoDB")
        
        # Step 2: Fetch one question for testing
        questions = list(mongo_handler.collection.find({}).limit(1))
        
        if not questions:
            print("❌ No questions found")
            return False
        
        original_question = questions[0]
        print(f"✓ Fetched test question: {original_question['_id']}")
        
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
        
        # Step 3: Process the question
        print("Processing question...")
        processed_questions = process_all_questions([original_question])
        processed_question = processed_questions[0]
        
        print(f"Processed question answers: {len(processed_question.get('answers', []))}")
        
        # Show the changes
        print("\n--- SHOWING CHANGES ---")
        original_answers = original_question.get('answers', [])
        processed_answers = processed_question.get('answers', [])
        
        print("Before processing:")
        for i, answer in enumerate(original_answers[:3]):
            print(f"  {i+1}. '{answer.get('answer', '')}' (rank: {answer.get('rank', 0)}, score: {answer.get('score', 0)})")
        
        print("After processing:")
        for i, answer in enumerate(processed_answers[:3]):
            print(f"  {i+1}. '{answer.get('answer', '')}' (rank: {answer.get('rank', 0)}, score: {answer.get('score', 0)})")
        
        # Step 4: Test update
        print("\n--- TESTING UPDATE ---")
        question_id = processed_question['_id']
        updated_answers = processed_question['answers']
        
        print(f"Updating question ID: {question_id}")
        print(f"Number of answers to update: {len(updated_answers)}")
        
        # Test the update
        success = mongo_handler.update_question_answers(question_id, updated_answers)
        
        if success:
            print("✓ Update successful!")
            
            # Verify the update by fetching the question again
            from bson import ObjectId
            updated_question = mongo_handler.collection.find_one({"_id": ObjectId(question_id)})
            
            if updated_question:
                print(f"✓ Verification: Question has {len(updated_question.get('answers', []))} answers")
                
                # Check if ranks and scores were actually updated
                updated_answers_from_db = updated_question.get('answers', [])
                ranks_updated = any(answer.get('rank', 0) > 0 for answer in updated_answers_from_db)
                scores_updated = any(answer.get('score', 0) > 0 for answer in updated_answers_from_db)
                
                print(f"✓ Ranks updated: {ranks_updated}")
                print(f"✓ Scores updated: {scores_updated}")
                
                if ranks_updated and scores_updated:
                    print("🎉 UPDATE COMPLETELY SUCCESSFUL!")
                    return True
                else:
                    print("⚠️ Update saved but ranks/scores might not be correct")
                    return False
            else:
                print("❌ Could not verify update")
                return False
        else:
            print("❌ Update failed")
            return False
            
    except Exception as e:
        print(f"❌ Debug process failed: {str(e)}")
        import traceback
        print(f"Full error: {traceback.format_exc()}")
        return False
    
    finally:
        mongo_handler.close()

if __name__ == "__main__":
    debug_update_process()