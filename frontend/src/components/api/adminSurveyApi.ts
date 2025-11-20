// Updated adminSurveyApi.ts - Added updateQuestionWithAnswers method
import { API_BASE, defaultHeaders } from "./config";
import { Question, Answer } from "../../types/types";

export async function fetchAllQuestionsAdmin(): Promise<Question[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
      headers: defaultHeaders,
    });

    // Handle 404 specifically - this usually means no questions exist
    if (res.status === 404) {
      console.log("No questions found (404) - database might be empty");
      return []; // Return empty array instead of throwing error
    }

    if (!res.ok) {
      throw new Error(
        `Failed to fetch questions for Admin Page (${res.status}): ${res.statusText}`
      );
    }

    const { data } = await res.json();

    // Handle case where data is null/undefined but request was successful
    if (!data || !Array.isArray(data)) {
      console.log("No questions data returned from server");
      return [];
    }

    return data.map((q: any) => ({
      questionID: q._id || q.questionID, // Handle both _id and questionID from backend
      question: q.question,
      questionType: q.questionType,
      questionCategory: q.questionCategory,
      questionLevel: q.questionLevel,
      timesAnswered: q.timesAnswered || 0,
      timesSkipped: q.timesSkipped || 0,
      answers: q.answers
        ? q.answers.map((a: any) => ({
            answerID: a._id || a.answerID, // Handle both _id and answerID from backend
            answer: a.answer,
            isCorrect: a.isCorrect || false, // Default to false
            responseCount: a.responseCount,
            rank: a.rank,
            score: a.score,
          }))
        : [],
      timeStamp: q.timeStamp,
      createdAt: q.createdAt,
    }));
  } catch (error: any) {
    // If it's a network error or fetch failed, it might be because there are no questions
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Network error: Unable to connect to the server. Please check your connection."
      );
    }
    throw error;
  }
}

export async function deleteQuestionByIdAdmin(
  questionID: string
): Promise<void> {
  const payload = {
    questions: [{ questionID }],
  };

  const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
    method: "DELETE",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete question (${res.status}): ${errorText}`);
  }
}

export async function deleteAllQuestionsAdmin(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const payload = {
    questions: ids.map((questionID) => ({ questionID })),
  };

  const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
    method: "DELETE",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete questions (${res.status}): ${errorText}`);
  }
}

// EXISTING: Single question update function (without answers)
export async function updateSingleQuestion(question: Question): Promise<void> {
  // Build the payload with only the single question
  const questionData: any = {
    questionID: question.questionID,
    question: question.question,
    questionType: question.questionType,
    questionCategory: question.questionCategory,
    questionLevel: question.questionLevel,
  };

  // Only include answers array for MCQ questions
  if (question.questionType === "MCQ" && question.answers && question.answers.length > 0) {
    questionData.answers = question.answers.map((a) => ({
      answer: a.answer,
      isCorrect: a.isCorrect,
      answerID: a.answerID,
    }));
  }
  // For Input type questions, don't include answers array at all

  const payload = {
    questions: [questionData],
  };

  console.log("🚀 Single question PUT payload:", JSON.stringify(payload, null, 2));
  console.log("🔍 Updating question:", {
    questionID: question.questionID,
    question: question.question.substring(0, 30) + "...",
    type: question.questionType,
    hasAnswers: question.questionType === "MCQ" ? question.answers?.length || 0 : "N/A (Input type)",
  });

  const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
    method: "PUT",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("🚨 Single question PUT request failed:", res.status, errorText);
    throw new Error(`Failed to update question (${res.status}): ${errorText}`);
  }

  console.log("✅ Single question updated successfully");
}

// NEW: Question update function WITH answers (for answer validation)
export async function updateQuestionWithAnswers(question: Question): Promise<void> {
  // Build the payload with the question AND answers array
  const questionData: any = {
    questionID: question.questionID,
    question: question.question,
    questionType: question.questionType,
    questionCategory: question.questionCategory,
    questionLevel: question.questionLevel,
  };

  // ALWAYS include answers array for answer validation functionality
  if (question.answers && question.answers.length > 0) {
    questionData.answers = question.answers.map((a) => ({
      answerID: a.answerID,
      answer: a.answer,
      isCorrect: a.isCorrect, // This is the field we're updating
      responseCount: a.responseCount,
      // Only include rank and score if they exist in the answer object
      ...(a.rank !== undefined && { rank: a.rank }),
      ...(a.score !== undefined && { score: a.score }),
    }));
  } else {
    // Include empty answers array if no answers
    questionData.answers = [];
  }

  const payload = {
    questions: [questionData],
  };

  console.log("🚀 Question with answers PUT payload:", JSON.stringify(payload, null, 2));
  console.log("🔍 Updating question with answers:", {
    questionID: question.questionID,
    question: question.question.substring(0, 30) + "...",
    type: question.questionType,
    answersCount: question.answers?.length || 0,
    answersWithCorrectness: question.answers?.map((a, i) => ({
      index: i,
      answer: a.answer.substring(0, 20) + "...",
      isCorrect: a.isCorrect,
    })) || [],
  });

  const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
    method: "PUT",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("🚨 Question with answers PUT request failed:", res.status, errorText);
    throw new Error(`Failed to update question with answers (${res.status}): ${errorText}`);
  }

  console.log("✅ Question with answers updated successfully");
}

// KEPT: Batch update function for existing bulk operations
export async function updateSurveyQuestionsBatch(
  questions: Question[]
): Promise<void> {
  // Use the exact format that works in Postman
  const payload = {
    questions: questions.map((q) => {
      const questionData: any = {
        questionID: q.questionID, // This should be included!
        question: q.question,
        questionType: q.questionType,
        questionCategory: q.questionCategory,
        questionLevel: q.questionLevel,
      };

      // Only include answers array for MCQ questions
      if (q.questionType === "MCQ" && q.answers && q.answers.length > 0) {
        questionData.answers = q.answers.map((a) => ({
          answer: a.answer,
          isCorrect: a.isCorrect,
          answerID: a.answerID, // This should be included!
        }));
      }
      // For Input type questions, don't include answers array at all

      return questionData;
    }),
  };

  console.log("🚀 Batch PUT payload:", JSON.stringify(payload, null, 2));
  console.log(
    "🔍 Input questions received:",
    questions.map((q) => ({
      questionID: q.questionID,
      question: q.question.substring(0, 20) + "...",
      type: q.questionType,
      hasAnswers:
        q.questionType === "MCQ" ? q.answers?.length || 0 : "N/A (Input type)",
    }))
  );

  const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
    method: "PUT",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("🚨 PUT request failed:", res.status, errorText);
    throw new Error(`Bulk update failed (${res.status}): ${errorText}`);
  }
}

export async function postSurveyQuestions(
  questions: Question[]
): Promise<void> {
  const newQuestions = questions.filter((q) => !q.questionID);

  if (newQuestions.length === 0) return;

  const payload = {
    questions: newQuestions.map((q) => {
      const questionData: any = {
        question: q.question,
        questionType: q.questionType,
        questionCategory: q.questionCategory,
        questionLevel: q.questionLevel,
        answers: [],
      };

      if (q.questionType === "MCQ" && q.answers && q.answers.length > 0) {
        questionData.answers = q.answers.map((a) => ({
          answer: a.answer,
          isCorrect: a.isCorrect || false,
        }));
      }

      return questionData;
    }),
  };

  console.log("📝 POST payload:", JSON.stringify(payload, null, 2));
  const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("🚨 POST request failed:", res.status, errorText);
    throw new Error(
      `Failed to post survey questions (${res.status}): ${errorText}`
    );
  }
}

export async function fetchAllQuestionsAndAnswersAdmin(): Promise<{
  questions: Question[];
  answers: Answer[];
}> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
      headers: defaultHeaders,
    });

    // Handle 404 - no questions exist
    if (res.status === 404) {
      return { questions: [], answers: [] };
    }

    if (!res.ok) {
      throw new Error(
        `Failed to fetch questions (${res.status}): ${res.statusText}`
      );
    }

    const response = await res.json();
    const questions: Question[] = response.data || [];

    const transformedQuestions = questions.map((q: any) => ({
      questionID: q._id || q.questionID, // Handle both _id and questionID
      question: q.question,
      questionType: q.questionType,
      questionCategory: q.questionCategory,
      questionLevel: q.questionLevel,
      timesAnswered: q.timesAnswered || 0,
      timesSkipped: q.timesSkipped || 0,
      answers: q.answers
        ? q.answers.map((ans: any) => ({
            answerID: ans._id || ans.answerID, // Handle both _id and answerID
            answer: ans.answer || "",
            responseCount: ans.responseCount || 0,
            isCorrect: ans.isCorrect || false, // Default to false
          }))
        : [],
      timeStamp: q.timeStamp,
      createdAt: q.createdAt,
    }));

    let allAnswers: Answer[] = [];

    transformedQuestions.forEach((q: any) => {
      if (q.answers && Array.isArray(q.answers)) {
        q.answers.forEach((ans: any) => {
          for (let i = 0; i < (ans.responseCount || 1); i++) {
            allAnswers.push({
              answerID: ans.answerID,
              questionId: q.questionID,
              answer: ans.answer || "",
              createdAt: q.createdAt,
            });
          }
        });
      }
    });

    return { questions: transformedQuestions, answers: allAnswers };
  } catch (error: any) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to the server");
    }
    throw error;
  }
}

export async function fetchAnswersByQuestionId(
  questionId: string
): Promise<Answer[]> {
  try {
    console.log("🔍 Fetching answers for question ID:", questionId);

    const res = await fetch(`${API_BASE}/api/v1/admin/survey`, {
      headers: defaultHeaders,
    });

    if (res.status === 404) {
      console.log("❌ No questions found (404)");
      return [];
    }

    if (!res.ok) {
      throw new Error(
        `Failed to fetch answers for question ${questionId} (${res.status}): ${res.statusText}`
      );
    }

    const response = await res.json();
    const questions = response.data || [];
    console.log("📋 Total questions in database:", questions.length);

    // Find the question by ID - handle both _id and questionID formats
    
    //const question = questions.find(
      //(q: any) =>
        //q._id === questionId ||
        //q.questionID === questionId ||
        //String(q._id) === String(questionId) ||
        //String(q.questionID) === String(questionId)
    //);

    const question = questions.find((q: any) => {
  const id1 = q?._id != null ? String(q._id) : "";
  const id2 = q?.questionID != null ? String(q.questionID) : "";
  const target = String(questionId ?? "");
  return id1 === target || id2 === target;
});


    console.log("🎯 Found question:", question ? "Yes" : "No");

    if (!question) {
      console.log("❌ Question not found with ID:", questionId);
      console.log(
        "Available question IDs:",
        questions.map((q: any) => ({ _id: q._id, questionID: q.questionID }))
      );
      return [];
    }

    if (!question.answers || !Array.isArray(question.answers)) {
      console.log("📝 Question found but no answers array");
      return [];
    }

    let answers: Answer[] = [];
    question.answers.forEach((ans: any) => {
      const responseCount = ans.responseCount || 1;
      console.log(
        `💬 Processing answer: "${ans.answer}" with ${responseCount} responses`
      );

      for (let i = 0; i < responseCount; i++) {
        answers.push({
          answerID:
            ans._id || ans.answerID || `${questionId}-${answers.length}`,
          questionId: questionId,
          answer: ans.answer || "",
          createdAt: question.createdAt || new Date().toISOString(),
        });
      }
    });

    console.log("✅ Total answers processed:", answers.length);
    return answers;
  } catch (error: any) {
    console.error("❌ Error in fetchAnswersByQuestionId:", error);
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Network error: Unable to connect to the server");
    }
    throw error;
  }
}