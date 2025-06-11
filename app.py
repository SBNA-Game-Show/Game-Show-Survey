# Add these new endpoints to your existing app.py

@app.route('/api/debug-comprehensive')
def debug_comprehensive():
    """Comprehensive debugging endpoint - add this to your app.py"""
    try:
        debug_results = db_handler.debug_api_issues()
        return jsonify({
            "status": "success",
            "debug_results": debug_results
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route('/api/diagnostics')
def get_diagnostics():
    """Get comprehensive diagnostic information - add this to your app.py"""
    try:
        diagnostic_info = db_handler.get_diagnostic_summary()
        return jsonify({
            "status": "success",
            "diagnostics": diagnostic_info
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route('/api/last-operation')
def get_last_operation():
    """Get details from last operation - add this to your app.py"""
    try:
        operation_details = db_handler.get_last_operation_details()
        return jsonify({
            "status": "success",
            "operation_details": operation_details
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# Add these JavaScript functions to your debug UI template:

def get_enhanced_debug_ui_additions():
    """JavaScript and HTML additions for your debug UI template"""
    
    # Add these buttons to your actions section:
    additional_buttons = '''
    <button class="btn" onclick="runComprehensiveDebug()">🔍 Comprehensive Debug</button>
    <button class="btn" onclick="getDiagnostics()">📊 Get Diagnostics</button>
    <button class="btn" onclick="getLastOperation()">📋 Last Operation Details</button>
    '''
    
    # Add these JavaScript functions to your script section:
    additional_javascript = '''
    async function runComprehensiveDebug() {
        addLog('Running comprehensive debugging...', 'INFO');
        updateStatus('🔍 Running comprehensive debug analysis...', 'info');
        
        try {
            const data = await makeRequest('/api/debug-comprehensive');
            
            if (data.status === 'success') {
                const results = data.debug_results;
                
                addLog('=== COMPREHENSIVE DEBUG RESULTS ===', 'INFO');
                addLog(`Connection: ${results.connection_test.success ? 'SUCCESS' : 'FAILED'}`, 
                       results.connection_test.success ? 'INFO' : 'ERROR');
                addLog(`Data Fetch: ${results.data_fetch_test.success ? 'SUCCESS' : 'FAILED'}`, 
                       results.data_fetch_test.success ? 'INFO' : 'ERROR');
                
                if (results.data_analysis.data_issues && results.data_analysis.data_issues.length > 0) {
                    addLog('DATA ISSUES DETECTED:', 'WARNING');
                    results.data_analysis.data_issues.slice(0, 5).forEach(issue => {
                        addLog(`  • ${issue}`, 'WARNING');
                    });
                }
                
                addLog('RECOMMENDATIONS:', 'INFO');
                results.recommendations.forEach((rec, i) => {
                    addLog(`  ${i + 1}. ${rec}`, 'INFO');
                });
                
                updateStatus('🎯 Comprehensive debug completed!', 'success');
                
                // Update stats if available
                if (results.data_analysis) {
                    updateStats({
                        total_questions: results.data_analysis.total_questions,
                        questions_with_answers: results.data_analysis.questions_with_answers
                    });
                }
            } else {
                addLog(`Debug failed: ${data.error}`, 'ERROR');
                updateStatus('❌ Comprehensive debug failed', 'error');
            }
        } catch (error) {
            addLog(`Debug error: ${error.message}`, 'ERROR');
            updateStatus('❌ Debug request failed', 'error');
        }
    }

    async function getDiagnostics() {
        addLog('Getting system diagnostics...', 'INFO');
        
        try {
            const data = await makeRequest('/api/diagnostics');
            
            if (data.status === 'success') {
                const diag = data.diagnostics;
                
                addLog('=== SYSTEM DIAGNOSTICS ===', 'INFO');
                addLog(`API URL: ${diag.api_config.base_url}${diag.api_config.endpoint}`, 'INFO');
                addLog(`Connection: ${diag.connection_status}`, 
                       diag.connection_status === 'healthy' ? 'INFO' : 'WARNING');
                
                if (diag.data_analysis) {
                    addLog(`Questions in DB: ${diag.data_analysis.total_questions || 0}`, 'INFO');
                    if (diag.data_analysis.data_issues && diag.data_analysis.data_issues.length > 0) {
                        addLog(`Data Issues: ${diag.data_analysis.data_issues.length}`, 'WARNING');
                    }
                }
                
                if (diag.last_operation) {
                    addLog(`Last Operation: ${diag.last_operation.operation || 'none'} - ${diag.last_operation.success ? 'SUCCESS' : 'FAILED'}`, 
                           diag.last_operation.success ? 'INFO' : 'WARNING');
                }
                
                updateStatus('📊 Diagnostics retrieved', 'success');
            } else {
                addLog(`Diagnostics failed: ${data.error}`, 'ERROR');
            }
        } catch (error) {
            addLog(`Diagnostics error: ${error.message}`, 'ERROR');
        }
    }

    async function getLastOperation() {
        addLog('Getting last operation details...', 'INFO');
        
        try {
            const data = await makeRequest('/api/last-operation');
            
            if (data.status === 'success') {
                const op = data.operation_details;
                
                if (op && Object.keys(op).length > 0) {
                    addLog('=== LAST OPERATION DETAILS ===', 'INFO');
                    addLog(`Operation: ${op.operation}`, 'INFO');
                    addLog(`Success: ${op.success}`, op.success ? 'INFO' : 'ERROR');
                    
                    if (op.error) {
                        addLog(`Error: ${op.error}`, 'ERROR');
                    }
                    
                    if (op.analysis) {
                        addLog(`Data Analysis Available: Yes`, 'INFO');
                        if (op.analysis.data_issues && op.analysis.data_issues.length > 0) {
                            addLog(`Issues Found: ${op.analysis.data_issues.length}`, 'WARNING');
                        }
                    }
                } else {
                    addLog('No operation details available', 'INFO');
                }
                
                updateStatus('📋 Operation details retrieved', 'success');
            } else {
                addLog(`Failed to get operation details: ${data.error}`, 'ERROR');
            }
        } catch (error) {
            addLog(`Operation details error: ${error.message}`, 'ERROR');
        }
    }

    // Enhanced error logging
    function addLog(message, level = 'INFO') {
        const logs = document.getElementById('logs');
        const timestamp = new Date().toLocaleTimeString();
        
        // Color coding for different log levels
        let color = '';
        switch (level) {
            case 'ERROR':
                color = 'color: #dc3545;';
                break;
            case 'WARNING':
                color = 'color: #ffc107;';
                break;
            case 'SUCCESS':
                color = 'color: #28a745;';
                break;
            default:
                color = 'color: inherit;';
        }
        
        const logEntry = `[${timestamp}] [${level}] ${message}`;
        logs.innerHTML += `<span style="${color}">${logEntry}</span>\\n`;
        logs.scrollTop = logs.scrollHeight;
    }
    '''
    
    return {
        "buttons": additional_buttons,
        "javascript": additional_javascript
    }

# Simple enhancement for ranking_processor.py
def enhance_ranking_processor():
    """Add this debug function to your ranking_processor.py"""
    
    debug_function = '''
def debug_ranking_issues():
    """Add this function to your ranking_processor.py for debugging"""
    from database.db_handler import DatabaseHandler
    
    logger = setup_logger()
    logger.info("🔍 RANKING DEBUG MODE")
    logger.info("=" * 50)
    
    try:
        # Initialize with enhanced diagnostics
        db_handler = DatabaseHandler()
        
        # Run comprehensive debug
        debug_results = db_handler.debug_api_issues()
        
        # Show specific ranking-related info
        if debug_results["data_analysis"].get("questions_with_correct_answers", 0) == 0:
            logger.warning("⚠️ NO QUESTIONS WITH CORRECT ANSWERS FOUND")
            logger.warning("This is why ranking may appear to fail!")
            logger.warning("Solutions:")
            logger.warning("  1. Add questions with correct answers marked")
            logger.warning("  2. Verify isCorrect field is boolean true")
            logger.warning("  3. Check data import process")
        
        return debug_results
        
    except Exception as e:
        logger.error(f"Debug failed: {str(e)}")
        return {"error": str(e)}

# Add this to your main() function in ranking_processor.py:
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--debug":
        debug_ranking_issues()
    else:
        success = main()
        sys.exit(0 if success else 1)
    '''
    
    return debug_function