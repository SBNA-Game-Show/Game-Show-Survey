// Fixed userSurveyApi.ts - Proper ID handling for user survey operations
import { API_BASE, defaultHeaders } from "./config";
import { Question } from "../../types/types";

interface QuestionsResponse {
  statusCode: number;
  data: RawQuestion[];
  message: string;
  success: boolean;
}

interface RawQuestion {
  _id: string; // Backend uses _id, not questionID
  question: string;
  questionType: string;
  questionCategory: string;
  questionLevel: string;
  timesAnswered?: number;
  timesSkipped?: number;
  answers?: Array<{
    _id?: string; // Backend uses _id for answers too
    answer: string;
    responseCount?: number;
    isCorrect?: boolean;
  }>;
  timeStamp?: boolean;
  createdAt?: string;
}

export async function fetchAllQuestions(): Promise<Question[]> {
  console.log("🌐 Fetching all questions from user API...");

  const res = await fetch(`${API_BASE}/api/v1/survey/`, {
    headers: defaultHeaders,
  });

  if (!res.ok) {
    throw new Error(`Network error: ${res.status}`);
  }

  const body = (await res.json()) as QuestionsResponse;

  if (!body.success) {
    throw new Error(`Server error: ${body.message}`);
  }

  console.log("📋 Raw questions received:", body.data.length);

  // FIX: Map _id to questionID correctly and handle all ID variations
  const transformedQuestions = body.data.map(
    (raw): Question => ({
      questionID: raw._id, // Map _id to questionID for frontend consistency
      question: raw.question,
      questionType: raw.questionType || "Input",
      questionCategory: raw.questionCategory,
      questionLevel: raw.questionLevel,
      timesAnswered: raw.timesAnswered || 0,
      timesSkipped: raw.timesSkipped || 0,
      answers: raw.answers?.map((ans) => ({
        answerID: ans._id, // Map _id to answerID for frontend consistency
        answer: ans.answer,
        responseCount: ans.responseCount || 0,
        isCorrect: ans.isCorrect || false,
      })),
      timeStamp: raw.timeStamp,
      createdAt: raw.createdAt,
    })
  );

  console.log(
    "✅ Transformed questions:",
    transformedQuestions.map((q) => ({
      questionID: q.questionID,
      question: q.question.substring(0, 30) + "...",
    }))
  );

  return transformedQuestions;
}

export async function fetchQuestionsByLevel(
  level: string
): Promise<Question[]> {
  console.log("🎯 Fetching questions for level:", level);

  const all = await fetchAllQuestions();
  const filtered = all.filter((q) => q.questionLevel === level);

  console.log(`📊 Found ${filtered.length} questions for ${level} level`);
  return filtered;
}

// FIX: Update to use the correct submission format with proper ID mapping
export async function submitAllAnswers(
  answers: { questionID: string; answerText: string }[]
): Promise<void> {
  console.log("📤 Submitting answers:", answers.length);

  // Transform to the correct format expected by the backend
  // Backend expects _id format, so we need to map questionID back to _id
  const payload = {
    questions: answers.map((a) => ({ questionID: a.questionID })), // Use _id format for backend
    answers: answers.map((a) => ({ answer: a.answerText })),
  };

  console.log("🚀 Submission payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(`${API_BASE}/api/v1/survey/`, {
    method: "PUT",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Submission failed:", res.status, text);

    let message;
    try {
      const json = JSON.parse(text);
      message = json.message || "Failed to submit answers";
    } catch (e) {
      message = `Server error (${res.status} ${res.statusText})`;
    }
    throw new Error(message);
  }

  console.log("✅ Answers submitted successfully");
}

// FIX: Update single answer submission format
export async function submitSingleAnswer(
  questionID: string,
  answer: string
): Promise<void> {
  console.log("📤 Submitting single answer for question:", questionID);

  const payload = {
    questions: [{ questionID: questionID }], // Use _id format for backend
    answers: [{ answer: answer }],
  };

  console.log("🚀 Single answer payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(`${API_BASE}/api/v1/survey/`, {
    method: "PUT",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Single answer submission failed:", res.status, text);

    let message;
    try {
      const json = JSON.parse(text);
      message = json.message || "Failed to submit answer";
    } catch (e) {
      message = `Server error (${res.status} ${res.statusText})`;
    }
    throw new Error(message);
  }

  console.log("✅ Single answer submitted successfully");
}

export async function submitAnswer(
  qId: string,
  answerText: string
): Promise<void> {
  await submitSingleAnswer(qId, answerText);
}
