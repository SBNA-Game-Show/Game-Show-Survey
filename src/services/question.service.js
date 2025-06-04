import { QUESTION_TYPE } from "../constants.js";
import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/ApiError.js";
import { v4 as uuidv4 } from "uuid";
async function getQuestionForAdmin() {
  // Fetch all questions with full details including answers and timesSkipped,
  // sorted by newest first
  const questions = await Question.find({})
    .select(
      "_id question questionCategory questionLevel questionType answers timesSkipped"
    )
    .sort({ createdAt: -1 });
  return questions;
}

async function getQuestionsForUser(
  types = [QUESTION_TYPE.INPUT, QUESTION_TYPE.MCQ]
) {
  // Initialize empty list for queries
  const queries = [];

  // If INPUT questions are requested, prepare query without answers
  if (types.includes(QUESTION_TYPE.INPUT)) {
    queries.push(
      Question.find({ questionType: QUESTION_TYPE.INPUT })
        .select("_id question questionCategory questionLevel questionType")
        .sort({ createdAt: -1 })
    );
  }

  // If MCQ questions are requested, prepare query including answers
  if (types.includes(QUESTION_TYPE.MCQ)) {
    queries.push(
      Question.find({ questionType: QUESTION_TYPE.MCQ })
        .select(
          "_id question questionCategory questionLevel questionType answers"
        )
        .sort({ createdAt: -1 })
    );
  }

  try {
    // Execute all queries in parallel and combine results
    const results = await Promise.all(queries);
    const finalQuestions = results.flat();
    return finalQuestions;
  } catch (error) {
    // Wrap or rethrow the error with ApiError for consistent handling
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to Retrieve questions", error);
  }
}

async function addQuestions(questions) {
  // Step 1: Validate that it's a non-empty array
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, "Question must not be an empty Array");
  }

  // Step 2: Initialize a list to store valid (non-duplicate) questions
  let validQuestions = [];
  for (const q of questions) {
    const { question, questionType, questionCategory, questionLevel, answers } =
      q;

    // Step 3: Check for missing required fields
    if (
      [question, questionCategory, questionLevel, questionType].some(
        (field) => !field || field.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required for every question");
    }
    if (questionType === QUESTION_TYPE.MCQ) {
      if (!Array.isArray(answers) || answers.length != 4) {
        throw new ApiError(
          "400",
          "Question Type of MCQ must have 4 Answer options along with it"
        );
      }
      //  Check that exactly one answer is marked correct
      const correctAnswers = answers.filter((a) => a.isCorrect === true);
      if (correctAnswers.length !== 1) {
        throw new ApiError(400, "MCQ must have exactly one correct answer");
      }

      // Check each answer is non-empty
      const hasEmptyAnswer = answers.some(
        (a) => !a.answer || a.answer.trim() === ""
      );
      if (hasEmptyAnswer) {
        throw new ApiError(400, "Each MCQ answer must have non-empty text");
      }

      //  Ensure no duplicate answers
      const answerTexts = answers.map((a) => a.answer.toLowerCase().trim());
      const hasDuplicates = new Set(answerTexts).size !== answerTexts.length;
      if (hasDuplicates) {
        throw new ApiError(400, "MCQ answer options must be unique");
      }
    }

    // Step 4: Normalize question text to avoid case-based duplicates
    const normalizedQuestion = question.toLowerCase().trim();
    // Step 5: Check if the question already exists in the DB
    const alreadyExists = await Question.findOne({
      question: normalizedQuestion,
      questionType,
      questionCategory,
      questionLevel,
    });

    // Step 6: Only add question to valid list if it's not a duplicate
    if (!alreadyExists) {
      const newQuestion = {
        _id: uuidv4(),
        question: normalizedQuestion,
        questionCategory,
        questionLevel,
        questionType,
      };

      // Only attach answers if it's MCQ
      if (questionType === QUESTION_TYPE.MCQ && Array.isArray(answers)) {
        newQuestion.answers = answers.map((a) => ({
          answer: a.answer,
          _id: uuidv4(),
          isCorrect: a.isCorrect,
          responseCount: 0,
        }));
      }

      validQuestions.push(newQuestion);
    }
  }

  // Step 7: If no new questions to insert, send a proper response
  if (validQuestions.length === 0) {
    throw new ApiError(
      409,
      "Questions provided are duplicate including all the fields"
    );
  }

  // Step 8: Insert valid questions into DB
  const insertedQuestions = await Question.insertMany(validQuestions);

  return insertedQuestions;
}

async function updateQuestionById(questionsData) {
  if (!Array.isArray(questionsData) || questionsData.length === 0) {
    throw new ApiError(400, "Questions data must be a non-empty array");
  }

  const allowedTypes = Object.values(QUESTION_TYPE);

  const updatePromises = questionsData.map(async (data) => {
    const {
      questionID,
      question,
      questionCategory,
      questionLevel,
      questionType,
    } = data;

    // Validate input
    if (
      !questionID ||
      !question ||
      !questionCategory ||
      !questionLevel ||
      !questionType
    ) {
      throw new ApiError(400, "Missing required fields for a question");
    }

    if (!allowedTypes.includes(questionType)) {
      throw new ApiError(
        400,
        `Invalid questionType. Allowed: ${allowedTypes.join(", ")}`
      );
    }

    const normalizedQuestion = question.toLowerCase().trim();

    // Check question exists
    const existingQuestion = await Question.findById(questionID);
    if (!existingQuestion) {
      throw new ApiError(404, `Question not found: ID ${questionID}`);
    }

    // Check duplicate excluding itself
    const duplicate = await Question.findOne({
      _id: { $ne: questionID },
      question: normalizedQuestion,
      questionCategory,
      questionLevel,
      questionType,
    });
    if (duplicate) {
      throw new ApiError(
        409,
        `Duplicate question exists for question ID ${questionID}`
      );
    }

    // Perform update
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionID,
      {
        $set: {
          question: normalizedQuestion,
          questionCategory,
          questionLevel,
          questionType,
        },
      },
      { new: true }
    );

    return updatedQuestion;
  });

  // Run all updates concurrently and wait for all to finish
  const updatedQuestions = await Promise.all(updatePromises);

  return updatedQuestions;
}

async function deleteQuestionById(data) {
  const { questionID } = data;

  // Step 3 If no ID throw Error
  if (!questionID) {
    throw new ApiError(403, "Question Id missing. Operation Failed !!");
  }

  // Step 4 Look for the question To Delete based on questionID
  const deletedQuestions = await Question.findByIdAndDelete({
    _id: questionID,
  });

  // Step 5 If no question is found with the specified ID throw Error
  if (!deletedQuestions) {
    throw new ApiError(404, "Question with specified ID doesnt Exist.");
  }

  return deletedQuestions;
}

export {
  getQuestionForAdmin,
  getQuestionsForUser,
  addQuestions,
  updateQuestionById,
  deleteQuestionById,
};
