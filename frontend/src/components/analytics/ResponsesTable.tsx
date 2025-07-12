// src/components/analytics/ResponsesTable.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Question } from "../../types/types";

interface ResponsesTableProps {
  questions: Question[];
  answerCounts: Record<string, number>;
  skipCounts: Record<string, number>;
  recentAnsweredIds: Set<string>;
}

export const ResponsesTable: React.FC<ResponsesTableProps> = ({
  questions,
  answerCounts,
  skipCounts,
  recentAnsweredIds,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      {/* Fixed Table Header */}
      <div className="p-6 pb-4">
        <h3 className="text-xl font-semibold mb-4">Responses Table</h3>

        {/* Summary Stats */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">
                Total Questions:
              </span>
              <span className="ml-2 font-bold">{questions.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Answers:</span>
              <span className="ml-2 font-bold text-green-600">
                {Object.values(answerCounts).reduce(
                  (sum, count) => sum + count,
                  0
                )}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Skips:</span>
              <span className="ml-2 font-bold text-amber-600">
                {Object.values(skipCounts).reduce(
                  (sum, count) => sum + count,
                  0
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="flex-1 px-6 pb-6">
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left">
            {/* Sticky Table Header */}
            <thead className="sticky top-0 bg-purple-100 z-10">
              <tr>
                <th className="px-3 py-2 font-semibold border-b border-gray-200">
                  #
                </th>
                <th className="px-3 py-2 font-semibold border-b border-gray-200">
                  Question
                </th>
                <th className="px-3 py-2 font-semibold border-b border-gray-200">
                  Category
                </th>
                <th className="px-3 py-2 font-semibold border-b border-gray-200">
                  Level
                </th>
                <th className="px-3 py-2 font-semibold text-green-700 border-b border-gray-200">
                  Answered
                </th>
                <th className="px-3 py-2 font-semibold text-amber-700 border-b border-gray-200">
                  Skipped
                </th>
                <th className="px-3 py-2 font-semibold text-red-700 border-b border-gray-200">
                  Skip%
                </th>
                <th className="px-3 py-2 font-semibold border-b border-gray-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No questions found. Questions need to be added to see
                    analytics.
                  </td>
                </tr>
              ) : (
                questions.map((q, index) => {
                  const answeredQ = answerCounts[q.questionID] || 0;
                  const skippedQ = skipCounts[q.questionID] || 0;
                  const totalQ = answeredQ + skippedQ;
                  const skipRate =
                    totalQ > 0 ? ((skippedQ / totalQ) * 100).toFixed(1) : "0.0";

                  return (
                    <tr
                      key={q.questionID}
                      className={`border-b hover:bg-gray-50 ${
                        recentAnsweredIds.has(q.questionID)
                          ? "bg-yellow-100 font-semibold"
                          : index % 2 === 0
                          ? "bg-white"
                          : "bg-purple-25"
                      }`}
                    >
                      <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                      <td
                        className="px-3 py-2 text-purple-600 underline cursor-pointer hover:text-purple-800 max-w-xs"
                        onClick={() =>
                          navigate(`/analytics/question/${q.questionID}`)
                        }
                        title={q.question}
                      >
                        <div className="truncate">
                          {q.question.length > 50
                            ? `${q.question.substring(0, 50)}...`
                            : q.question}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {q.questionCategory}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            q.questionLevel === "Beginner"
                              ? "bg-green-100 text-green-800"
                              : q.questionLevel === "Intermediate"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {q.questionLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-700">
                            {answeredQ}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="font-medium text-amber-700">
                            {skippedQ}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`font-medium ${
                            parseFloat(skipRate) > 50
                              ? "text-red-600"
                              : parseFloat(skipRate) > 25
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {skipRate}%
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-700">
                        {totalQ}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
