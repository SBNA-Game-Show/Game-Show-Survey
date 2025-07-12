// src/components/analytics/StatsOverview.tsx
import React from "react";

interface StatsOverviewProps {
  totalResponses: number;
  totalAnswered: number;
  totalSkipped: number;
  overallSkipRate: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalResponses,
  totalAnswered,
  totalSkipped,
  overallSkipRate,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm">Total Responses</p>
        <p className="text-xl font-bold">{totalResponses}</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm">Total Answered</p>
        <p className="text-xl font-bold">{totalAnswered}</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm">Total Skipped</p>
        <p className="text-xl font-bold">{totalSkipped}</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm">Overall Skip Rate</p>
        <p className="text-xl font-bold">{overallSkipRate}%</p>
      </div>
    </div>
  );
};