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

  // 1. Get all IDs from incoming update data
  const idsToUpdate = questionsData.map((q) => q.questionID);

  // 2. Fetch all existing questions from DB in one query by IDs
  const existingQuestions = await Question.find({ _id: { $in: idsToUpdate } });

  // 3. Build a Map for quick lookup by ID
  const questionMap = new Map(existingQuestions.map((q) => [q._id, q]));

  // 4. Array to hold update results
  const updatedQuestions = [];

  // 5. Loop over each update data
  for (const data of questionsData) {
    const {
      questionID,
      question,
      questionCategory,
      questionLevel,
      questionType,
      answers,
    } = data;

    // Validate required fields
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

    // 6. Get existing question from map
    const existingQuestion = questionMap.get(questionID);
    if (!existingQuestion) {
      throw new ApiError(404, `Question not found: ID ${questionID}`);
    }

    // 7. Check for duplicates (exclude current question)
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

    // 8. Perform update in DB
    const updatedQuestion = await Question.findByIdAndUpdate(
      questionID,
      {
        $set: {
          question: normalizedQuestion,
          questionCategory,
          questionLevel,
          questionType,
          answers: answers
            ? answers.map((a) => ({
                _id: a._id, // if you want to keep the same id or generate new one
                answer: a.answer,
                responseCount: a.responseCount || 0,
                isCorrect: a.isCorrect || false,
                rank: a.rank,
                score: a.score,
              }))
            : undefined,
        },
      },
      { new: true }
    );

    updatedQuestions.push(updatedQuestion);
  }

  return updatedQuestions;
}

async function deleteQuestionById(questionDataArray) {
  // Step 1: Validate the input is a non-empty array
  if (!Array.isArray(questionDataArray) || questionDataArray.length === 0) {
    throw new ApiError(
      400,
      "Request body must contain an array of questions to delete."
    );
  }

  // Step 2: Extract all valid questionIDs
  const questionIDs = questionDataArray
    .map((q) => q.questionId)
    .filter((id) => typeof id === "string" && id.trim() !== "");

  if (questionIDs.length === 0) {
    throw new ApiError(400, "No valid Question IDs provided.");
  }

  // Step 3: Delete all questions with matching IDs in a single DB call
  const result = await Question.deleteMany({
    _id: { $in: questionIDs },
  });

  // Step 4: Handle case when no documents were deleted
  if (result.deletedCount === 0) {
    throw new ApiError(404, "No questions were deleted. IDs may be invalid.");
  }

  // Step 5: Return the result for logging or confirmation
  return {
    deletedCount: result.deletedCount,
    message: `${result.deletedCount} question(s) deleted successfully.`,
  };
}

export {
  getQuestionForAdmin,
  getQuestionsForUser,
  addQuestions,
  updateQuestionById,
  deleteQuestionById,
};
