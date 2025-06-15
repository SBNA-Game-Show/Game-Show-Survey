"""
Updated Flask Application - Two separate buttons for ranking and final POST
"""

import time
import traceback
from flask import Flask, render_template_string, jsonify, request
from config.settings import Config
from database.db_handler import DatabaseHandler
from services.ranking_service import RankingService
from services.final_service import FinalService
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
            final_service = FinalService(db_handler)
            
            return db_handler, ranking_service, final_service
            
        except Exception as e:
            logger.error(f"❌ Configuration error: {e}")
            raise


class APIEndpoints:
    """Handles API endpoint logic"""
    
    def __init__(self, db_handler: DatabaseHandler, ranking_service: RankingService, final_service: FinalService):
        self.db_handler = db_handler
        self.ranking_service = ranking_service
        self.final_service = final_service
    
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
            input_questions = sum(1 for q in questions if q.get('questionType', '').lower() == 'input')
            mcq_questions = sum(1 for q in questions if q.get('questionType', '').lower() == 'mcq')
            
            return {
                "status": "success",
                "results": {
                    "total_questions": len(questions),
                    "questions_with_answers": questions_with_answers,
                    "input_questions": input_questions,
                    "mcq_questions": mcq_questions,
                    "processing_time": f"{fetch_time}s"
                }
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def process_ranking(self) -> dict:
        """Process ranking logic - Input questions only"""
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
                    "skipped_mcq": result["skipped_mcq"],
                    "skipped_insufficient": result["skipped_insufficient"],
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
    
    def post_final_answers(self) -> dict:
        """POST final answers logic - Input questions with correct answers only"""
        try:
            start_time = time.time()
            
            # Fetch current questions from main endpoint
            questions = self.db_handler.fetch_all_questions()
            
            if not questions:
                return {
                    "status": "success",
                    "results": {
                        "questions_posted": 0,
                        "questions_failed": 0,
                        "skipped_mcq": 0,
                        "skipped_insufficient": 0,
                        "total_processed": 0,
                        "processing_time": "0.0s",
                        "message": "No questions found in main endpoint"
                    }
                }
            
            # Process POST to final endpoint
            result = self.final_service.post_to_final_endpoint(questions)
            processing_time = round(time.time() - start_time, 2)
            
            return {
                "status": "success" if result["post_success"] else "error",
                "results": {
                    "questions_posted": result["questions_posted"],
                    "questions_failed": result["questions_failed"],
                    "skipped_mcq": result["skipped_mcq"],
                    "skipped_insufficient": result["skipped_insufficient"],
                    "total_processed": result["total_processed"],
                    "processing_time": f"{processing_time}s",
                    "message": "Success" if result["post_success"] else "Failed"
                }
            }
        except Exception as e:
            logger.error(f"Final POST process failed: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"status": "error", "error": str(e)}


class TemplateProvider:
    """Provides HTML templates for the debug UI"""
    
    @staticmethod
    def get_debug_ui_template() -> str:
        """Get the main debug UI template with two separate buttons"""
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            min-height: 100vh;
        }

        /* Header */
        .header {
            background: white;
            padding: 16px 24px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }

        .logo-text h1 {
            font-size: 22px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 2px;
        }

        .logo-text p {
            font-size: 14px;
            color: #718096;
        }

        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        .panel {
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .panel-header {
            padding: 20px 24px;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
        }

        .panel-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 8px;
        }

        .panel-subtitle {
            font-size: 14px;
            color: #718096;
        }

        .section { 
            padding: 24px;
        }

        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn { 
            background: #4299e1;
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 14px;
            font-weight: 500;
            margin: 6px 8px 6px 0;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn:hover { 
            background: #3182ce;
            transform: translateY(-1px);
        }

        .btn:disabled { 
            background: #a0aec0; 
            cursor: not-allowed; 
            transform: none;
        }

        .btn-success {
            background: #48bb78;
        }

        .btn-success:hover {
            background: #38a169;
        }

        .btn-warning {
            background: #8b5cf6;
        }

        .btn-warning:hover {
            background: #7c3aed;
        }

        .btn-danger {
            background: #f56565;
        }

        .btn-danger:hover {
            background: #e53e3e;
        }

        .btn-final {
            background: #ed8936;
        }

        .btn-final:hover {
            background: #dd6b20;
        }

        .status { 
            padding: 12px 16px; 
            border-radius: 8px; 
            margin: 12px 0; 
            font-weight: 500;
            font-size: 14px;
            border-left: 4px solid;
        }

        .status.success { 
            background: #f0fff4; 
            color: #22543d; 
            border-left-color: #48bb78;
        }

        .status.error { 
            background: #fff5f5; 
            color: #742a2a; 
            border-left-color: #f56565;
        }

        .status.info { 
            background: #ebf8ff; 
            color: #2a4365; 
            border-left-color: #4299e1;
        }

        .status.warning { 
            background: #fffaf0; 
            color: #744210; 
            border-left-color: #ed8936;
        }

        .progress { 
            background: #e2e8f0; 
            border-radius: 8px; 
            height: 8px; 
            overflow: hidden;
            margin: 12px 0;
        }

        .progress-bar { 
            background: linear-gradient(90deg, #4299e1 0%, #667eea 100%);
            height: 100%; 
            width: 0%; 
            transition: width 0.3s ease;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin: 16px 0;
        }

        .stat-card {
            background: #f7fafc;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }

        .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 4px;
        }

        .stat-label {
            color: #718096;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .logs { 
            background: #1a202c; 
            color: #f7fafc; 
            padding: 16px; 
            border-radius: 8px; 
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace; 
            max-height: 300px; 
            overflow-y: auto;
            white-space: pre-wrap;
            font-size: 13px;
            line-height: 1.4;
        }

        .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
        }

        .button-separator {
            width: 1px;
            height: 40px;
            background: #e2e8f0;
            margin: 0 8px;
        }

        .full-width-panel {
            grid-column: 1 / -1;
        }

        /* Responsive */
        @media (max-width: 1200px) {
            .container {
                grid-template-columns: 1fr;
                gap: 16px;
            }
        }

        @media (max-width: 768px) {
            .container {
                padding: 16px;
            }
            
            .header {
                padding: 12px 16px;
            }
            
            .logo-text h1 {
                font-size: 18px;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .button-group {
                flex-direction: column;
                align-items: stretch;
            }

            .button-separator {
                display: none;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="logo">
            <div class="logo-icon">🏆</div>
            <div class="logo-text">
                <h1>Survey Ranking System</h1>
                <p>Monitor the ranking processor</p>
            </div>
        </div>
    </div>

    <div class="container">
        <!-- Actions Panel -->
        <div class="panel">
            <div class="panel-header">
                <h2 class="panel-title">🎮 Actions</h2>
                <p class="panel-subtitle">Perform ranking</p>
            </div>
            
            <div class="section">
                <div class="button-group">
                    <button class="btn btn-warning" onclick="processRanking()">🏆 RANK</button>
                    <div class="button-separator"></div>
                    <button class="btn btn-final" onclick="postFinalAnswers()">📤 POST</button>
                </div>
                <div style="margin-top: 16px; padding: 12px; background: #f7fafc; border-radius: 6px; font-size: 13px; color: #4a5568;">
                    <strong>🏆 RANK:</strong> Process questions with 3+ correct answers to rank and score<br>
                    <strong>📤 POST:</strong> Store final ranked questions
                </div>
            </div>
        </div>

        <!-- Status Panel -->
        <div class="panel">
            <div class="panel-header">
                <h2 class="panel-title">📊 Status</h2>
                <p class="panel-subtitle">Current operation status and progress</p>
            </div>
            
            <div class="section">
                <div id="status-container">
                    <div class="status info">Ready to start</div>
                </div>
                <div class="progress">
                    <div class="progress-bar" id="progress-bar"></div>
                </div>
            </div>
        </div>

        <!-- Statistics Panel -->
        <div class="panel full-width-panel">
            <div class="panel-header">
                <h2 class="panel-title">📈 Statistics</h2>
                <p class="panel-subtitle">Performance metrics and operation results</p>
            </div>
            
            <div class="section">
                <div class="stats-grid" id="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number" id="total-answered">-</div>
                        <div class="stat-label">Total Answered</div>
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
                        <div class="stat-number" id="final-posted">-</div>
                        <div class="stat-label">Final Posted</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Logs Panel -->
        <div class="panel full-width-panel">
            <div class="panel-header">
                <h2 class="panel-title">📝 System Logs</h2>
                <p class="panel-subtitle">Real-time operation logs and debugging information</p>
            </div>
            
            <div class="section">
                <div class="logs" id="logs">
[INFO] Debug UI initialized - Input questions only
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
                document.getElementById('total-answered').textContent = stats.total_questions;
            }
            if (stats.processed_count !== undefined) {
                document.getElementById('processed-questions').textContent = stats.processed_count;
            }
            if (stats.answers_ranked !== undefined) {
                document.getElementById('ranked-answers').textContent = stats.answers_ranked;
            }
            if (stats.questions_posted !== undefined) {
                document.getElementById('final-posted').textContent = stats.questions_posted;
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
            addLog('🏆 Processing ranking for Input questions only...');
            updateStatus('🏆 Processing rankings...', 'info');
            
            try {
                await testConnection();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await fetchQuestions();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await makeRequest('/api/process-ranking', 'POST');
                
                updateStatus('🎉 Ranking completed!', 'success');
                addLog('Ranking process completed successfully!');
            } catch (error) {
                updateStatus('❌ Ranking failed', 'error');
                addLog('Ranking process failed', 'ERROR');
            }
        }

        async function postFinalAnswers() {
            addLog('📤 POSTing final answers to /admin/survey/final...');
            updateStatus('📤 Posting to final endpoint...', 'info');
            
            try {
                await makeRequest('/api/post-final-answers', 'POST');
                
                updateStatus('🎉 Final POST completed!', 'success');
                addLog('Final POST process completed successfully!');
            } catch (error) {
                updateStatus('❌ Final POST failed', 'error');
                addLog('Final POST process failed', 'ERROR');
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
                // Only log if debug logging is enabled
            } catch (error) {
                addLog('Health check: Failed', 'WARNING');
            }
        }, 30000);
    </script>
</body>
</html>
'''


# Initialize application components
db_handler, ranking_service, final_service = AppInitializer.initialize()
api_endpoints = APIEndpoints(db_handler, ranking_service, final_service)

# Route handlers
@app.route('/')
def debug_ui():
    """Debug UI homepage"""
    return render_template_string(TemplateProvider.get_debug_ui_template())

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
    """Process ranking for Input questions only"""
    result = api_endpoints.process_ranking()
    status_code = 500 if result["status"] == "error" else 200
    return jsonify(result), status_code

@app.route('/api/post-final-answers', methods=['POST'])
def post_final_answers():
    """POST final answers to /admin/survey/final"""
    result = api_endpoints.post_final_answers()
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