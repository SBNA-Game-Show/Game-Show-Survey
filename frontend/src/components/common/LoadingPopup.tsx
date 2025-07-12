// src/components/common/LoadingPopup.tsx
import React from "react";

interface LoadingPopupProps {
  show: boolean;
  message?: string;
  submessage?: string;
  variant?: "default" | "create" | "update" | "delete" | "fetch" | "submit";
  overlay?: boolean;
}

const LoadingPopup: React.FC<LoadingPopupProps> = ({
  show,
  message,
  submessage,
  variant = "default",
  overlay = true,
}) => {
  if (!show) return null;

  const getVariantConfig = () => {
    switch (variant) {
      case "create":
        return {
          color: "text-green-600",
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
          icon: "➕",
          defaultMessage: "Creating Questions...",
          defaultSubmessage:
            "Please wait while we save your questions to the database.",
        };
      case "update":
        return {
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          borderColor: "border-blue-200",
          icon: "✏️",
          defaultMessage: "Updating Questions...",
          defaultSubmessage:
            "Please wait while we update your questions in the database.",
        };
      case "delete":
        return {
          color: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
          icon: "🗑️",
          defaultMessage: "Deleting Questions...",
          defaultSubmessage:
            "Please wait while we remove the questions from the database.",
        };
      case "fetch":
        return {
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          borderColor: "border-purple-200",
          icon: "📥",
          defaultMessage: "Loading Data...",
          defaultSubmessage:
            "Please wait while we fetch your questions from the database.",
        };
      case "submit":
        return {
          color: "text-indigo-600",
          bgColor: "bg-indigo-100",
          borderColor: "border-indigo-200",
          icon: "📤",
          defaultMessage: "Submitting Survey...",
          defaultSubmessage: "Please wait while we save your responses.",
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
          icon: "⏳",
          defaultMessage: "Loading...",
          defaultSubmessage: "Please wait a moment.",
        };
    }
  };

  const config = getVariantConfig();
  const displayMessage = message || config.defaultMessage;
  const displaySubmessage = submessage || config.defaultSubmessage;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        overlay ? "bg-black bg-opacity-50" : ""
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center border-2 ${config.borderColor} animate-in zoom-in-95 duration-200`}
      >
        {/* Animated Icon */}
        <div
          className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse`}
        >
          <span className="text-2xl">{config.icon}</span>
        </div>

        {/* Spinner */}
        <div className="mb-6">
          <div
            className={`w-8 h-8 border-3 ${config.borderColor} border-t-transparent rounded-full animate-spin mx-auto`}
            style={{ borderWidth: "3px" }}
          ></div>
        </div>

        {/* Main Message */}
        <h2 className={`text-xl font-bold ${config.color} mb-3`}>
          {displayMessage}
        </h2>

        {/* Submessage */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {displaySubmessage}
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-1">
          <div
            className={`w-2 h-2 ${config.bgColor} rounded-full animate-bounce`}
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className={`w-2 h-2 ${config.bgColor} rounded-full animate-bounce`}
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className={`w-2 h-2 ${config.bgColor} rounded-full animate-bounce`}
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>

        {/* Warning Text for Important Operations */}
        {(variant === "delete" || variant === "submit") && (
          <p className="text-xs text-gray-400 mt-4">
            Please do not close this window or navigate away.
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingPopup;
