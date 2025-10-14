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
      <div className="flex items-center justify-center h-screen bg-user-survey-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-user-survey-loading-spinner-border border-t-user-survey-loading-spinner-top rounded-full animate-spin mx-auto mb-4"
          
          ></div>
          <p className="text-lg font-medium text-user-survey-loading-text">
            Loading your survey...
          </p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="flex items-center justify-center h-screen px-4 bg-user-survey-bg" >
        <div className="bg-user-survey-no-questions-bg rounded-2xl shadow-xl p-6 sm:p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-user-survey-no-questions-icon-bg rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-user-survey-no-questions-icon"
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
          <p className="text-user-survey-no-questions-text text-lg font-medium">
            No surveys available for {proficiency} level
          </p>
          <p className="text-user-survey-no-questions-subtext text-sm mt-2">Please check back later</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-2 bg-user-survey-btn-back-bg text-white rounded-lg hover:bg-user-survey-btn-back-hover transition-colors"

           
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
        className="md:hidden fixed top-4 left-4 z-30 bg-user-survey-menu-toggle-bg text-user-survey-menu-toggle-icon p-2 rounded-lg shadow-lg transition-all duration-300"
        
        onClick={toggleSidebar}
        aria-label={showSidebar ? "Close menu" : "Open menu"}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
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
      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-user-survey-bg" >
        <div className="flex flex-col md:flex-row items-start md:items-stretch justify-center gap-8 lg:gap-12 px-4 md:px-8 lg:px-16 w-full max-w-7xl mx-auto md:h-[85vh]">
          {/* Sidebar - hidden by default on mobile, shown when toggled */}
          {/* On desktop: positioned next to the question box instead of at the edge */}
          <div className={`
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 
            fixed md:static 
            z-20 
            transition-transform duration-300 ease-in-out 
            w-full md:w-72 lg:w-80 md:max-w-xs
            h-full md:h-auto md:max-h-[85vh]
          `}>
            {/* Wrapper with padding to prevent content overlapping with toggle button */}
            <div className="h-full pt-16 md:pt-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-user-card-border scrollbar-track-transparent hide-scrollbar bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
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
            flex-1 flex flex-col justify-center items-center transition-opacity duration-300 ease-in-out p-4 sm:p-6 md:p-8 md:overflow-y-auto
            ${showSidebar ? 'opacity-30 md:opacity-100' : 'opacity-100'} 
          `}
          >
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
                <div className="w-12 h-12 bg-user-survey-popup-success-bg rounded-full flex items-center justify-center"
                >
                  <svg className="w-6 h-6 text-user-survey-popup-success-icon"  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 bg-user-survey-popup-error-bg rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-user-survey-popup-error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            <h2 className={`text-xl font-bold mb-2 ${
              isSuccessPopup ? 'text-user-survey-popup-title-success' : 'text-user-survey-popup-title-error'
            }`}>
              {isSuccessPopup ? "Success!" : "Submission Failed"}
            </h2>
            <p className="mb-6 text-gray-700">{popupMessage}</p>

          
            <button
              onClick={handleClosePopup}
              className={`px-6 py-2 rounded-lg text-white transition-colors ${
                isSuccessPopup 
                  ? 'bg-user-survey-btn-ok-success hover:bg-user-survey-btn-ok-success-hover' 
                  : 'bg-user-survey-btn-ok-error hover:bg-user-survey-btn-ok-error-hover'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close sidebar when clicking outside on mobile */}
      {showSidebar && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-30 z-10" 
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
    </>
  );
};

export default UserSurvey;