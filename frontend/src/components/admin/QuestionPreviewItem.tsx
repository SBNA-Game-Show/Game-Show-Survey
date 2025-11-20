import { Question } from "../../types/types";

interface QuestionPreviewItemProps {
  question: Question;
  index: number;
  levelPrefix?: string;
}

export const QuestionPreviewItem: React.FC<QuestionPreviewItemProps> = ({
  question: q,
  index: idx,
  levelPrefix,
}) => {
  const keyBase = q.questionID || levelPrefix || "question";

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500">
            Question {idx + 1}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {q.questionCategory}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              q.questionType === "MCQ"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {q.questionType === "MCQ" ? "Multiple Choice" : "Text Input"}
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

      {q.questionType === "MCQ" && q.answers && q.answers.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Answer Options:
          </p>
          <div className="space-y-2">
            {q.answers.map((option, optIdx) => (
              <div
                key={`${keyBase}-${idx}-option-${optIdx}`}
                className="flex items-center gap-2"
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    option.isCorrect ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={`text-sm ${
                    option.isCorrect
                      ? "font-medium text-green-700"
                      : "text-gray-600"
                  }`}
                >
                  {option.answer}
                  {option.isCorrect && (
                    <span className="ml-1 text-xs text-green-600">
                      (Correct)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
