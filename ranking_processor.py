#!/usr/bin/env python3
"""
Updated Ranking Processor - Input questions only, no automatic final processing
"""

import sys
import time
from typing import Dict
from config.settings import Config
from database.db_handler import DatabaseHandler
from services.ranking_service import RankingService
from utils.logger import setup_logger


class ProcessorDisplay:
    """Handles console output and display formatting"""
    
    @staticmethod
    def print_header():
        """Print application header"""
        print("🚀 Starting Survey Answer Ranking Processor")
        print("📝 Processing Input Questions Only (MCQ questions will be skipped)")
        print("=" * 70)
    
    @staticmethod
    def print_results(result: Dict, processing_time: float):
        """Print processing results in a formatted way"""
        print("\n" + "=" * 70)
        print("📊 RANKING PROCESS COMPLETED - INPUT QUESTIONS ONLY")
        print("=" * 70)
        print(f"⏱️  Processing Time: {processing_time}s")
        print(f"📝 Total Questions: {result['total_questions']}")
        print(f"✅ Input Questions Processed: {result['processed_count']}")
        print(f"⏭️  MCQ Questions Skipped: {result['skipped_mcq']}")
        print(f"❌ Input Questions Skipped (insufficient answers): {result['skipped_insufficient']}")
        print(f"💾 Updated in Database: {result['updated_count']}")
        print(f"❌ Failed Updates: {result['failed_count']}")
        print(f"🏆 Answers Ranked: {result['answers_ranked']}")
        print(f"🎯 Answers Scored: {result['answers_scored']}")
        
        ProcessorDisplay._print_warnings_and_success(result)
        
        print("=" * 70)
        print("🏁 Ranking process finished.")
        print("💡 Use the UI or separate command to POST to final endpoint.")
    
    @staticmethod
    def _print_warnings_and_success(result: Dict):
        """Print warnings and success messages based on results"""
        if result['failed_count'] > 0:
            print(f"\n⚠️  Warning: {result['failed_count']} questions failed to update")
        
        if result['skipped_mcq'] > 0:
            print(f"\nℹ️  Note: {result['skipped_mcq']} MCQ questions were skipped (Input questions only)")
        
        if result['skipped_insufficient'] > 0:
            print(f"\n⚠️  Warning: {result['skipped_insufficient']} Input questions skipped (need 3+ correct answers)")
        
        if result['updated_count'] > 0:
            print(f"\n🎉 Success! {result['updated_count']} Input questions updated with rankings")
        else:
            print(f"\nℹ️  No questions were updated (possibly no valid Input questions found)")
    
    @staticmethod
    def print_error(error_msg: str):
        """Print error message"""
        print(f"\n❌ Error: {error_msg}")
        print("🔧 Check your .env file and API configuration")


class ProcessorValidator:
    """Handles validation of processor prerequisites"""
    
    @staticmethod
    def validate_configuration(logger) -> bool:
        """Validate configuration and log results"""
        try:
            Config.validate()
            logger.info("✅ Configuration validated")
            logger.info(f"📡 API URL: {Config.get_full_api_url()}")
            return True
        except Exception as e:
            logger.error(f"❌ Configuration validation failed: {str(e)}")
            return False
    
    @staticmethod
    def test_api_connection(db_handler, logger) -> bool:
        """Test API connection and log results"""
        logger.info("🔍 Testing API connection...")
        if not db_handler.test_connection():
            logger.error("❌ API connection failed. Exiting.")
            return False
        
        logger.info("✅ API connection successful!")
        return True


class RankingProcessor:
    """Main processor class that orchestrates the ranking process"""
    
    def __init__(self):
        self.logger = setup_logger()
        self.db_handler = None
        self.ranking_service = None
    
    def initialize_services(self) -> bool:
        """Initialize database handler and ranking service"""
        try:
            self.logger.info("🔧 Initializing services...")
            self.db_handler = DatabaseHandler()
            self.ranking_service = RankingService(self.db_handler)
            return True
        except Exception as e:
            self.logger.error(f"❌ Service initialization failed: {str(e)}")
            return False
    
    def validate_prerequisites(self) -> bool:
        """Validate all prerequisites before processing"""
        if not ProcessorValidator.validate_configuration(self.logger):
            return False
        
        if not self.initialize_services():
            return False
        
        if not ProcessorValidator.test_api_connection(self.db_handler, self.logger):
            return False
        
        return True
    
    def execute_ranking_process(self) -> tuple:
        """Execute the main ranking process"""
        self.logger.info("⚙️ Starting ranking process for Input questions only...")
        start_time = time.time()
        
        try:
            result = self.ranking_service.process_all_questions()
            processing_time = round(time.time() - start_time, 2)
            return result, processing_time, True
        except Exception as e:
            processing_time = round(time.time() - start_time, 2)
            self.logger.error(f"❌ Fatal error in ranking processor: {str(e)}")
            return None, processing_time, False
    
    def run(self) -> bool:
        """Run the complete ranking process"""
        ProcessorDisplay.print_header()
        
        # Validate prerequisites
        if not self.validate_prerequisites():
            ProcessorDisplay.print_error("Prerequisites validation failed")
            return False
        
        # Execute ranking process
        result, processing_time, success = self.execute_ranking_process()
        
        if not success:
            ProcessorDisplay.print_error("Ranking process execution failed")
            return False
        
        # Display results
        ProcessorDisplay.print_results(result, processing_time)
        
        # Log completion
        if result['failed_count'] > 0:
            self.logger.warning("Some updates failed. Check logs for details.")
        
        if result['updated_count'] > 0:
            self.logger.info("✅ Ranking process completed successfully")
        else:
            self.logger.info("ℹ️ Ranking process completed with no updates")
        
        return True


def main() -> bool:
    """Main function, entry point for ranking processor"""
    processor = RankingProcessor()
    return processor.run()


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)