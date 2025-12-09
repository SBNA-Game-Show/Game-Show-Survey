// Updated Header.tsx - Improved colors, text clarity, and layout spacing
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutPrompt from "../common/LogoutPrompt";
import UpdatePrompt from "../common/UpdateConfirmPrompt";
import { Plus } from "lucide-react";

interface HeaderProps {
  completedCount: number;
  totalCount: number;
  mode: "create" | "edit";
  onPreview(): void;
  onCreateNew(): void;
  onUpdate(): void; // Now used for batch updates only
  onSwitchToCreate(): void;
  onSwitchToEdit(): void;
  isSubmitting: boolean;
  onLogout(): void;
}

const getButtonClasses = (
  variant: "mode" | "nav" | "action" | "logout",
  isActive = false
) => {
  const base =
    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200";

  const variants = {
    mode: isActive
      ? "bg-secondary text-btn-active-text border-accent shadow-md px-6 py-2.5 font-semibold shadow-sm border"
      : "bg-secondary-light text-btn-inactive-text border-accent hover:bg-btn-inactive-hover-bg hover:border-btn-inactive-hover-border px-6 py-2.5 font-semibold shadow-sm border",
    nav: "border hover:opacity-90",
    action:
      "px-5 py-2.5 font-semibold shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed",
    logout:
      "bg-btn-logout-bg text-btn-logout-text border border-red-200 hover:bg-btn-logout-hover-bg hover:border-btn-logout-hover-border",
  };

  return `${base} ${variants[variant]}`;
};

export const Header: React.FC<HeaderProps> = ({
  completedCount,
  mode,
  onPreview,
  onCreateNew,
  onUpdate,
  onSwitchToCreate,
  onSwitchToEdit,
  isSubmitting,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const handleLogout = (confirm: boolean) => {
    setShowLogoutPrompt(false);
    if (confirm) onLogout();
  };

  const handleUpdate = (confirm: boolean) => {
    setShowUpdatePrompt(false);
    if (confirm) onUpdate();
  };

  const rankingPageUrl = process.env.REACT_APP_RANKING_UI_URL;

  const navButtons = [
    {
      icon: "📊",
      "data-cy": "analytics-button",
      label: "Analytics",
      onClick: () => navigate("/analytics"),
      className:
        "text-btn-analytics-text bg-btn-analytics-bg border-indigo-200 hover:bg-btn-analytics-hover-bg",
    },
    {
      icon: "🏆",
      "data-cy": "ranking-page-button",
      label: "Ranking Page",
      onClick: () => window.open(rankingPageUrl, "_blank"),
      className:
        "text-btn-ranking-text bg-btn-ranking-bg border-orange-200 hover:bg-btn-ranking-hover-bg",
    },
    {
      icon: "👁️",
      "data-cy": "preview-button",
      label: "Preview",
      onClick: onPreview,
      className:
        "text-btn-preview-text bg-btn-preview-bg border-purple-200 hover:bg-btn-preview-hover-bg",
    },
  ];

  return (
    <>
      <header
        data-cy="admin-header"
        className="sticky top-0 z-50 w-full bg-primary bg-opacity-95 backdrop-blur-sm border-b-2 border-indigo-100 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between w-full">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-header-primary rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg font-bold">SB</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-header-primary tracking-tight">
                  Survey Builder
                </h1>
                <span className="text-sm text-header-subtitle font-medium tracking-wide">
                  Administrative Dashboard
                </span>
              </div>
            </div>

            {/* Center: Mode Toggle */}
            <div className="flex items-center gap-3">
              <button
                data-cy="add-header-button"
                onClick={onSwitchToCreate}
                className={getButtonClasses("mode", mode === "create")}
              >
                <span className="text-base ">
                  <Plus size={16} />
                </span>
                <span>Add</span>
              </button>
              <button
                data-cy="edit-header-button"
                onClick={onSwitchToEdit}
                className={getButtonClasses("mode", mode === "edit")}
              >
                <span className="text-base">✏️</span>
                <span>Edit</span>
              </button>
            </div>

            {/* Right: Navigation & Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Navigation Buttons */}
              {navButtons.map((btn, idx) => (
                <button
                  key={idx}
                  data-cy={btn["data-cy"]}
                  onClick={btn.onClick}
                  className={`${getButtonClasses("nav")} ${btn.className}`}
                >
                  <span className="text-base">{btn.icon}</span>
                  <span>{btn.label}</span>
                </button>
              ))}

              {/* Action Button */}
              {mode === "create" ? (
                <button
                  data-cy="save-questions-button"
                  onClick={onCreateNew}
                  disabled={isSubmitting || completedCount === 0}
                  className={`${getButtonClasses(
                    "action"
                  )} bg-btn-save-questions-bg text-btn-save-questions-text hover:bg-btn-save-questions-hover-bg`}
                >
                  <span className="text-base">💾</span>
                  <span>{isSubmitting ? "Creating..." : "Save Questions"}</span>
                </button>
              ) : (
                <button
                  data-cy="save-changes-button"
                  onClick={() => setShowUpdatePrompt(true)}
                  disabled={isSubmitting || completedCount === 0}
                  className={`${getButtonClasses(
                    "action"
                  )} bg-btn-save-changes-bg text-btn-save-changes-text hover:bg-btn-save-changes-hover-bg`}
                >
                  <span className="text-base">🔄</span>
                  <span>{isSubmitting ? "Updating..." : "Save Changes"}</span>
                </button>
              )}

              {/* Logout Button - Right Corner */}
              <button
                data-cy="logout-button"
                onClick={() => setShowLogoutPrompt(true)}
                className={getButtonClasses("logout")}
              >
                <span className="text-base">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Divider */}
        <div className="w-full h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-blue-200"></div>
      </header>

      {/* LOGOUT MODAL */}
      <LogoutPrompt
        show={showLogoutPrompt}
        onConfirm={() => handleLogout(true)}
        onCancel={() => handleLogout(false)}
      />
      {/* BATCH UPDATE MODAL */}
      <UpdatePrompt
        show={showUpdatePrompt}
        onConfirm={() => handleUpdate(true)}
        onCancel={() => handleUpdate(false)}
      />
    </>
  );
};
