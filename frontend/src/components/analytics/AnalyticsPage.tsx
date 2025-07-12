import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
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
  Legend,
  ArcElement
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
          "#e9d5ff", // very light purple (Beginner)
          "#c4b5fd", // light purple (Intermediate)
          "#a78bfa", // medium light purple (Advanced)
        ],
        borderColor: [
          "#d8b4fe",
          "#a78bfa",
          "#8b5cf6",
        ],
        borderWidth: 2,
        borderRadius: 12,
      },
    ],
  };

  // Header
  const renderHeader = () => (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">📊</span>
        </div>
        <h2 className="text-2xl font-bold">Survey Analytics Dashboard</h2>
      </div>
      <div className="flex gap-2">
        <button
          className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300"
          onClick={handleRefresh}
        >
          🔄 Refresh
        </button>
        <button
          onClick={() => navigate("/responses")}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          📋 Responses
        </button>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
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
      <div className="p-6 space-y-6">
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
            Add some questions before you can view analytics.
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
      <div className="p-6 space-y-6">
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

  // Calculate correct and incorrect responses from Input questions only
  const inputQuestionsForPie = questions.filter(q => q.questionType === "Input");
  
  let correctResponses = 0;
  let incorrectResponses = 0;
  
  inputQuestionsForPie.forEach(question => {
    if (question.answers && Array.isArray(question.answers)) {
      question.answers.forEach(answer => {
        if (answer.isCorrect === true) {
          correctResponses++;
        } else if (answer.isCorrect === false) {
          incorrectResponses++;
        }
      });
    }
  });

  // If we have a mismatch, adjust to use totalAnswered
  const totalAnsweredFromInputs = correctResponses + incorrectResponses;
  
  // Use existing totalAnswered and proportionally distribute correct/incorrect
  const finalCorrectResponses = totalAnsweredFromInputs > 0 
    ? Math.round((correctResponses / totalAnsweredFromInputs) * totalAnswered)
    : 0;
  const finalIncorrectResponses = totalAnswered - finalCorrectResponses;

  // Pie chart data for response distribution
  const responseDistributionData = {
    labels: ["Correct Answers", "Incorrect Answers", "Skipped"],
    datasets: [
      {
        label: "Response Distribution",
        data: [finalCorrectResponses, finalIncorrectResponses, totalSkipped],
        backgroundColor: [
          "#d1fae5", // very light green for correct
          "#fee2e2", // very light red for incorrect
          "#fef3c7", // very light amber for skipped
        ],
        borderColor: [
          "#86efac", // soft green border
          "#fca5a5", // soft red border
          "#fde68a", // soft amber border
        ],
        borderWidth: 2,
      },
    ],
  };

  // Filter for Input questions only and calculate skip rates
  const inputQuestions = questions.filter(q => q.questionType === "Input");

  const mostSkippedInputQuestions = inputQuestions
    .map((q) => {
      const total = (q.timesAnswered || 0) + (q.timesSkipped || 0);
      return {
        ...q,
        skipRate: total > 0 ? (((q.timesSkipped || 0) / total) * 100).toFixed(1) : "0.0",
      };
    })
    .sort((a, b) => Number(b.skipRate) - Number(a.skipRate))
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6">
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

        <div className="bg-white p-4 rounded shadow w-full max-w-[400px]">
          <div className="font-semibold text-lg mb-2 text-center">
            Overall Response Distribution
          </div>
          <div className="h-[250px]">
            <Pie
              data={responseDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
                        return `${context.label}: ${percentage}%`;
                      }
                    }
                  }
                },
              }}
              height={250}
            />
          </div>
        </div>
      </ChartContainer>

      <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 gap-8">
        {/* Most Skipped Questions (Input Type Only) */}
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
              {inputQuestions.length === 0 ? (
                <tr>
                  <td className="px-6 py-3 text-gray-500" colSpan={2}>
                    No questions found.
                  </td>
                </tr>
              ) : (
                mostSkippedInputQuestions.map((q, idx) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;