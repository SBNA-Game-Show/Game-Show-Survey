// src/components/analytics/ChartContainer.tsx
import React from "react";

interface ChartContainerProps {
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ children }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
      {children}
    </div>
  );
};