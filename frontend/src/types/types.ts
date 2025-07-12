export interface Question {
  questionID: string;
  question: string;
  questionType: string;
  questionCategory: string;
  questionLevel: string;
  timesSkipped?: number;
  timesAnswered: number;
  answers?: Array<{
    answerID?: string;
    answer: string;
    responseCount?: number;
    isCorrect: boolean;        // Required boolean, defaults to false
    rank?: number;             // Optional - for MCQ questions
    score?: number;            // Optional - for scoring system
  }>;
  timeStamp?: boolean;
  createdAt?: string;
}

export interface Answer {
  answerID: string;
  questionId: string;
  answer: string;
  createdAt?: string;
}

export interface User {
  name: string;
  isAnonymous: boolean;
  role: "participant" | "admin" | "super_admin";
}

export interface Survey {
  surveyID: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}