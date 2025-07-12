import { useState, useEffect } from "react";
import * as api from "../api/userSurveyApi";
import { Question } from "../../types/types";

export function useUserSurveyApi(level: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!level) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const qs = await api.fetchQuestionsByLevel(level);
        setQuestions(qs);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [level]);

  const submitAllAnswers = async (
    answers: { questionID: string; answerText: string }[]
  ) => {
    setSubmitting(true);
    setError("");
    try {
      await api.submitAllAnswers(answers);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    questions,
    loading,
    error,
    submitting,
    setError,
    submitAllAnswers,
  };
}
