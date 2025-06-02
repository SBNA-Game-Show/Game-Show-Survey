import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
// Enable CORS with credentials (cookies, auth headers)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Parse incoming JSON requests (up to 20kb)
app.use(express.json({ limit: "20kb" }));

/*
Parse URL-encoded form data (also up to 20kb)
'extended: true' allows nested objects
*/
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Parse cookies from the request headers
app.use(cookieParser());

// -------- ROUTES --------

import surveyRouter from "./routes/survey.route.js";
import adminRouter from "./routes/admin.route.js";
// routes handlers
app.use("/api/v1/survey", surveyRouter);
app.use("/api/v1/admin", adminRouter);
export default app;
