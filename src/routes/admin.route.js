import { Router } from "express";
import {
  addQuestions,
  getQuestion,
  updateQuestionById,
  deleteQuestionById,
} from "../controllers/question.controller.js";
import {
  addFinalQuestions,
  getFinalQuestions,
  updateFinalQuestionById,
  deleteFinalQuestionById,
} from "../controllers/finalQuestion.controller.js";
 import { 
    loginAdmin,
    logoutAdmin,
    refreshAccessToken
} from "../controllers/admin.controller.js";
import checkIfAdminRoute from "../middlewares/isAdmin.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";  

// routes handled under: api/v1/admin
// for admin-level CRUD operations
const adminRouter = Router();

// [ POST ] METHOD for login an administrator
adminRouter.route("/login").post(checkIfAdminRoute, loginAdmin);

// [ POST ] METHOD for logout an administrator
adminRouter.route("/logout").post(checkIfAdminRoute, verifyJWT, logoutAdmin);

// [ POST ] METHOD for refresh-token
adminRouter.route("/refresh-token").post(checkIfAdminRoute, refreshAccessToken);

// [ POST ] METHOD to add questions to DB alongside API-KEY check middleware
adminRouter.route("/survey")
  .post(checkIfAdminRoute, verifyJWT, addQuestions);

// [ GET ] METHOD will get all the Questions and Answers for ADMIN
adminRouter.route("/survey")
  .get(checkIfAdminRoute, verifyJWT, getQuestion);

// [ PUT ] METHOD to retrieve one question by ID. Returns all question fields
adminRouter.route("/survey")
  .put(checkIfAdminRoute, verifyJWT, updateQuestionById);

// [ DELETE ] METHOD to delete a question by its ID.
adminRouter.route("/survey")
  .delete(checkIfAdminRoute, verifyJWT, deleteQuestionById);

/////////////////////// ________________________ ///////////////////
////////////////////// |                       | ///////////////////
////////////////////// |                       | ///////////////////
////////////////////// | FINAL QUESTION ROUTES | ///////////////////
////////////////////// |                       | ///////////////////
////////////////////// |                       | ///////////////////
/////////////////////// ________________________ ///////////////////

// routes handled under: api/v1/admin/survey/final
// for finalizing valid questions and answers

// [ POST ] METHOD to apply finalized questions and correct responses to finalQuestionSchema
adminRouter
  .route("/survey/final")
  .post(checkIfAdminRoute, verifyJWT, addFinalQuestions);

// [ PUT ] METHOD to make changes to a finalized question's fields in the DataBase by ID
adminRouter
  .route("/survey/final")
  .put(checkIfAdminRoute, verifyJWT, updateFinalQuestionById);

// [ GET ] METHOD to retrieve all questions and answers for admin, users will only see questions
adminRouter
  .route("/survey/final")
  .get(checkIfAdminRoute, verifyJWT, getFinalQuestions);

// [ DELETE ] METHOD to delete a question from the finalized DataBase
adminRouter
  .route("/survey/final")
  .delete(checkIfAdminRoute, verifyJWT, deleteFinalQuestionById);

export default adminRouter;
