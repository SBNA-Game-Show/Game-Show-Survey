import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserSurveyApi } from "../hooks/useUserSurveyApi";
import ProficiencyModal from "../common/ProficiencyModal";
import LogoutPrompt from "../common/LogoutPrompt";
import UserSidebar from "./UserSidebar";
import UserQuestionCard from "./UserQuestionCard";

const UserSurvey: React.FC = () => {
  const navigate = useNavigate();

  const [proficiency, setProficiency] = useState<string>("");
  const [showModal, setShowModal] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false); // State to toggle sidebar on mobile

  const { questions, loading, error, submitting, setError, submitAllAnswers } =
    useUserSurveyApi(proficiency);

  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isSuccessPopup, setIsSuccessPopup] = useState(true);

  useEffect(() => {
    if (questions.length) {
      setAnswers(Array(questions.length).fill(""));
    }
  }, [questions]);

  const answeredCount = answers.filter((a) => a && a !== "skip").length;

  const handleSaveNext = () => {
    const currentAnswer = answers[index]?.trim();
    
    if (!currentAnswer && answers[index] !== "skip") {
      setError("Please answer the question or click Skip.");
      return;
    }
    
    setError("");
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setShowPreviewDialog(true);
    }
  };

  const handleSkip = () => {
    const copy = [...answers];
    if (copy[index] === "skip") {
      copy[index] = "";
    } else {
      copy[index] = "skip";
    }
    setAnswers(copy);
    setError("");

    if (copy[index] === "skip") {
      if (index < questions.length - 1) {
        setIndex((i) => i + 1);
      } else {
        setShowPreviewDialog(true);
      }
    }
  };

  const handleSelectQuestion = (i: number) => {
    setIndex(i);
    setShowPreviewDialog(false);
    setShowSidebar(false); // Close sidebar after selection on mobile
  };

  const handlePublish = async () => {
    try {
      const payload = questions.map((q, i) => ({
        questionID: q.questionID,
        answerText: answers[i] === "skip" ? "" : (answers[i] || ""),
      }));
      await submitAllAnswers(payload);
      
      setPopupMessage("Survey submitted successfully! Thank you for your participation.");
      setIsSuccessPopup(true);
      setShowPopup(true);
    } catch (e: any) {
      setPopupMessage(`Failed to submit survey: ${e.message}`);
      setIsSuccessPopup(false);
      setShowPopup(true);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    if (isSuccessPopup) {
      navigate("/login");
    }
  };

  const handleClosePreview = () => {
    setShowPreviewDialog(false);
  };

  const handleAnswerChange = (value: string) => {
    const copy = [...answers];
    copy[index] = value;
    setAnswers(copy);
    setError("");
  };

  // Toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  if (showModal) {
    return (
      <ProficiencyModal
        show
        proficiency={proficiency}
        setProficiency={setProficiency}
        onConfirm={() => {
          if (proficiency) setShowModal(false);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-700 text-lg font-medium">
            Loading your survey...
          </p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-slate-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-700 text-lg font-medium">
            No surveys available for {proficiency} level
          </p>
          <p className="text-gray-500 text-sm mt-2">Please check back later</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LogoutPrompt
        show={showLogoutPrompt}
        onConfirm={() => navigate("/login")}
        onCancel={() => setShowLogoutPrompt(false)}
      />

      {/* Mobile menu toggle button - changes between hamburger and X */}
      <button 
        className="md:hidden fixed top-4 left-4 z-30 bg-purple-600 text-white p-2 rounded-lg shadow-lg transition-all duration-300"
        onClick={toggleSidebar}
        aria-label={showSidebar ? "Close menu" : "Open menu"}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={showSidebar 
              ? "M6 18L18 6M6 6l12 12" // X icon
              : "M4 6h16M4 12h16M4 18h16" // Hamburger icon
            } 
          />
        </svg>
      </button>

      {/* Main container - modified to center content on desktop */}
      <div className="h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row md:items-center md:justify-center md:gap-6 md:px-6">
          {/* Sidebar - hidden by default on mobile, shown when toggled */}
          {/* On desktop: positioned next to the question box instead of at the edge */}
          <div className={`
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 
            fixed md:static 
            z-20 
            transition-transform duration-300 ease-in-out 
            w-full md:w-80 md:max-w-xs
            h-full md:h-auto md:max-h-[85vh]
          `}>
            {/* Wrapper with padding to prevent content overlapping with toggle button */}
            <div className="h-full pt-16 md:pt-0">
              <UserSidebar
                questions={questions}
                answers={answers}
                index={index}
                answeredCount={answeredCount}
                onSelectQuestion={handleSelectQuestion}
              />
            </div>
          </div>

          {/* Main content - centered on desktop */}
          <div className={`
            flex-1 flex flex-col w-full md:w-auto md:max-w-2xl
            ${showSidebar ? 'opacity-30 md:opacity-100' : 'opacity-100'} 
            transition-opacity duration-300 ease-in-out
            md:max-h-[85vh]
            p-4 md:p-0
          `}>
            <UserQuestionCard
              questions={questions}
              answers={answers}
              index={index}
              error={error}
              showPreviewDialog={showPreviewDialog}
              answeredCount={answeredCount}
              submitting={submitting}
              onAnswerChange={handleAnswerChange}
              onSaveNext={handleSaveNext}
              onSkip={handleSkip}
              onPublish={handlePublish}
              onClosePreview={handleClosePreview}
              onLogout={() => setShowLogoutPrompt(true)}
            />
          </div>
        </div>
      </div>

      {/* Popup modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center">
              {isSuccessPopup ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isSuccessPopup ? "text-green-600" : "text-red-600"}`}>
              {isSuccessPopup ? "Success!" : "Submission Failed"}
            </h2>
            <p className="mb-6 text-gray-700">{popupMessage}</p>
            <button
              onClick={handleClosePopup}
              className={`px-6 py-2 rounded-lg text-white ${
                isSuccessPopup ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              } transition-colors`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close sidebar when clicking outside on mobile */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 z-10" 
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
    </>
  );
};

export default UserSurvey;