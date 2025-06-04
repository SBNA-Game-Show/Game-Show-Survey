import { Router } from "express";
import {
    addQuestions,
    getQuestion,
    updateQuestionById,
    deleteQuestionById
 } from "../controllers/question.controller.js";
import { addAdmin, updateAdmin, deleteAdmin, getAdmin } from "../controllers/admin.controller.js";
import { checkApiKey } from "../middlewares/apiKey.js";
import checkIfAdminRoute from "../middlewares/isAdmin.js";
import { get } from "mongoose";

// routes handled under: api/v1/admin
// for admin-level CRUD operations
const adminRouter = Router();

// [ POST ] METHOD to add questions to DB alongside API-KEY check middleware
adminRouter.route("/surveyQuestions").post(checkApiKey, checkIfAdminRoute, addQuestions);

// [ GET ] this will get all the Questions and Answers for ADMIN
adminRouter.route("/survey").get(checkApiKey, checkIfAdminRoute, getQuestion);

// [ PUT ] METHOD to retrieve one question by ID. Returns all question fields
adminRouter.route("/").put(checkApiKey, checkIfAdminRoute, updateQuestionById);

// [ DELETE ] METHOD to delete a question by its ID.
adminRouter.route("/").delete(checkApiKey, checkIfAdminRoute, deleteQuestionById);



// [ POST ] METHOD for creating/adding new administrators
adminRouter.route("/admins").post(checkApiKey, checkIfAdminRoute, addAdmin);

// [ GET ] METHOD for retrieving an administrator by username
adminRouter.route("/admins").get(checkApiKey, checkIfAdminRoute, getAdmin);

// [ PUT ] METHOD for updating an administator
adminRouter.route("/admins").put(checkApiKey, checkIfAdminRoute, updateAdmin);

// [ DELETE ] METHOD for deleting an administrator
adminRouter.route("/admins").delete(checkApiKey, checkIfAdminRoute, deleteAdmin);


export default adminRouter;
