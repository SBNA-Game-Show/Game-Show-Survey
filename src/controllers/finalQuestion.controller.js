import { FinalQuestion } from "../models/finalQuestion.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
 
/*
  ROUTE METHOD FOR
  ADDING  QUESTIONS TO DATABASE
*/
const updateFinalQuestions = asyncHandler(async (req, res) => {
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
  let finalQuestions = [];
  for (const q of questions) {
    const {
      question,
      questionType,
      questionCategory,
      questionLevel,
      timesSkipped,
      timesAnswered,
      answers
    } = q;
 
    // Step 5: Check for missing required fields
    if (
      [question, questionCategory, questionLevel, questionType].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required for every question");
    }
 
    // Step 6: Normalize question text to avoid case-based duplicates
    const normalizedQuestion = question.toLowerCase().trim();
 
    const alreadyExists = await FinalQuestion.findOne({
          question: normalizedQuestion,
          questionType,
          questionCategory,
          questionLevel,
        });
 
    // validating if the answer is correct
    const filteredAnswers = answers.filter((a) => {
      return a.isCorrect === true;
    })
 
 
    // Step 8: Only add question to valid list if it's not a duplicate
    if (!alreadyExists) {
    finalQuestions.push({
      question: normalizedQuestion,
      questionCategory,
      questionLevel,
      questionType,
      timesSkipped,
      timesAnswered,
      answers: filteredAnswers
    });
    }
  }
 
  if (finalQuestions.length === 0) {
      throw new ApiError(409, "All questions provided are duplicate");
    }
 
 
 
 
  // Step 10: Insert valid questions into DB
  const insertedQuestions = await FinalQuestion.insertMany(finalQuestions);
 
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        insertedQuestions,
        "Question added to finalized DB successfully "
      )
    );
});
 
export { updateFinalQuestions}