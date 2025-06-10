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
    addAdmin, 
    updateAdmin, 
    deleteAdmin, 
    getAdmin,
    loginAdmin
} from "../controllers/admin.controller.js";
import { checkApiKey } from "../middlewares/apiKey.js";
import checkIfAdminRoute from "../middlewares/isAdmin.js";
import {protect } from "../middlewares/authMiddleware.js";  

// routes handled under: api/v1/admin
// for admin-level CRUD operations
const adminRouter = Router();

// [ POST ] METHOD for login an administrator
adminRouter.route("/login").post(checkApiKey, checkIfAdminRoute, loginAdmin);

// [ POST ] METHOD to add questions to DB alongside API-KEY check middleware
adminRouter.route("/survey")
  .post(checkApiKey, checkIfAdminRoute, protect, addQuestions);

// [ GET ] METHOD will get all the Questions and Answers for ADMIN
adminRouter.route("/survey")
  .get(checkApiKey, checkIfAdminRoute, protect, getQuestion);

// [ PUT ] METHOD to retrieve one question by ID. Returns all question fields
adminRouter.route("/survey")
  .put(checkApiKey, checkIfAdminRoute, protect, updateQuestionById);

// [ DELETE ] METHOD to delete a question by its ID.
adminRouter.route("/survey")
  .delete(checkApiKey, checkIfAdminRoute, protect, deleteQuestionById);

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
  .post(checkApiKey, checkIfAdminRoute, protect, addFinalQuestions);

// [ PUT ] METHOD to make changes to a finalized question's fields in the DataBase by ID
adminRouter
  .route("/survey/final")
  .put(checkApiKey, checkIfAdminRoute, protect, updateFinalQuestionById);

// [ GET ] METHOD to retrieve all questions and answers for admin, users will only see questions
adminRouter
  .route("/survey/final")
  .get(checkApiKey, checkIfAdminRoute, protect, getFinalQuestions);

// [ DELETE ] METHOD to delete a question from the finalized DataBase
adminRouter
  .route("/survey/final")
  .delete(checkApiKey, checkIfAdminRoute, protect, deleteFinalQuestionById);


// routes handled under: api/v1/admin/admins
// for superadmin

// [ POST ] METHOD for creating/adding new administrators
adminRouter.route("/superadmins").post(checkApiKey, checkIfAdminRoute, addAdmin);

// [ GET ] METHOD for retrieving an administrator by username
adminRouter.route("/superadmins").get(checkApiKey, checkIfAdminRoute, protect, getAdmin);

// [ PUT ] METHOD for updating an administator
adminRouter.route("/superadmins").put(checkApiKey, checkIfAdminRoute, updateAdmin);

// [ DELETE ] METHOD for deleting an administrator
adminRouter.route("/superadmins").delete(checkApiKey, checkIfAdminRoute, deleteAdmin);

export default adminRouter;
