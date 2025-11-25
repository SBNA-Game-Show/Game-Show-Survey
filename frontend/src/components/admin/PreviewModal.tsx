import { useMemo } from "react";
import { X, Eye, FileText } from "lucide-react";
import { Question } from "../../types/types";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import { QuestionPreviewItem } from "./QuestionPreviewItem";

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

const getLevelColor = (level: string) => {
  const colors = {
    Beginner: "bg-green-50 border-green-200",
    Intermediate: "bg-amber-50 border-amber-200",
    Advanced: "bg-red-50 border-red-200",
  };
  return colors[level as keyof typeof colors] || "bg-gray-50 border-gray-200";
};

const getLevelTextColor = (level: string) => {
  const colors = {
    Beginner: "text-green-800",
    Intermediate: "text-amber-800",
    Advanced: "text-red-800",
  };
  return colors[level as keyof typeof colors] || "text-gray-800";
};

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

  const renderQuestions = (
    questionsToRender: Question[],
    showLevelHeaders = false,
    singleLevel?: string
  ) => {
    if (questionsToRender.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Questions Available
          </h3>
          <p className="text-gray-600">
            No questions found for this difficulty level.
          </p>
        </div>
      );
    }

    // Helper function to render level header
    const renderLevelHeader = (level: string, count: number) => (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
              level === "Beginner"
                ? "bg-green-500"
                : level === "Intermediate"
                ? "bg-amber-500"
                : "bg-red-500"
            }`}
          >
            {count}
          </div>
          <h3 className={`text-xl font-bold ${getLevelTextColor(level)}`}>
            {level} Level
          </h3>
        </div>
        <div className="text-sm text-gray-600">
          {count} question{count !== 1 ? "s" : ""}
        </div>
      </div>
    );

    if (showLevelHeaders) {
      // Group by level and show with headers (for "All Questions" tab)
      const groupedQuestions = questionsToRender.reduce(
        (groups: Record<string, Question[]>, q) => {
          if (!groups[q.questionLevel]) groups[q.questionLevel] = [];
          groups[q.questionLevel].push(q);
          return groups;
        },
        {}
      );

      return (
        <div className="space-y-8">
          {Object.entries(groupedQuestions).map(([level, levelQuestions]) => (
            <div
              key={level}
              className={`border-2 rounded-xl p-6 ${getLevelColor(level)}`}
            >
              {renderLevelHeader(level, levelQuestions.length)}
              <div className="grid gap-4">
                {levelQuestions.map((q, idx) => (
                  <QuestionPreviewItem
                    key={q.questionID || `${level}-${idx}`}
                    question={q}
                    index={idx}
                    levelPrefix={level}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (singleLevel) {
      // Single level with header (for individual difficulty tabs)
      return (
        <div
          className={`border-2 rounded-xl p-6 ${getLevelColor(singleLevel)}`}
        >
          {renderLevelHeader(singleLevel, questionsToRender.length)}
          <div className="grid gap-4">
            {questionsToRender.map((q, idx) => (
              <QuestionPreviewItem
                key={q.questionID || `${singleLevel}-${idx}`}
                question={q}
                index={idx}
                levelPrefix={singleLevel}
              />
            ))}
          </div>
        </div>
      );
    }

    // Simple list (fallback)
    return (
      <div className="space-y-4">
        {questionsToRender.map((q, idx) => (
          <QuestionPreviewItem
            key={q.questionID || `question-${idx}`}
            question={q}
            index={idx}
          />
        ))}
      </div>
    );
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
              <Eye size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Survey Preview
              </h2>
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
              <div className="text-2xl font-bold text-indigo-600">
                {completedQuestions.length}
              </div>
              <div className="text-sm text-gray-600">Ready Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {newQuestions.length}
              </div>
              <div className="text-sm text-gray-600">
                {mode === "create" ? "New Questions" : "Will Create"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {existingQuestions.length}
              </div>
              <div className="text-sm text-gray-600">
                {mode === "edit" ? "Will Update" : "Existing"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(questionsByLevel).length}
              </div>
              <div className="text-sm text-gray-600">Difficulty Levels</div>
            </div>
          </div>
        </div>

        {/* Difficulty Tabs  */}
        <Tabs className="flex flex-col flex-1 overflow-hidden">
          <TabList className="px-8 py-4 border-b border-gray-100 bg-white">
            {["All Questions", "Beginner", "Intermediate", "Advanced"].map(
              (tab) => (
                <Tab key={tab}>{tab}</Tab>
              )
            )}
          </TabList>

          <TabPanel className="flex-1 overflow-y-auto p-0">
            <div className="px-8 py-6">
              {renderQuestions(completedQuestions, true)}
            </div>
          </TabPanel>

          {["Beginner", "Intermediate", "Advanced"].map((level) => (
            <TabPanel key={level} className="flex-1 overflow-y-auto p-0">
              <div className="px-8 py-6">
                {renderQuestions(questionsByLevel[level] || [], false, level)}
              </div>
            </TabPanel>
          ))}
        </Tabs>

        {/* Questions Content */}

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Operation Info */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    mode === "create"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {mode === "create" ? "CREATE MODE" : "EDIT MODE"}
                </span>
                <span className="text-sm text-gray-600">
                  {mode === "create"
                    ? "Use the header 'Save Questions' button to create these questions"
                    : "Use the header 'Save Changes' button to update these questions"}
                </span>
              </div>
            </div>

            {/* Close Button Only */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
              >
                <X size={16} />
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
