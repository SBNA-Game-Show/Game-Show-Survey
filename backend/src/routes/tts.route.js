import { Router } from "express";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import tts from "sanskrit-tts";
import { checkApiKey } from "../middlewares/apiKey.js";

const ttsRouter = Router();

ttsRouter.get("", checkApiKey, async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).send('Missing "text" query parameter');
  }

  // Generate unique filename to avoid conflicts
  const filename = `audio_${uuidv4()}.mp3`;
  
  try {
    // Generate TTS audio file
    await tts.saveFile(text, {
      script: 'devanagari',
      slow: false,
      fileName: filename
    });

    // Add a small delay to ensure file is completely written
    await new Promise(resolve => setTimeout(resolve, 100));

    // The library might create the file in current working directory
    // Let's check multiple possible locations
    let filePath = null;
    const possiblePaths = [
      path.resolve(filename),
      path.resolve(process.cwd(), filename),
      filename // relative path
    ];

    for (let attempt = 0; attempt < 5; attempt++) {
      for (const testPath of possiblePaths) {
        try {
          await fs.access(testPath);
          const stats = await fs.stat(testPath);
          if (stats.size > 0) {
            filePath = testPath;
            break;
          }
        } catch (err) {
        }
      }
      
      if (filePath) break;
      
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }

    if (!filePath) {
      const files = await fs.readdir(process.cwd());
      const audioFiles = files.filter(f => f.includes(filename.split('_')[1]));
      console.log(`Available files: ${files.slice(0, 10).join(', ')}`);
      console.log(`Audio files found: ${audioFiles.join(', ')}`);
      throw new Error(`Generated file not found. Expected: ${filename}, Found audio files: ${audioFiles.join(', ')}`);
    }

    console.log(`Found TTS file at: ${filePath}`);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);

    await fs.unlink(filePath);

  } catch (err) {
    console.error('TTS Error:', err);
    
    const possiblePaths = [
      path.resolve(filename),
      path.resolve(process.cwd(), filename),
      filename
    ];

    for (const testPath of possiblePaths) {
      try {
        await fs.unlink(testPath);
        console.log(`Cleaned up file: ${testPath}`);
      } catch (cleanupErr) {
      }
    }
    
    res.status(500).send('Error generating TTS audio');
  }
});

export default ttsRouter;