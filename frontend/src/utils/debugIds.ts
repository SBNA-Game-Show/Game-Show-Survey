// Debug utility to help identify ID mapping issues
// Place this in src/utils/debugIds.ts

export const debugQuestionIds = (questions: any[], source: string) => {
  console.group(`🔍 Debug Question IDs from ${source}`);

  questions.forEach((q, index) => {
    console.log(`Question ${index + 1}:`, {
      _id: q._id,
      questionID: q.questionID,
      id: q.id,
      question: q.question?.substring(0, 30) + "...",
      hasAnswers: q.answers?.length || 0,
    });

    if (q.answers && q.answers.length > 0) {
      console.log(
        `  Answers:`,
        q.answers.map((a: any) => ({
          _id: a._id,
          answerID: a.answerID,
          id: a.id,
          answer: a.answer?.substring(0, 20) + "...",
        }))
      );
    }
  });

  console.groupEnd();
};

export const debugApiResponse = (response: any, endpoint: string) => {
  console.group(`🌐 Debug API Response from ${endpoint}`);
  console.log("Raw response:", response);
  console.log("Response type:", typeof response);
  console.log("Is array:", Array.isArray(response));

  if (response && response.data) {
    console.log("Response.data type:", typeof response.data);
    console.log("Response.data is array:", Array.isArray(response.data));
    if (Array.isArray(response.data)) {
      debugQuestionIds(response.data, `${endpoint} response.data`);
    }
  }

  console.groupEnd();
};

// Add this to your ResponsesPage.tsx to debug the navigation issue
export const debugQuestionNavigation = (
  questionId: string,
  allQuestions: any[]
) => {
  console.group(`🎯 Debug Question Navigation`);
  console.log("Looking for question ID:", questionId);
  console.log(
    "Available questions:",
    allQuestions.map((q) => ({
      _id: q._id,
      questionID: q.questionID,
      id: q.id,
      question: q.question?.substring(0, 30) + "...",
    }))
  );

  const foundBy_id = allQuestions.find((q) => q._id === questionId);
  const foundByQuestionID = allQuestions.find(
    (q) => q.questionID === questionId
  );
  const foundById = allQuestions.find((q) => q.id === questionId);

  console.log("Found by _id:", foundBy_id ? "YES" : "NO");
  console.log("Found by questionID:", foundByQuestionID ? "YES" : "NO");
  console.log("Found by id:", foundById ? "YES" : "NO");

  console.groupEnd();

  return foundBy_id || foundByQuestionID || foundById;
};
