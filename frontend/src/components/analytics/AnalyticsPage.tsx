import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Question, Answer } from "../../types/types";
import { StatsOverview } from "./StatsOverview";
import { ChartContainer } from "./ChartContainer";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

interface AnalyticsPageProps {
  fetchAllQuestionsAndAnswersAdmin: () => Promise<{
    questions: Question[];
    answers: Answer[];
  }>;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  fetchAllQuestionsAndAnswersAdmin,
}) => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  // eslint-disable-next-line
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    setErr(null);
    setIsEmpty(false);
    try {
      const { questions: fetchedQuestions, answers: fetchedAnswers } =
        await fetchAllQuestionsAndAnswersAdmin();
      setQuestions(fetchedQuestions);
      setAnswers(fetchedAnswers);
      setIsEmpty(fetchedQuestions.length === 0);
    } catch (e: any) {
      if (
        e.message?.includes("404") ||
        e.message?.includes("No questions") ||
        e.message?.includes("empty")
      ) {
        setIsEmpty(true);
        setQuestions([]);
        setAnswers([]);
        setErr(
          "No questions found in the database. Please add some questions first in the admin dashboard."
        );
      } else {
        setErr(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      navigate("/login", { replace: true });
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setErr(null);
      setIsEmpty(false);
      try {
        const { questions: fetchedQuestions, answers: fetchedAnswers } =
          await fetchAllQuestionsAndAnswersAdmin();
        setQuestions(fetchedQuestions);
        setAnswers(fetchedAnswers);
        setIsEmpty(fetchedQuestions.length === 0);
      } catch (e: any) {
        if (
          e.message?.includes("404") ||
          e.message?.includes("No questions") ||
          e.message?.includes("empty")
        ) {
          setIsEmpty(true);
          setQuestions([]);
          setAnswers([]);
          setErr(
            "No questions found in the database. Please add some questions first in the admin dashboard."
          );
        } else {
          setErr(e.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchAllQuestionsAndAnswersAdmin, navigate]);

  // Stats for header boxes
  const totalAnswered = questions.reduce(
    (sum, q) => sum + (q.timesAnswered || 0),
    0
  );
  const totalSkipped = questions.reduce(
    (sum, q) => sum + (q.timesSkipped || 0),
    0
  );
  const totalResponses = totalAnswered + totalSkipped;
  const overallSkipRate =
    totalResponses > 0
      ? ((totalSkipped / totalResponses) * 100).toFixed(1)
      : "0.0";

  // Bar chart: Answer count per level
  const levelAnswerCounts = LEVELS.map((level) =>
    questions
      .filter((q) => q.questionLevel === level)
      .reduce((sum, q) => sum + (q.timesAnswered || 0), 0)
  );

  const levelChartData = {
    labels: [...LEVELS],
    datasets: [
      {
        label: "Answers Submitted",
        data: levelAnswerCounts,
        backgroundColor: [
          "#e47215ff", // light purple (Beginner)
          "#f0560eff", // medium purple (Intermediate)
          "#fc3808ff", // deep purple (Advanced)
        ],
        borderRadius: 12,
      },
    ],
  };

  // Header

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
      <h2 className="text-3xl font-bold text-[var(--header-primary)]">
        Survey Analytics Dashboard
      </h2>

      <div className="flex flex-wrap justify-start sm:justify-end gap-2 w-full sm:w-auto">
        <button
          className="bg-button-refresh-responses-back px-3 py-2 rounded text-sm hover:opacity-90 transition"
          onClick={handleRefresh}
        >
          🔄 Refresh
        </button>
        <button
          onClick={() => navigate("/responses")}
          className="bg-button-refresh-responses-back text-white px-4 py-2 rounded hover:opacity-90 transition"
        >
          📋 Responses
        </button>
        <button
          className="bg-button-refresh-responses-back text-white px-4 py-2 rounded hover:opacity-90 transition"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-analytics-bg p-6 space-y-6">
        {renderHeader()}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-700 text-lg font-medium">
              Loading analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-[var(--survey-bg)] p-6 space-y-6">
        {renderHeader()}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">
            No Survey Data Available
          </h3>
          <p className="text-blue-700 mb-4">
            There are no questions in your survey database yet. You need to
            create some questions before you can view analytics.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Go to Admin Dashboard
            </button>
            <p className="text-blue-600 text-sm">
              Create questions in the admin dashboard, then return here to view
              analytics and responses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (err && !isEmpty) {
    return (
      <div className="min-h-screen bg-[var(--survey-bg)] p-6 space-y-6">
        {renderHeader()}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold">Error loading analytics</p>
            <p className="text-sm mt-1">{err}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            {err.includes("Network error") && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                <p className="font-medium">Troubleshooting:</p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• Check if your backend server is running</li>
                  <li>• Verify your API configuration</li>
                  <li>• Ensure your database connection is working</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Most skipped questions (top 3 by skip rate)
  const mostSkipped = [...questions]
    .map((q) => {
      const total = (q.timesAnswered || 0) + (q.timesSkipped || 0);
      return {
        ...q,
        skipRate:
          total > 0
            ? (((q.timesSkipped || 0) / total) * 100).toFixed(1)
            : "0.0",
      };
    })
    .sort((a, b) => Number(b.skipRate) - Number(a.skipRate))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--survey-bg)] p-6 space-y-6">
      {renderHeader()}

      <StatsOverview
        totalResponses={totalResponses}
        totalAnswered={totalAnswered}
        totalSkipped={totalSkipped}
        overallSkipRate={overallSkipRate}
      />

      <ChartContainer>
        <div className="bg-white p-4 rounded shadow w-full max-w-[500px]">
          <div className="font-semibold text-lg mb-2 text-center">
            Answers Submitted Per Level
          </div>
          <div className="h-[250px]">
            <Bar
              data={levelChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true, ticks: { precision: 0 } },
                },
              }}
              height={250}
            />
          </div>
        </div>
      </ChartContainer>

      <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 gap-8">
        {/* Most Skipped Questions */}
        <div className="bg-white shadow rounded-xl flex flex-col w-full">
          <div className="p-6 border-b font-semibold text-gray-900 text-lg flex items-center gap-2">
            <span role="img" aria-label="skipped">
              🚩
            </span>
            Most Skipped Questions
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-purple-50">
                <th className="px-6 py-3">Question</th>
                <th className="px-6 py-3">Skip %</th>
              </tr>
            </thead>
            <tbody>
              {mostSkipped.length === 0 && (
                <tr>
                  <td className="px-6 py-3 text-gray-500" colSpan={2}>
                    No skipped questions.
                  </td>
                </tr>
              )}
              {mostSkipped.map((q, idx) => (
                <tr
                  key={q.questionID || idx}
                  className={idx % 2 ? "bg-purple-25" : "bg-white"}
                >
                  <td className="px-6 py-3">
                    {q.question.length > 40
                      ? q.question.slice(0, 40) + "..."
                      : q.question}
                  </td>
                  <td className="px-6 py-3">{q.skipRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
