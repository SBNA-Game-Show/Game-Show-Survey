import { Router } from "express";
import multer from "multer";
import { Client } from "@gradio/client";
import dotenv from "dotenv";
import { checkApiKey } from "../middlewares/apiKey.js";  

dotenv.config();

const transcribeRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

let client;

async function initializeClient() {
  if (!client) {
    try {
      client = await Client.connect(process.env.DB_URI);
      console.log("✅ Connected to Gradio client");
    } catch (error) {
      console.error("❌ Failed to connect to Gradio client:", error);
    }
  }
}

await initializeClient();

transcribeRouter
  .route("/transcribe")
  .post(checkApiKey, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      console.log("📤 Processing audio:", {
        size: req.file.size,
        type: req.file.mimetype,
        time: new Date().toISOString(),
      });

      const audioBlob = new Blob([req.file.buffer], {
        type: req.file.mimetype,
      });

      const result = await client.predict("/predict", {
        audio_file: audioBlob,
      });

      const transcriptionText = result.data?.[1] ?? "No transcription available";
      console.log(result.data[0])
      res.json({
        transcription: transcriptionText,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Transcription error:", error);
      res.status(500).json({
        error: "Transcription failed",
        details: error.message,
      });
    }
  });

export default transcribeRouter;
