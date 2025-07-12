import React from "react";
import { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { API_BASE, API_KEY } from "../api/config";
interface UserQuestionCardProps {
  questions: any[];
  answers: string[];
  index: number;
  error: string;
  showPreviewDialog: boolean;
  answeredCount: number;
  submitting: boolean;
  onAnswerChange: (value: string) => void;
  onSaveNext: () => void;
  onSkip: () => void;
  onPublish: () => void;
  onClosePreview: () => void;
  onLogout: () => void;
}

const UserQuestionCard: React.FC<UserQuestionCardProps> = ({
  questions,
  answers,
  index,
  error,
  showPreviewDialog,
  answeredCount,
  submitting,
  onAnswerChange,
  onSaveNext,
  onSkip,
  onPublish,
  onClosePreview,
  onLogout,
}) => {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<string>("");
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );

  useEffect(() => {
    checkMicrophonePermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingError("Recording not supported in this browser");
        setPermissionGranted(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionGranted(true);
      setRecordingError("");
    } catch (err: any) {
      console.error("Microphone permission error:", err);
      setPermissionGranted(false);

      if (err.name === "NotAllowedError") {
        setRecordingError(
          "Microphone access denied. Please allow microphone access and refresh the page."
        );
      } else if (err.name === "NotFoundError") {
        setRecordingError("No microphone found. Please connect a microphone.");
      } else {
        setRecordingError(
          "Unable to access microphone. Please check your browser settings."
        );
      }
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await checkMicrophonePermission();
      if (!permissionGranted) return;
    }

    try {
      setRecordingError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = "";
        }
      }

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log(
          "Recording stopped, chunks:",
          audioChunksRef.current.length
        );
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || "audio/webm",
          });
          console.log("Audio blob created:", audioBlob.size, "bytes");
          sendToBackend(audioBlob);
        } else {
          setRecordingError("No audio data recorded. Please try again.");
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event.error);
        setRecordingError("Recording failed: " + event.error?.message);
        setRecording(false);
      };

      mediaRecorder.start(1000);
      setRecording(true);
      console.log("Recording started");
    } catch (err: any) {
      console.error("Start recording error:", err);
      setRecordingError("Failed to start recording: " + err.message);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      console.log("Stopping recording...");
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendToBackend = async (audioBlob: Blob) => {
    setLoading(true);
    console.log("Sending audio to backend:", audioBlob.size, "bytes");

    const file = new File([audioBlob], "recording.webm", {
      type: audioBlob.type,
    });

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch(`${API_BASE}/api/v1/audio/transcribe`, {
        method: "POST",
        body: formData,
        headers: {
          "x-api-key": API_KEY,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const result = await res.json();
      console.log("Backend response:", result);

      if (result.transcription) {
        onAnswerChange(result.transcription);
      } else {
        console.error("Backend error:", result.error);
        setRecordingError(
          "Transcription failed: " + (result.error || "Unknown error")
        );
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      setRecordingError("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleTTSPlay = async () => {
    if (isPlayingTTS || isLoadingTTS) return;

    setIsLoadingTTS(true);

    try {
      // Call your TTS API
      const response = await fetch(
        `${API_BASE}/api/v1/tts?text=${encodeURIComponent(
          questions[index].question
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.onloadeddata = () => {
        setIsLoadingTTS(false);
        setIsPlayingTTS(true);
        audio.play();
      };

      audio.onended = () => {
        setIsPlayingTTS(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsLoadingTTS(false);
        setIsPlayingTTS(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        console.error("Audio playback error");
      };
    } catch (error) {
      console.error("TTS Error:", error);
      setIsLoadingTTS(false);
      setIsPlayingTTS(false);
    }
  };

  const handleTTSStop = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlayingTTS(false);
      setCurrentAudio(null);
    }
  };
  return (
    <main className="flex-grow flex items-center justify-center px-8">
      <div
        className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 w-full max-w-2xl relative border border-purple-100 transition-all duration-500 ${
          recording
            ? "opacity-70 scale-[0.98] shadow-3xl"
            : "opacity-100 scale-100"
        }`}
      >
        {/* Enhanced decorative gradient overlay with recording state */}
        <div
          className={`absolute inset-0 bg-gradient-to-br rounded-3xl transition-all duration-500 ${
            recording
              ? "from-red-500/20 to-pink-500/20 animate-pulse"
              : "from-purple-500/5 to-indigo-500/5"
          }`}
        ></div>

        {recording && (
          <div className="absolute inset-0 rounded-3xl border-2 border-red-400 animate-pulse pointer-events-none">
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LISTENING
            </div>
          </div>
        )}

        <div className="relative flex justify-between items-start mb-8">
          <span
            className={`px-4 py-2 bg-gradient-to-r text-white rounded-full text-sm font-bold uppercase tracking-wide shadow-lg transition-all duration-300 ${
              recording
                ? "from-red-500 to-pink-500 animate-pulse"
                : "from-purple-500 to-indigo-500"
            }`}
          >
            {!showPreviewDialog ? questions[index]?.questionLevel : "SURVEY"}{" "}
            Level
          </span>
          <button
            onClick={onLogout}
            disabled={submitting || recording}
            className={`text-sm text-red-500 hover:text-red-600 hover:underline font-medium transition-all duration-200 ${
              submitting || recording
                ? "opacity-30 cursor-not-allowed"
                : "opacity-100"
            }`}
          >
            Logout
          </button>
        </div>

        {!showPreviewDialog && (
          <>
            <div className="relative mb-8 text-center">
              <h2
                className={`text-2xl font-bold text-transparent bg-clip-text mb-4 transition-all duration-300 ${
                  recording
                    ? "bg-gradient-to-r from-red-600 to-pink-600"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600"
                }`}
              >
                {questions[index].question}
              </h2>
              <button
                onClick={isPlayingTTS ? handleTTSStop : handleTTSPlay}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-110 ${
                  isLoadingTTS
                    ? "bg-yellow-500 cursor-not-allowed"
                    : isPlayingTTS
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
                disabled={recording || isLoadingTTS}
              >
                {isLoadingTTS ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isPlayingTTS ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>

              {isPlayingTTS && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <textarea
                className={`w-full border-2 rounded-2xl p-4 text-lg focus:ring-4 transition-all duration-300 resize-none backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
                  recording
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30"
                    : "border-purple-200 focus:border-purple-400 focus:ring-purple-100 bg-white/50"
                } ${answers[index] === "skip" ? "opacity-50" : ""}`}
                placeholder={
                  recording
                    ? "🎤 Listening... Speak now!"
                    : answers[index] === "skip"
                    ? "This question has been skipped"
                    : "Share your thoughts here..."
                }
                rows={4}
                value={answers[index] === "skip" ? "" : answers[index]}
                disabled={answers[index] === "skip" || submitting || recording}
                onChange={(e) => onAnswerChange(e.target.value)}
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={
                    answers[index] === "skip" ||
                    submitting ||
                    loading ||
                    permissionGranted === false
                  }
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-medium shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    recording
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse shadow-red-200"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-purple-200"
                  }`}
                >
                  <span className="text-lg">{recording ? "🔴" : "🎤"}</span>
                  {recording ? "Stop" : "Speak"}
                </button>

                {loading && (
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-full">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-blue-600 font-medium">
                      Transcribing...
                    </span>
                  </div>
                )}

                {recording && (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-full animate-pulse">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    <span className="text-sm text-red-600 font-medium">
                      Recording...
                    </span>
                  </div>
                )}
              </div>

              {/* Recording Error Display */}
              {recordingError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium text-center">
                    {recordingError}
                  </p>
                  {permissionGranted === false && (
                    <button
                      onClick={checkMicrophonePermission}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium text-center">
                    {error}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={onSaveNext}
                disabled={submitting || recording}
                className={`px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-semibold hover:from-purple-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  recording ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {index === questions.length - 1
                  ? "Review Answers"
                  : "Save & Continue"}
              </button>

              <button
                onClick={onSkip}
                disabled={submitting || recording}
                className={`px-8 py-3 rounded-2xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  recording ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  answers[index] === "skip"
                    ? "bg-amber-200 text-amber-800 hover:bg-amber-300"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {answers[index] === "skip"
                  ? "Unskip Question"
                  : "Skip Question"}
              </button>
            </div>
          </>
        )}

        {/* Preview Dialog - always inside main container */}
        {showPreviewDialog && (
          <div className="bg-white/95 backdrop-blur-sm border-2 border-green-200 rounded-2xl shadow-xl p-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                  Survey Complete!
                </h3>
              </div>
              <button
                onClick={onClosePreview}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              You've answered {answeredCount} out of {questions.length}{" "}
              questions. Review your responses before submitting.
            </p>
            <div className="max-h-48 overflow-y-auto mb-4 space-y-3">
              {questions.map((q, i) => (
                <div
                  key={q.questionID || q._id || `question-${i}`}
                  className="bg-gray-50 rounded-xl p-3 text-sm"
                >
                  <p className="font-medium text-gray-800 mb-1">
                    Q{i + 1}: {q.question.substring(0, 60)}
                    {q.question.length > 60 ? "..." : ""}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {answers[i] && answers[i] !== "skip"
                      ? answers[i].substring(0, 80) +
                        (answers[i].length > 80 ? "..." : "")
                      : answers[i] === "skip"
                      ? "Skipped"
                      : "No answer"}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onPublish}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {submitting ? "Submitting..." : "Submit Survey"}
              </button>
              <button
                onClick={onClosePreview}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 text-sm disabled:opacity-50"
              >
                Review More
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UserQuestionCard;
