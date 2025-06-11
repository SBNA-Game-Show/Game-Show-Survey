"""
Clean and Enhanced API communication handler
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
    """Handles all HTTP communication with the API - Clean and Enhanced"""
    
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
    
    def _is_likely_empty_database_404(self, response_text: str) -> bool:
        """Determine if 404 is likely due to empty database vs missing endpoint"""
        
        # If response is HTML (like your case), it's definitely a real 404
        if any(tag in response_text.lower() for tag in ["<html>", "<!doctype", "<body>", "<title>"]):
            logger.debug("404 response contains HTML - this is a real endpoint not found error")
            return False
        
        # If response contains typical web server error messages, it's a real 404
        web_server_indicators = [
            "not found",
            "error 404", 
            "page not found",
            "cannot get",
            "express"  # Express.js error pages
        ]
        
        response_lower = response_text.lower()
        if any(indicator in response_lower for indicator in web_server_indicators) and len(response_text) > 100:
            logger.debug("404 response contains web server error indicators - real endpoint error")
            return False
        
        # Common indicators that this is an empty database 404 (usually JSON responses)
        empty_db_indicators = [
            "no questions found",
            "no data found", 
            "empty collection",
            "no records",
            '"data": []',
            '"questions": []',
            '"count": 0'
        ]
        
        # Check for empty database indicators
        if any(indicator in response_lower for indicator in empty_db_indicators):
            logger.debug("404 response indicates empty database")
            return True
            
        # If response is very short and not HTML, might be empty database
        if len(response_text.strip()) < 50 and not any(tag in response_lower for tag in ["<", ">"]):
            logger.debug("404 response is very short and not HTML - might be empty database")
            return True
            
        # Default: if it's longer than 50 chars or contains HTML, it's probably a real 404
        logger.debug("404 response appears to be a real endpoint error")
        return False
    
    def _handle_404_as_empty_database(self) -> Dict:
        """Handle 404 as empty database and return appropriate response"""
        logger.info("📝 Treating 404 as empty database - returning empty result")
        
        # Return a response structure that indicates empty database
        return {
            "data": [],
            "success": True,
            "statusCode": 200,
            "message": "No questions found - database appears to be empty",
            "_empty_database": True  # Internal flag
        }
    
    def _analyze_response_for_issues(self, response_data: any) -> Dict[str, any]:
        """Analyze response for common issues that cause confusion"""
        analysis = {
            "has_issues": False,
            "issues": [],
            "suggestions": [],
            "data_summary": {}
        }
        
        try:
            # Check if response is a dict (expected format)
            if isinstance(response_data, dict):
                # Check for explicit success indicators
                if 'success' in response_data and not response_data['success']:
                    analysis["has_issues"] = True
                    analysis["issues"].append(f"API returned success=false: {response_data.get('message', 'No message')}")
                    analysis["suggestions"].append("Check API server logs for error details")
                
                # Check for data field
                if 'data' in response_data:
                    data = response_data['data']
                    if data is None:
                        analysis["has_issues"] = True
                        analysis["issues"].append("API returned data=null")
                        analysis["suggestions"].extend([
                            "Database appears to be empty",
                            "Check if data was recently cleared",
                            "Import questions into database"
                        ])
                    elif isinstance(data, list):
                        analysis["data_summary"]["type"] = "list"
                        analysis["data_summary"]["count"] = len(data)
                        if len(data) == 0:
                            analysis["has_issues"] = True
                            analysis["issues"].append("API returned empty data array")
                            analysis["suggestions"].extend([
                                "Database is empty - this is likely your issue",
                                "Add sample questions to database",
                                "Check if questions were recently deleted"
                            ])
                        else:
                            # Check data structure
                            structure_issues = self._check_data_structure(data)
                            if structure_issues["has_issues"]:
                                analysis["has_issues"] = True
                                analysis["issues"].extend(structure_issues["issues"])
                                analysis["suggestions"].extend(structure_issues["suggestions"])
                    else:
                        analysis["data_summary"]["type"] = str(type(data))
                        analysis["data_summary"]["preview"] = str(data)[:100]
                
                # Check for questions field (alternative format)
                elif 'questions' in response_data:
                    questions = response_data['questions']
                    if not questions or len(questions) == 0:
                        analysis["has_issues"] = True
                        analysis["issues"].append("API returned empty questions array")
                        analysis["suggestions"].extend([
                            "Database is empty",
                            "Import questions into database"
                        ])
                
            elif isinstance(response_data, list):
                analysis["data_summary"]["type"] = "list"
                analysis["data_summary"]["count"] = len(response_data)
                if len(response_data) == 0:
                    analysis["has_issues"] = True
                    analysis["issues"].append("API returned empty array")
                    analysis["suggestions"].append("Database appears to be empty")
            
            else:
                analysis["has_issues"] = True
                analysis["issues"].append(f"Unexpected response type: {type(response_data)}")
                analysis["suggestions"].append("Check API endpoint documentation")
        
        except Exception as e:
            analysis["has_issues"] = True
            analysis["issues"].append(f"Error analyzing response: {str(e)}")
        
        return analysis
    
    def _check_data_structure(self, data_list: list) -> Dict[str, any]:
        """Check if data has valid structure"""
        issues = []
        suggestions = []
        
        if not data_list:
            return {"has_issues": False, "issues": [], "suggestions": []}
        
        # Check first few items for structure
        sample_size = min(3, len(data_list))
        for i in range(sample_size):
            item = data_list[i]
            
            if not isinstance(item, dict):
                issues.append(f"Item {i}: Not a dictionary (got {type(item)})")
                continue
            
            # Check for required question fields
            if '_id' not in item and 'questionID' not in item:
                issues.append(f"Item {i}: Missing ID field (_id or questionID)")
            
            if 'question' not in item:
                issues.append(f"Item {i}: Missing 'question' field")
            
            # Check answers structure
            if 'answers' in item:
                answers = item['answers']
                if not isinstance(answers, list):
                    issues.append(f"Item {i}: 'answers' is not a list")
                elif len(answers) > 0:
                    # Check first answer structure
                    answer = answers[0]
                    if not isinstance(answer, dict):
                        issues.append(f"Item {i}, Answer 0: Not a dictionary")
                    else:
                        if 'answer' not in answer:
                            issues.append(f"Item {i}, Answer 0: Missing 'answer' field")
                        if 'isCorrect' not in answer:
                            issues.append(f"Item {i}, Answer 0: Missing 'isCorrect' field")
        
        if issues:
            suggestions.extend([
                "Data structure appears corrupted or invalid",
                "Check database schema and data integrity",
                "Consider clearing and reimporting data",
                "Verify data export/import process"
            ])
        
        return {
            "has_issues": len(issues) > 0,
            "issues": issues[:5],  # Limit to first 5 issues
            "suggestions": suggestions
        }
    
    def _handle_error_status(self, status_code: int, response_text: str) -> None:
        """Handle different HTTP error status codes with clean, concise messages"""
        
        if status_code == HTTPStatus.NOT_FOUND:
            # Check if this is likely an empty database vs actual endpoint not found
            if self._is_likely_empty_database_404(response_text):
                logger.info("📭 No data found - treating as empty database")
                return
            else:
                logger.error(f"❌ Endpoint not found: {self.endpoint}")
                logger.error("💡 Possible causes:")
                logger.error("   • Server not fully deployed")
                logger.error("   • Route not registered on server")
                logger.error("   • Server configuration issue")
                logger.error(f"💡 Test manually: curl -H 'x-api-key: {self.api_key[:8]}...' {self.url}")
                raise APIException(f"API endpoint not found: {self.endpoint}")
            
        elif status_code == HTTPStatus.UNAUTHORIZED:
            logger.error("❌ Unauthorized - check API key")
            raise APIException("Unauthorized - check API key")
            
        elif status_code == HTTPStatus.FORBIDDEN:
            logger.error("❌ Forbidden - insufficient permissions")
            raise APIException("Forbidden - insufficient permissions")
            
        elif status_code == HTTPStatus.BAD_REQUEST:
            logger.error("❌ Bad request - check data format")
            raise APIException(f"Bad request: {response_text[:100]}")
            
        elif status_code == HTTPStatus.INTERNAL_SERVER_ERROR:
            logger.error("❌ Server error - API service issue")
            raise APIException("Server error")
        else:
            logger.error(f"❌ HTTP {status_code} error")
            raise APIException(f"HTTP {status_code} error")
    
    def _log_request_details(self, method: str, data: Optional[Dict] = None) -> None:
        """Log request details for debugging - only in debug mode"""
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"→ {method} {self.url}")
            if data:
                logger.debug(f"→ Data: {list(data.keys()) if isinstance(data, dict) else 'Invalid'}")
    
    def _log_response_details(self, response: requests.Response) -> None:
        """Log response details for debugging - only in debug mode"""
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"← {response.status_code} ({len(response.text)} chars)")
    
    def _parse_json_response(self, response: requests.Response) -> Dict:
        """Parse JSON response with minimal logging"""
        try:
            response_data = response.json()
            
            # Only analyze response for issues if debug logging is enabled
            if logger.isEnabledFor(logging.DEBUG):
                analysis = self._analyze_response_for_issues(response_data)
                if analysis["has_issues"]:
                    logger.debug(f"⚠️ Response issues: {len(analysis['issues'])} found")
            
            return response_data
            
        except ValueError as e:
            logger.error(f"❌ Invalid JSON response")
            raise APIException(f"Invalid JSON response: {str(e)}")
    
    def _make_http_request(self, method: str, data: Optional[Dict] = None) -> requests.Response:
        """Make HTTP request with clean error handling"""
        try:
            if method.upper() == "GET":
                return requests.get(self.url, headers=self.headers, timeout=self.timeout)
            elif method.upper() == "PUT":
                return requests.put(self.url, headers=self.headers, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
        
        except requests.exceptions.Timeout:
            logger.error(f"❌ Request timeout after {self.timeout}s")
            raise APIException("Request timeout")
            
        except requests.exceptions.ConnectionError:
            logger.error(f"❌ Cannot connect to server: {self.base_url}")
            raise APIException(f"Cannot connect to server")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Request failed: {str(e)}")
            raise APIException(f"Request failed: {str(e)}")
    
    def make_request(self, method: str, data: Optional[Dict] = None) -> Dict:
        """Make HTTP request with clean, minimal logging"""
        self._log_request_details(method, data)
        
        try:
            response = self._make_http_request(method, data)
            self._log_response_details(response)
            
            # Special handling for 404 on GET requests (likely empty database)
            if response.status_code == HTTPStatus.NOT_FOUND and method.upper() == "GET":
                if self._is_likely_empty_database_404(response.text):
                    logger.info("📭 No data found - returning empty result")
                    return self._handle_404_as_empty_database()
                else:
                    # Real 404 error
                    self._handle_error_status(response.status_code, response.text)
            
            # Check for other error status codes
            elif response.status_code not in [HTTPStatus.OK, HTTPStatus.CREATED]:
                self._handle_error_status(response.status_code, response.text)
            
            return self._parse_json_response(response)
            
        except APIException:
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error: {str(e)}")
            raise APIException(f"Unexpected error: {str(e)}")
    
    def test_connection(self) -> bool:
        """Test API connection with clean logging"""
        try:
            logger.info(f"🔍 Testing connection to {self.base_url}")
            response_data = self.make_request("GET")
            logger.info("✅ Connection successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection failed: {str(e)}")
            
            # Only show detailed troubleshooting if it's a 404
            if "404" in str(e) or "not found" in str(e).lower():
                logger.error("💡 Server is running but endpoint not found")
                logger.error("💡 Check if server deployment is complete")
            
            return False
    
    def test_alternative_endpoint(self, alternative_endpoint: str) -> bool:
        """Test an alternative endpoint to help with troubleshooting"""
        original_endpoint = self.endpoint
        original_url = self.url
        
        try:
            # Temporarily change endpoint
            self.endpoint = alternative_endpoint
            self.url = f"{self.base_url}{self.endpoint}"
            
            logger.info(f"🧪 Testing alternative endpoint: {alternative_endpoint}")
            response_data = self.make_request("GET")
            
            logger.info(f"✅ Alternative endpoint works: {alternative_endpoint}")
            logger.info("💡 Update your .env file with this endpoint!")
            
            return True
            
        except Exception as e:
            logger.debug(f"❌ Alternative endpoint failed: {alternative_endpoint} - {str(e)}")
            return False
            
        finally:
            # Restore original endpoint
            self.endpoint = original_endpoint
            self.url = original_url