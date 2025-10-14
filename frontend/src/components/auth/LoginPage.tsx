import React, { useState } from "react";

export interface LoginPageProps {
  onParticipant: (name: string, anonymous: boolean) => void;
  onAdmin: (name: string, password: string) => void;
  adminError?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onParticipant,
  onAdmin,
  adminError,
}) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState(""); // for admin
  const [anonymous, setAnonymous] = useState(false);
  const [tab, setTab] = useState<"participant" | "admin">("participant");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (tab === "participant") {
      if (!name.trim() && !anonymous) {
        setError("Please enter your name or login as Anonymous.");
        return;
      }
      setError("");
      onParticipant(name.trim() || "Guest", anonymous);
    } else {
      if (!name.trim()) {
        setError("Please enter admin name.");
        return;
      }
      if (!password.trim()) {
        setError("Please enter password.");
        return;
      }
      setError("");
      onAdmin(name.trim() || "Admin", password);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-login-bg px-4 sm:px-6 py-10">
      <div className="bg-login-card-bg p-6 sm:p-8 rounded-xl shadow-md w-full max-w-sm sm:max-w-md md:max-w-lg transition-all duration-300">
        <div className="flex mb-5 sm:mb-6">
          <button
          data-cy="participant-tab"
            className={`flex-1 py-2 sm:py-3 text-lg sm:text-base font-semibold rounded-l-lg transition-colors ${
              
              tab === "participant"
                ? "bg-login-primary text-login-active-text"
                : "bg-login-nonactive-bg text-login-nonactive-text"
            }`}
            onClick={() => {
              setTab("participant");
              setError("");
              setPassword("");
            }}
          >
            Participant
          </button>
          <button
          data-cy="admin-tab"
            className={`flex-1 py-2 sm:py-3 text-lg sm:text-base font-semibold rounded-r-lg transition-colors ${
              
              tab === "admin"
                ? "bg-login-primary text-login-active-text"
                : "bg-login-nonactive-bg text-login-nonactive-text"
            }`}
            onClick={() => {
              setTab("admin");
              setError("");
              setAnonymous(false);
            }}
          >
            Admin
          </button>
        </div>
        <h2 className="text-2xl sm:text-2xl font-bold text-center mb-6 sm:mb-6">
          {tab === "participant" ? "Participant Login" : "Admin Login"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4 sm:space-y-5"
        >
          <div>
            <input
              data-cy="username-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={tab === "participant" ? "Your Name" : "Admin Name"}
              className="w-full border border-login-input-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-login-focus-border focus:border-transparent"
              autoComplete="name"
              disabled={tab === "participant" && anonymous}
            />
          </div>
          {tab === "admin" && (
            <div>
              <input
                data-cy="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Password"
                className="w-full border border-login-input-border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-login-focus-border focus:border-transparent transition"
                autoComplete="current-password"
              />
            </div>
          )}
          {tab === "participant" && (
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="mr-2 w-4 h-4 accent-login-primary text-text-input border-login-checkbox-border rounded focus:ring-login-focus-border"
                />
                <span className="text-sm sm:text-base text-login-checkbox-text">Anonymous</span>
              </label>
            </div>
          )}
          <button
            data-cy="login-button"
            type="submit"
            className="w-full bg-login-button-bg text-login-button-text text-sm sm:text-base px-4 py-2 sm:py-2.5 rounded-lg hover:bg-login-button-hover transition font-semibold"
          >
            {tab === "participant" ? "Login as Participant" : "Login as Admin"}
          </button>
          {(error || (tab === "admin" && adminError)) && (
            <div className="text-login-error-text text-sm sm:text-base mt-2 p-2 bg-login-error-bg border border-login-error-border rounded">
              {error || adminError}
            </div>
          )}
        </form>
        <p className="text-center text-login-welcome-text text-sm sm:text-sm mt-4">
          Welcome to Sanskrit Learning Survey!
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
