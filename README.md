## Team Pathfinder

### Develop Back-End for Data Capture & Storage

A minimal backend API for managing survey questions and answers, built with Node.js, Express, and MongoDB (Mongoose).

---

## Features

- Add survey questions (with type)
- Retrieve paginated list of questions
- API key protection for endpoints
- Modular code structure
- Async error handling
- Admin routing for authorizing requests

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB instance (local or cloud)

### Installation

1. **Clone the repository and switch to the backend branch:**

   ```sh
   git clone <repo-url>
   cd GameShow
   git checkout remotes/origin/PathFinder---EndPoint,-API-and-Database
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the root directory, `GameShow`, with the following content (see `.env` for example):

   ```
   PORT=8000
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>
   CORS_ORIGIN=*
   API_KEY=your_api_key_here
   ```

   Adjust values as needed.

4. **Start the server:**
   ```sh
   npm run dev
   ```
   or
   ```sh
   node src/index.js
   ```

---

## API Endpoint Use Guide

Below is a list of endpoints and all the information needed to use them.

### Admin Route: **`api/v1/admin/survey`**

#### **Add Questions**

Submit an array of questions to the database:

- Method: **`POST`**
- Headers: `x-api-key: <API_KEY>`
- Sample Body FOR SUBMITTING INPUT QUESTIONS:

  ```json
  {
    "questions": [
      {
        "question": "What is your favorite color?",
        "questionType": "Input",
        "questionCategory": "Vocabulary",
        "questionLevel": "Beginner"
      },
      {
        "question": "Name a yoga pose.",
        "questionType": "Input",
        "questionCategory": "Grammar",
        "questionLevel": "Intermediate"
      }
    ]
  }
  ```

  - Sample Body FOR SUBMITTING MULTIPLE CHOICE QUESTIONS:

  ```json
  {
    "questions": [
      {
        "question": "Which of these is a Sanskrit text?",
        "questionType": "Mcq",
        "questionCategory": "Literature",
        "questionLevel": "Advanced",
        "answers": [
          { "answer": "Gita", "isCorrect": true },
          { "answer": "Dasha", "isCorrect": false },
          { "answer": "Karma", "isCorrect": false },
          { "answer": "Agni", "isCorrect": false }
        ]
      },
      {
        "question": "Finish the yoga pose: Sun ____",
        "questionType": "Mcq",
        "questionCategory": "Culture",
        "questionLevel": "Intermediate",
        "answers": [
          { "answer": "Sonata", "isCorrect": false },
          { "answer": "Solution", "isCorrect": false },
          { "answer": "Salutation", "isCorrect": true },
          { "answer": "Power", "isCorrect": false }
        ]
      }
    ]
  }
  ```

#### **Get Questions and Answers**

Request all questions and their respective answers:

- Method: **`GET`**
- Headers: `x-api-key: <API_KEY>`

#### **Update Question By Id**

Request to retrieve a specific question and modify its properties:

- Method: **`PUT`**
- Headers: `x-api-key: <API_KEY>`
- Sample Body:

  ```json
  {
    "questionID": "68364a7434e454278dd83319",
    "question": " Name something difficult about learning Sanskrit. ",
    "questionType": "Input",
    "questionCategory": "Grammar",
    "questionLevel": "Beginner"
  }
  ```

#### **Delete Question By Id**

Request to delete a question according to its Id value:

- Method: **`DELETE`**
- Headers: `x-api-key: <API_KEY>`
- Sample Body:
  ```json
  {
    "questions": [
      { "questionID": "68364a7434e454278dd83319" },
      { "questionID": "68364a7434e454278dd83310" }
    ]
  }
  ```

### Final Route: **`api/v1/admin/survey/final`**

#### **Post Final Questions**

Request made to finalize the validated questions and their responses:

- Method: **`POST`**
- Headers: `x-api-key: <API_KEY>`
- Sample Body (Only `isCorrect: true` answers and their respective questions will be inserted to the finalized schema):

```json
{
  "questions": [
    {
      "question": "What is the word for fire in Sanskrit?",
      "questionType": "Input",
      "questionCategory": "Vocabulary",
      "questionLevel": "Beginner",
      "timesSkipped": 5,
      "timesAnswered": 23,
      "answers": [
        {
          "answer": "Agni",
          "responseCount": 8,
          "isCorrect": true
        },
        {
          "answer": "Hello",
          "responseCount": 10,
          "isCorrect": false
        },
        {
          "answer": "Hey",
          "responseCount": 5,
          "isCorrect": false
        }
      ]
      ]
    },
    {
      "question": "What is the Sanskrit word for water?",
      "questionType": "Input",
      "questionCategory": "Vocabulary",
      "questionLevel": "Beginner",
      "timesSkipped": 2,
      "timesAnswered": 14,
      "answers": [
        {
          "answer": "Jala",
          "responseCount": 7,
          "isCorrect": true
        },
        {
          "answer": "Tree",
          "responseCount": 3,
          "isCorrect": false
        },
        {
          "answer": "Sky",
          "responseCount": 4,
          "isCorrect": false
        }
      ]
    }
  ]
}
```

#### **Get Final Questions**

Request made to retrieve all information for the questions and answers in the finalized collection:

- Method: **`GET`**
- Headers: `x-api-key: <API_KEY>`

#### **Post Final Questions**

Request made to finalize the validated questions and their responses:

- Method: **`POST`**
- Headers: `x-api-key: <API_KEY>`

#### **Update Final Question By Id**

Request made to update any field from the finalized questions and answers:

- Method: **`PUT`**
- Headers: `x-api-key: <API_KEY>`
- Sample Body:

```json
{
  "questions": [
    {
      "questionID": "06fd91a7-a9c5-4335-a0f5-ba6835fa8f72",
      "question": "name a sanskrit compound type (samasa).",
      "questionType": "Input",
      "questionCategory": "Grammar",
      "questionLevel": "Advanced",
      "timesSkipped": 0,
      "timesAnswered": 0,
      "answers": [
        {
          "answer": "pair",
          "isCorrect": true,
          "responseCount": 4,
          "rank": 0,
          "score": 0,
          "_id": "f9e61308-ff59-4131-b7f7-8667c0859d01"
        },
        {
          "answer": "penguin",
          "isCorrect": true,
          "responseCount": 2,
          "rank": 0,
          "score": 0,
          "_id": "bb133bc7-cef2-4853-9660-3bb937cac819"
        }
      ]
    }
  ]
}
```

#### **Delete Final Question By Id**

Request to delete a finalzed question and it's answers by Id:
  - Method: **`GET`**
  - Headers: `x-api-key: <API_KEY>`
  - Sample Body:
  ```json
  {
    "questions": [
      { "questionID": "68364a7434e454278dd83319" },
      { "questionID": "68364a7434e454278dd83310" }
    ]
  }
  ```

### Survey Route:

#### **`api/v1/survey`**

#### **Get Questions**
  Request without admin access that retrieves all questions:

  - Method: `GET`
  - Headers: `x-api-key: <API_KEY>`

#### **Add Answer to Question**
  Request that inserts user answers into their respective questions:

  - Method: **`PUT`**
  - Headers: `x-api-key: <API_KEY>`
  - Sample Body:

    ```json
    {
      "questions": [
        { "_id": "6838bccdb1be6e54cfee3c51" },
        { "_id": "6838bccdb1be6e54cfee3c52" },
        { "_id": "6838bccdb1be6e54cfee3c53" }
      ],
      "answers": [
        { "answer": "Penguin" },
        { "answer": "Volcano" },
        { "answer": "Ackee" }
      ]
    }
    ```

---

## Notes

- Question Types - defined in `constants.js`:
- Question Types - defined in `constants.js`:
  - `Mcq`
  - `Input`
- Question Categories - defined in `constants.js`:
- Question Categories - defined in `constants.js`:
  - `Grammar`
  - `Vocabulary`
  - `Literature`
  - `History`
  - `Culture`
- Question Levels - defined in `constants.js`:
- Question Levels - defined in `constants.js`:
  - `Beginner`
  - `Intermediate`
  - `Advanced`
- Schema Models - defined in `enums.js`:

  - `Question`
  - `FinalQuestion`

- All endpoints require a valid API key via the `x-api-key` header.

---

#### Checkpoints

■ [X] Choose data storage method - MongoDB

■ [ ] Implement API endpoint (if using a back-end framework).

**Vincent, Anmol, Junaid**

■ [ ] Ensure data is stored correctly linked to the question.

**Ayushi, Austin**
