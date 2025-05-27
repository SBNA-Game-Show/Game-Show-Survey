export const DB_NAME = "database_Test";

// Enums for question Type
export const QUESTION_TYPE = Object.freeze({
  MCQ: "Mcq",
  INPUT: "Input",
});

// Enums for question Category
export const QUESTION_CATEGORY = Object.freeze({
  VOCABULARY: "Vocabulary",
  LITERATUREandCULTURE: "Literature & Culture",
  GRAMMARandLANGUAGE: "Grammar & Language",
});

// Enums for question Level
export const QUESTION_LEVEL = Object.freeze({
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
})

// Enums for Role-based access
export const USER_ROLE = Object.freeze({
  ADMIN: "Admin",
  USER: "User"
});
