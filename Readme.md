# Survey Ranking System

A Python-based system for processing survey data, ranking answers by response count, and managing question analytics through a REST API.

## 🚀 Features

- **Answer Ranking**: Automatically ranks correct answers based on response counts
- **Similarity Processing**: Merges similar answers to reduce duplicates
- **API Integration**: Communicates with remote survey database via REST API
- **Comprehensive Logging**: Detailed logging with configurable levels
- **Validation**: Robust data validation and error handling
- **Debug Tools**: Built-in debugging and diagnostic endpoints

## 📋 Prerequisites

- Python 3.7 or higher
- pip (Python package installer)
- Access to the survey API (API key and endpoint)

## 🛠️ Installation

1. **Clone or download the project files** to your local machine

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file in the project root with the following configuration:
   ```env
   # API Configuration
   API_BASE_URL=https://pathfinder-deploy.onrender.com
   API_KEY=your_api_key_here
   API_ENDPOINT=/api/v1/admin/survey

   # Processing Configuration
   SIMILARITY_THRESHOLD=0.75
   LOG_LEVEL=INFO

   # Application Configuration
   FLASK_PORT=5000
   FLASK_DEBUG=False
   ```

   **Important**: Replace `your_api_key_here` with your actual API key.

## 🏃‍♂️ How to Run

### Main Ranking Processor

The primary way to run the system is through the ranking processor:

```bash
python ranking_processor.py
```

This will:
- Connect to the API
- Fetch all questions from the database
- Process and rank answers based on response counts
- Update the database with rankings
- Display a summary of results

### Debug Mode

For troubleshooting, run with debug logging:

```bash
# Set LOG_LEVEL=DEBUG in your .env file, then run:
python ranking_processor.py
```

### Web Interface (Optional)

To start the Flask web interface for debugging:

```bash
python app.py
```

Then visit `http://localhost:5000` in your browser for:
- API diagnostics
- Real-time debugging
- System status monitoring

## 📊 Understanding the Output

When you run the ranking processor, you'll see output like this:

```
🚀 Starting Survey Answer Ranking Processor
============================================================
✅ Configuration validated
📡 API URL: https://pathfinder-deploy.onrender.com/api/v1/admin/survey
✅ API connection successful!
⚙️ Starting ranking process...
✅ Found 25 questions
🎯 15 questions ready for ranking
📤 Starting bulk update of 15 questions
✅ Bulk update successful: 15 questions updated

============================================================
📊 RANKING PROCESS COMPLETED
============================================================
⏱️  Processing Time: 2.3s
📝 Total Questions: 25
✅ Processed: 15
⏭️  Skipped: 10
💾 Updated in Database: 15
❌ Failed Updates: 0
🏆 Answers Ranked: 45
🎯 Answers Scored: 30
============================================================
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_BASE_URL` | Base URL of the survey API | - | ✅ |
| `API_KEY` | API authentication key | - | ✅ |
| `API_ENDPOINT` | API endpoint path | - | ✅ |
| `SIMILARITY_THRESHOLD` | Threshold for merging similar answers | 0.75 | ❌ |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) | INFO | ❌ |
| `FLASK_PORT` | Port for web interface | 5000 | ❌ |
| `FLASK_DEBUG` | Enable Flask debug mode | False | ❌ |

### Scoring System

The system uses a default scoring system for ranked answers:
- Rank 1: 100 points
- Rank 2: 80 points  
- Rank 3: 60 points
- Rank 4: 40 points
- Rank 5: 20 points
- Rank 6+: 0 points

## 🐛 Troubleshooting

### Common Issues

**1. "API connection failed"**
- Check your internet connection
- Verify `API_BASE_URL` is correct
- Ensure the API server is running

**2. "Unauthorized - check API key"**
- Verify your `API_KEY` is correct
- Check if the API key has expired

**3. "No questions found"**
- Database might be empty (this is normal for new installations)
- Import sample data into your database
- Check if questions were recently deleted

**4. "Endpoint not found (404)"**
- Verify `API_ENDPOINT` path is correct
- Check if the server deployment is complete
- Test the endpoint manually with curl

### Debug Commands

Enable detailed logging by setting `LOG_LEVEL=DEBUG` in your `.env` file.

Run diagnostics through the web interface:
```bash
python app.py
# Visit http://localhost:5000 and click "Comprehensive Debug"
```

### Testing API Connection

Test your API configuration:
```bash
# Enable DEBUG logging and run:
python ranking_processor.py
```

Look for connection test results in the output.

## 📁 Project Structure

```
survey-ranking-system/
├── .env                      # Environment configuration
├── .gitignore               # Git ignore rules
├── requirements.txt         # Python dependencies
├── ranking_processor.py     # Main entry point
├── app.py                   # Flask web interface
├── constants.py             # System constants
├── config/
│   └── settings.py          # Configuration management
├── database/
│   └── db_handler.py        # Database operations
├── services/
│   ├── ranking_service.py   # Answer ranking logic
│   └── similarity_service.py # Answer similarity processing
└── utils/
    ├── api_handler.py       # HTTP API communication
    ├── data_formatters.py   # Data formatting utilities
    └── logger.py            # Logging configuration
```

## 🔄 How It Works

1. **Connects** to the survey API using your credentials
2. **Fetches** all questions and their answers from the database
3. **Processes** each question to:
   - Identify correct answers
   - Rank them by response count (highest first)
   - Assign scores based on ranking
   - Skip incorrect answers (rank=0, score=0)
4. **Updates** the database with new rankings and scores
5. **Reports** summary statistics

## 📝 Data Format


After processing, answers get ranked and scored:
```json
{
  "answer": "Paris",
  "isCorrect": true,
  "responseCount": 150,
  "rank": 1,
  "score": 100
}
```

## 🤝 Contributing

This is a production system. Before making changes:
1. Test thoroughly in a development environment
2. Ensure all validations pass
3. Update documentation as needed

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Enable debug logging (`LOG_LEVEL=DEBUG`)
3. Use the web interface diagnostics
4. Review API server logs if available

## 📄 License

This project is proprietary software. All rights reserved.
