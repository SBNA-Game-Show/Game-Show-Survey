import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { QUESTION_TYPE } from "../constants.js";
import { SCHEMA_MODELS } from "../utils/enums.js";
import * as questionService from "../services/question.service.js";
/*
  ROUTE METHOD FOR
  ADDING  QUESTIONS TO DATABASE
*/
const addQuestions = asyncHandler(async (req, res) => {
  // Step 1: Check if user has Admin privileges
  if (!req.isAdminRoute) {
    throw new ApiError(403, "You need Admin Privileges");
  }
  // Step 2: Extract the questions array from the request body
  const { questions } = req.body;

  const insertedQuestions = await questionService.addQuestions(questions, SCHEMA_MODELS.QUESTION);
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        insertedQuestions,
        "Question added to DB successfully "
      )
    );
});

/*
  ROUTE METHOD FOR
  RETRIEVING QUESTIONS AND ANSWERS FROM DATABASE
*/
const getQuestion = asyncHandler(async (req, res) => {
  // Step:1  Check if the request is from an admin route
  if (req.isAdminRoute) {
    // Step:2   Fetch all questions with admin-level details (including answers and timesSkipped)
    const questions = await questionService.getQuestionForAdmin(SCHEMA_MODELS.QUESTION);

    // Step:3  If no questions found, throw a 404 error
    if (questions.length === 0) {
      throw new ApiError(404, "No questions found");
    }
    // Step:4  Respond with success and the list of questions
    return res
      .status(200)
      .json(
        new ApiResponse(200, questions, "Questions Retrieved Successfully")
      );
  } else {
    // Step:1  Fetch questions for normal users (input + MCQ types, limited fields)
    const questions = await questionService.getQuestionsForUser(
      SCHEMA_MODELS.QUESTION,
      [
      QUESTION_TYPE.INPUT,
      QUESTION_TYPE.MCQ,
    ]);

    // Step:2  If no questions found, throw a 404 error
    if (questions.length === 0) {
      throw new ApiError(404, "No questions found");
    }

    // Step:3  Respond with success and the list of questions
    return res
      .status(200)
      .json(
        new ApiResponse(200, questions, "Questions Retrieved Successfully")
      );
  }
});

/*
  ROUTE METHOD FOR
  UPDATING QUESTION BY ID
*/
const updateQuestionById = asyncHandler(async (req, res) => {
  // Step 1 Check for admin Route
  if (!req.isAdminRoute) {
    throw new ApiError(403, "Invalid Request. NO ADMIN privilege ");
  }
  const { questions } = req.body;
  const updatedQuestion = await questionService.updateQuestionById(questions, SCHEMA_MODELS.QUESTION);
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedQuestion, "Question Updated Successfully")
    );
});

/*
  ROUTE METHOD FOR
  DELETING QUESTION BY ID along with its Answers
*/
const deleteQuestionById = asyncHandler(async (req, res) => {
  // Step 1 Check for admin Route
  if (!req.isAdminRoute) {
    throw new ApiError(403, "Invalid Request. NO ADMIN privilege ");
  }
  const { questions } = req.body;
  const deletedQuestions = await questionService.deleteQuestionById(questions, SCHEMA_MODELS.QUESTION);

  return res.status(200).json(new ApiResponse(200, deletedQuestions));
});


/*
  ROUTE METHOD FOR [ PUT ]
  ADDING ANSWERS TO QUESTION BY ID
*/
// User adds answers to the questions [ PUT ]
const addAnswerToQuestion = asyncHandler(async (req, res) => {
  const { questions, answers } = req.body;

  await questionService.addAnswerToQuestion(questions, answers);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Answers updated successfully"));
});
export {
  addQuestions,
  getQuestion,
  updateQuestionById,
  deleteQuestionById,
  addAnswerToQuestion,
};
