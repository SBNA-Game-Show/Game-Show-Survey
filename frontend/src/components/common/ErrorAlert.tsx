import React from "react";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => (
  <div className="max-w-4xl mx-auto px-6 pt-4">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-700 text-sm">{message}</p>
      <button
        onClick={onDismiss}
        className="text-red-600 hover:text-red-800 text-xs underline mt-1"
      >
        Dismiss
      </button>
    </div>
  </div>
);

export default ErrorAlert;
