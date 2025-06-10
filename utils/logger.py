import logging
import sys
from config.settings import Config

def setup_logger():
    """Setup console logging with configurable level and enhanced formatting"""
    
    # Create logger
    logger = logging.getLogger('survey_analytics')
    logger.setLevel(getattr(logging, Config.LOG_LEVEL.upper()))
    
    # Remove existing handlers to avoid duplicates
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, Config.LOG_LEVEL.upper()))
    
    # Create detailed formatter based on log level
    if Config.LOG_LEVEL.upper() == 'DEBUG':
        # More detailed format for debugging
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        # Standard format for info and above
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    console_handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(console_handler)
    
    # Log initial configuration
    logger.info("Logger initialized")
    logger.info(f"Log level: {Config.LOG_LEVEL}")
    logger.info(f"API Base URL: {Config.API_BASE_URL}")
    logger.info(f"API Endpoint: {Config.API_ENDPOINT}")
    
    if Config.LOG_LEVEL.upper() == 'DEBUG':
        logger.debug("Debug logging enabled - detailed request/response logs will be shown")
        logger.debug(f"API Key preview: {Config.API_KEY[:8]}...")
    
    return logger