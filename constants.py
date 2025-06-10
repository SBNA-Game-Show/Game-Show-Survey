"""
Centralized constants for the Survey Ranking System
"""

# HTTP Status Codes
class HTTPStatus:
    OK = 200
    CREATED = 201
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_SERVER_ERROR = 500

# API Response Keys
class APIKeys:
    DATA = 'data'
    SUCCESS = 'success'
    STATUS_CODE = 'statusCode'
    MESSAGE = 'message'
    QUESTIONS = 'questions'

# Question Field Names
class QuestionFields:
    ID = '_id'
    QUESTION_ID = 'questionID'
    QUESTION = 'question'
    QUESTION_TYPE = 'questionType'
    QUESTION_CATEGORY = 'questionCategory'
    QUESTION_LEVEL = 'questionLevel'
    TIMES_SKIPPED = 'timesSkipped'
    TIMES_ANSWERED = 'timesAnswered'
    ANSWERS = 'answers'

# Answer Field Names
class AnswerFields:
    ID = '_id'
    ANSWER_ID = 'answerID'
    ANSWER = 'answer'
    IS_CORRECT = 'isCorrect'
    RESPONSE_COUNT = 'responseCount'
    RANK = 'rank'
    SCORE = 'score'

# Default Values
class Defaults:
    TIMEOUT = 30
    SIMILARITY_THRESHOLD = 0.75
    SCORING_VALUES = [100, 80, 60, 40, 20]
    FLASK_PORT = 5000
    LOG_LEVEL = 'INFO'
    
    # Answer defaults
    ANSWER_TEXT = ''
    IS_CORRECT = False
    RESPONSE_COUNT = 0
    RANK = 0
    SCORE = 0

# Log Messages
class LogMessages:
    # Connection
    CONNECTION_TEST_START = "Testing API connection..."
    CONNECTION_TEST_SUCCESS = "✅ API connection test successful"
    CONNECTION_TEST_FAILED = "❌ API connection test failed: {error}"
    
    # Questions
    FETCHING_QUESTIONS = "Fetching all questions from API"
    QUESTIONS_FETCHED = "Fetched {count} questions from API"
    QUESTIONS_FETCH_FAILED = "Failed to fetch questions from API: {error}"
    
    # Processing
    PROCESSING_START = "Starting ranking process for all questions"
    PROCESSING_COMPLETE = "Ranking process completed successfully"
    PROCESSING_FAILED = "Ranking processing failed: {error}"
    
    # Updates
    UPDATE_SUCCESS = "✅ Successfully updated question {id}"
    UPDATE_FAILED = "❌ Failed to update question {id}: {error}"
    BULK_UPDATE_START = "Bulk updating {count} questions via API"
    BULK_UPDATE_SUCCESS = "✅ Bulk update successful: {count} questions updated"
    BULK_UPDATE_FAILED = "❌ Bulk update failed: {error}"

# Error Messages
class ErrorMessages:
    MISSING_ENV_VARS = "Missing required environment variables: {vars}"
    ENDPOINT_NOT_FOUND = "API endpoint not found (404): {endpoint}"
    UNAUTHORIZED = "Unauthorized (401): Check API key"
    FORBIDDEN = "Forbidden (403): Insufficient permissions"
    BAD_REQUEST = "Bad Request (400): {details}"
    SERVER_ERROR = "Server error (500): API service error"
    TIMEOUT = "API request timeout"
    CONNECTION_ERROR = "API connection error: Cannot reach {url}"
    INVALID_JSON = "Invalid JSON response: {error}"
    VALIDATION_FAILED = "Validation failed for question {id}"
    NO_CORRECT_ANSWERS = "No correct answers marked"
    QUESTION_NOT_FOUND = "Question {id} not found"