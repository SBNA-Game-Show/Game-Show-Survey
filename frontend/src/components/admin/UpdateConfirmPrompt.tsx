// Updated UpdateConfirmPrompt.tsx - Clarified for batch operations
import { RefreshCcw } from "lucide-react";
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
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCcw className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-blue-700 mb-2">
          Update Modified Questions?
        </h2>
        <div className="text-gray-700 mb-6 space-y-3">
          <p className="font-medium">
            This will update only the questions you have modified.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-800 font-medium mb-1">ℹ️ What happens:</p>
            <p className="text-blue-700">
              Each modified question will be sent as a separate PUT request to
              the server.
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold"
            onClick={onConfirm}
          >
            Yes, Update Modified Questions
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
