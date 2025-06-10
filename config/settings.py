import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database Configuration
    MONGO_CONNECTION_STRING = os.getenv('MONGO_CONNECTION_STRING')
    DB_NAME = os.getenv('DB_NAME', 'database_Test_Ninja2')
    COLLECTION_NAME = os.getenv('COLLECTION_NAME', 'questions')
    
    # Processing Configuration
    SIMILARITY_THRESHOLD = float(os.getenv('SIMILARITY_THRESHOLD', '0.75'))
    SCORING_VALUES = [100, 80, 60, 40, 20]  # Top 5 ranks get these scores
    
    # Application Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.MONGO_CONNECTION_STRING:
            raise ValueError("MONGO_CONNECTION_STRING is required")
        if not cls.DB_NAME:
            raise ValueError("DB_NAME is required")
        if not cls.COLLECTION_NAME:
            raise ValueError("COLLECTION_NAME is required")