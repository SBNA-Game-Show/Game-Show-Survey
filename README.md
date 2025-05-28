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

### Admin Route

- **Add Questions**
Submit an array of questions to the database using `addQuestions` method:
  - `POST /api/v1/admin/surveyQuestions`
  - Headers: `x-api-key: <API_KEY>`
  - Body:
    ```json
    {
       [
          {
            "question": "What is your favorite color?",
            "questionType": "Input",
            "questionCategory": "Language",
            "questionLevel": "Beginner"
          },
          {
            "question": "What is your favorite color?",
            "questionType": "Input",
            "questionCategory": "Language",
            "questionLevel": "Beginner"
          }
       ]
    }
    ```

- **Get Questions and Answers**
Request all questions and their respective answers using `getQuestion` method:
  - `GET /api/v1/admin/survey`
  - Headers: `x-api-key: <API_KEY>`

### Answers

- **Add Answer to Question**
  - `PUT /api/v1/answers/`
  - Headers: `x-api-key: <API_KEY>`
  - Body:
    ```json
    {
      "questionID": "683487e92b1ce69eed66ecbd",
      "answerTest": "Raja"
    }
    ```

---

## Project Structure

```
src/
  controllers/
    answer.controller.js
    question.controller.js
  db/
    index.js
  middlewares/
    apiKey.js
  models/
    question.model.js
    user.model.js
  routes/
    answer.route.js
    question.routes.js
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
- Question Categories are:
  - `Grammar`
  - `Vocabulary`
  - `Literature`
 - Question levels are:
  - `Beginner`
  - `Intermediate`
  - `Advanced`
- All endpoints require a valid API key via the `x-api-key` header.
- Pagination is set to 10 questions per page.
- Answers functionality is a stub and can be extended.

---

#### Checkpoints

■ [X] Choose data storage method - MongoDB


■ [ ] Implement API endpoint (if using a back-end framework).

**Vincent, Anmol, Junaid**

■ [ ] Ensure data is stored correctly linked to the question.

**Ayushi, Austin**
