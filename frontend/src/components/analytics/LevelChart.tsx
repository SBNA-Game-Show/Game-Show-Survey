// src/components/analytics/LevelChart.tsx
import React from "react";
import { Pie } from "react-chartjs-2";

interface LevelChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
  }>;
}

interface LevelChartProps {
  data: LevelChartData;
}

export const LevelChart: React.FC<LevelChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-4 rounded shadow w-full max-w-[400px]">
      <Pie 
        data={data} 
        options={{ 
          responsive: true, 
          maintainAspectRatio: false 
        }} 
        height={250} 
      />
    </div>
  );
};