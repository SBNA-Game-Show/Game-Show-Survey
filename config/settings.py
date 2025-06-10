"""
Refactored Configuration Settings - Clean and centralized
"""

import os
from typing import List
from dotenv import load_dotenv
from constants import Defaults, ErrorMessages

load_dotenv()


class ConfigValidator:
    """Handles configuration validation"""
    
    @staticmethod
    def validate_required_vars(config_class) -> None:
        """Validate required configuration variables"""
        required_vars = ['API_BASE_URL', 'API_KEY', 'API_ENDPOINT']
        missing_vars = []
        
        for var in required_vars:
            if not getattr(config_class, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(ErrorMessages.MISSING_ENV_VARS.format(vars=', '.join(missing_vars)))
    
    @staticmethod
    def validate_numeric_configs(config_class) -> None:
        """Validate numeric configuration values"""
        if config_class.SIMILARITY_THRESHOLD < 0 or config_class.SIMILARITY_THRESHOLD > 1:
            raise ValueError("SIMILARITY_THRESHOLD must be between 0 and 1")
        
        if config_class.FLASK_PORT < 1 or config_class.FLASK_PORT > 65535:
            raise ValueError("FLASK_PORT must be between 1 and 65535")


class Config:
    """Centralized configuration management"""
    
    # API Configuration - All from environment variables
    API_BASE_URL = os.getenv('API_BASE_URL')
    API_KEY = os.getenv('API_KEY')
    API_ENDPOINT = os.getenv('API_ENDPOINT')
    
    # Processing Configuration
    SIMILARITY_THRESHOLD = float(os.getenv('SIMILARITY_THRESHOLD', str(Defaults.SIMILARITY_THRESHOLD)))
    SCORING_VALUES = Defaults.SCORING_VALUES  # Top 5 ranks get these scores
    
    # Application Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', Defaults.LOG_LEVEL)
    FLASK_PORT = int(os.getenv('FLASK_PORT', str(Defaults.FLASK_PORT)))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Import field constants for backward compatibility
    from constants import QuestionFields, AnswerFields
    
    @classmethod
    def validate(cls) -> None:
        """Validate all configuration settings"""
        ConfigValidator.validate_required_vars(cls)
        ConfigValidator.validate_numeric_configs(cls)
    
    @classmethod
    def get_full_api_url(cls) -> str:
        """Get the complete API URL"""
        return f"{cls.API_BASE_URL}{cls.API_ENDPOINT}"
    
    @classmethod
    def get_api_headers(cls) -> dict:
        """Get standard API headers"""
        return {
            "x-api-key": cls.API_KEY,
            "Content-Type": "application/json"
        }
    
    @classmethod
    def get_timeout(cls) -> int:
        """Get API timeout value"""
        return Defaults.TIMEOUT
    
    @classmethod
    def is_debug_mode(cls) -> bool:
        """Check if debug mode is enabled"""
        return cls.FLASK_DEBUG
    
    @classmethod
    def get_scoring_values(cls) -> List[int]:
        """Get scoring values for ranking"""
        return cls.SCORING_VALUES.copy()  # Return copy to prevent modification