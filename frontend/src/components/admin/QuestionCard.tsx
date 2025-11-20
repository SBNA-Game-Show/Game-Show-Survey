// Updated QuestionCard.tsx - Removed unused Plus import and fixed other issues
import { useState } from "react";
import { X, Check, Plus } from "lucide-react";
import { Question } from "../../types/types";

const categories = [
  "Vocabulary",
  "Grammar",
  "Culture",
  "Literature",
  "History",
] as const;
const levels = ["Beginner", "Intermediate", "Advanced"] as const;
const questionTypes = ["Input", "MCQ"] as const;

interface QuestionCardProps {
  question: Question;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onPrev(): void;
  onNext(): void;
  onDelete(): void;
  onUpdate(field: keyof Question, value: any): void;
  onAddNext(): void;
  currentTabLevel: string;
  mode?: "create" | "edit";
}

interface McqOption {
  answer: string;
  isCorrect: boolean;
  answerID?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  isFirst,
  isLast,
  onPrev,
  onNext,
  onDelete,
  onUpdate,
  onAddNext,
  currentTabLevel,
  mode = "create",
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const defaultMcqOptions: McqOption[] = [
    { answer: "", isCorrect: true },
    { answer: "", isCorrect: false },
    { answer: "", isCorrect: false },
    { answer: "", isCorrect: false },
  ];

  const mcqOptions = question.answers?.length
    ? question.answers.map((a) => ({
        answer: a.answer || "",
        isCorrect: a.isCorrect || false,
        answerID: a.answerID,
      }))
    : defaultMcqOptions;

  if (mcqOptions.length > 0 && !mcqOptions.some((opt) => opt.isCorrect)) {
    mcqOptions[0].isCorrect = true;
  }

  const handleMcqOptionChange = (i: number, val: string) => {
    const newOptions = [...mcqOptions];
    newOptions[i].answer = val;
    onUpdate("answers", newOptions);
  };

  const handleSetCorrectOption = (i: number) => {
    const updated = mcqOptions.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === i,
    }));
    onUpdate("answers", updated);
  };

  const handleDelete = (confirm: boolean) => {
    setShowDeleteDialog(false);
    if (confirm) onDelete();
  };

  const isCategorySelected = () => !!question.questionCategory?.trim();
  const nearLimit = (question.question?.length || 0) > 450;
  const isQuestionTypeDisabled = Boolean(
    mode === "edit" && question.questionID
  );

  // Add question button functionality - now using the onAddNext prop
  const handleAddQuestion = () => {
    onAddNext();
  };

  return (
    <>
      <div className="bg-question-card-bg rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-question-text">
            Question {index + 1}
          </h3>
          <div className="flex items-center gap-2">
            {/* Add Question Button - using the onAddNext functionality */}
            {mode === "create" && (
              <button
                onClick={handleAddQuestion}
                className="p-2 rounded-lg transition-colors text-green-600 hover:bg-green-100 hover:text-green-700 flex items-center gap-1 text-sm font-medium"
                title="Add another question"
              >
                <Plus size={16} />
                Add
              </button>
            )}
            <button
              data-cy="delete-question-button"
              onClick={() => setShowDeleteDialog(true)}
              className="p-2 rounded-lg transition-colors bg-btn-delete-question-bg text-btn-delete-question-text hover:bg-btn-delete-question-hover-bg hover:text-btn-delete-question-hover-text"
              title="Delete this question"
            >
              Delete this question
            </button>
          </div>
        </div>

        {/* Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Category *
            </label>
            <select
              data-cy="question-category-select"
              value={question.questionCategory || ""}
              onChange={(e) => onUpdate("questionCategory", e.target.value)}
              className="w-full border-2 rounded-xl px-4 py-3 bg-white"
            >
              <option value="">Choose a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Level *
            </label>
            <select
              data-cy="question-level-select"
              value={question.questionLevel || currentTabLevel}
              onChange={(e) => onUpdate("questionLevel", e.target.value)}
              className="w-full border-2 rounded-xl px-4 py-3 bg-white"
            >
              <option value="">Select level</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Question Type *
            </label>
            <select
              data-cy="question-type-select"
              value={question.questionType || "Input"}
              onChange={(e) => onUpdate("questionType", e.target.value)}
              disabled={isQuestionTypeDisabled}
              className={`w-full border-2 rounded-xl px-4 py-3 transition-colors ${
                isQuestionTypeDisabled
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                  : "bg-white hover:border-gray-300"
              }`}
              title={
                isQuestionTypeDisabled
                  ? "Question type cannot be changed in edit mode"
                  : ""
              }
            >
              {questionTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "Input" ? "Text" : "Multiple Choice"}
                </option>
              ))}
            </select>
            {isQuestionTypeDisabled && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <span>🔒</span>
                Question type cannot be changed in edit mode
              </p>
            )}
          </div>
        </div>

        {/* Question Text + MCQ Right Side */}
        <div
          className={`flex flex-col ${
            question.questionType === "MCQ" ? "sm:flex-row gap-4" : ""
          }`}
        >
          {/* Left: Question Text */}
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Question Text *
            </label>
            <div className="relative">
              <textarea
                data-cy="question-textarea"
                rows={question.questionType === "MCQ" ? 6 : 4}
                value={question.question || ""}
                onChange={(e) => onUpdate("question", e.target.value)}
                placeholder={
                  isCategorySelected()
                    ? "Enter your question..."
                    : "Select a category first"
                }
                disabled={!isCategorySelected()}
                maxLength={500}
                className={`w-full border-2 rounded-xl p-4 resize-none transition-colors ${
                  !isCategorySelected()
                    ? "bg-gray-100 text-gray-500"
                    : "bg-white"
                }`}
              />
              <span
                className={`absolute bottom-2 right-3 text-xs px-2 py-1 rounded-full ${
                  nearLimit
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {question.question?.length || 0}/500
              </span>
            </div>
          </div>

          {/* Right: MCQ Options */}
          {question.questionType === "MCQ" && (
            <div className="flex-1 space-y-2 mt-6 sm:mt-0">
              <div className="text-sm font-semibold text-gray-900 mb-1">
                MCQ Options <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-500">
                  (Select one correct)
                </span>
              </div>
              {mcqOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    data-cy={`mcq-option-${i}-input`}
                    type="text"
                    value={opt.answer}
                    onChange={(e) => handleMcqOptionChange(i, e.target.value)}
                    className="flex-1 border-2 rounded-lg px-3 py-2"
                    placeholder={`Option ${i + 1}`}
                  />
                  <button
                    data-cy={`mcq-correct-answer-${i}-button`}
                    onClick={() => handleSetCorrectOption(i)}
                    className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                      opt.isCorrect
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {opt.isCorrect && <Check size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={onNext}
            disabled={isLast}
            className="px-4 py-2 text-sm rounded-lg bg-btn-next-bg text-btn-next-text hover:bg-btn-next-hover-bg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Delete Question?
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to delete this question? This action cannot
              be undone.
            </p>
            <div className="flex gap-3">
              <button
                data-cy="cancel-delete-question-button"
                onClick={() => handleDelete(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                data-cy="confirm-delete-question-button"
                onClick={() => handleDelete(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuestionCard;
