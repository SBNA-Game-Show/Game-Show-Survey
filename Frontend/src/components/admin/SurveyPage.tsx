import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminSurveyApi } from "../hooks/useAdminSurveyApi";
import SurveyLayout from "./SurveyLayout";
import { Question } from "../../types";
 
const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
type Level = (typeof LEVELS)[number];
type QMap = Record<Level, Question[]>;
 
const SurveyPage: React.FC = () => {
  const {
    questions,
    isLoading,
    error,
    setError,
    fetchQuestions,
    createQuestions,
    updateQuestions,
    deleteQuestions,
  } = useAdminSurveyApi();
 
  const [questionsByLevel, setQuestionsByLevel] = useState<QMap>({
    Beginner: [],
    Intermediate: [],
    Advanced: [],
  });
  const [currentTab, setCurrentTab] = useState<Level>("Beginner");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [showPreview, setShowPreview] = useState(false);
  
  // Add state to track if we've shown the UI immediately
  const [showUIImmediately, setShowUIImmediately] = useState(false);
 
  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<Level>("Beginner");
 
  const navigate = useNavigate();
 
  // On mount: verify admin & show UI immediately, then fetch in background
  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      navigate("/login", { replace: true });
    } else {
      // Show UI immediately with empty placeholders
      setShowUIImmediately(true);
      
      // Then fetch questions in background
      fetchQuestions();
    }
  }, [fetchQuestions, navigate]);

  // Initialize empty placeholders immediately when component mounts
  useEffect(() => {
    if (showUIImmediately && questionsByLevel.Beginner.length === 0) {
      const emptyMap: QMap = { Beginner: [], Intermediate: [], Advanced: [] };
      LEVELS.forEach((lvl) => {
        emptyMap[lvl] = [{
          _id: "",
          question: "",
          questionType: "Input",
          questionCategory: "",
          questionLevel: lvl,
        }];
      });
      setQuestionsByLevel(emptyMap);
    }
  }, [showUIImmediately, questionsByLevel.Beginner.length]);
 
  // Group flat questions into per-level buckets (only when questions arrive)
  useEffect(() => {
    if (!showUIImmediately || questions.length === 0) return;

    const map: QMap = { Beginner: [], Intermediate: [], Advanced: [] };
   
    // If we have existing questions, populate them
    questions.forEach((q) => {
      if (q.questionLevel && LEVELS.includes(q.questionLevel as Level)) {
        map[q.questionLevel as Level].push(q);
      }
    });

    // Ensure at least one empty placeholder per level
    LEVELS.forEach((lvl) => {
      if (map[lvl].length === 0) {
        map[lvl].push({
          _id: "",
          question: "",
          questionType: "Input",
          questionCategory: "",
          questionLevel: lvl,
        });
      }
    });
    setQuestionsByLevel(map);
  }, [questions, showUIImmediately]);
 
  // Update a single level's list
  const updateTabQuestions = (level: Level, list: Question[]) => {
    setQuestionsByLevel((prev) => ({ ...prev, [level]: list }));
  };
 
  const onSelectQuestion = (level: Level, idx: number) => {
    setCurrentTab(level);
    setCurrentIndex(idx);
  };
 
  const onAddQuestion = (level: Level) => {
    const list = questionsByLevel[level];
    const lastCat = list[list.length - 1]?.questionCategory || "";
    const newQ: Question = {
      _id: "",
      question: "",
      questionType: "Input",
      questionCategory: lastCat,
      questionLevel: level,
    };
    updateTabQuestions(level, [...list, newQ]);
    setCurrentTab(level);
    setCurrentIndex(list.length);
  };
 
  const onDeleteCurrent = async () => {
    const list = questionsByLevel[currentTab];
    if (list.length <= 1) return; // keep one placeholder
   
    const toDelete = list[currentIndex];
   
    // If it's an existing question (has _id), delete from backend
    if (toDelete._id) {
      await deleteQuestions([toDelete]);
    }
   
    // Remove from local state
    const newList = list.filter((_, i) => i !== currentIndex);
    updateTabQuestions(currentTab, newList);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };
 
  const onDeleteAllQuestions = (level: Level) => {
    setLevelToDelete(level);
    setShowDeleteDialog(true);
  };
 
  const confirmDeleteAllQuestions = async () => {
    const list = questionsByLevel[levelToDelete];
    const toDelete = list.filter((q) => q._id);
   
    if (toDelete.length) {
      await deleteQuestions(toDelete);
    }
   
    updateTabQuestions(levelToDelete, [
      {
        _id: "",
        question: "",
        questionType: "Input",
        questionCategory: "",
        questionLevel: levelToDelete,
      },
    ]);
    setCurrentIndex(0);
    setShowDeleteDialog(false);
  };
 
  const onUpdateQuestion = (field: keyof Question, value: string) => {
    const list = questionsByLevel[currentTab];
    const q = list[currentIndex];
   
    if (field === "questionLevel" && LEVELS.includes(value as Level)) {
      const newLevel = value as Level;
      const updated = { ...q, questionLevel: newLevel };
      const oldList = list.filter((_, idx) => idx !== currentIndex);
      updateTabQuestions(currentTab, oldList);
      updateTabQuestions(newLevel, [...questionsByLevel[newLevel], updated]);
      setCurrentTab(newLevel);
      setCurrentIndex(questionsByLevel[newLevel].length);
    } else {
      const newList = [...list];
      newList[currentIndex] = { ...q, [field]: value };
      updateTabQuestions(currentTab, newList);
    }
    setError("");
  };
 
  const completedCount = Object.values(questionsByLevel)
    .flat()
    .filter(
      (q) => q.question.trim() && q.questionCategory && q.questionLevel
    ).length;
 
  const handleCreateNew = () => {
    if (window.confirm("This will create new survey questions. Continue?")) {
      const allQs = LEVELS.flatMap((lvl) => questionsByLevel[lvl])
        .filter(q => q.question.trim() && q.questionCategory && q.questionLevel);
      createQuestions(allQs);
    }
  };
 
  const handleUpdate = () => {
    if (window.confirm("This will update the existing survey. Continue?")) {
      const allQs = LEVELS.flatMap((lvl) => questionsByLevel[lvl])
        .filter(q => q.question.trim() && q.questionCategory && q.questionLevel);
      updateQuestions(allQs);
    }
  };
 
  const switchToCreateMode = () => {
    if (window.confirm("Switch to create mode? This will clear current questions.")) {
      setMode("create");
      const emptyMap: QMap = { Beginner: [], Intermediate: [], Advanced: [] };
      LEVELS.forEach((lvl) => {
        emptyMap[lvl] = [{
          _id: "",
          question: "",
          questionType: "Input",
          questionCategory: "",
          questionLevel: lvl,
        }];
      });
      setQuestionsByLevel(emptyMap);
      setCurrentIndex(0);
    }
  };
 
  const switchToEditMode = async () => {
    setMode("edit");
    await fetchQuestions();
  };

  // Show loading only if we haven't shown UI yet
  if (!showUIImmediately) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-700 text-lg font-medium">
            Loading Survey Builder...
          </p>
        </div>
      </div>
    );
  }
 
  return (
    <>
      <SurveyLayout
        questions={questionsByLevel[currentTab]}
        questionsByLevel={questionsByLevel}
        currentIndex={currentIndex}
        currentLevel={currentTab}
        completedCount={completedCount}
        showPreview={showPreview}
        isSubmitting={isLoading}
        error={error}
        mode={mode}
        onErrorDismiss={() => setError("")}
        onSelectQuestion={onSelectQuestion}
        onAddQuestion={onAddQuestion}
        onDeleteCurrent={onDeleteCurrent}
        onDeleteAllQuestions={onDeleteAllQuestions}
        onUpdateQuestion={onUpdateQuestion}
        onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
        onNext={() =>
          setCurrentIndex((i) =>
            Math.min(i + 1, questionsByLevel[currentTab].length - 1)
          )
        }
        onCreateNew={handleCreateNew}
        onUpdate={handleUpdate}
        onSwitchToCreate={switchToCreateMode}
        onSwitchToEdit={switchToEditMode}
        onPreview={() => setShowPreview(true)}
        onClosePreview={() => setShowPreview(false)}
        onLogout={() => navigate("/")}
        formTitle="Sanskrit Survey Builder"
        formDescription="Add or edit questions for each level."
      />

      {/* Show subtle loading indicator in header when background fetch is happening */}
      {isLoading && showUIImmediately && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-700">Syncing questions...</span>
          </div>
        </div>
      )}
     
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-700">Delete All Questions</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete all <span className="font-semibold">{levelToDelete}</span> level questions?
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                onClick={confirmDeleteAllQuestions}
              >
                Yes, Delete All
              </button>
              <button
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
 
export default SurveyPage;