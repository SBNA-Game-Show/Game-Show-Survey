// Enhanced ResponsesPage.tsx - Added Correct Answers column to responses table
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Question } from "../../types/types";
import { fetchAllQuestionsAndAnswersAdmin, updateQuestionWithAnswers } from "../api/adminSurveyApi";
import { useAnalyticsData } from "../hooks/useAnalyticsData";

const ResponsesPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentAnsweredIds, setRecentAnsweredIds] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // State for answer validation modal
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [updatingAnswers, setUpdatingAnswers] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { questions: fetchedQuestions, answers: fetchedAnswers } =
        await fetchAllQuestionsAndAnswersAdmin();
      setQuestions(fetchedQuestions);
      const sorted = [...fetchedAnswers].sort((a, b) => {
        const t1 = new Date(a.createdAt || "").getTime();
        const t2 = new Date(b.createdAt || "").getTime();
        return t2 - t1;
      });
      const recentIds = new Set(sorted.slice(0, 5).map((a) => a.questionId));
      setRecentAnsweredIds(recentIds);
    } catch (e: any) {
      setError(e.message);
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
      setError(null);
      try {
        const { questions: fetchedQuestions, answers: fetchedAnswers } =
          await fetchAllQuestionsAndAnswersAdmin();
        setQuestions(fetchedQuestions);
        const sorted = [...fetchedAnswers].sort((a, b) => {
          const t1 = new Date(a.createdAt || "").getTime();
          const t2 = new Date(b.createdAt || "").getTime();
          return t2 - t1;
        });
        const recentIds = new Set(sorted.slice(0, 5).map((a) => a.questionId));
        setRecentAnsweredIds(recentIds);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const analyticsData = useAnalyticsData(questions);

  // Function to calculate correct answers for a question
  const getCorrectAnswersCount = (question: Question): number => {
    if (!question.answers || !Array.isArray(question.answers)) {
      return 0;
    }
    
    return question.answers.reduce((count, answer) => {
      if (answer.isCorrect === true) {
        return count + (answer.responseCount || 1);
      }
      return count;
    }, 0);
  };

  // Function to handle answer validation button click
  const handleValidateAnswers = (question: Question) => {
    // Only allow validation for Input type questions that have answers
    if (question.questionType === "Input" && question.answers && question.answers.length > 0) {
      setSelectedQuestion(question);
      setShowAnswerModal(true);
    }
  };

  // Function to update answer isCorrect status
  const handleUpdateAnswerCorrectness = async (answerIndex: number, isCorrect: boolean) => {
    if (!selectedQuestion) return;

    const answerKey = `${selectedQuestion.questionID}-${answerIndex}`;
    setUpdatingAnswers(prev => new Set(prev).add(answerKey));

    try {
      // Create a copy of the question with only the specific answer's isCorrect field updated
      const updatedQuestion: Question = {
        ...selectedQuestion,
        answers: selectedQuestion.answers!.map((answer, index) => 
          index === answerIndex 
            ? { ...answer, isCorrect } 
            : answer
        )
      };

      // Use existing updateQuestionWithAnswers method
      await updateQuestionWithAnswers(updatedQuestion);

      // Update local state
      setQuestions(prevQuestions => 
        prevQuestions.map(q => 
          q.questionID === selectedQuestion.questionID ? updatedQuestion : q
        )
      );

      // Update selected question for modal
      setSelectedQuestion(updatedQuestion);

      console.log(`✅ Answer ${answerIndex + 1} marked as ${isCorrect ? 'correct' : 'incorrect'}`);
    } catch (error: any) {
      console.error('❌ Failed to update answer correctness:', error);
      setError(`Failed to update answer: ${error.message}`);
    } finally {
      setUpdatingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(answerKey);
        return newSet;
      });
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-400">↕️</span>;
    return (
      <span className="text-purple-600">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const filteredAndSortedQuestions = React.useMemo(() => {
    let filtered = questions.filter((q) => {
      const questionText = (q.question || "").toLowerCase().trim();
      const searchText = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchText || questionText.includes(searchText);
      const matchesCategory =
        !filterCategory || q.questionCategory === filterCategory;
      const matchesLevel = !filterLevel || q.questionLevel === filterLevel;
      return matchesSearch && matchesCategory && matchesLevel;
    });

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "category":
            aValue = a.questionCategory;
            bValue = b.questionCategory;
            break;
          case "level":
            const levelOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 };
            aValue =
              levelOrder[a.questionLevel as keyof typeof levelOrder] || 4;
            bValue =
              levelOrder[b.questionLevel as keyof typeof levelOrder] || 4;
            break;
          case "answered":
            aValue = analyticsData.answerCounts[a.questionID] || 0;
            bValue = analyticsData.answerCounts[b.questionID] || 0;
            break;
          case "correct":
            aValue = getCorrectAnswersCount(a);
            bValue = getCorrectAnswersCount(b);
            break;
          case "skipped":
            aValue = analyticsData.skipCounts[a.questionID] || 0;
            bValue = analyticsData.skipCounts[b.questionID] || 0;
            break;
          case "skipRate":
            const aAnswered = analyticsData.answerCounts[a.questionID] || 0;
            const aSkipped = analyticsData.skipCounts[a.questionID] || 0;
            const aTotal = aAnswered + aSkipped;
            aValue = aTotal > 0 ? (aSkipped / aTotal) * 100 : 0;

            const bAnswered = analyticsData.answerCounts[b.questionID] || 0;
            const bSkipped = analyticsData.skipCounts[b.questionID] || 0;
            const bTotal = bAnswered + bSkipped;
            bValue = bTotal > 0 ? (bSkipped / bTotal) * 100 : 0;
            break;
          case "total":
            aValue =
              (analyticsData.answerCounts[a.questionID] || 0) +
              (analyticsData.skipCounts[a.questionID] || 0);
            bValue =
              (analyticsData.answerCounts[b.questionID] || 0) +
              (analyticsData.skipCounts[b.questionID] || 0);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    questions,
    searchTerm,
    filterCategory,
    filterLevel,
    sortField,
    sortDirection,
    analyticsData,
  ]);

  const categories = [
    ...new Set(questions.map((q) => q.questionCategory)),
  ].filter(Boolean);
  const levels = [...new Set(questions.map((q) => q.questionLevel))].filter(
    Boolean
  );

  // Calculate total correct answers for summary
  const totalCorrectAnswers = questions.reduce((sum, q) => sum + getCorrectAnswersCount(q), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📋</span>
              </div>
              <h2 className="text-2xl font-bold">Survey Responses</h2>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300"
                onClick={handleRefresh}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => navigate("/analytics")}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                📈 Analytics
              </button>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                onClick={() => navigate("/dashboard")}
              >
                ← Back
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-purple-700 text-lg font-medium">
                Loading responses...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📋</span>
              </div>
              <h2 className="text-2xl font-bold">Survey Responses</h2>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300"
                onClick={handleRefresh}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => navigate("/analytics")}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                📈 Analytics
              </button>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                onClick={() => navigate("/dashboard")}
              >
                ← Back
              </button>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <p className="text-lg font-semibold">Error loading responses</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📋</span>
            </div>
            <h2 className="text-2xl font-bold">Survey Responses</h2>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300"
              onClick={handleRefresh}
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => navigate("/analytics")}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              📈 Analytics
            </button>
            <button
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              onClick={() => navigate("/dashboard")}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Questions
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by question text..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Levels</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchTerm || filterCategory || filterLevel) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("");
                  setFilterLevel("");
                }}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Clear all filters
              </button>
              <span className="ml-4 text-sm text-gray-500">
                Showing {filteredAndSortedQuestions.length} of{" "}
                {questions.length} questions
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="text-xl font-semibold mb-4">Responses Table</h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    Total Questions:
                  </span>
                  <span className="ml-2 font-bold">
                    {filteredAndSortedQuestions.length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Total Answers:
                  </span>
                  <span className="ml-2 font-bold text-green-600">
                    {Object.values(analyticsData.answerCounts).reduce(
                      (sum, count) => sum + count,
                      0
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Correct Answers:
                  </span>
                  <span className="ml-2 font-bold text-blue-600">
                    {totalCorrectAnswers}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Total Skips:
                  </span>
                  <span className="ml-2 font-bold text-amber-600">
                    {Object.values(analyticsData.skipCounts).reduce(
                      (sum, count) => sum + count,
                      0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[26.4rem] overflow-y-auto border-t border-gray-200">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-purple-100 z-10">
                <tr>
                  <th className="px-3 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">Question</th>
                  <th
                    className="px-3 py-2 font-semibold cursor-pointer hover:bg-purple-200 transition-colors"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center justify-between">
                      Category
                      <SortIndicator field="category" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 font-semibold cursor-pointer hover:bg-purple-200 transition-colors"
                    onClick={() => handleSort("level")}
                  >
                    <div className="flex items-center justify-between">
                      Level
                      <SortIndicator field="level" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 font-semibold text-green-700 cursor-pointer hover:bg-purple-200 transition-colors"
                    onClick={() => handleSort("answered")}
                  >
                    <div className="flex items-center justify-between">
                      Answered
                      <SortIndicator field="answered" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 font-semibold text-blue-700 cursor-pointer hover:bg-purple-200 transition-colors"
                    onClick={() => handleSort("correct")}
                  >
                    <div className="flex items-center justify-between">
                      Correct
                      <SortIndicator field="correct" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 font-semibold text-amber-700 cursor-pointer hover:bg-purple-200 transition-colors"
                    onClick={() => handleSort("skipped")}
                  >
                    <div className="flex items-center justify-between">
                      Skipped
                      <SortIndicator field="skipped" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 font-semibold text-red-700 cursor-pointer hover:bg-purple-200 transition-colors"
                    onClick={() => handleSort("skipRate")}
                  >
                    <div className="flex items-center justify-between">
                      Skip%
                      <SortIndicator field="skipRate" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 font-semibold cursor-pointer hover:bg-purple-200 transition-colors"
                    onClick={() => handleSort("total")}
                  >
                    <div className="flex items-center justify-between">
                      Total
                      <SortIndicator field="total" />
                    </div>
                  </th>
                  <th className="px-3 py-2 font-semibold">Validate</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-500">
                      No questions found. Questions need to be added to see
                      analytics.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedQuestions.map((q, index) => {
                    const answeredQ =
                      analyticsData.answerCounts[q.questionID] || 0;
                    const correctQ = getCorrectAnswersCount(q);
                    const skippedQ =
                      analyticsData.skipCounts[q.questionID] || 0;
                    const totalQ = answeredQ + skippedQ;
                    const skipRate =
                      totalQ > 0
                        ? ((skippedQ / totalQ) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr
                        key={q.questionID || `response-row-${index}`}
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
                          onClick={() => {
                            console.log(
                              "🎯 Navigating to question:",
                              q.questionID
                            );
                            navigate(`/analytics/question/${q.questionID}`);
                          }}
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
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium text-blue-700">
                              {correctQ}
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
                        <td className="px-3 py-2">
                          {q.questionType === "Input" && q.answers && q.answers.length > 0 ? (
                            <button
                              onClick={() => handleValidateAnswers(q)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
                            >
                              ✓ Validate
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
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

      {/* Answer Validation Modal with Rank and Score Display */}
      {showAnswerModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Validate Answers</h2>
              <button
                onClick={() => setShowAnswerModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Question:</h3>
              <p className="text-gray-700">{selectedQuestion.question}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {selectedQuestion.questionCategory}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  selectedQuestion.questionLevel === "Beginner"
                    ? "bg-green-100 text-green-800"
                    : selectedQuestion.questionLevel === "Intermediate"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {selectedQuestion.questionLevel}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <h4 className="text-md font-semibold text-gray-800 mb-4">
                Answers ({selectedQuestion.answers?.length || 0})
              </h4>
              
              {selectedQuestion.answers && selectedQuestion.answers.length > 0 ? (
                <div className="space-y-3">
                  {selectedQuestion.answers.map((answer, index) => {
                    const answerKey = `${selectedQuestion.questionID}-${index}`;
                    const isUpdating = updatingAnswers.has(answerKey);
                    
                    return (
                      <div
                        key={answer.answerID || `answer-${index}`}
                        className={`p-4 border rounded-lg transition-all ${
                          answer.isCorrect 
                            ? "border-green-200 bg-green-50" 
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                Answer #{index + 1}
                              </span>
                              {answer.responseCount && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                  {answer.responseCount} responses
                                </span>
                              )}
                              
                              {/* NEW: Display rank and score if available */}
                              {answer.rank !== undefined && answer.rank !== null && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  Rank #{answer.rank}
                                </span>
                              )}
                              {answer.score !== undefined && answer.score !== null && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                  Score: {answer.score}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-800 break-words">{answer.answer}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {answer.isCorrect ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                True
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                False
                              </span>
                            )}
                            
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleUpdateAnswerCorrectness(index, true)}
                                disabled={isUpdating}
                                className={`p-2 rounded-lg transition-all ${
                                  answer.isCorrect
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-green-600 hover:bg-green-100"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="Mark as correct"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleUpdateAnswerCorrectness(index, false)}
                                disabled={isUpdating}
                                className={`p-2 rounded-lg transition-all ${
                                  !answer.isCorrect
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-100 text-red-600 hover:bg-red-100"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="Mark as incorrect"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No answers available for this question.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Instructions:</span> Click the green checkmark to mark an answer as correct, or the red X to mark it as incorrect.
                  {selectedQuestion.answers?.some(a => a.rank !== undefined || a.score !== undefined) && (
                    <span className="block mt-1 text-xs">
                      💡 Rank and Score values are fetched from your database and displayed above.
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAnswerModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsesPage;