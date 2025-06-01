import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  // Step 3: Validate that it's a non-empty array
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, "Question must not be an empty Array");
  }

  // Step 4: Initialize a list to store valid (non-duplicate) questions
  let validQuestions = [];
  for (const q of questions) {
    const {
      question,
      questionType,
      questionCategory,
      questionLevel,
      timesSkipped,
    } = q;

    // Step 5: Check for missing required fields
    if (
      [question, questionCategory, questionLevel].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required for every question");
    }

    // Step 6: Normalize question text to avoid case-based duplicates
    const normalizedQuestion = question.toLowerCase().trim();
    // Step 7: Check if the question already exists in the DB
    const alreadyExists = await Question.findOne({
      question: normalizedQuestion,
      questionType,
      questionCategory,
      questionLevel,
    });

    // Step 8: Only add question to valid list if it's not a duplicate
    if (!alreadyExists) {
      validQuestions.push({
        question: normalizedQuestion,
        questionCategory,
        questionLevel,
        questionType,
      });
    }
  }

  // Step 9: If no new questions to insert, send a proper response
  if (validQuestions.length === 0) {
    throw new ApiError(409, "All questions provided are duplicate");
  }

  // Step 10: Insert valid questions into DB
  const insertedQuestions = await Question.insertMany(validQuestions);

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
  // Step 1: Build base query to fetch selected fields (excluding answers)
  let query = Question.find({})
    .select("question questionCategory questionLevel timesSkipped")
    .sort({ createdAt: -1 }); // shows the latest questions on top

  // Step 2: If request is from ADMIN, include answers in the selection
  if (req.isAdminRoute) {
    query = query.select("answers"); // adds "answers" to the already selected fields
  }

  // Step 3: Execute the query
  const questions = await query;

  // Step 4 if No questions are returned throw error
  if (questions.length === 0) {
    throw new ApiError(404, "No questions found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, questions, "Questions Retrieved Successfully"));
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

  // Step 2 deconstruct the whole Request based on the fields needed
  const {
    questionID,
    question,
    questionCategory,
    questionLevel,
    questionType,
  } = req.body;

  // Step 3: Validate input fields
  if (!questionID || !question || !questionCategory || !questionLevel) {
    throw new ApiError(400, "Missing required fields.");
  }
  // Step 4 Check for the question based on the fields
  const queryQuestion = await Question.findById(questionID);

  // Step 5 if No question then Throw Error
  if (!queryQuestion) {
    throw new ApiError(404, "Question not found. Invalid ID.");
  }

  // Step 6 update the question
  const updatedQuestion = await Question.findByIdAndUpdate(
    questionID,
    {
      $set: {
        question: question,
        questionCategory: questionCategory,
        questionLevel: questionLevel,
        questionType: questionType,
      },
    },
    { new: true }
  );
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
    return res
      .status(403)
      .json(new ApiError(403, "Invalid Request. NO ADMIN privilege "));
  }
  // Step 2 deconstruct the questionID from the request Body
  const { questionID } = req.body;

  // Step 3 If no ID throw Error
  if (!questionID) {
    return res
      .status(403)
      .json(new ApiError(403, "Question Id missing. Operation Failed !!"));
  }

  // Step 4 Look for the question To Delete based on questionID
  const questionToDelete = await Question.findById({ _id: questionID });

  // Step 5 If no question is found with the specified ID throw Error
  if (!questionToDelete) {
    return res
      .status(404)
      .json(new ApiError(404, "Question with specified ID doesnt Exist."));
  }

  // Step 6 If everything matches DELETE the question along with its answers
  await Question.deleteOne({ _id: questionID });

  return res
    .status(200)
    .json(
      new ApiResponse(200, questionToDelete, "Question Deleted Successfully")
    );
});

export { addQuestions, getQuestion, updateQuestionById, deleteQuestionById };
