import { Router } from "express";
import {
  addQuestions,
  deleteQuestionById,
  getQuestion,
  updateQuestionById,
} from "../controllers/question.controller.js";
import { checkApiKey } from "../middlewares/apiKey.js";

// Initiate Router
const questionRouter = Router();

// [ POST ] METHOD to add questions to DB alongside API-KEY check middleware
questionRouter.route("/surveyQuestions").post(checkApiKey, addQuestions);

// [ PUT ] METHOD to retrieve one question by ID. Returns all question fields
questionRouter.route("/").put(checkApiKey, updateQuestionById);

// [ DELETE ] METHOD to delete a question by its ID.
questionRouter.route("/").delete(checkApiKey, deleteQuestionById);

// [ GET ] METHOD to retrieve all the questions follows pagination
questionRouter.route("/").get(checkApiKey, getQuestion);

export default questionRouter;
