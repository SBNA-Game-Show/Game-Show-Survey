// src/components/analytics/AnalyticsHeader.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

interface AnalyticsHeaderProps {
  onRefresh: () => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  onRefresh,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Survey Analytics Dashboard</h2>
      <div className="flex gap-2">
        <button
          className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300"
          onClick={onRefresh}
        >
          🔄 Refresh Analytics
        </button>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={() => navigate("/dashBoard")}
        >
          ← Back
        </button>
      </div>
    </div>
  );
};
