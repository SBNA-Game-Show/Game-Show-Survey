import { QUESTION_TYPE } from "../constants.js";
import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/ApiError.js";
import { v4 as uuidv4 } from "uuid";
import { SCHEMA_MODELS } from "../utils/enums.js";

async function getQuestionForAdmin(collection) {
  // Fetch all questions with full details including answers and timesSkipped,
  // sorted by newest first
  const questions = await collection
    .find({})
    .select(
      "_id question questionCategory questionLevel questionType answers timesSkipped timesAnswered"
    )
    .sort({ createdAt: -1 });
  return questions;
}

async function getQuestionsForUser(
  collection,
  types = [QUESTION_TYPE.INPUT, QUESTION_TYPE.MCQ]
) {
  // Initialize empty list for queries
  const queries = [];

  // If INPUT questions are requested, prepare query without answers
  if (types.includes(QUESTION_TYPE.INPUT)) {
    queries.push(
      collection
        .find({ questionType: QUESTION_TYPE.INPUT })
        .select("_id question questionCategory questionLevel questionType")
        .sort({ createdAt: -1 })
    );
  }

  // { [ NEEDED FOR GAME TIME NOT FOR USERS WHEN DOING SURVEY]}

  /*
  If MCQ questions are requested, prepare query including answers
  if (types.includes(QUESTION_TYPE.MCQ)) {
    queries.push(
      collection.find({ questionType: QUESTION_TYPE.MCQ })
        .select(
          "_id question questionCategory questionLevel questionType answers.answer"
        )
        .sort({ createdAt: -1 })
    );
  }
*/

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

async function addQuestions(questions, collection) {
  // Step 1: Validate that it's a non-empty array
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, "Question must not be an empty Array");
  }

  let validQuestions = [];

  for (const q of questions) {
    let {
      question,
      questionType,
      questionCategory,
      questionLevel,
      timesSkipped,
      timesAnswered,
      answers,
    } = q;

    // ── Normalize type ────────────────────────────────────────────────
    const rawType = (questionType || "").trim();        // e.g. "Mcq", "MCQ", "Input"
    const normalizedType = rawType.toUpperCase();       // e.g. "MCQ", "INPUT"

    // Values from constants (these must match your schema enum)
    const mcqConst = QUESTION_TYPE.MCQ;      // "MCQ"
    const inputConst = QUESTION_TYPE.INPUT;  // "Input"

    const isMcq =
      normalizedType === "MCQ" || rawType === mcqConst;
    const isInput =
      normalizedType === "INPUT" || rawType === inputConst;

    // 👇 This is what we actually save into Mongo
    let canonicalType = rawType;
    if (isMcq) {
      canonicalType = mcqConst;     // => "MCQ"
    } else if (isInput) {
      canonicalType = inputConst;   // => "Input"
    }

    // Step 3: Check for missing required fields
    if (
      [question, questionCategory, questionLevel, canonicalType].some(
        (field) => !field || field.toString().trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required for every question");
    }

    // ── MCQ validation ───────────────────────────────────────────────
    if (isMcq) {
      if (!Array.isArray(answers) || answers.length !== 4) {
        throw new ApiError(
          400,
          "Question Type of MCQ must have 4 Answer options along with it"
        );
      }

      const correctAnswers = answers.filter((a) => a.isCorrect === true);
      if (correctAnswers.length !== 1) {
        throw new ApiError(400, "MCQ must have exactly one correct answer");
      }

      const hasEmptyAnswer = answers.some(
        (a) => !a.answer || a.answer.trim() === ""
      );
      if (hasEmptyAnswer) {
        throw new ApiError(400, "Each MCQ answer must have non-empty text");
      }

      const answerTexts = answers.map((a) => a.answer.toLowerCase().trim());
      const hasDuplicates =
        new Set(answerTexts).size !== answerTexts.length;
      if (hasDuplicates) {
        throw new ApiError(400, "MCQ answer options must be unique");
      }
    }

    // Step 4: Normalize question text to avoid case-based duplicates
    const normalizedQuestion = (question || "").toLowerCase().trim();

    // Step 5: Check if the question already exists in the DB
    const alreadyExists = await collection.findOne({
      question: normalizedQuestion,
      questionType: canonicalType,   // ✅ use canonicalType
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
        questionType: canonicalType, // ✅ "MCQ" or "Input"
        timesSkipped,
        timesAnswered,
      };

      // ── FINALQUESTION collection ───────────────────────────────────
      if (collection === SCHEMA_MODELS.FINALQUESTION) {
        let filteredAnswers = [];

        if (isInput) {
          if (!Array.isArray(answers) || answers.length < 1) {
            throw new ApiError(
              400,
              "Input Questions must have at least 1 valid answer"
            );
          }

          filteredAnswers = answers.filter((a) => a.isCorrect === true);

          if (filteredAnswers.length < 1) {
            throw new ApiError(
              400,
              "Input type questions must have at least 1 correct answer"
            );
          }
        } else if (isMcq) {
          filteredAnswers = answers || [];
        } else {
          filteredAnswers = answers || [];
        }

        newQuestion.answers = filteredAnswers.map((a) => ({
          answer: a.answer,
          _id: uuidv4(),
          isCorrect: a.isCorrect,
          responseCount: a.responseCount ?? 0,
          rank: a.rank ?? 0,
          score: a.score ?? 0,
        }));
      }

      // ── QUESTION collection MCQs (for survey taking) ───────────────
      if (
        collection === SCHEMA_MODELS.QUESTION &&
        isMcq &&
        Array.isArray(answers)
      ) {
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
  const insertedQuestions = await collection.insertMany(validQuestions);

  return insertedQuestions;
}



async function updateQuestionById(questionsData, collection) {
  if (!Array.isArray(questionsData) || questionsData.length === 0) {
    throw new ApiError(400, "Questions data must be a non-empty array");
  }

  const allowedTypes = Object.values(QUESTION_TYPE);

  // 1. Get all IDs from incoming update data
  const idsToUpdate = questionsData.map((q) => q.questionID);

  // 2. Fetch all existing questions from DB in one query by IDs
  const existingQuestions = await collection.find({
    _id: { $in: idsToUpdate },
  });

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
    const missingFields = [];

    if (!questionID) missingFields.push("questionID");
    if (!question) missingFields.push("question");
    if (!questionCategory) missingFields.push("questionCategory");
    if (!questionLevel) missingFields.push("questionLevel");
    if (!questionType) missingFields.push("questionType");

    if (missingFields.length > 0) {
      throw new ApiError(
        400,
        `Missing required fields: ${missingFields.join(", ")}`
      );
    }

    if (!allowedTypes.includes(questionType)) {
      throw new ApiError(
        400,
        `Invalid questionType. Allowed: ${allowedTypes.join(", ")}`
      );
    }
    if (answers) {
      // Ensure all answers have an ID (needed for updates)
      const missingAnswerId = answers.some((a) => !a.answerID);
      if (missingAnswerId) {
        throw new ApiError(
          400,
          "Each answer must have a valid answerID for update."
        );
      }
    }
    if (collection === SCHEMA_MODELS.FINALQUESTION) {
      // INPUT questions must have exactly one correct answer
      if (questionType === QUESTION_TYPE.INPUT) {
        const correctAnswers = answers.filter((a) => a.isCorrect === true);
        if (correctAnswers.length < 1) {
          throw new ApiError(400, "Must have atleast 1 correct answer set to Correct");
        }
      }
    }
    if (questionType === QUESTION_TYPE.MCQ) {
      // Must have exactly 4 options
      if (!Array.isArray(answers) || answers.length !== 4) {
        throw new ApiError(
          400,
          "MCQ Type questions must have exactly 4 answer options"
        );
      }
      // Only one answer should be correct
      const correctAnswers = answers.filter((a) => a.isCorrect === true);
      if (correctAnswers.length !== 1) {
        throw new ApiError(400, "MCQ must have exactly one correct answer");
      }
      // All answers must have non-empty text
      const hasEmptyAnswer = answers.some(
        (a) => !a.answer || a.answer.trim() === ""
      );
      if (hasEmptyAnswer) {
        throw new ApiError(400, "Each MCQ answer must have non-empty text");
      }
      // Answer options must be unique (case-insensitive)
      const answerTexts = answers.map((a) => a.answer.toLowerCase().trim());
      const hasDuplicates = new Set(answerTexts).size !== answerTexts.length;
      if (hasDuplicates) {
        throw new ApiError(400, "MCQ answer options must be unique");
      }
    }
    // Normalize question text for consistency
    const normalizedQuestion = question.toLowerCase().trim();

    // 6. Get existing question from map
    const existingQuestion = questionMap.get(questionID);
    if (!existingQuestion) {
      throw new ApiError(404, `Question not found: ID ${questionID}`);
    }

    // 7. Check for duplicates (exclude current question)
    const duplicate = await collection.findOne({
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
    const updatedQuestion = await collection.findByIdAndUpdate(
      questionID,
      {
        $set: {
          question: normalizedQuestion,
          questionCategory,
          questionLevel,
          questionType,
          answers: answers
            ? answers.map((a) => ({
                _id: a.answerID, // if you want to keep the same id or generate new one
                answer: a.answer.trim().toLowerCase(),
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

async function deleteQuestionById(questionDataArray, collection) {
  // Step 1: Validate the input is a non-empty array
  if (!Array.isArray(questionDataArray) || questionDataArray.length === 0) {
    throw new ApiError(
      400,
      "Request body must contain an array of questions to delete."
    );
  }

  // Step 2: Extract all valid questionIDs
  const questionIDs = questionDataArray
    .map((q) => q.questionID)
    .filter((id) => typeof id === "string" && id.trim() !== "");

  if (questionIDs.length === 0) {
    throw new ApiError(400, "No valid Question IDs provided.");
  }

  // Step 3: Delete all questions with matching IDs in a single DB call
  const result = await collection.deleteMany({
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

async function addAnswerToQuestion(questions, answers) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, "Question must not be an empty Array");
  }

  const bulkOps = [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const answerInput = answers[i];

    if (!question.questionID || question.questionID.trim() === "") {
      throw new ApiError(400, "Missing question ID");
    }

    const qID = question.questionID;
    const answerText = answerInput?.answer?.toLowerCase().trim();

    // Case 1: Answer is blank — increment `timesSkipped`
    if (!answerText) {
      bulkOps.push({
        updateOne: {
          filter: { _id: qID },
          update: { $inc: { timesSkipped: 1 } },
        },
      });
      continue;
    }

    // Case 2: Answer is valid — try increment OR push
    // First try to increment if answer exists
    bulkOps.push({
      updateOne: {
        filter: { _id: qID, "answers.answer": answerText },
        update: {
          $inc: { timesAnswered: 1, "answers.$.responseCount": 1 },
        },
      },
    });

    // Then add a fallback push in case it didn’t exist
    bulkOps.push({
      updateOne: {
        filter: { _id: qID, "answers.answer": { $ne: answerText } },
        update: {
          $inc: { timesAnswered: 1 },
          $push: {
            answers: {
              _id: uuidv4(),
              answer: answerText,
              responseCount: 1,
            },
          },
        },
      },
    });
  }

  if (bulkOps.length === 0) {
    throw new ApiError(400, "No valid question/answer pairs provided");
  }

  // Final step: execute all operations at once
  await Question.bulkWrite(bulkOps);
}

export {
  getQuestionForAdmin,
  getQuestionsForUser,
  addQuestions,
  updateQuestionById,
  deleteQuestionById,
  addAnswerToQuestion,
};
