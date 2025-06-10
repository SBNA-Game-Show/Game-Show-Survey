"""
Refactored Flask Application - Clean and modular
"""

import time
import traceback
from flask import Flask, render_template_string, jsonify, request
from config.settings import Config
from database.db_handler import DatabaseHandler
from services.ranking_service import RankingService
from utils.logger import setup_logger
from constants import LogMessages

# Initialize Flask app
app = Flask(__name__)

# Setup logging
logger = setup_logger()


class AppInitializer:
    """Handles application initialization"""
    
    @staticmethod
    def initialize() -> tuple:
        """Initialize and validate application components"""
        try:
            # Validate configuration
            Config.validate()
            logger.info("✅ Configuration validated for debug UI")
            
            # Initialize services
            db_handler = DatabaseHandler()
            ranking_service = RankingService(db_handler)
            
            return db_handler, ranking_service
            
        except Exception as e:
            logger.error(f"❌ Configuration error: {e}")
            raise


class APIEndpoints:
    """Handles API endpoint logic"""
    
    def __init__(self, db_handler: DatabaseHandler, ranking_service: RankingService):
        self.db_handler = db_handler
        self.ranking_service = ranking_service
    
    def health_check(self) -> dict:
        """Health check endpoint logic"""
        try:
            is_healthy = self.db_handler.test_connection()
            return {
                "status": "success" if is_healthy else "error",
                "api_url": Config.get_full_api_url(),
                "timestamp": time.time()
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def test_connection(self) -> dict:
        """Test API connection logic"""
        try:
            start_time = time.time()
            is_healthy = self.db_handler.test_connection()
            test_time = round(time.time() - start_time, 2)
            
            return {
                "status": "success" if is_healthy else "error",
                "results": {
                    "connection": "healthy" if is_healthy else "failed",
                    "test_time": f"{test_time}s",
                    "api_url": Config.get_full_api_url()
                }
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def get_questions(self) -> dict:
        """Fetch questions logic"""
        try:
            start_time = time.time()
            questions = self.db_handler.fetch_all_questions()
            fetch_time = round(time.time() - start_time, 2)
            
            # Analyze questions
            questions_with_answers = sum(1 for q in questions if q.get('answers'))
            admin_approved = sum(1 for q in questions 
                               if any(a.get('isCorrect') is not None for a in q.get('answers', [])))
            
            return {
                "status": "success",
                "results": {
                    "total_questions": len(questions),
                    "questions_with_answers": questions_with_answers,
                    "admin_approved": admin_approved,
                    "processing_time": f"{fetch_time}s"
                }
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def process_ranking(self) -> dict:
        """Process ranking logic"""
        try:
            start_time = time.time()
            result = self.ranking_service.process_all_questions()
            processing_time = round(time.time() - start_time, 2)
            
            return {
                "status": "success",
                "results": {
                    "total_questions": result["total_questions"],
                    "processed_count": result["processed_count"],
                    "skipped_count": result["skipped_count"],
                    "updated_count": result["updated_count"],
                    "failed_count": result["failed_count"],
                    "answers_ranked": result["answers_ranked"],
                    "answers_scored": result["answers_scored"],
                    "processing_time": f"{processing_time}s"
                }
            }
        except Exception as e:
            logger.error(f"Ranking process failed: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"status": "error", "error": str(e)}


class TemplateProvider:
    """Provides HTML templates for the debug UI"""
    
    @staticmethod
    def get_debug_ui_template() -> str:
        """Get the main debug UI template"""
        return '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey Ranking Debug UI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .content { padding: 30px; }
        .section { 
            background: #f8f9fa; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px;
            border-left: 4px solid #4facfe;
        }
        .section h2 { color: #333; margin-bottom: 15px; }
        .btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 16px;
            margin: 5px;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn:disabled { 
            background: #ccc; 
            cursor: not-allowed; 
            transform: none;
        }
        .status { 
            padding: 15px; 
            border-radius: 6px; 
            margin: 10px 0; 
            font-weight: bold;
        }
        .status.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .status.info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .status.warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .config-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 15px; 
            margin: 20px 0;
        }
        .config-item { 
            background: white; 
            padding: 15px; 
            border-radius: 6px; 
            border: 1px solid #ddd;
        }
        .config-item strong { color: #667eea; }
        .logs { 
            background: #1e1e1e; 
            color: #f8f8f2; 
            padding: 20px; 
            border-radius: 6px; 
            font-family: 'Courier New', monospace; 
            max-height: 400px; 
            overflow-y: auto;
            white-space: pre-wrap;
        }
        .progress { 
            background: #e9ecef; 
            border-radius: 10px; 
            height: 20px; 
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-bar { 
            background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
            height: 100%; 
            width: 0%; 
            transition: width 0.3s;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #ddd;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 Survey Ranking Debug UI</h1>
            <p>Monitor and debug the ranking process</p>
        </div>
        
        <div class="content">
            <!-- Configuration Section -->
            <div class="section">
                <h2>🔧 Configuration</h2>
                <div class="config-grid">
                    <div class="config-item">
                        <strong>API Base URL:</strong><br>
                        <span id="api-url">{{ config.API_BASE_URL }}</span>
                    </div>
                    <div class="config-item">
                        <strong>API Endpoint:</strong><br>
                        <span>{{ config.API_ENDPOINT }}</span>
                    </div>
                    <div class="config-item">
                        <strong>API Key:</strong><br>
                        <span>{{ config.API_KEY[:8] }}...</span>
                    </div>
                    <div class="config-item">
                        <strong>Log Level:</strong><br>
                        <span>{{ config.LOG_LEVEL }}</span>
                    </div>
                </div>
            </div>

            <!-- Actions Section -->
            <div class="section">
                <h2>🎮 Actions</h2>
                <button class="btn" onclick="testConnection()">🔍 Test API Connection</button>
                <button class="btn" onclick="fetchQuestions()">📥 Fetch Questions</button>
                <button class="btn" onclick="processRanking()">🏆 Process Ranking</button>
                <button class="btn" onclick="runFullProcess()">🚀 Run Full Process</button>
                <button class="btn" onclick="clearLogs()">🗑️ Clear Logs</button>
            </div>

            <!-- Status Section -->
            <div class="section">
                <h2>📊 Status</h2>
                <div id="status-container">
                    <div class="status info">Ready to start</div>
                </div>
                <div class="progress">
                    <div class="progress-bar" id="progress-bar"></div>
                </div>
            </div>

            <!-- Statistics Section -->
            <div class="section">
                <h2>📈 Statistics</h2>
                <div class="stats-grid" id="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number" id="total-questions">-</div>
                        <div class="stat-label">Total Questions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="processed-questions">-</div>
                        <div class="stat-label">Processed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="ranked-answers">-</div>
                        <div class="stat-label">Answers Ranked</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="processing-time">-</div>
                        <div class="stat-label">Processing Time</div>
                    </div>
                </div>
            </div>

            <!-- Logs Section -->
            <div class="section">
                <h2>📝 Logs</h2>
                <div class="logs" id="logs">
[INFO] Debug UI initialized
[INFO] Waiting for user action...
                </div>
            </div>
        </div>
    </div>

    <script>
        function addLog(message, level = 'INFO') {
            const logs = document.getElementById('logs');
            const timestamp = new Date().toLocaleTimeString();
            logs.textContent += `\\n[${timestamp}] [${level}] ${message}`;
            logs.scrollTop = logs.scrollHeight;
        }

        function updateStatus(message, type = 'info') {
            const container = document.getElementById('status-container');
            container.innerHTML = `<div class="status ${type}">${message}</div>`;
        }

        function updateProgress(percent) {
            document.getElementById('progress-bar').style.width = percent + '%';
        }

        function updateStats(stats) {
            if (stats.total_questions !== undefined) {
                document.getElementById('total-questions').textContent = stats.total_questions;
            }
            if (stats.processed_count !== undefined) {
                document.getElementById('processed-questions').textContent = stats.processed_count;
            }
            if (stats.answers_ranked !== undefined) {
                document.getElementById('ranked-answers').textContent = stats.answers_ranked;
            }
            if (stats.processing_time !== undefined) {
                document.getElementById('processing-time').textContent = stats.processing_time;
            }
        }

        async function makeRequest(endpoint, method = 'GET') {
            try {
                updateStatus('Processing...', 'info');
                updateProgress(25);
                
                const response = await fetch(endpoint, { method });
                updateProgress(75);
                
                const data = await response.json();
                updateProgress(100);
                
                if (data.status === 'success') {
                    updateStatus('✅ Success!', 'success');
                    if (data.results) {
                        updateStats(data.results);
                    }
                } else {
                    updateStatus(`❌ Error: ${data.error}`, 'error');
                }
                
                addLog(`${method} ${endpoint}: ${data.status}`);
                return data;
            } catch (error) {
                updateStatus(`❌ Network Error: ${error.message}`, 'error');
                addLog(`Error: ${error.message}`, 'ERROR');
                updateProgress(0);
                throw error;
            }
        }

        async function testConnection() {
            addLog('Testing API connection...');
            await makeRequest('/api/test-connection');
        }

        async function fetchQuestions() {
            addLog('Fetching questions from API...');
            await makeRequest('/api/get-questions');
        }

        async function processRanking() {
            addLog('Processing ranking...');
            await makeRequest('/api/process-ranking', 'POST');
        }

        async function runFullProcess() {
            addLog('Starting full ranking process...');
            updateStatus('🚀 Running full process...', 'info');
            
            try {
                await testConnection();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await fetchQuestions();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await processRanking();
                
                updateStatus('🎉 Full process completed!', 'success');
                addLog('Full process completed successfully!');
            } catch (error) {
                updateStatus('❌ Full process failed', 'error');
                addLog('Full process failed', 'ERROR');
            }
        }

        function clearLogs() {
            document.getElementById('logs').textContent = '[INFO] Logs cleared\\n[INFO] Ready for new operations...';
            updateProgress(0);
            updateStatus('Ready to start', 'info');
        }

        // Auto-refresh connection status every 30 seconds
        setInterval(async () => {
            try {
                await fetch('/api/health');
                addLog('Health check: OK');
            } catch (error) {
                addLog('Health check: Failed', 'WARNING');
            }
        }, 30000);
    </script>
</body>
</html>
'''


# Initialize application components
db_handler, ranking_service = AppInitializer.initialize()
api_endpoints = APIEndpoints(db_handler, ranking_service)

# Route handlers
@app.route('/')
def debug_ui():
    """Debug UI homepage"""
    return render_template_string(TemplateProvider.get_debug_ui_template(), config=Config)

@app.route('/api/health')
def health():
    """Health check endpoint"""
    result = api_endpoints.health_check()
    status_code = 500 if result["status"] == "error" else 200
    return jsonify(result), status_code

@app.route('/api/test-connection')
def test_connection():
    """Test API connection"""
    result = api_endpoints.test_connection()
    status_code = 500 if result["status"] == "error" else 200
    return jsonify(result), status_code

@app.route('/api/get-questions')
def get_questions():
    """Fetch questions from API"""
    result = api_endpoints.get_questions()
    status_code = 500 if result["status"] == "error" else 200
    return jsonify(result), status_code

@app.route('/api/process-ranking', methods=['POST'])
def process_ranking():
    """Process ranking for all questions"""
    result = api_endpoints.process_ranking()
    status_code = 500 if result["status"] == "error" else 200
    return jsonify(result), status_code

@app.route('/api/logs')
def get_logs():
    """Get recent logs (simulated)"""
    return jsonify({
        "status": "success",
        "logs": [
            {"timestamp": time.time(), "level": "INFO", "message": "Service started"},
            {"timestamp": time.time(), "level": "INFO", "message": "Configuration validated"},
        ]
    })

if __name__ == '__main__':
    logger.info("🌐 Starting Debug UI Server")
    logger.info(f"🔗 Access UI at: http://localhost:{Config.FLASK_PORT}")
    
    app.run(
        host='0.0.0.0', 
        port=Config.FLASK_PORT, 
        debug=Config.FLASK_DEBUG
    )