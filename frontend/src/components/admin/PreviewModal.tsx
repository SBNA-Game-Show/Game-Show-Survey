import React, { useMemo } from "react";
import { X } from "lucide-react";
import { Question } from "../../types/types";

interface PreviewModalProps {
  title: string;
  description: string;
  questions: Question[];
  mode: "create" | "edit";
  onClose: () => void;
  onCreateNew: () => void;
  onUpdate: () => void;
  isSubmitting: boolean;
  completedCount: number;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  title,
  description,
  questions,
  mode,
  onClose,
  onCreateNew,
  onUpdate,
  isSubmitting,
  completedCount,
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Only include completed questions in preview
  const completedQuestions = useMemo(() => {
    return questions.filter(
      (q) => q.question.trim() && q.questionCategory && q.questionLevel
    );
  }, [questions]);

  const newQuestions = completedQuestions.filter(
    (q) => !q.questionID || q.questionID === ""
  );
  const existingQuestions = completedQuestions.filter(
    (q) => q.questionID && q.questionID !== ""
  );

  // Group questions by level for better organization
  const questionsByLevel = useMemo(() => {
    const grouped: Record<string, Question[]> = {};
    completedQuestions.forEach((q) => {
      if (!grouped[q.questionLevel]) {
        grouped[q.questionLevel] = [];
      }
      grouped[q.questionLevel].push(q);
    });
    return grouped;
  }, [completedQuestions]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "border-green-200 bg-green-50";
      case "Intermediate":
        return "border-amber-200 bg-amber-50";
      case "Advanced":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getLevelTextColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "text-green-800";
      case "Intermediate":
        return "text-amber-800";
      case "Advanced":
        return "text-red-800";
      default:
        return "text-gray-800";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Survey Preview</h2>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close preview"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-8 py-6 border-b border-gray-100 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{completedQuestions.length}</div>
              <div className="text-sm text-gray-600">Ready Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{newQuestions.length}</div>
              <div className="text-sm text-gray-600">{mode === "create" ? "New Questions" : "Will Create"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{existingQuestions.length}</div>
              <div className="text-sm text-gray-600">{mode === "edit" ? "Will Update" : "Existing"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(questionsByLevel).length}</div>
              <div className="text-sm text-gray-600">Difficulty Levels</div>
            </div>
          </div>
        </div>

        {/* Questions Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {completedQuestions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Complete Questions</h3>
              <p className="text-gray-600">Please complete at least one question before previewing.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(questionsByLevel).map(([level, levelQuestions]) => (
                <div key={level} className={`border-2 rounded-xl p-6 ${getLevelColor(level)}`}>
                  {/* Level Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                        level === "Beginner" ? "bg-green-500" : 
                        level === "Intermediate" ? "bg-amber-500" : "bg-red-500"
                      }`}>
                        {levelQuestions.length}
                      </div>
                      <h3 className={`text-xl font-bold ${getLevelTextColor(level)}`}>
                        {level} Level
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600">
                      {levelQuestions.length} question{levelQuestions.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Questions in this level */}
                  <div className="grid gap-4">
                    {levelQuestions.map((q, idx) => (
                      <div key={q.questionID || `preview-${level}-${idx}`} 
                           className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                              Question {idx + 1}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              {q.questionCategory}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              q.questionType === "Mcq" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                            }`}>
                              {q.questionType === "Mcq" ? "Multiple Choice" : "Text Input"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {q.questionID ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                Update
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-3 leading-relaxed">
                          {q.question}
                        </h4>

                        {/* MCQ Options */}
                        {q.questionType === "Mcq" && q.answers && q.answers.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Answer Options:</p>
                            <div className="space-y-2">
                              {q.answers.map((option, optIdx) => (
                                <div key={`${q.questionID || level}-${idx}-option-${optIdx}`}
                                     className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    option.isCorrect ? "bg-green-500" : "bg-gray-300"
                                  }`}></div>
                                  <span className={`text-sm ${option.isCorrect ? "font-medium text-green-700" : "text-gray-600"}`}>
                                    {option.answer}
                                    {option.isCorrect && (
                                      <span className="ml-1 text-xs text-green-600">(Correct)</span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Operation Info */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  mode === "create" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                }`}>
                  {mode === "create" ? "CREATE MODE" : "EDIT MODE"}
                </span>
                <span className="text-sm text-gray-600">
                  {mode === "create" 
                    ? "Use the header 'Save Questions' button to add these questions" 
                    : "Use the header 'Save Changes' button to update these questions"
                  }
                </span>
              </div>
            </div>

            {/* Close Button Only */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};