// src/components/admin/Sidebar.tsx
import { Trash2, Plus } from "lucide-react";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
type Level = (typeof LEVELS)[number];

interface Question {
  id?: string;
  question?: string;
  questionCategory?: string;
  questionLevel?: string;
  questionType?: string;
}

interface SidebarProps {
  questionsByLevel: Record<Level, Question[]>;
  currentIndex: number;
  currentLevel: Level;
  onSelect(level: Level, index: number): void;
  onDeleteAll(level: Level): void;
  onSelectLevel(level: Level): void;
  completedCount: number;
  mode?: "create" | "edit";
  onAddQuestion?: (level: Level) => void;
}

const getClassNames = {
  levelTab: (isActive: boolean) =>
    `px-4 py-2 rounded-t-lg transition-colors focus:outline-none ${
      isActive
        ? "bg-active-level-tab-bg text-active-level-tab-text border-t border-l border-r border-gray-200"
        : "bg-inactive-level-tab-bg text-inactive-level-tab-text hover:bg-gray-200"
    }`,

  questionItem: (isActive: boolean) =>
    `group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
      isActive
        ? "bg-levelquestion-active-bg border-l-4 border-levelquestion-active-border shadow-sm"
        : "hover:bg-gray-50 hover:shadow-sm border-l-4 border-transparent"
    }`,

  questionTypeBadge: (type?: string) =>
    `text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
      type === "Mcq"
        ? "bg-blue-100 text-blue-700"
        : "bg-green-100 text-green-700"
    }`,

  deleteButton:
    "flex items-center gap-1 px-3 py-1 bg-btn-delete-all-questions-bg text-btn-delete-all-questions-text rounded-md hover:bg-btn-delete-all-questions-hover-bg transition-colors text-sm",

  addButton:
    "w-full px-3 py-2 rounded-lg font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300 transition-all duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:text-gray-600 disabled:hover:border-gray-200",
};

export function Sidebar({
  questionsByLevel,
  currentIndex,
  currentLevel,
  onSelect,
  onDeleteAll,
  onSelectLevel,
  completedCount,
  mode,
  onAddQuestion,
}: SidebarProps) {
  const levelQuestions = questionsByLevel[currentLevel] || [];
  const totalQuestions = Object.values(questionsByLevel).flat().length;
  const progressPct = totalQuestions
    ? (completedCount / totalQuestions) * 100
    : 0;
  const MAX_HEIGHT_REM = mode === "create" ? 20 : 22;

  return (
    <aside
      className="w-full max-w-6xl bg-sidebar-bg rounded-2xl shadow-lg border border-gray-100 p-4 text-sidebar-text flex flex-col"
      role="navigation"
      aria-label="Question Navigation Sidebar"
    >
      {/* Question Bank Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-bold text-question-bank-text">
          Question Bank
        </h3>
        {mode === "create" && (
          <span
            data-cy="create-mode-badge"
            className="px-3 py-1 bg-green-100 text-black rounded-full"
          >
            CREATE MODE
          </span>
        )}
      </div>
      {/* Progress Bar only shows during Edit mode*/}
      {mode === "edit" && (
        <div className="mb-2 bg-gray-100 py-2 px-2 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between text-sm">
            <span className="text-progress-text">Progress</span>
            <span className="font-bold text-progress-number">
              {completedCount}/{totalQuestions}
            </span>
          </div>

          <div className="relative h-2 mt-1">
            <div
              className="absolute h-full bg-gradient-to-r from-progress-bar-from to-progress-bar-to transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Level Tabs + Delete All */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-4">
          {LEVELS.map((lvl) => (
            <button
              data-cy={`level-tab-${lvl.toLowerCase()}`}
              key={lvl}
              onClick={() => onSelectLevel(lvl)}
              className={getClassNames.levelTab(currentLevel === lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>
        <button
          data-cy="delete-all-questions-button"
          onClick={() => {
            if (levelQuestions.length > 0) {
              onDeleteAll(currentLevel);
            }
          }}
          className={getClassNames.deleteButton}
          title={`Delete all ${currentLevel} questions`}
          type="button"
        >
          <Trash2 size={14} /> Delete All {currentLevel} Questions
        </button>
      </div>

      {/* Questions List for Selected Level */}
      <div className="flex-1 flex flex-col">
        <div
          className="overflow-y-auto flex-1"
          style={{ maxHeight: `${MAX_HEIGHT_REM}rem` }}
        >
          {levelQuestions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              {mode === "create"
                ? "No questions in this level yet. Click 'Add Question' below to start."
                : "No questions in this level."}
            </div>
          ) : (
            levelQuestions.map((q, idx) => (
              <div
                data-cy={`${currentLevel}-question-${idx}`}
                key={q.id || idx}
                className={getClassNames.questionItem(idx === currentIndex)}
                onClick={() => onSelect(currentLevel, idx)}
                tabIndex={0}
                title={q.question || "Untitled Question"}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>

                <div className="flex justify-between items-center w-full">
                  <span className="text-base font-medium break-words flex-1 pr-2 truncate">
                    {q.question || "Untitled Question"}
                  </span>
                  <span
                    className={getClassNames.questionTypeBadge(q.questionType)}
                  >
                    {q.questionType || "Input"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Question Button - Only show in create mode */}
        {mode === "create" && onAddQuestion && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              data-cy="add-question-button"
              onClick={() => onAddQuestion(currentLevel)}
              disabled={levelQuestions.some((q) => !q.question?.trim())}
              className={getClassNames.addButton}
            >
              <Plus size={16} />
              <span>Add Question</span>
            </button>
            {levelQuestions.some((q) => !q.question?.trim()) && (
              <p className="text-xs text-gray-400 mt-1 text-center">
                Complete the current question first
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
