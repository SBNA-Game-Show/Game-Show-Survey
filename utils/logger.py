"""
Refactored Logger - Clean and consistent logging setup
"""

import logging
import sys
from typing import Optional
from config.settings import Config


class LoggerFormatter:
    """Handles log formatting based on configuration"""
    
    @staticmethod
    def get_formatter(log_level: str) -> logging.Formatter:
        """Get appropriate formatter based on log level"""
        if log_level.upper() == 'DEBUG':
            return LoggerFormatter._get_debug_formatter()
        else:
            return LoggerFormatter._get_standard_formatter()
    
    @staticmethod
    def _get_debug_formatter() -> logging.Formatter:
        """Get detailed formatter for debugging"""
        return logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    @staticmethod
    def _get_standard_formatter() -> logging.Formatter:
        """Get standard formatter for info and above"""
        return logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )


class LoggerConfig:
    """Handles logger configuration"""
    
    @staticmethod
    def configure_logger(logger: logging.Logger, log_level: str) -> None:
        """Configure logger with appropriate level and handler"""
        # Set logger level
        logger.setLevel(getattr(logging, log_level.upper()))
        
        # Remove existing handlers to avoid duplicates
        LoggerConfig._remove_existing_handlers(logger)
        
        # Add new console handler
        console_handler = LoggerConfig._create_console_handler(log_level)
        logger.addHandler(console_handler)
    
    @staticmethod
    def _remove_existing_handlers(logger: logging.Logger) -> None:
        """Remove existing handlers to avoid duplicates"""
        for handler in logger.handlers[:]:
            logger.removeHandler(handler)
    
    @staticmethod
    def _create_console_handler(log_level: str) -> logging.StreamHandler:
        """Create and configure console handler"""
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, log_level.upper()))
        
        formatter = LoggerFormatter.get_formatter(log_level)
        console_handler.setFormatter(formatter)
        
        return console_handler


class LoggerInitializer:
    """Handles initial logger setup and configuration logging"""
    
    @staticmethod
    def log_initialization_info(logger: logging.Logger) -> None:
        """Log initial configuration information"""
        logger.info("Logger initialized")
        logger.info(f"Log level: {Config.LOG_LEVEL}")
        logger.info(f"API Base URL: {Config.API_BASE_URL}")
        logger.info(f"API Endpoint: {Config.API_ENDPOINT}")
        
        if Config.LOG_LEVEL.upper() == 'DEBUG':
            LoggerInitializer._log_debug_info(logger)
    
    @staticmethod
    def _log_debug_info(logger: logging.Logger) -> None:
        """Log debug-specific information"""
        logger.debug("Debug logging enabled - detailed request/response logs will be shown")
        logger.debug(f"API Key preview: {Config.API_KEY[:8]}...")
        logger.debug(f"Similarity threshold: {Config.SIMILARITY_THRESHOLD}")
        logger.debug(f"Scoring values: {Config.SCORING_VALUES}")


def setup_logger(logger_name: Optional[str] = None) -> logging.Logger:
    """
    Setup console logging with configurable level and enhanced formatting
    
    Args:
        logger_name: Optional custom logger name. Defaults to 'survey_analytics'
    
    Returns:
        Configured logger instance
    """
    # Create logger
    name = logger_name or 'survey_analytics'
    logger = logging.getLogger(name)
    
    # Configure logger
    LoggerConfig.configure_logger(logger, Config.LOG_LEVEL)
    
    # Log initialization info (only for main logger)
    if name == 'survey_analytics':
        LoggerInitializer.log_initialization_info(logger)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name using the same configuration
    
    Args:
        name: Logger name
    
    Returns:
        Configured logger instance
    """
    return setup_logger(name)