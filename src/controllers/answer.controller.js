import { Question } from "../models/question.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// User adds answers to the questions [ PUT ]
const addAnswerToQuestion = asyncHandler(async (req, res) => {
  // Step 1: Extract data from request body
  const { questions, answers } = req.body;

  // Step 2: Validate that questions is a non-empty array
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, "Question must not be an empty Array");
  }

  // Step 3: Loop through each question-answer pair
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const a = answers[i];

    // 3.1: Ensure question ID is present
    if (!q._id || q._id.trim() === "") {
      throw new ApiError(400, "Missing question ID");
    }

    // 3.2: If answer is blank or skipped, increment timesSkipped
    if (!a || !a.answer || a.answer.trim() === "") {
      await Question.findByIdAndUpdate(q._id, { $inc: { timesSkipped: 1 } });
      continue; // Skip to next question
    }

    // 3.3: Clean and normalize answer text
    const cleanAnswer = a.answer.toLowerCase().trim();

    // 3.4: Find the question in the database
    const questionDoc = await Question.findById(q._id);
    if (!questionDoc) {
      throw new ApiError(404, `Question with ID ${q._id} not found`);
    }

    // 3.5: Check if the answer already exists in the DB
    const existing = questionDoc.answers.find(
      (ans) => ans.answer === cleanAnswer
    );

    if (existing) {
      // 3.6: If it exists, increment its responseCount
      await Question.findByIdAndUpdate(
        q._id,
        { $inc: { "answers.$[elem].responseCount": 1 } },
        { arrayFilters: [{ "elem.answer": cleanAnswer }] }
      );
    } else {
      // 3.7: If not, add it as a new answer with responseCount = 1
      await Question.findByIdAndUpdate(q._id, {
        $push: {
          answers: {
            answer: cleanAnswer,
            responseCount: 1,
          },
        },
      });
    }
  }
  // Step 4: Send final success response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Question Updated with Answers"));
});

export { addAnswerToQuestion };
