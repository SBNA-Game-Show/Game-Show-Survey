import React from "react";

interface ProficiencyModalProps {
  show: boolean;
  proficiency: string;
  setProficiency: (level: string) => void;
  onConfirm: () => void;
}

const ProficiencyModal: React.FC<ProficiencyModalProps> = ({
  show,
  proficiency,
  setProficiency,
  onConfirm,
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm text-center">
        <h2 className="text-xl font-bold mb-4 text-purple-700">
          What's your Sanskrit proficiency level?
        </h2>
        <div className="flex flex-col gap-3 mb-6">
          {["Beginner", "Intermediate", "Advanced"].map((level) => (
            <button
              key={level}
              className={`px-6 py-2 rounded text-lg font-medium border
                ${
                  proficiency === level
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-purple-700 border-purple-200"
                }
                hover:bg-purple-100`}
              onClick={() => setProficiency(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <button
          className="mt-2 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          onClick={onConfirm}
          disabled={!proficiency}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default ProficiencyModal;
