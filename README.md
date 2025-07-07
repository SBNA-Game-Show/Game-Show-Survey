# Survey Ranking System

A Python-based system for processing survey data, ranking answers by response count, and managing question analytics through a REST API. The system specifically processes **Input questions only** and provides a complete workflow for ranking answers and posting them to a final endpoint.

## 🚀 Features

- **Answer Ranking**: Automatically ranks correct answers based on response counts (highest first)
- **Input Questions Only**: Processes only Input-type questions, skips MCQ questions automatically
- **Similarity Processing**: Merges similar answers to reduce duplicates
- **API Integration**: Communicates with remote survey database via REST API
- **Final Endpoint Management**: POST workflow for final answer submission from /survey to /survey/final
- **Comprehensive Logging**: Detailed logging with configurable levels
- **Validation**: Robust data validation and error handling
- **Debug Tools**: Built-in debugging and diagnostic endpoints
- **Web Interface**: Flask-based UI for monitoring and manual operations

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
   API_BASE_URL=https://pathfinder-v4.onrender.com
   API_KEY=api_key_here
   API_ENDPOINT=/api/v1/admin/survey

   # Processing Configuration
   SIMILARITY_THRESHOLD=0.75
   LOG_LEVEL=INFO

   # Application Configuration
   FLASK_PORT=5000
   FLASK_DEBUG=False
   ```

   **Important**: Replace `api_key_here` with your actual API key.

## 🏃‍♂️ How to Run

### Method 1: Command Line Processor (Recommended)

The primary way to run the ranking system:

```bash
python ranking_processor.py
```

This will:
- Connect to the API
- Fetch all questions from the database
- Process **Input questions only** (skips MCQ questions)
- Rank answers based on response counts for questions with 3+ correct answers
- Update the database with rankings
- Display a comprehensive summary

### Method 2: Web Interface

For monitoring, debugging, and manual operations:

```bash
python app.py
```

Then visit `http://localhost:5000` in your browser for:
- **🏆 RANK**: Process Input questions with ranking and scoring
- **📤 POST**: Execute GET(if exists) → DELETE(if exists) → POST from /survey to /survey/final endpoint
- Real-time system monitoring
- API diagnostics and debugging tools

### Debug Mode

For troubleshooting, enable debug logging:

```bash
# Set LOG_LEVEL=DEBUG in your .env file, then run:
python ranking_processor.py
```

## 📊 Understanding the System Workflow

### 1. Ranking Process (🏆 RANK)

When you run the ranking processor, it follows this workflow:

1. **Fetches** all questions from `/api/v1/admin/survey`
2. **Filters** to process only Input-type questions
3. **Validates** questions have at least 3 correct answers
4. **Ranks** correct answers by responseCount (highest first)
5. **Assigns scores**: Rank 1 = 100 points, Rank 2 = 80 points, etc.
6. **Keeps** incorrect answers with rank=0, score=0
7. **Updates** questions back to `/api/v1/admin/survey`

### 2. Final Endpoint Process (📤 POST)
POSt will be used once done with the survey and answers has been ranked.

1. **DELETE** the questions from final endpoint if exists
2. **POST** new ranked Input questions (with 3+ correct answers)from /survey to /survey/final endpoint
3. **Only includes** correct answers in the POST (filters out incorrect answers)

## 📈 Understanding the Output

### Command Line Output
```
🚀 Starting Survey Answer Ranking Processor
📝 Processing Input Questions Only (MCQ questions will be skipped)
======================================================================
✅ Configuration validated
📡 API URL: https://pathfinder-v4.onrender.com/api/v1/admin/survey
✅ API connection successful!
⚙️ Starting ranking process for Input questions only...
✅ Found 25 questions
🎯 15 Input questions processed
⏭️ 5 MCQ questions skipped
❌ 3 Input questions skipped (insufficient correct answers)
💾 Updated in Database: 15
🏆 Answers Ranked: 45
🎯 Answers Scored: 30
======================================================================
📊 RANKING PROCESS COMPLETED - INPUT QUESTIONS ONLY
======================================================================
⏱️  Processing Time: 2.3s
📝 Total Questions: 25
✅ Input Questions Processed: 15
⏭️  MCQ Questions Skipped: 5
❌ Input Questions Skipped (insufficient answers): 3
💾 Updated in Database: 15
❌ Failed Updates: 0
🏆 Answers Ranked: 45
🎯 Answers Scored: 30
======================================================================
```

### Key Metrics Explained

- **Total Questions**: All questions found in database
- **Input Questions Processed**: Input questions with 3+ correct answers that were ranked
- **MCQ Questions Skipped**: Multiple choice questions (system only processes Input questions)
- **Insufficient Answers**: Input questions with fewer than 3 correct answers
- **Answers Ranked**: Total number of answers that received rankings
- **Answers Scored**: Answers that received points (ranks 1-5 get points, rank 6+ get 0 points)

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

The system uses this default scoring for ranked answers:
- **Rank 1**: 100 points
- **Rank 2**: 80 points  
- **Rank 3**: 60 points
- **Rank 4**: 40 points
- **Rank 5**: 20 points
- **Rank 6+**: 0 points

Incorrect answers always get rank=0, score=0.

## 🏗️ System Architecture

### Core Components

```
survey-ranking-system/
├── ranking_processor.py     # Main command-line entry point
├── app.py                   # Flask web interface
├── config/
│   └── settings.py          # Configuration management
├── database/
│   └── db_handler.py        # API communication and data handling
├── services/
│   ├── ranking_service.py   # Core ranking logic for Input questions
│   ├── final_service.py     # Final endpoint GET/DELETE/POST operations
│   └── similarity_service.py # Answer similarity processing
└── utils/
    ├── api_handler.py       # HTTP API communication
    ├── data_formatters.py   # Data formatting utilities
    └── logger.py            # Logging configuration
```

### Data Flow

1. **ranking_processor.py** → **RankingService** → **DatabaseHandler** → API
2. **app.py** → **FinalService** → **FinalEndpointHandler** → `/final` API

## 📝 Question and Answer Processing

### Input Questions Only

The system **only processes Input-type questions** because:
- Input questions have user-generated text answers that need ranking
- MCQ questions have pre-defined options that don't require response-count ranking
- Input questions with fewer than 3 correct answers are skipped (insufficient data for meaningful ranking)

### Answer Processing Logic

**For Correct Answers:**
1. Sort by responseCount (highest first)
2. Assign rank (1, 2, 3, ...)
3. Assign score based on rank (100, 80, 60, 40, 20, 0)

**For Incorrect Answers:**
1. Keep in the data but set rank=0, score=0
2. Preserve for reference but don't include in rankings

### Final Endpoint Filtering

When posting to the final endpoint:
- Only Input questions with 3+ correct answers are included
- Only correct answers are posted (incorrect answers filtered out)
- All answers retain their rank and score from the ranking process

## 🐛 Troubleshooting

### Common Issues and Solutions

**1. "API connection failed"**
```bash
# Check these in order:
curl -H "x-api-key: YOUR_API_KEY" https://pathfinder-v4.onrender.com/api/v1/admin/survey
# Verify: Internet connection, API key, server status
```

**2. "No questions found / Database is empty"**
- This is normal for new installations
- Import sample questions into your database
- Not an error - just means no data to process yet

**3. "MCQ questions skipped"**
- Expected behavior - system only processes Input questions
- MCQ questions don't need response-count based ranking

**4. "Input questions skipped (insufficient answers)"**
- Input questions need at least 3 correct answers for ranking
- Questions with fewer correct answers are automatically skipped
- Consider reviewing your data quality or import process

**5. "Endpoint not found (404)"**
```bash
# Test manually:
curl -H "x-api-key: YOUR_API_KEY" https://pathfinder-v4.onrender.com/api/v1/admin/survey
# Check: Server deployment status, endpoint registration
```

### Debug Commands

**Enable detailed logging:**
```bash
# In .env file:
LOG_LEVEL=DEBUG

# Then run:
python ranking_processor.py
```

**Use web interface for diagnostics:**
```bash
python app.py
# Visit http://localhost:5000
# Click buttons to test API connection and diagnose issues
```

### Testing the Setup

**1. Test API Connection:**
```bash
python -c "
from database.db_handler import DatabaseHandler
db = DatabaseHandler()
print('Connection successful!' if db.test_connection() else 'Connection failed!')
"
```

**2. Check Question Count:**
```bash
python -c "
from database.db_handler import DatabaseHandler
db = DatabaseHandler()
questions = db.fetch_all_questions()
print(f'Found {len(questions)} questions')
"
```

## 🔄 Complete Workflow Example

Here's how to use the system from start to finish:

### Step 1: Initial Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Configure .env file with your API credentials
# Test connection
python -c "from database.db_handler import DatabaseHandler; print('✅' if DatabaseHandler().test_connection() else '❌')"
```

### Step 2: Process Rankings
```bash
# Run ranking for Input questions
python ranking_processor.py
```

### Step 3: Post to Final Endpoint
```bash
# Use web interface for final posting
python app.py
# Visit http://localhost:5000
# Click "📤 POST" button
```

### Step 4: Monitor Results
- Check web interface for real-time status
- Review logs for detailed processing information
- Verify final endpoint contains your ranked questions

### Code Organization

- **Services**: Business logic (ranking, similarity, final processing)
- **Database**: API communication and data handling
- **Utils**: Shared utilities (logging, formatting, API handling)
- **Config**: Centralized configuration management


## 📄 License

This project is proprietary software. All rights reserved.

---

## 🎯 Quick Start Summary

1. Install Python dependencies: `pip install -r requirements.txt`
2. Configure `.env` file with your API credentials
3. Run ranking: `python ranking_processor.py`
4. Use web interface for final operations: `python app.py`
5. Monitor results at `http://localhost:5000`

The system processes **Input questions only**, requires **3+ correct answers** per question, and provides a complete workflow from ranking to final endpoint posting.
