import React, { memo } from "react";
import { Sidebar } from "./Sidebar";
import QuestionCard from "./QuestionCard";
import { PreviewModal } from "./PreviewModal";
import { Header } from "./Header";
import ErrorAlert from "../common/ErrorAlert";
import { Question } from "../../types/types";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
type Level = (typeof LEVELS)[number];

interface SurveyLayoutProps {
  questions: Question[];
  questionsByLevel: Record<Level, Question[]>;
  currentIndex: number;
  currentLevel: Level;
  completedCount: number;
  showPreview: boolean;
  isSubmitting: boolean;
  error: string;
  mode: "create" | "edit";

  onSelectLevel: (level: Level) => void;
  onSelectQuestion: (level: Level, index: number) => void;
  onAddQuestion: (level: Level) => void;
  onPrev: () => void;
  onNext: () => void;
  onDeleteCurrent: () => void;
  onDeleteAllQuestions: (level: Level) => void;

  onUpdateQuestion: (field: keyof Question, value: string) => void;
  onCreateNew: () => void;
  onUpdate: () => void;
  onSwitchToCreate: () => void;
  onSwitchToEdit: () => void;
  onPreview: () => void;
  onClosePreview: () => void;
  onLogout: () => void;
  onErrorDismiss: () => void;
  formTitle: string;
  formDescription: string;
}

function SurveyLayout({
  questions,
  questionsByLevel,
  currentIndex,
  currentLevel,
  completedCount,
  showPreview,
  isSubmitting,
  error,
  mode,
  onSelectLevel,
  onSelectQuestion,
  onAddQuestion,
  onPrev,
  onNext,
  onDeleteCurrent,
  onDeleteAllQuestions,
  onUpdateQuestion,
  onCreateNew,
  onUpdate,
  onSwitchToCreate,
  onSwitchToEdit,
  onPreview,
  onClosePreview,
  onLogout,
  onErrorDismiss,
  formTitle,
  formDescription,
}: SurveyLayoutProps) {
  // Clamp index so it never goes out of bounds
  const safeIndex = Math.min(currentIndex, Math.max(questions.length - 1, 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Header
        completedCount={completedCount}
        totalCount={questions.length}
        mode={mode}
        onPreview={onPreview}
        onCreateNew={onCreateNew}
        onUpdate={onUpdate}
        onSwitchToCreate={onSwitchToCreate}
        onSwitchToEdit={onSwitchToEdit}
        isSubmitting={isSubmitting}
        onLogout={onLogout}
      />

      {error && <ErrorAlert message={error} onDismiss={onErrorDismiss} />}

      {/* Main content area - centered in the page */}
      <div className="container mx-auto py-8 px-4">
        <div className="w-full flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Sidebar - keeping the original fixed width */}
          <div className="w-full lg:w-[700px] flex-shrink-0">
            <MemoizedSidebar
              questionsByLevel={questionsByLevel}
              currentLevel={currentLevel}
              onSelectLevel={onSelectLevel}
              currentIndex={safeIndex}
              onSelect={onSelectQuestion}
              onDeleteAll={onDeleteAllQuestions}
              completedCount={completedCount}
              mode={mode}
              onAddQuestion={onAddQuestion}
            />
          </div>

          {/* Main Question Card - flexible width */}
          <div className="w-full lg:max-w-3xl flex-1">
            {questions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow border border-gray-100 p-12 text-center h-full flex items-center justify-center">
                <div>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Questions Yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Start building your survey by adding questions to any
                    difficulty level.
                  </p>
                  <div className="flex gap-3 justify-center">
                    {LEVELS.map((level) => (
                      <button
                        key={level}
                        onClick={() => onAddQuestion(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          level === "Beginner"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : level === "Intermediate"
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        Add {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <MemoizedQuestionCard
                question={questions[safeIndex]!}
                index={safeIndex}
                isFirst={safeIndex === 0}
                isLast={safeIndex === questions.length - 1}
                onPrev={onPrev}
                onNext={onNext}
                onDelete={onDeleteCurrent}
                onUpdate={onUpdateQuestion}
                onAddNext={() => onAddQuestion(currentLevel)}
                currentTabLevel={currentLevel}
                mode={mode}
              />
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          title={formTitle}
          description={formDescription}
          questions={questions}
          mode={mode}
          onClose={onClosePreview}
          onCreateNew={onCreateNew}
          onUpdate={onUpdate}
          isSubmitting={isSubmitting}
          completedCount={completedCount}
        />
      )}
    </div>
  );
}

const MemoizedSidebar = memo(Sidebar);
const MemoizedQuestionCard = memo(QuestionCard);

export default SurveyLayout;