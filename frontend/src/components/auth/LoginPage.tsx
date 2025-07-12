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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 rounded-l-lg font-semibold text-lg ${
              tab === "participant"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-500"
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
            className={`flex-1 py-2 rounded-r-lg font-semibold text-lg ${
              tab === "admin"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-500"
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
        <h2 className="text-2xl font-bold text-center mb-6">
          {tab === "participant" ? "Participant Login" : "Admin Login"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-5"
        >
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={tab === "participant" ? "Your Name" : "Admin Name"}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoComplete="name"
              disabled={tab === "participant" && anonymous}
            />
          </div>
          {tab === "admin" && (
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Password"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Anonymous</span>
              </label>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          >
            {tab === "participant" ? "Login as Participant" : "Login as Admin"}
          </button>
          {(error || (tab === "admin" && adminError)) && (
            <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
              {error || adminError}
            </div>
          )}
        </form>
        <p className="text-center text-gray-500 text-xs mt-4">
          Welcome to Sanskrit Learning Survey!
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
