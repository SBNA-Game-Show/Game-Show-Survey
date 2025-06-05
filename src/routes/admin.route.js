import { Router } from "express";
import {
    addQuestions,
    getQuestion,
    updateQuestionById,
    deleteQuestionById
 } from "../controllers/question.controller.js";
import { checkApiKey } from "../middlewares/apiKey.js";
import checkIfAdminRoute from "../middlewares/isAdmin.js";

// routes handled under: api/v1/admin
// for admin-level CRUD operations
const adminRouter = Router();

// [ POST ] METHOD to add questions to DB alongside API-KEY check middleware
adminRouter.route("/surveyQuestions").post(checkApiKey, checkIfAdminRoute, addQuestions);

// [ GET ] METHOD will get all the Questions and Answers for ADMIN
adminRouter.route("/survey").get(checkApiKey, checkIfAdminRoute, getQuestion);

// [ PUT ] METHOD to retrieve one question by ID. Returns all question fields
adminRouter.route("/survey").put(checkApiKey, checkIfAdminRoute, updateQuestionById);

// [ DELETE ] METHOD to delete a question by its ID.
adminRouter.route("/survey").delete(checkApiKey, checkIfAdminRoute, deleteQuestionById);

// routes handled under: api/v1/admin/survey/final
// for finalizing valid questions and answers

// [ POST ] METHOD to apply finalized questions and correct responses to finalQuestionSchema
adminRouter.route("/survey/final").put(checkApiKey, checkIfAdminRoute, updateFinalQuestions)


export default adminRouter;
