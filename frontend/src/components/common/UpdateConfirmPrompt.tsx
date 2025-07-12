import React from "react";

interface UpdateConfirmPromptProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const UpdateConfirmPrompt: React.FC<UpdateConfirmPromptProps> = ({
  show,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-purple-700 mb-2">Update Survey?</h2>
        <p className="mb-6 text-gray-700">Are you sure you want to update the existing survey?</p>
        <div className="flex justify-center gap-4">
          <button
            className="px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors font-semibold"
            onClick={onConfirm}
          >
            Yes, Update
          </button>
          <button
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateConfirmPrompt;
