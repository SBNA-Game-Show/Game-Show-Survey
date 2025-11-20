import React, { useEffect, useState, useMemo } from "react";
import {
  fetchAnswersByQuestionId,
  fetchAllQuestionsAdmin,
  updateQuestionWithAnswers,
} from "../api/adminSurveyApi";
import { useParams, useNavigate } from "react-router-dom";
import { Question } from "../../types/types";
import { CircleAlert, CircleQuestionMark, Info, X, Check } from "lucide-react";

interface Answer {
  answerID: string;
  questionId: string;
  answer: string;
  createdAt?: string;
}

const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"frequency" | "length" | "alphabetical">(
    "frequency"
  );
  const [updatingAnswers, setUpdatingAnswers] = useState<Set<string>>(
    new Set()
  );
  const [updateError, setUpdateError] = useState<string>("");
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isAdmin") !== "true") {
      navigate("/login", { replace: true });
      return;
    }
    const fetchData = async () => {
      if (!id) {
        setError("No question ID provided");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const allQuestions = await fetchAllQuestionsAdmin();
        const foundQuestion = allQuestions.find(
          (q) =>
            q.questionID === id ||
            (q as any)._id === id ||
            String(q.questionID) === String(id)
        );
        if (!foundQuestion) {
          setError(`Question with ID "${id}" not found`);
          setLoading(false);
          return;
        }
        setQuestion(foundQuestion);
        const answerData = await fetchAnswersByQuestionId(id);
        setAnswers(answerData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleUpdateAnswerCorrectness = async (
    answerText: string,
    isCorrect: boolean
  ) => {
    if (!question) return;
    setUpdatingAnswers((prev) => new Set(prev).add(answerText));
    setUpdateError("");
    try {
      const answerIndex = question.answers?.findIndex(
        (a) => a.answer === answerText
      );
      if (answerIndex === undefined || answerIndex === -1)
        throw new Error("Answer not found in question");
      const updatedQuestion: Question = {
        ...question,
        answers: question.answers!.map((ans, index) => {
          if (index !== answerIndex) return ans;
          if (!isCorrect) {
            return { ...ans, isCorrect: false, rank: 0, score: 0 };
          }
          return { ...ans, isCorrect: true };
        }),
      };
      await updateQuestionWithAnswers(updatedQuestion);
      setQuestion(updatedQuestion);
      if (!isCorrect) {
        setToast({
          id: Date.now(),
          message: `Reset rank & score for "${answerText}"`,
        });
      }
    } catch (error: any) {
      setUpdateError(`Failed to update answer: ${error.message}`);
    } finally {
      setUpdatingAnswers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(answerText);
        return newSet;
      });
    }
  };

  // Prepare filtered and sorted answers
  const answerFrequencies: Record<string, number> = useMemo(() => {
    const frequencies: Record<string, number> = {};
    answers.forEach((a) => {
      if (a.answer.trim() !== "") {
        frequencies[a.answer] = (frequencies[a.answer] || 0) + 1;
      }
    });
    return frequencies;
  }, [answers]);

  const filteredAnswers = useMemo(() => {
    let filtered = Object.entries(answerFrequencies);
    if (searchTerm) {
      filtered = filtered.filter(([answer]) =>
        answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    switch (sortBy) {
      case "frequency":
        filtered.sort(([, a], [, b]) => b - a);
        break;
      case "alphabetical":
        filtered.sort(([a], [b]) => a.localeCompare(b));
        break;
      case "length":
        filtered.sort(([a], [b]) => b.length - a.length);
        break;
    }
    return filtered;
  }, [answerFrequencies, searchTerm, sortBy]);

  const answerStats = useMemo(() => {
    const answerTexts = answers
      .map((a) => a.answer)
      .filter((text) => text.trim() !== "");
    const uniqueAnswers = [...new Set(answerTexts)];
    return {
      totalAnswers: answerTexts.length,
      uniqueAnswers: uniqueAnswers.length,
    };
  }, [answers]);

  // UI rendering logic
  if (loading) {
    return (
      <div className="min-h-screen bg-survey-bg p-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Question Details</h2>
            <button
              className="bg-button-refresh-responses-back text-white px-4 py-2 rounded hover:bg-purple-700"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-purple-700 text-lg font-medium">
                Loading question details...
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
            <h2 className="text-2xl font-bold">Question Details</h2>
            <button
              className="bg-button-refresh-responses-back text-white px-4 py-2 rounded hover:bg-purple-700"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CircleAlert className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-lg font-semibold">
                Error loading question details
              </p>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question || answers.length === 0) {
    return (
      <div className="min-h-screen bg-yellow-50">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-yellow-900">
              Question Details
            </h2>
            <button
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
          <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CircleQuestionMark className="w-8 h-8 text-yellow-800" />
            </div>
            <h3 className="text-xl font-semibold text-yellow-900 mb-2">
              No Responses Found
            </h3>
            <p className="text-yellow-800 mb-4">
              {question
                ? "This question hasn't received any responses yet."
                : "Question not found in the database."}
            </p>
            <button
              onClick={() => navigate("/responses")}
              className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              View All Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-survey-bg">
      <div className="p-6 space-y-6">
        {/* Toast */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-4 rounded-lg shadow-lg flex items-start gap-3 animate-fade-in"
          >
            <Info className="w-6 h-6 flex-shrink-0" />
            <div className="text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-gray-300 hover:text-white"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Header */}

        {/* <div className="min-h-screen bg-yellow-50">
           <div className="p-6">
          <div className="flex justify-between items-center mb-6"> */}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--header-primary)] text-center sm:text-left">
              Question Analysis
            </h2>
            <p className="text-1xl sm:text-1xl font-bold text-[var(--header-primary)] text-center sm:text-left">
              Detailed response analysis and statistics
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-button-refresh-responses-back px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition">
              🔄 Refresh
            </button>
            <button
              className="bg-button-refresh-responses-back px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition"
              // className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-lg"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Question Info Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Question Details
            </h3>
            <div className="flex gap-2">
              <span
                className={`px-4 py-2 rounded-full text-lg font-medium ${
                  question.questionLevel === "Beginner"
                    ? "bg-green-100 text-green-800"
                    : question.questionLevel === "Intermediate"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {question.questionLevel}
              </span>
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-lg font-medium">
                {question.questionCategory}
              </span>
            </div>
          </div>
          <p className="text-gray-800 text-xl leading-relaxed font-semibold">
            {question.question}
          </p>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-lg font-medium">
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-semibold">
                  {question.questionType === "MCQ"
                    ? "Multiple Choice"
                    : "Text Input"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total Responses:</span>
                <p className="font-bold text-purple-600">
                  {answerStats.totalAnswers}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Unique Answers:</span>
                <p className="font-bold text-blue-600">
                  {answerStats.uniqueAnswers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Update Error Display */}
        {updateError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CircleAlert className="w-6 h-6 text-red-600" />
              <p className="text-red-700 text-lg font-medium">{updateError}</p>
              <button
                onClick={() => setUpdateError("")}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              className="bg-button-refresh-responses-back px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition"
              disabled
            >
              📋 List View
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 sm:w-64 px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="frequency">Sort by Frequency</option>
                <option value="alphabetical">Sort Alphabetically</option>
                <option value="length">Sort by Length</option>
              </select>
            </div>
          </div>
        </div>

        {/* Answer List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold">
              All Responses ({filteredAnswers.length})
            </h3>
            {question.questionType === "Input" && (
              <p className="text-lg text-gray-600 mt-1">
                Click the green ✓ or red ✗ buttons to validate answers
              </p>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredAnswers.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xl">
                No answers match your search criteria.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredAnswers.map(([answer, count], idx) => {
                  const isUpdating = updatingAnswers.has(answer);
                  const questionAnswer = question.answers?.find(
                    (a) => a.answer === answer
                  );
                  const isCorrect = questionAnswer?.isCorrect || false;
                  return (
                    <li
                      key={idx}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 break-words text-2xl font-bold">
                            {answer}
                          </p>
                          <div className="flex flex-col md:flex-row md:items-center justify-between mt-4">
                            <div className="flex flex-wrap gap-4 items-center text-lg font-medium">
                              <span className="text-gray-600">
                                Length:{" "}
                                <span className="text-black">
                                  {answer.length} characters
                                </span>
                              </span>
                              {questionAnswer && (
                                <>
                                  {questionAnswer.rank !== undefined &&
                                    questionAnswer.rank !== null && (
                                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-base">
                                        Rank: #{questionAnswer.rank}
                                      </span>
                                    )}
                                  {questionAnswer.score !== undefined &&
                                    questionAnswer.score !== null && (
                                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-bold text-base">
                                        Score: {questionAnswer.score}
                                      </span>
                                    )}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-4 md:mt-0 ml-2">
                              <span
                                className={`px-4 py-2 rounded-full font-bold text-lg shadow ${
                                  isCorrect
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {isCorrect ? "Correct" : "Incorrect"}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateAnswerCorrectness(answer, true)
                                }
                                disabled={isUpdating}
                                className="flex items-center justify-center px-3 py-2 rounded-full border border-green-200 text-green-700 bg-green-50 hover:bg-green-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-2xl"
                                title="Mark as correct"
                              >
                                <Check className="w-6 h-6" />
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateAnswerCorrectness(answer, false)
                                }
                                disabled={isUpdating}
                                className="flex items-center justify-center px-3 py-2 rounded-full border border-red-200 text-red-700 bg-red-50 hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-2xl"
                                title="Mark as incorrect"
                              >
                                <X className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="ml-6 flex-shrink-0">
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-purple-100 text-purple-800 shadow">
                            {count} {count === 1 ? "response" : "responses"}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailPage;
