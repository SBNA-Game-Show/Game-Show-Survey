import express from 'express';
import multer from 'multer';
import { Client } from "@gradio/client";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));

let client;
async function initializeClient() {
    try {
    client = await Client.connect("dsa/fds");
        console.log("Connected to Gradio client");
    } catch (error) {
        console.error("Failed to connect to Gradio client:", error);
    }
}

app.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        if (!client) {
            await initializeClient();
        }

        console.log('📤 Processing audio file:', {
            size: req.file.size,
            type: req.file.mimetype,
            timestamp: new Date().toLocaleString()
        });

        const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
        
        const result = await client.predict("/predict", { 
            audio_file: audioBlob, 
        });

        const transcriptionText = result.data[1] || 'No transcription available';
        
        console.log('🎯 TRANSCRIPTION RESULT:');
        console.log('=' .repeat(50));
        console.log(transcriptionText);
        console.log('=' .repeat(50));
        console.log('⏰ Time:', new Date().toLocaleString());
        console.log('📊 Audio duration: ~' + Math.round(req.file.size / 16000) + 's');
        console.log('');

        res.json({ 
            transcription: transcriptionText,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Transcription error:', error);
        res.status(500).json({ 
            error: 'Transcription failed',
            details: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, async () => {
    console.log('🎤 Real-time Audio Transcriber Server');
    console.log('=====================================');
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log('🎯 Transcription results will appear below:');
    console.log('');
    await initializeClient();
});

export default app;