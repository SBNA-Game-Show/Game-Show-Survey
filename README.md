# 🎤 Real-time Audio Transcriber

A real-time voice activity detector and speech-to-text transcriber using **Node.js**, **Web Audio API**, and **Hugging Face's Gradio backend**. Automatically records voice when detected and transcribes it seamlessly in the browser.

---

## 🌐 Live Demo

🔗 [Try the live app here](https://sanskrit-stt.onrender.com/)

> Replace this with your actual deployed URL.

---

## 📦 Features

- ✅ **Automatic voice detection** (no clicks needed!)
- ✅ **Silence-based auto-stop**
- ✅ **Live waveform visualization**
- ✅ **Customizable detection thresholds**
- ✅ **Speech-to-text transcription** powered by Hugging Face + Gradio
- ✅ **Responsive UI** with smooth interactions

---

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/rakshverma/Sanskrit-STT.git
cd Sanskrit-STT
2. Install dependencies
bash
Copy
Edit
npm install
3. Configure your .env
Create a .env file in the root directory:
DB_URI=<your-huggingface-useraccount-name-with-predict-route>
add a request if you want mine
4. Start the server
``` bash
npm start
The app will be running at:
http://localhost:3000
```

