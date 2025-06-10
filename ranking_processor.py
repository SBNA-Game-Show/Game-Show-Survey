#!/usr/bin/env python3
"""
One-time ranking processor
Fetches data, ranks answers, updates database, then stops
"""

import logging
import sys
import time
from config.settings import Config
from database.db_handler import DatabaseHandler
from services.ranking_service import RankingService
from utils.logger import setup_logger

def main():
    """Main ranking processor function"""
    
    print("🚀 Starting Survey Answer Ranking Processor")
    print("=" * 60)
    
    try:
        # Setup logging
        logger = setup_logger()
        
        # Validate configuration
        Config.validate()
        logger.info(f"✅ Configuration validated")
        logger.info(f"📡 API URL: {Config.get_full_api_url()}")
        
        # Initialize services
        logger.info("🔧 Initializing services...")
        db_handler = DatabaseHandler()
        ranking_service = RankingService(db_handler)
        
        # Test API connection
        logger.info("🔍 Testing API connection...")
        if not db_handler.test_connection():
            logger.error("❌ API connection failed. Exiting.")
            return False
        
        logger.info("✅ API connection successful!")
        
        # Process ranking
        logger.info("⚙️ Starting ranking process...")
        start_time = time.time()
        
        result = ranking_service.process_all_questions()
        
        processing_time = round(time.time() - start_time, 2)
        
        # Display results
        print("\n" + "=" * 60)
        print("📊 RANKING PROCESS COMPLETED")
        print("=" * 60)
        print(f"⏱️  Processing Time: {processing_time}s")
        print(f"📝 Total Questions: {result['total_questions']}")
        print(f"✅ Processed: {result['processed_count']}")
        print(f"⏭️  Skipped: {result['skipped_count']}")
        print(f"💾 Updated in Database: {result['updated_count']}")
        print(f"❌ Failed Updates: {result['failed_count']}")
        print(f"🏆 Answers Ranked: {result['answers_ranked']}")
        print(f"🎯 Answers Scored: {result['answers_scored']}")
        
        if result['failed_count'] > 0:
            print(f"\n⚠️  Warning: {result['failed_count']} questions failed to update")
            logger.warning(f"Some updates failed. Check logs for details.")
        
        if result['updated_count'] > 0:
            print(f"\n🎉 Success! {result['updated_count']} questions updated with rankings")
            logger.info("✅ Ranking process completed successfully")
        else:
            print(f"\n ℹ️ No questions were updated (possibly no correct answers found)")
            logger.info("ℹ️ Ranking process completed with no updates")
        
        print("=" * 60)
        print("🏁 Process finished. Application will now exit.")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Fatal error in ranking processor: {str(e)}")
        print(f"\n❌ Error: {str(e)}")
        print("🔧 Check your .env file and API configuration")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)