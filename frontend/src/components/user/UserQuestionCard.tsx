import React, { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { API_BASE, API_KEY } from "../api/config";
import { Client } from "@gradio/client";

import ProficiencyModal from "../common/ProficiencyModal";

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
  proficiency: string;
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
  proficiency,
  // participantLevel,
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
        if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/ogg"))
          mimeType = "audio/ogg";
        else mimeType = "";
      }

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || "audio/webm",
          });
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
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendToBackend = async (audioBlob: Blob) => {
    setLoading(true);

    const file = new File([audioBlob], "recording.webm", {
      type: audioBlob.type,
    });
    const formData = new FormData();
    formData.append("audio", file);
    const HF_SPACE_URL = "https://rverma0631-nemo-asr-model.hf.space/";

    try {
      // 1. Connect to the Gradio Space
      const client = await Client.connect(HF_SPACE_URL);

      // 2. Call the /predict endpoint with the Blob object
      // Note: The parameter name 'audio_file' comes directly from the API documentation.
      const result = await client.predict("/predict", {
        audio_file: audioBlob,
      });

      // 3. Process the result
      // The client wraps the output, the actual transcription is in result.data[0]
      const transcription = (result?.data as any[])?.[0];

      if (transcription) {
        onAnswerChange(transcription);
      } else {
        // Handle cases where the prediction returns an empty or unexpected result
        setRecordingError("Transcription failed: received empty or invalid output from API.");
      }
    } catch (err) {
      const errorObject = err as Error;
      console.error("Gradio Client API failed:", err);
      // The client handles network and API errors, report the message.
      setRecordingError("Transcription failed: " + errorObject.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTTSPlay = async () => {
    if (isPlayingTTS || isLoadingTTS) return;

    setIsLoadingTTS(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/tts?text=${encodeURIComponent(
          questions[index].question
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        }
      );
      if (!response.ok) throw new Error("Failed to generate audio");

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

  const isSkipped = answers[index] === "skip";

  return (
    <main className="flex-grow flex justify-center px-4 sm:px-8 py-16 sm:py-10 overflow-y-auto sm:items-center">
      {/* Decorative gradient overlay */}
      {/* <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/5 to-secondary/5" /> */}

      {/*Floating Logout Button (always visible, responsive) */}

      <button
        onClick={onLogout}
        disabled={submitting || recording}
        className={`fixed top-5 right-5 sm:top-4 sm:right-6 z-50 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
          submitting || recording ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Logout
      </button>

      {/* Question Card */}
      <div
        className={`relative bg-white/90 backdrop-blur-sm border border-purple-100 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg sm:max-w-xl md:max-w-2xl p-5 sm:p-8 transition-all duration-500 ${
          recording ? "opacity-70 scale-[0.98]" : "opacity-100 scale-100"
        }`}
      >
        {/* Recording overlay */}
        <div
          className={`absolute inset-0 rounded-3xl transition-all duration-500 ${
            recording
              ? "bg-gradient-to-br from-red-500/20 to-pink-500/20 animate-pulse"
              : "bg-gradient-to-br from-primary/5 to-accent/5"
          }`}
        />

        {recording && (
          <div className="absolute inset-0 rounded-3xl border-2 border-user-recording-indicator animate-pulse pointer-events-none">
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-user-recording-indicator/90 text-white px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LISTENING
            </div>
          </div>
        )}

        {/* Header row */}

        <div className="relative flex justify-between items-start mb-8">
          <span
            className="px-4 py-2 text-white rounded-full text-sm font-bold uppercase tracking-wide shadow-lg"
            style={{ background: "var(--header-primary)" }}
          >
            {!showPreviewDialog ? questions[index]?.questionLevel : proficiency}{" "}
            Level
          </span>
          
        </div>

        {!showPreviewDialog && (
          <>
            {/* Question + TTS */}
            <div className="relative mb-6 sm:mb-8 text-center">
              {/* FIX: single H2 (the earlier code had two H2s, one unclosed) */}
              <h2
                className={`text-xl sm:text-2xl font-bold text-transparent bg-clip-text mb-4 transition-all duration-300 ${
                  recording
                    ? "bg-gradient-to-r from-red-600 to-pink-600"
                    : "bg-gradient-to-r from-header-primary to-header-primary"
                }`}
              >
                {questions[index].question}
              </h2>

              <button
                onClick={isPlayingTTS ? handleTTSStop : handleTTSPlay}
                className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-300 hover:scale-110 ${
                  isLoadingTTS
                    ? "bg-user-tts-loading-bg cursor-not-allowed"
                    : isPlayingTTS
                    ? "bg-user-tts-stop-bg hover:bg-user-tts-stop-hover text-white"
                    : "bg-user-tts-play-bg hover:bg-user-tts-play-hover text-white"
                }`}
                disabled={recording || isLoadingTTS}
              >
                {isLoadingTTS ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : isPlayingTTS ? (
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>

              {isPlayingTTS && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-user-tts-play-bg animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-user-tts-play-bg animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 rounded-full bg-user-tts-play-bg animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Answer box */}
            <div className="mb-6">
              {/* FIX: merged duplicate className props */}
              <textarea
                data-cy="text-area"
                className={`w-full border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-base sm:text-lg focus:ring-4 focus:ring-primary/30 transition-all duration-300 resize-none backdrop-blur-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
                  recording
                    ? "border-user-textarea-recording-border focus:border-red-400 bg-user-textarea-recording-bg"
                    : "border-user-textarea-border focus:border-user-textarea-focus bg-user-textarea-bg"
                } ${isSkipped ? "opacity-50" : ""}`}
                placeholder={
                  recording
                    ? "🎤 Listening... Speak now!"
                    : isSkipped
                    ? "This question has been skipped"
                    : "Share your thoughts here..."
                }
                rows={4}
                value={isSkipped ? "" : answers[index]}
                disabled={isSkipped || submitting || recording}
                onChange={(e) => onAnswerChange(e.target.value)}
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={
                    isSkipped ||
                    submitting ||
                    loading ||
                    permissionGranted === false
                  }
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-medium shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    recording
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse shadow-red-200"
                      : "bg-gradient-to-r from-user-btn-speak-from to-user-btn-speak-to text-white hover:from-user-btn-speak-hover-from hover:to-user-btn-speak-hover-to shadow-orange-200"
                  }`}
                >
                  <span className="text-lg">{recording ? "🔴" : "🎤"}</span>
                  {recording ? "Stop" : "Speak"}
                </button>

                {loading && (
                  <div className="flex items-center gap-2 bg-user-transcribing-bg border border-user-transcribing-border px-3 py-2 rounded-full">
                    <div className="w-4 h-4 border-2 border-user-transcribing-text border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-user-transcribing-text font-medium">
                      Transcribing...
                    </span>
                  </div>
                )}

                {recording && (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-full animate-pulse">
                    <div className="w-3 h-3 bg-user-recording-indicator rounded-full animate-ping" />
                    <span className="text-sm text-red-600 font-medium">
                      Recording...
                    </span>
                  </div>
                )}
              </div>

              {/* Errors */}
              {recordingError && (
                <div className=" mt-3 p-3 bg-error-bg border border-error-border rounded-xl text-center">
                  <p className="text-error-text text-sm font-medium text-center">
                    {recordingError}
                  </p>
                  {permissionGranted === false && (
                    <button
                      onClick={checkMicrophonePermission}
                      className="mt-2 text-sm text-error-text hover:text-error-dismiss-hover "
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 bg-error-bg border border-error-border rounded-xl text-center">
                  <p className="text-error-text text-sm font-medium">{error}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center item-stretch gap-3 sm:gap-4">
              <button
              data-cy={index === questions.length - 1 
                  ? "review-answers-button" 
                    : "save-continue-button"} 
                onClick={onSaveNext}
                disabled={submitting || recording}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-user-btn-save-from to-user-btn-save-to text-white rounded-xl sm:rounded-2xl font-semibold hover:from-user-btn-save-hover-from hover:to-user-btn-save-hover-to transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 ${
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
                data-cy="skip-button"
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 ${
                  recording ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  isSkipped
                    ? "bg-user-btn-skip-active-bg text-user-btn-skip-active-text hover:bg-user-btn-skip-active-hover"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {isSkipped ? "Unskip Question" : "Skip Question"}
              </button>
            </div>
          </>
        )}

        {/* Preview Dialog */}
        {showPreviewDialog && (
          <div className="bg-user-card-bg/95 backdrop-blur-sm border-2 border-user-preview-border rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-header-primary to-accent rounded-full flex items-center justify-center">
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
                <h3 className="text-base sm:text-lg font-bold text-user-preview-title">
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

            <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
              You've answered {answeredCount} out of {questions.length}{" "}
              questions. Review your responses before submitting.
            </p>

            <div className="max-h-40 sm:max-h-48 overflow-y-auto mb-3 sm:mb-4 space-y-3">
              {questions.map((q, i) => (
                // FIX: no duplicate key/className
                <div
                  key={q.questionID || q._id || 'question-${i}'}
                  className="bg-gray-50 rounded-xl p-3 text-sm"
                >
                  <p className="font-medium text-gray-800 mb-1">
                    Q{i + 1}: {q.question.substring(0, 60)}
                    {q.question.length > 60 ? "..." : ""}
                  </p>
                  <p className="text-gray-600 ">
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

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                             onClick={onPublish}
                disabled={submitting}
                data-cy="submit-survey"
                className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-user-preview-submit-from to-user-preview-submit-to text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:shadow-lg"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {submitting ? "Submitting..." : "Submit Survey"}
              </button>
              <button
                onClick={onClosePreview}
                disabled={submitting}
                className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm hover:bg-gray-300"
              >
                Edit Answers
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UserQuestionCard;