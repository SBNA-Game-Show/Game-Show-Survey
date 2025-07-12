// Updated SurveyPage.tsx - Fixed useEffect dependency warnings
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminSurveyApi } from "../hooks/useAdminSurveyApi";
import SurveyLayout from "./SurveyLayout";
import AdminEmptyState from "./AdminEmptyState";
import LoadingPopup from "../common/LoadingPopup";
import { Question } from "../../types/types";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
type Level = (typeof LEVELS)[number];
type QMap = Record<Level, Question[]>;

const SurveyPage: React.FC = () => {
  const {
    questions: existingQuestions,
    isLoading,
    error,
    isEmpty,
    setError,
    fetchQuestions,
    createQuestions,
    updateSingleQuestion,
    updateQuestionsBatch,
    deleteQuestions,
  } = useAdminSurveyApi();

  // Loading states
  const [loadingState, setLoadingState] = useState({
    show: false,
    message: "",
    variant: "fetch" as "create" | "update" | "delete" | "fetch",
  });

  // Separate state for new questions (Add mode) vs existing questions (Edit mode)
  const [newQuestionsByLevel, setNewQuestionsByLevel] = useState<QMap>({
    Beginner: [],
    Intermediate: [],
    Advanced: [],
  });
  
  const [existingQuestionsByLevel, setExistingQuestionsByLevel] = useState<QMap>({
    Beginner: [],
    Intermediate: [],
    Advanced: [],
  });

  // Track original questions state for change detection
  const [originalQuestions, setOriginalQuestions] = useState<QMap>({
    Beginner: [],
    Intermediate: [],
    Advanced: [],
  });

  // Track which questions have been modified
  const [modifiedQuestions, setModifiedQuestions] = useState<Set<string>>(new Set());

  const hasFetchedOnce = useRef(false);
  const [currentTab, setCurrentTab] = useState<Level>("Beginner");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"create" | "edit">("edit");
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<Level>("Beginner");
  const [showUIImmediately, setShowUIImmediately] = useState(false);
  const navigate = useNavigate();

  // Confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

const showLoading = useCallback((variant: "create" | "update" | "delete" | "fetch", message?: string) => {
  setLoadingState({ show: true, variant, message: message || "" });
}, []);

  const hideLoading = useCallback(() => {
    setLoadingState({ show: false, message: "", variant: "fetch" });
  }, []);

  const showConfirmationDialog = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmationTitle(title);
    setConfirmationMessage(message);
    setOnConfirmAction(() => onConfirm);
    setShowConfirmation(true);
  };

  // Deep comparison utility to detect changes
  const questionsAreEqual = (q1: Question, q2: Question): boolean => {
    if (q1.question !== q2.question) return false;
    if (q1.questionType !== q2.questionType) return false;
    if (q1.questionCategory !== q2.questionCategory) return false;
    if (q1.questionLevel !== q2.questionLevel) return false;
    
    // Compare answers for MCQ questions
    if (q1.questionType === "Mcq" || q2.questionType === "Mcq") {
      const a1 = q1.answers || [];
      const a2 = q2.answers || [];
      
      if (a1.length !== a2.length) return false;
      
      for (let i = 0; i < a1.length; i++) {
        if (a1[i].answer !== a2[i].answer) return false;
        if (a1[i].isCorrect !== a2[i].isCorrect) return false;
      }
    }
    
    return true;
  };

  // Mark question as modified
  const markQuestionAsModified = (questionID: string) => {
    if (questionID) {
      setModifiedQuestions(prev => new Set(prev).add(questionID));
      console.log("📝 Question marked as modified:", questionID);
    }
  };

  // Clear modification tracking
  const clearModifications = () => {
    setModifiedQuestions(new Set());
    console.log("🧹 Cleared all modification tracking");
  };

  // Initialize edit mode with existing questions or empty placeholders
  const initializeEditMode = useCallback(() => {
    const map: QMap = { Beginner: [], Intermediate: [], Advanced: [] };
    
    existingQuestions.forEach((q) => {
      if (q.questionLevel && LEVELS.includes(q.questionLevel as Level)) {
        map[q.questionLevel as Level].push(q);
      }
    });

    LEVELS.forEach((lvl) => {
      if (map[lvl].length === 0) {
        map[lvl].push(createEmptyQuestion(lvl));
      }
    });

    setExistingQuestionsByLevel(map);
    setOriginalQuestions(JSON.parse(JSON.stringify(map))); // Deep copy for tracking
    clearModifications();
  }, [existingQuestions]);

  // Update existing questions when new data is fetched
  const updateExistingQuestionsFromFetch = useCallback(() => {
    if (isEmpty && existingQuestions.length === 0) return;
    
    const map: QMap = { Beginner: [], Intermediate: [], Advanced: [] };
    
    existingQuestions.forEach((q) => {
      if (q.questionLevel && LEVELS.includes(q.questionLevel as Level)) {
        map[q.questionLevel as Level].push(q);
      }
    });

    LEVELS.forEach((lvl) => {
      if (map[lvl].length === 0) {
        map[lvl].push(createEmptyQuestion(lvl));
      }
    });

    setExistingQuestionsByLevel(map);
    setOriginalQuestions(JSON.parse(JSON.stringify(map))); // Deep copy for tracking
    clearModifications();
  }, [existingQuestions, isEmpty]);

  // Initialize add mode with clean slate
  const initializeAddMode = () => {
    const emptyMap: QMap = { Beginner: [], Intermediate: [], Advanced: [] };
    
    LEVELS.forEach((lvl) => {
      emptyMap[lvl] = [createEmptyQuestion(lvl)];
    });

    setNewQuestionsByLevel(emptyMap);
    clearModifications();
  };

  // Create an empty question template
  const createEmptyQuestion = (level: Level): Question => ({
    questionID: "",
    question: "",
    questionType: "Input",
    questionCategory: "",
    questionLevel: level,
    timesAnswered: 0,
  });

  // Admin check
  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Initialize UI immediately for better UX - fixed dependencies
  useEffect(() => {
    if (!showUIImmediately) {
      initializeEditMode();
      setShowUIImmediately(true);
    }

    // Fetch existing questions once
    if (showUIImmediately && !hasFetchedOnce.current) {
      hasFetchedOnce.current = true;
      showLoading("fetch", "Loading Questions...");
      fetchQuestions().finally(() => hideLoading());
    }
  }, [fetchQuestions, showUIImmediately, initializeEditMode, showLoading, hideLoading]);

  // Update existing questions when fetched - fixed dependencies
  useEffect(() => {
    if (!showUIImmediately) return;
    
    if (mode === "edit") {
      updateExistingQuestionsFromFetch();
    }
  }, [existingQuestions, showUIImmediately, mode, updateExistingQuestionsFromFetch]);

  // Get current questions based on mode
  const getCurrentQuestions = (): Question[] => {
    const questionsByLevel = mode === "create" ? newQuestionsByLevel : existingQuestionsByLevel;
    return questionsByLevel[currentTab] || [];
  };

  // Get current questions by level based on mode
  const getCurrentQuestionsByLevel = (): QMap => {
    return mode === "create" ? newQuestionsByLevel : existingQuestionsByLevel;
  };

  // Update questions based on current mode
  const updateCurrentQuestions = (level: Level, questions: Question[]) => {
    if (mode === "create") {
      setNewQuestionsByLevel(prev => ({ ...prev, [level]: questions }));
    } else {
      setExistingQuestionsByLevel(prev => ({ ...prev, [level]: questions }));
    }
  };

  // Mode switching functions
  const switchToCreateMode = () => {
    setMode("create");
    initializeAddMode();
    setCurrentIndex(0);
    setError("");
    console.log("🆕 Switched to Add mode - sidebar should show only new questions");
  };

  const switchToEditMode = async () => {
    setMode("edit");
    setCurrentIndex(0);
    setError("");
    showLoading("fetch", "Switching to Edit Mode...");
    try {
      await fetchQuestions();
    } finally {
      hideLoading();
    }
    console.log("✏️ Switched to EDIT mode - sidebar should show existing questions");
  };

  // Question management functions
  const onSelectQuestion = (level: Level, idx: number) => {
    setCurrentTab(level);
    setCurrentIndex(idx);
  };

  const onAddQuestion = (level: Level) => {
    if (mode === "edit") {
      switchToCreateMode();
      return;
    }

    const currentQuestions = newQuestionsByLevel[level];
    const hasEmptyQuestion = currentQuestions.some(q => !q.question?.trim());
    
    if (hasEmptyQuestion) {
      setError("Please complete the current question before adding a new one.");
      return;
    }

    const lastQuestion = currentQuestions[currentQuestions.length - 1];
    const lastCategory = lastQuestion?.questionCategory || "";
    
    const newQuestion = createEmptyQuestion(level);
    newQuestion.questionCategory = lastCategory;
    
    const updatedQuestions = [...currentQuestions, newQuestion];
    setNewQuestionsByLevel(prev => ({ ...prev, [level]: updatedQuestions }));
    
    setCurrentTab(level);
    setCurrentIndex(updatedQuestions.length - 1);
    
    if (isEmpty) setError("");
    console.log(`➕ Added new question to ${level} level`);
  };

  const onDeleteCurrent = async () => {
    const currentQuestions = getCurrentQuestions();
    const questionToDelete = currentQuestions[currentIndex];
    
    if (mode === "edit" && questionToDelete.questionID) {
      showLoading("delete", "Deleting Question...");
      try {
        await deleteQuestions([questionToDelete]);
      } catch (error) {
        console.error("Failed to delete question:", error);
        setError("Failed to delete question from database");
        return;
      } finally {
        hideLoading();
      }
    }

    const newList = currentQuestions.filter((_, i) => i !== currentIndex);
    
    if (newList.length === 0) {
      newList.push(createEmptyQuestion(currentTab));
    }
    
    updateCurrentQuestions(currentTab, newList);
    
    const newIndex = Math.min(currentIndex, newList.length - 1);
    setCurrentIndex(Math.max(newIndex, 0));
    
    console.log(`🗑️ Deleted question from ${currentTab} level. Remaining: ${newList.length}`);
  };

  const onDeleteAllQuestions = (level: Level) => {
    setLevelToDelete(level);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAllQuestions = async () => {
    const currentQuestions = getCurrentQuestions();
    
    if (mode === "edit") {
      const questionsToDelete = currentQuestions.filter(q => q.questionID);
      if (questionsToDelete.length) {
        showLoading("delete", `Deleting All ${levelToDelete} Questions...`);
        try {
          await deleteQuestions(questionsToDelete);
        } catch (error) {
          console.error("Failed to delete questions:", error);
          setError("Failed to delete questions from database");
          setShowDeleteDialog(false);
          return;
        } finally {
          hideLoading();
        }
      }
    }

    updateCurrentQuestions(levelToDelete, [createEmptyQuestion(levelToDelete)]);
    setCurrentIndex(0);
    setShowDeleteDialog(false);
  };

  // Question update function with change tracking (no auto-save)
  const onUpdateQuestion = (field: keyof Question, value: any) => {
    const currentQuestions = getCurrentQuestions();
    const question = currentQuestions[currentIndex];
    
    if (field === "questionLevel" && LEVELS.includes(value as Level)) {
      const newLevel = value as Level;
      const updatedQuestion = { ...question, questionLevel: newLevel };
      
      const remainingQuestions = currentQuestions.filter((_, idx) => idx !== currentIndex);
      updateCurrentQuestions(currentTab, remainingQuestions);
      
      const targetLevelQuestions = getCurrentQuestionsByLevel()[newLevel];
      updateCurrentQuestions(newLevel, [...targetLevelQuestions, updatedQuestion]);
      
      setCurrentTab(newLevel);
      setCurrentIndex(targetLevelQuestions.length);
      
      // Mark as modified if in edit mode and has questionID
      if (mode === "edit" && updatedQuestion.questionID) {
        markQuestionAsModified(updatedQuestion.questionID);
      }
    } else {
      const newList = [...currentQuestions];
      if (field === "questionType" && value === "Input" && question.answers) {
        const { answers, ...rest } = question;
        newList[currentIndex] = { ...rest, [field]: value };
      } else {
        newList[currentIndex] = { ...question, [field]: value };
      }
      updateCurrentQuestions(currentTab, newList);
      
      // Track changes but don't auto-save
      if (mode === "edit" && question.questionID) {
        const updatedQuestion = newList[currentIndex];
        
        // Check if question is actually different from original
        const originalQuestion = findOriginalQuestion(question.questionID);
        if (originalQuestion && !questionsAreEqual(updatedQuestion, originalQuestion)) {
          markQuestionAsModified(question.questionID);
          console.log("📝 Question marked as modified (will save on manual update):", question.questionID);
        }
      }
    }
    
    setError("");
  };

  // Find original question by ID
  const findOriginalQuestion = (questionID: string): Question | null => {
    for (const level of LEVELS) {
      const question = originalQuestions[level].find(q => q.questionID === questionID);
      if (question) return question;
    }
    return null;
  };

  // Update original question state after successful save
  const updateOriginalQuestion = (updatedQuestion: Question) => {
    setOriginalQuestions(prev => {
      const newOriginal = { ...prev };
      for (const level of LEVELS) {
        const questionIndex = newOriginal[level].findIndex(q => q.questionID === updatedQuestion.questionID);
        if (questionIndex !== -1) {
          newOriginal[level][questionIndex] = { ...updatedQuestion };
          break;
        }
      }
      return newOriginal;
    });
    
    // Remove from modified set since it's now saved
    setModifiedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(updatedQuestion.questionID);
      return newSet;
    });
  };

  // Calculate completed questions based on current mode
  const getCompletedCount = (): number => {
    const questionsByLevel = getCurrentQuestionsByLevel();
    return Object.values(questionsByLevel)
      .flat()
      .filter(q => q.question.trim() && q.questionCategory && q.questionLevel)
      .length;
  };

  // Submission handlers
  const handleCreateNew = () => {
    showConfirmationDialog(
      "Add Survey Questions",
      "This will add new questions to the existing survey. Do you want to continue?",
      async () => {
        const allNewQuestions = LEVELS.flatMap(lvl => newQuestionsByLevel[lvl]).filter(
          q => q.question.trim() && q.questionCategory && q.questionLevel && !q.questionID
        );
        
        showLoading("create", "Adding Questions...");
        try {
          await createQuestions(allNewQuestions);
          console.log(`✅ Added ${allNewQuestions.length} new questions`);
          await switchToEditMode();
        } catch (error) {
          console.error("Creation failed:", error);
        } finally {
          hideLoading();
        }
      }
    );
  };

  // ⭐ NEW: Smart update logic - single PUT for 1 question, bulk for multiple
  const handleUpdateModifiedQuestions = async () => {
    if (modifiedQuestions.size === 0) {
      setError("No questions have been modified.");
      return;
    }

    const questionsToUpdate: Question[] = [];
    
    // Collect all modified questions
    for (const level of LEVELS) {
      for (const question of existingQuestionsByLevel[level]) {
        if (question.questionID && modifiedQuestions.has(question.questionID)) {
          questionsToUpdate.push(question);
        }
      }
    }

    if (questionsToUpdate.length === 0) {
      setError("No valid modified questions found.");
      return;
    }

    console.log(`🔍 Found ${questionsToUpdate.length} modified questions to update`);

    // ⭐ SMART LOGIC: Choose update method based on count
    if (questionsToUpdate.length === 1) {
      // Use single question update for better performance and clearer logging
      const singleQuestion = questionsToUpdate[0];
      console.log(`📝 Using SINGLE PUT for 1 question: ${singleQuestion.questionID}`);
      
      showLoading("update", `Updating question: "${singleQuestion.question.substring(0, 30)}..."`);
      
      try {
        await updateSingleQuestion(singleQuestion);
        console.log("✅ Single question updated successfully");
        
        // Update the original questions state to reflect the new saved state
        updateOriginalQuestion(singleQuestion);
        
        await fetchQuestions(); // Refresh to ensure consistency
      } catch (error: any) {
        console.error("❌ Failed to update single question:", error);
        setError(`Failed to update question: ${error.message}`);
      } finally {
        hideLoading();
      }
    } else {
      // Use batch update for multiple questions
      console.log(`📝 Using BULK PUT for ${questionsToUpdate.length} questions`);
      
      showLoading("update", `Updating ${questionsToUpdate.length} modified questions...`);
      
      try {
        await updateQuestionsBatch(questionsToUpdate);
        console.log(`✅ Successfully updated ${questionsToUpdate.length} questions in bulk`);
        
        // Update the original questions state for all updated questions
        questionsToUpdate.forEach(question => {
          updateOriginalQuestion(question);
        });
        
        await fetchQuestions(); // Refresh to ensure consistency
      } catch (error: any) {
        console.error("❌ Failed to update questions in bulk:", error);
        setError(`Failed to update questions: ${error.message}`);
      } finally {
        hideLoading();
      }
    }

    // Clear modifications after successful update (for both single and bulk)
    clearModifications();
  };

  // Show loading or empty state
  if (!showUIImmediately) {
    return (
      <LoadingPopup
        show={true}
        variant="fetch"
        message="Initializing Survey Builder..."
      />
    );
  }

  // Show empty state only when in edit mode and no questions exist
  if (mode === "edit" && isEmpty && existingQuestions.length === 0) {
    return (
      <>
        <AdminEmptyState
          onAddQuestion={(level) => {
            switchToCreateMode();
            setTimeout(() => onAddQuestion(level), 0);
          }}
          isEmpty={true}
          error={error}
        />
        <LoadingPopup
          show={loadingState.show}
          variant={loadingState.variant}
          message={loadingState.message}
        />
      </>
    );
  }

  return (
    <>
      <SurveyLayout
        questions={getCurrentQuestions()}
        questionsByLevel={getCurrentQuestionsByLevel()}
        currentIndex={currentIndex}
        currentLevel={currentTab}
        completedCount={getCompletedCount()}
        showPreview={showPreview}
        isSubmitting={loadingState.show || isLoading}
        error={error}
        mode={mode}
        onErrorDismiss={() => setError("")}
        onSelectLevel={(lvl) => {
          setCurrentTab(lvl);
          setCurrentIndex(0);
        }}
        onSelectQuestion={onSelectQuestion}
        onAddQuestion={onAddQuestion}
        onDeleteCurrent={onDeleteCurrent}
        onDeleteAllQuestions={onDeleteAllQuestions}
        onUpdateQuestion={onUpdateQuestion}
        onPrev={() => setCurrentIndex(i => Math.max(i - 1, 0))}
        onNext={() => setCurrentIndex(i => Math.min(i + 1, getCurrentQuestions().length - 1))}
        onCreateNew={handleCreateNew}
        onUpdate={handleUpdateModifiedQuestions} // ⭐ Smart update function
        onSwitchToCreate={switchToCreateMode}
        onSwitchToEdit={switchToEditMode}
        onPreview={() => setShowPreview(true)}
        onClosePreview={() => setShowPreview(false)}
        onLogout={() => navigate("/")}
        formTitle="Sanskrit Survey Builder"
        formDescription={mode === "create" ? "Create new questions for each level." : "Edit existing questions. Click 'Update' to save changes."}
      />

      {/* Loading Popup */}
      <LoadingPopup
        show={loadingState.show}
        variant={loadingState.variant}
        message={loadingState.message}
      />

      {/* Delete Confirmation */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Delete All Questions
            </h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete all <strong>{levelToDelete}</strong> questions?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                onClick={confirmDeleteAllQuestions}
              >
                Yes, Delete All
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
            <h2 className="text-xl font-bold text-blue-700 mb-2">
              {confirmationTitle}
            </h2>
            <p className="text-gray-700 mb-6">{confirmationMessage}</p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                onClick={() => {
                  setShowConfirmation(false);
                  onConfirmAction();
                }}
              >
                Yes, Confirm
              </button>
              <button
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show indicator for modified questions that need saving */}
      {modifiedQuestions.size > 0 && (
        <div className="fixed bottom-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm">
              {modifiedQuestions.size} question{modifiedQuestions.size > 1 ? 's' : ''} modified - 
              {modifiedQuestions.size === 1 ? ' Single PUT' : ' Bulk PUT'} will be used
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default SurveyPage;