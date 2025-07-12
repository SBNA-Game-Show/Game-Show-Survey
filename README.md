# Gameshow STT/TTS Integration

## Overview
This project is an integration of Speech-to-Text (STT) and Text-to-Speech (TTS) functionality to the original Gameshow project created by Team Pathfinder. The application provides an interactive quiz experience with voice input and output capabilities.

## Project Structure
```
gameshow-stt-tts/
├── frontend/          # React frontend application
├── backend/           # Node.js backend server
└── README.md         # This file
```

## Prerequisites
Before running the application, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **MongoDB** (local installation)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd gameshow-stt-tts
```

### 2. Backend Setup
Navigate to the backend folder and install dependencies:
```bash
cd backend
npm install
npm start
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend folder and install dependencies:
```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup
Ensure MongoDB is running on your local system and create the required database structure:

1. **Start MongoDB** service on your system
2. **Create Database**: `TestAnswerId`
3. **Create Collection**: `questions`
4. **Insert Sample Data**: Add the following JSON document to the `questions` collection:

```json
{
  "questions": [
    {
      "question": "भवतः प्रियं फलम् किम् अस्ति?", 
      "questionType": "Input",
      "questionCategory": "Vocabulary",
      "questionLevel": "Advanced"
    },
    {
      "question": "भवतः सर्वाधिकं रुचिकरं फलम् किम्?", 
      "questionType": "Input",
      "questionCategory": "Vocabulary",
      "questionLevel": "Advanced"
    },
    {
      "question": "कस्मिन् ऋतौ आम्रफलस्य प्राप्तिः भवति?", 
      "questionType": "Input",
      "questionCategory": "Vocabulary",
      "questionLevel": "Advanced"
    }
  ]
}
```

## Running the Application

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm start
   ```

3. **Access the Application**:
   - Once the frontend starts, your web browser will automatically redirect to the application
   - Navigate to the **Advanced** section to view and interact with the questions

## Features

### Core Functionality
- **Interactive Quiz Interface**: Browse questions by difficulty level
- **Speech-to-Text (STT)**: Voice input for answering questions
- **Text-to-Speech (TTS)**: Audio output for questions and feedback
- **Multi-language Support**: Supports Sanskrit questions
- **Real-time Processing**: Instant voice recognition and synthesis


## Usage Instructions

1. **Navigate to Advanced Section**: After launching the application, go to the Advanced difficulty level
2. **Voice Input**: Use the microphone feature to provide spoken answers
3. **Audio Output**: Listen to questions being read aloud via TTS


## Credits
- **Original Project**: Team Pathfinder (Gameshow-Frontend and Backend)
- **STT/TTS Integration**: Current development team
