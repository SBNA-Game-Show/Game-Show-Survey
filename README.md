# 🎤 Real-time Audio Transcriber

A real-time voice activity detector and speech-to-text transcriber using **Node.js**, **Web Audio API**, and **Hugging Face's Gradio backend**. Automatically records voice when detected and transcribes it seamlessly in the browser.

---

## 🌐 Live Demo

🔗 [Try the live app here](https://sanskrit-stt.onrender.com/)

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
```
2. Install dependencies
``` bash
npm install
```
3. Configure your .env
``` bash
Create a .env file in the root directory:
DB_URI=<your-huggingface-useraccount-name-with-predict-route>
add a request if you want mine
```
5. Start the server
 ``` bash
npm start
The app will be running at:
http://localhost:3000
```

## 🧪 Usage
Open the app in your browser.

Click "Enable Auto Transcription".

Speak — your voice will trigger recording.

The recording stops after silence.

Transcription appears below in real time.

You can also:

Adjust the Voice Activation Threshold

Set Minimum Recording Time

Customize Silence Timeout Duration

