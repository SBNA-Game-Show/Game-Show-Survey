import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
// Enable CORS with credentials (cookies, auth headers)
app.use(cors());


// Parse incoming JSON requests (up to 1mb)
app.use(express.json({ limit: "1mb" }));

/*
Parse URL-encoded form data (also up to 1mb)
'extended: true' allows nested objects
*/
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Parse cookies from the request headers
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.originalUrl}`);
  next();
});

app.use((req, res, next) => {
  console.log("🔍 Headers received by backend:", req.headers);
  next();
});

app.use((req, res, next) => {
  console.log("📦 Request body:", req.body);
  next();
});

app.use((req, res, next) => {
  console.log("🔑 x-api-key header:", req.headers["x-api-key"]);
  next();
});

app.use((req, res, next) => {
  console.log(`🕒 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});
// -------- ROUTES --------

import surveyRouter from "./routes/survey.route.js";
import adminRouter from "./routes/admin.route.js";
import transcribeRouter from "./routes/transcribe.route.js"; 
import ttsRouter from "./routes/tts.route.js";


// routes handlers
app.use("/api/v1/survey", surveyRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/audio", transcribeRouter); 
app.use("/api/v1/tts", ttsRouter); 

export default app;
