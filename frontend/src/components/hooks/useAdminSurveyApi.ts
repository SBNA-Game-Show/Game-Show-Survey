// Updated useAdminSurveyApi.ts - Added updateQuestionWithAnswers functionality
import { useState, useCallback, useRef } from "react";
import * as api from "../api/adminSurveyApi";
import { Question } from "../../types/types";

const CACHE_DURATION = 30 * 1000;

export function useAdminSurveyApi() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isEmpty, setIsEmpty] = useState(false);

  const cache = useRef<{
    questions: Question[] | null;
    timestamp: number;
  }>({
    questions: null,
    timestamp: 0,
  });

  const fetchQuestions = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    if (
      !forceRefresh &&
      cache.current.questions &&
      now - cache.current.timestamp < CACHE_DURATION
    ) {
      setQuestions(cache.current.questions);
      setIsEmpty(cache.current.questions.length === 0);
      return;
    }

    setLoading(true);
    setError("");
    setIsEmpty(false);

    try {
      const data = await api.fetchAllQuestionsAdmin();
      setQuestions(data);
      setIsEmpty(data.length === 0);

      cache.current = {
        questions: data,
        timestamp: now,
      };
    } catch (e: any) {
      console.error("Error fetching questions:", e);

      // Check if it's a 404 or network error indicating no questions exist
      if (
        e.message.includes("404") ||
        e.message.includes("Failed to fetch questions") ||
        e.message.includes("Network error")
      ) {
        setIsEmpty(true);
        setQuestions([]);
        setError(
          "No questions found in the database. Please add some questions to get started."
        );
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuestions = useCallback(
    async (newQuestions: Question[]) => {
      setLoading(true);
      setError("");
      try {
        await api.postSurveyQuestions(newQuestions);
        cache.current.questions = null;
        await fetchQuestions(true);
        setIsEmpty(false);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchQuestions]
  );

  // EXISTING: Single question update function (without answers)
  const updateSingleQuestion = useCallback(
    async (question: Question) => {
      setLoading(true);
      setError("");
      try {
        await api.updateSingleQuestion(question);
        cache.current.questions = null;
        await fetchQuestions(true);
        console.log("✅ Single question updated successfully");
      } catch (e: any) {
        console.error("❌ Failed to update single question:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchQuestions]
  );

  // NEW: Question update function WITH answers (for answer validation)
  const updateQuestionWithAnswers = useCallback(
    async (question: Question) => {
      setLoading(true);
      setError("");
      try {
        await api.updateQuestionWithAnswers(question);
        cache.current.questions = null;
        await fetchQuestions(true);
        console.log("✅ Question with answers updated successfully");
      } catch (e: any) {
        console.error("❌ Failed to update question with answers:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchQuestions]
  );

  // KEPT: Batch update function for existing bulk operations
  const updateQuestionsBatch = useCallback(
    async (questionsToUpdate: Question[]) => {
      setLoading(true);
      setError("");
      try {
        await api.updateSurveyQuestionsBatch(questionsToUpdate);
        cache.current.questions = null;
        await fetchQuestions(true);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchQuestions]
  );

  const deleteQuestions = useCallback(
    async (toDelete: Question[]) => {
      setLoading(true);
      setError("");
      try {
        const ids = toDelete
          .map((q) => q.questionID)
          .filter(Boolean) as string[];

        const deletePromises = ids.map((id) => api.deleteQuestionByIdAdmin(id));
        await Promise.all(deletePromises);

        cache.current.questions = null;
        await fetchQuestions(true);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchQuestions]
  );

  return {
    questions,
    isLoading,
    error,
    isEmpty,
    fetchQuestions,
    createQuestions,
    updateSingleQuestion, // EXISTING: For regular question updates
    updateQuestionWithAnswers, // NEW: For answer validation updates
    updateQuestionsBatch, // EXISTING: For batch updates
    deleteQuestions,
    setError,
  };
}