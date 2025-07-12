import React from "react";

interface UserSidebarProps {
  questions: any[];
  answers: string[];
  index: number;
  answeredCount: number;
  onSelectQuestion: (i: number) => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({
  questions,
  answers,
  index,
  answeredCount,
  onSelectQuestion,
}) => {
  return (
    <aside className="w-80 bg-white/80 backdrop-blur-sm shadow-xl border-r border-purple-100 p-6 overflow-y-auto flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-2">
          Survey Progress
        </h2>
        <div className="w-full bg-purple-100 rounded-full h-3 shadow-inner">
          <div
            className="h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-sm transition-all duration-500 ease-out"
            style={{
              width: `${(answeredCount / questions.length) * 100}%`,
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2 text-center font-medium">
          {answeredCount} of {questions.length} completed
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Questions
        </p>
      </div>

      <ul className="space-y-2 flex-1">
        {questions.map((q, i) => (
          <li
            key={q.questionID || q._id || `sidebar-question-${i}`} // FIX: Added proper key
            onClick={() => onSelectQuestion(i)}
            className={`group relative flex items-center justify-between px-4 py-3 rounded-xl text-sm cursor-pointer transition-all duration-200 ${
              index === i
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg transform scale-105"
                : "hover:bg-purple-50 hover:shadow-md hover:transform hover:scale-102"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === i
                    ? "bg-white/20 text-white"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`font-medium ${
                  index === i ? "text-white" : "text-gray-700"
                }`}
              >
                Question {i + 1}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {answers[i] && answers[i] !== "skip" && (
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm animate-pulse" />
              )}
              {answers[i] === "skip" && (
                <div className="w-3 h-3 bg-amber-400 rounded-full shadow-sm" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default UserSidebar;