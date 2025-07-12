// src/components/analytics/CategoryChart.tsx
import React from "react";
import { Bar } from "react-chartjs-2";

interface CategoryChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
  }>;
}

interface CategoryChartProps {
  data: CategoryChartData;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-4 rounded shadow w-full max-w-[500px]">
      <Bar 
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