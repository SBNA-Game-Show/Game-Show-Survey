import React from "react";

interface LogoutPromptProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutPrompt: React.FC<LogoutPromptProps> = ({
  show,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xs text-center">
        <h2 className="text-xl font-bold mb-4 text-red-700">Logout?</h2>
        <p className="mb-6 text-gray-700">Are you sure you want to logout?</p>
        <div className="flex justify-center gap-4">
          <button
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={onConfirm}
          >
            Yes, Logout
          </button>
          <button
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPrompt;
