import { useMemo } from "react";
import { Question } from "../../types/types";

interface AnalyticsData {
  categoryCounts: Record<string, number>;
  levelCounts: Record<string, number>;
  answerCounts: Record<string, number>;
  skipCounts: Record<string, number>;
  totalAnswered: number;
  totalSkipped: number;
  totalResponses: number;
  overallSkipRate: string;
  leaderboard: Array<{ question: string; responses: number }>;
  categoryChartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  };
  levelChartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  };
}

export const useAnalyticsData = (questions: Question[]): AnalyticsData => {
  return useMemo(() => {
    const predefinedCategories = [
      "Vocabulary",
      "Grammar",
      "Culture",
      "Literature",
      "History",
    ];

    const categoryCounts: Record<string, number> = {
      Vocabulary: 0,
      Grammar: 0,
      Culture: 0,
      Literature: 0,
      History: 0,
    };
    const levelCounts: Record<string, number> = {};
    const answerCounts: Record<string, number> = {};
    const skipCounts: Record<string, number> = {};

    questions.forEach((q) => {
      if (!categoryCounts[q.questionCategory]) {
        categoryCounts[q.questionCategory] = 0;
      }
      categoryCounts[q.questionCategory]++;
      levelCounts[q.questionLevel] = (levelCounts[q.questionLevel] || 0) + 1;

      answerCounts[q.questionID] = 0;
      skipCounts[q.questionID] = q.timesSkipped ?? 0;

      if (q.answers && Array.isArray(q.answers)) {
        q.answers.forEach((answerData) => {
          if (answerData.answer && answerData.answer.trim() !== "") {
            answerCounts[q.questionID] += answerData.responseCount || 0;
          }
        });
      }
    });

    const totalAnswered = Object.values(answerCounts).reduce(
      (sum, cnt) => sum + cnt,
      0
    );
    const totalSkipped = Object.values(skipCounts).reduce(
      (sum, cnt) => sum + cnt,
      0
    );
    const totalResponses = totalAnswered + totalSkipped;
    const overallSkipRate =
      totalResponses > 0
        ? ((totalSkipped / totalResponses) * 100).toFixed(1)
        : "0.0";

    const leaderboard = questions
      .map((q) => ({
        question: q.question,
        responses: answerCounts[q.questionID] || 0,
      }))
      .sort((a, b) => b.responses - a.responses)
      .slice(0, 5);

    const categoryChartData = {
      labels: predefinedCategories,
      datasets: [
        {
          label: "Questions per Category",
          data: predefinedCategories.map((cat) => categoryCounts[cat] || 0),
          backgroundColor: ["#6a5acd", "#ec4899", "#10b981"],
        },
      ],
    };

    const levelChartData = {
      labels: Object.keys(levelCounts),
      datasets: [
        {
          label: "Questions per Level",
          data: Object.values(levelCounts),
          backgroundColor: ["#ec4899", "#3b82f6", "#8b5cf6", "#22c55e"],
        },
      ],
    };

    return {
      categoryCounts,
      levelCounts,
      answerCounts,
      skipCounts,
      totalAnswered,
      totalSkipped,
      totalResponses,
      overallSkipRate,
      leaderboard,
      categoryChartData,
      levelChartData,
    };
  }, [questions]);
};
