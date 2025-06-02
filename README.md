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

## Data Structures

### Question Collection Sample

**Question Collection Layout**
```
{
   "_id": {"$oid": "68373facb384c8b16146c183"},
   "question": "What is the word for fire in Sanskrit?",
   "questionType": "Input",
   "questionCategory": "Vocabulary",
   "questionLevel": "Beginner",
   "timesSkipped": {"$numberInt":"5"},
   "answers": [
      {"answerId": "a1",
      "answer": "Hello",
      "responseCount": {"$numberInt": "10"},
      "isCorrect": false},
      {"answerId": "a2",
      "answer": "Hey",
      "responseCount": {"$numberInt": "5"},
      "isCorrect": false }
   ],
   "timeStamp": true
}
```

**User Collection Layout**
```
{
   "_id": {"$oid": "68374212b384c8b16146c185"},
   "userId": "u1",
   "userName": "Sample",
   "userEmail": "sample@email.com",
   "answers": [
      {"answerId": "a1"},
      {"answerId": "a2"}
   ]
}

```

**Admin Collection Layout**
```
{
   "_id": {"$oid": "68374320b384c8b16146c187"},
   "userId": "ad1",
   "userName": "Sammy",
   "userEmail": "sammy@email.com",
   "password": "blahblah",
   "role": "Super Admin(created from backend")"
}

```

## API Endpoint Use Guide
Below is a list of endpoints and all the information needed to use them.

### Admin Route

- **Add Questions**
Submit an array of questions to the database using `addQuestions` method:
  - `POST /api/v1/admin/surveyQuestions`
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
               {"answer": "Gita",
               "isCorrect": true},
               {"answer": "Dasha",
               "isCorrect": false},
               {"answer": "Karma",
               "isCorrect": false},
               {"answer": "Agni",
               "isCorrect": false},
             ]
          },
          {
            "question": "Finish the yoga pose: Sun ____",
            "questionType": "Mcq",
            "questionCategory": "Culture",
            "questionLevel": "Intermediate",
            "answers": [
               {"answer": "Sonata",
               "isCorrect": false},
               {"answer": "Solution",
               "isCorrect": false},
               {"answer": "Salutation",
               "isCorrect": true},
               {"answer": "Power",
               "isCorrect": false},
             ]
          }
       ]
    }
    ```

    

- **Get Questions and Answers**
Request all questions and their respective answers using `getQuestion` method:
  - `GET /api/v1/admin/survey`
  - Headers: `x-api-key: <API_KEY>`

- **Update Question By Id**
Request to retrieve a specific question and modify its properties with `updateQuestionById` method:
  - `PUT /api/v1/admin/`
  - Headers: `x-api-key: <API_KEY>`
  - Sample Body:
    ```json
    {
     "questionID": "68364a7434e454278dd83319",
     "question": " Name something difficult about learning French. ",
     "questionType": "Input",
     "questionCategory": "Grammar",
     "questionLevel": "Beginner"
    }
    ```

- **Delete Question By Id**
Request to delete a question according to its Id value using `deleteQuestionById` method:
  - `DELETE /api/v1/admin/`
  - Headers: `x-api-key: <API_KEY>`
  - Sample Body:
    ```json
    {
     "questionID": "68364a7434e454278dd83319",
    }
    ```

- **Delete Answer By Id**
Request to delete an answer according to its Id value using `deleteAnswerById` method:
  - `DELETE /api/v1/admin/answer`
  - Headers: `x-api-key: <API_KEY>`
  - Sample Body:
    ```json
    {
    "questions":
    [
        {
            "_id": "68387c69aae27e31ebbcfe29"
        },
        {
            "_id": "68387c69aae27e31ebbcfe28"
        }
    ],
    "answers": [
        {
            "answer": "Sunday"
        },
        {
            "answer": "Red"
        }
    ]
    }
    ```

### Survey Route

- **Get Questions**
Request without admin access that retrieves all questions using `getQuestion` method:
  - `GET /api/v1/survey/`
  - Headers: `x-api-key: <API_KEY>`

- **Add Answer to Question**
Request that inserts user answers into their respective questions with `addAnswerToQuestion` method:
  - `PUT /api/v1/survey/`
  - Headers: `x-api-key: <API_KEY>`
  - Sample Body:
    ```json
    {
      "questionID": "683487e92b1ce69eed66ecbd",
      "answer": "Raja"
    }
    ```

---

## Project Structure

```
src/
  controllers/
    admin.controller.js
    answer.controller.js
    user.controller.js
    question.controller.js
  db/
    index.js
  middlewares/
    apiKey.js
    isAdmin.js
  models/
    admin.model.js
    question.model.js
    user.model.js
  routes/
    admin.route.js
    survey.route.js
  utils/
    ApiError.js
    ApiResponse.js
    asyncHandler.js
  app.js
  constants.js
  index.js
```

---

## Notes

- Question types are defined in `constants.js`:
  - `Mcq`
  - `Input`
- Question Categories are (more coming):
  - `Grammar`
  - `Vocabulary`
  - `Literature`
- Question levels are:
  - `Beginner`
  - `Intermediate`
  - `Advanced`
- All endpoints require a valid API key via the `x-api-key` header.
- Pagination is set to 10 questions per page.

---

#### Checkpoints

■ [X] Choose data storage method - MongoDB


■ [ ] Implement API endpoint (if using a back-end framework).

**Vincent, Anmol, Junaid**

■ [ ] Ensure data is stored correctly linked to the question.

**Ayushi, Austin**
