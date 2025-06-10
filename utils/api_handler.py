"""
Centralized API communication handler
"""

import json
import requests
import logging
from typing import Dict, Optional
from constants import HTTPStatus, Defaults, LogMessages, ErrorMessages

logger = logging.getLogger('survey_analytics')


class APIException(Exception):
    """Custom exception for API-related errors"""
    pass


class APIHandler:
    """Handles all HTTP communication with the API"""
    
    def __init__(self, base_url: str, api_key: str, endpoint: str):
        self.base_url = base_url
        self.api_key = api_key
        self.endpoint = endpoint
        self.headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        self.timeout = Defaults.TIMEOUT
        self.url = f"{self.base_url}{self.endpoint}"
    
    def _log_request_details(self, method: str, data: Optional[Dict] = None) -> None:
        """Log request details for debugging"""
        logger.debug(f"Making {method} request to {self.url}")
        logger.debug(f"Headers: {self.headers}")
        if data:
            logger.debug(f"Request data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            logger.debug(f"Full request data: {json.dumps(data, indent=2)}")
    
    def _log_response_details(self, response: requests.Response) -> None:
        """Log response details for debugging"""
        logger.debug(f"Response status: {response.status_code}")
        logger.debug(f"Response headers: {dict(response.headers)}")
    
    def _handle_error_status(self, status_code: int, response_text: str) -> None:
        """Handle different HTTP error status codes"""
        error_map = {
            HTTPStatus.NOT_FOUND: ErrorMessages.ENDPOINT_NOT_FOUND.format(endpoint=self.endpoint),
            HTTPStatus.UNAUTHORIZED: ErrorMessages.UNAUTHORIZED,
            HTTPStatus.FORBIDDEN: ErrorMessages.FORBIDDEN,
            HTTPStatus.BAD_REQUEST: self._handle_bad_request(response_text),
            HTTPStatus.INTERNAL_SERVER_ERROR: ErrorMessages.SERVER_ERROR
        }
        
        if status_code in error_map:
            logger.error(f"❌ {error_map[status_code]}")
            raise APIException(error_map[status_code])
        else:
            error_msg = f"API returned status {status_code}"
            logger.error(f"❌ Unexpected status code {status_code}")
            logger.error(f"❌ Response: {response_text[:500]}")
            raise APIException(error_msg)
    
    def _handle_bad_request(self, response_text: str) -> str:
        """Handle 400 Bad Request with detailed logging"""
        logger.error(f"❌ Bad Request (400)")
        logger.error(f"❌ Response body: {response_text[:500]}")
        return ErrorMessages.BAD_REQUEST.format(details=response_text[:200])
    
    def _parse_json_response(self, response: requests.Response) -> Dict:
        """Parse JSON response with error handling"""
        try:
            response_data = response.json()
            logger.debug(f"Response data type: {type(response_data)}")
            if isinstance(response_data, dict):
                logger.debug(f"Response keys: {list(response_data.keys())}")
            return response_data
        except ValueError as e:
            logger.error(f"❌ Invalid JSON response: {response.text[:500]}")
            raise APIException(ErrorMessages.INVALID_JSON.format(error=str(e)))
    
    def _make_http_request(self, method: str, data: Optional[Dict] = None) -> requests.Response:
        """Make the actual HTTP request with error handling"""
        try:
            if method.upper() == "GET":
                return requests.get(self.url, headers=self.headers, timeout=self.timeout)
            elif method.upper() == "PUT":
                return requests.put(self.url, headers=self.headers, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
        
        except requests.exceptions.Timeout:
            logger.error(f"❌ Request timeout after {self.timeout}s")
            raise APIException(ErrorMessages.TIMEOUT)
        except requests.exceptions.ConnectionError:
            logger.error(f"❌ Connection error - server may be down")
            raise APIException(ErrorMessages.CONNECTION_ERROR.format(url=self.base_url))
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Request error: {str(e)}")
            raise APIException(f"API request error: {str(e)}")
    
    def make_request(self, method: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request to the API endpoint with comprehensive error handling"""
        self._log_request_details(method, data)
        
        try:
            response = self._make_http_request(method, data)
            self._log_response_details(response)
            
            # Check for success status codes
            if response.status_code not in [HTTPStatus.OK, HTTPStatus.CREATED]:
                self._handle_error_status(response.status_code, response.text)
            
            return self._parse_json_response(response)
            
        except APIException:
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error: {str(e)}")
            raise APIException(f"Unexpected error: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test if API connection is healthy"""
        try:
            logger.info(LogMessages.CONNECTION_TEST_START)
            self.make_request("GET")
            logger.info(LogMessages.CONNECTION_TEST_SUCCESS)
            return True
        except Exception as e:
            logger.error(LogMessages.CONNECTION_TEST_FAILED.format(error=str(e)))
            return False