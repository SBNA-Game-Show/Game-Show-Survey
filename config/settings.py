import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Configuration - All from environment variables
    API_BASE_URL = os.getenv('API_BASE_URL')
    API_KEY = os.getenv('API_KEY')
    API_ENDPOINT = os.getenv('API_ENDPOINT')
    
    # Processing Configuration
    SIMILARITY_THRESHOLD = float(os.getenv('SIMILARITY_THRESHOLD', '0.75'))
    SCORING_VALUES = [100, 80, 60, 40, 20]  # Top 5 ranks get these scores
    
    # Application Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    FLASK_PORT = int(os.getenv('FLASK_PORT', '5000'))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        required_vars = ['API_BASE_URL', 'API_KEY', 'API_ENDPOINT']
        missing_vars = []
        
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    @classmethod
    def get_full_api_url(cls):
        """Get the complete API URL"""
        return f"{cls.API_BASE_URL}{cls.API_ENDPOINT}"