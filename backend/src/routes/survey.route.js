import { Router } from "express";
import {
  getQuestion,
  addAnswerToQuestion,
} from "../controllers/question.controller.js";
import { checkApiKey } from "../middlewares/apiKey.js";
import checkIfAdminRoute from "../middlewares/isAdmin.js";

// routes handled under: api/v1/survey
// for simple user actions
const surveyRouter = Router();

// [ GET ] METHOD to retrieve all the questions for USERS
surveyRouter.route("/").get(checkApiKey, checkIfAdminRoute, getQuestion);

// [ PUT ] METHOD to add answers to the questions
surveyRouter.route("/").put(checkApiKey, addAnswerToQuestion);

export default surveyRouter;
