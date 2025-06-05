import mongoose, { Schema } from "mongoose";
import {
  QUESTION_CATEGORY,
  QUESTION_LEVEL,
  QUESTION_TYPE,
} from "../constants.js";

const finalQuestionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    questionType: {
      type: String,
      enum: Object.values(QUESTION_TYPE),
      required: false,
    },
    questionCategory: {
      type: String,
      enum: Object.values(QUESTION_CATEGORY),
      required: false,
    },
    questionLevel: {
      type: String,
      enum: Object.values(QUESTION_LEVEL),
      required: false,
    },
    timesSkipped: { type: Number, required: false, min: 0, default: 0 },
    timesAnswered: { type: Number, required: false, min: 0, default: 0 },
    answers: [
      {
        answer: { type: String, required: false, trim: true },
        responseCount: { type: Number, required: false, min: 0, default: 0 },
        isCorrect: { type: Boolean, required: true, default: false },
        rank: { type: Number, required: false, min: 1, default: 1 },
        score: { type: Number, required: false, min: 0, default: 0 }
      },
    ],
  },
  { timestamps: true }
);

export const FinalQuestion = mongoose.model("FinalQuestion", finalQuestionSchema);
