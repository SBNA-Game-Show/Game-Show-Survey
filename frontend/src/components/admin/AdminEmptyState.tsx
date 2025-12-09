// src/components/admin/AdminEmptyState.tsx
import { FileText, Plus } from "lucide-react";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
type Level = (typeof LEVELS)[number];

interface AdminEmptyStateProps {
  onAddQuestion: (level: Level) => void;
  isEmpty: boolean;
  error?: string;
}

const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  onAddQuestion,
  isEmpty,
  error,
}) => {
  const handleButtonClick = (level: Level) => {
    console.log(
      "🚀 AdminEmptyState: Starting to add question for level:",
      level
    );
    onAddQuestion(level);
  };

  return (
    <div className="min-h-screen bg-adminlost-bg flex items-center justify-center p-6">
      <div className="bg-adminlost-card-bg rounded-2xl shadow-lg border border-gray-100 p-12 text-center max-w-2xl mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 bg-adminlost-icon-bg rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="w-10 h-10 text-adminlost-icon" />
        </div>

        {/* Title and Message */}
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          {isEmpty ? "No Questions Found" : "Welcome to Survey Builder"}
        </h3>

        {error ? (
          <div className="mb-8">
            <p className="text-adminlost-connection-issue text-lg font-medium mb-4">
              Database Connection Issue
            </p>
            <p className="text-gray-600 text-sm mb-6">{error}</p>
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm font-semibold mb-3">
                What to do:
              </p>
              <ul className="text-amber-700 text-sm space-y-2 text-left">
                <li>• Check if your backend server is running</li>
                <li>• Verify your API configuration in the .env file</li>
                <li>• Ensure your database connection is working</li>
                <li>• Try refreshing the page</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <p className="text-adminlost-connection-issue text-lg mb-6">
              {isEmpty
                ? "Your survey database is empty. Start building your survey by adding questions to any difficulty level."
                : "Start building your survey by adding questions to any difficulty level."}
            </p>

            {isEmpty && (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <p className="text-amber-800 text-sm font-semibold mb-3">
                  Getting Started:
                </p>
                <ul className="text-amber-700 text-sm space-y-2 text-left">
                  <li>
                    • Choose a difficulty level below to create your first
                    question
                  </li>
                  <li>• Fill in the question details and category</li>
                  <li>• Use the Preview button to review before saving</li>
                  <li>• Switch to Analytics once you have responses</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - only show if no error */}
        {!error && (
          <div className="space-y-4">
            <p className="text-gray-700 font-medium mb-4">
              Choose a difficulty level to start creating questions:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {LEVELS.map((level) => (
                <button
                  data-cy={`empty-add-${level.toLowerCase()}-button`}
                  key={level}
                  onClick={() => handleButtonClick(level)}
                  className={`group relative px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl overflow-hidden ${
                    level === "Beginner"
                      ? "bg-adminlost-beginner-bg hover:brightness-110 text-white"
                      : level === "Intermediate"
                      ? "bg-adminlost-intermediate-bg hover:brightness-110 text-white"
                      : "bg-adminlost-advanced-bg hover:brightness-110 text-white"
                  }`}
                >
                  {/* Background animation effect */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

                  <div className="relative flex items-center justify-center gap-3">
                    <Plus className="w-10 h-10" />
                    <span>Add {level} Question</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Additional Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-400 text-sm">
            {isEmpty
              ? "Questions will appear in the sidebar once you create them"
              : "Build comprehensive surveys with multiple difficulty levels"}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Need help? Check the documentation or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminEmptyState;
