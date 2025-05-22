import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Question {
  id: string;
  question: string;
  category: string;
  level: string;
}
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";
const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", question: "", category: "", level: "" },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formTitle, setFormTitle] = useState("Sanskrit Language Survey");
  const [formDescription, setFormDescription] = useState(
    "Please answer the following questions to help us understand your Sanskrit knowledge level."
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const current = questions[currentIndex];

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([
      ...questions,
      { id: newId, question: "", category: "", level: "" },
    ]);
    setCurrentIndex(questions.length);
  };
  const deleteQuestion = (index: number) => {
    if (questions.length > 1) {
      // 1) remove the item
      let updated = questions.filter((_, i) => i !== index);
      // 2) reassign ids 1,2,3…
      updated = updated.map((q, i) => ({
        ...q,
        id: (i + 1).toString(),
      }));
      setQuestions(updated);
      // 3) fix currentIndex
      setCurrentIndex(Math.min(index, updated.length - 1));
    }
  };

  const updateQuestion = (field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[currentIndex] = { ...updated[currentIndex], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1) clear old
      await fetch(`${API}/api/surveys`, { method: "DELETE" });

      // 2) publish new
      const res = await fetch(`${API}/api/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          questions: questions.filter((q) => q.question.trim() !== ""),
        }),
      });
      if (!res.ok) throw new Error(res.statusText);
      setSubmitMessage("Survey published successfully!");
    } catch (err) {
      console.error(err);
      setSubmitMessage("Failed to publish. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedQuestions = questions.filter(
    (q) => q.question.trim() !== "" && q.category !== "" && q.level !== ""
  ).length;

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Survey Forms
              </h1>
              <p className="text-sm text-gray-500">Sanskrit Survey Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              👁️ Preview
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || completedQuestions === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              📤 {isSubmitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-3">Questions</h3>
              <div className="space-y-2 mb-4">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      index === currentIndex
                        ? "bg-purple-100 border-purple-200 border"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Q{index + 1}</span>
                      {q.question.trim() && q.category && q.level ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {q.question.trim() || "Empty question"}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={addQuestion}
                className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
              >
                ➕ Add Question
              </button>

              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500 mb-1">Progress</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (completedQuestions / questions.length) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {completedQuestions}/{questions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Form Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full text-2xl font-bold text-gray-900 border-none outline-none bg-transparent placeholder-gray-400 focus:bg-gray-50 rounded p-2 -m-2"
                placeholder="Form title"
              />
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full mt-2 text-gray-600 border-none outline-none bg-transparent placeholder-gray-400 focus:bg-gray-50 rounded p-2 -m-2 resize-none"
                placeholder="Form description"
                rows={2}
              />
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg shadow-sm border"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Question {currentIndex + 1}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentIndex(Math.max(0, currentIndex - 1))
                        }
                        disabled={currentIndex === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                      >
                        ⬅️
                      </button>
                      <button
                        onClick={() =>
                          setCurrentIndex(
                            Math.min(questions.length - 1, currentIndex + 1)
                          )
                        }
                        disabled={currentIndex === questions.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                      >
                        ➡️
                      </button>
                      {questions.length > 1 && (
                        <button
                          onClick={() => deleteQuestion(currentIndex)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                      </label>
                      <textarea
                        value={current.question}
                        onChange={(e) =>
                          updateQuestion("question", e.target.value)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        rows={3}
                        maxLength={500}
                        placeholder="Enter your question here..."
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          {current.question.length}/500 characters
                        </span>
                        {current.question.trim() && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Question added
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={current.category}
                          onChange={(e) =>
                            updateQuestion("category", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        >
                          <option value="">Choose a category</option>
                          <option value="Vocabulary">📚 Vocabulary</option>
                          <option value="Culture">🏛️ Culture</option>
                          <option value="Grammar">📝 Grammar</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty Level *
                        </label>
                        <select
                          value={current.level}
                          onChange={(e) =>
                            updateQuestion("level", e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        >
                          <option value="">Select difficulty</option>
                          <option value="Beginner">🟢 Beginner</option>
                          <option value="Intermediate">🟡 Intermediate</option>
                          <option value="Advanced">🔴 Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Actions */}
                <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {current.question.trim() &&
                    current.category &&
                    current.level ? (
                      <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                        ✓ Complete
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        ⚠️ Incomplete
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion("question", "")}
                      className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-white transition-colors"
                    >
                      Clear
                    </button>
                    {currentIndex === questions.length - 1 && (
                      <button
                        onClick={addQuestion}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      >
                        Add Next Question
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Survey Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {formTitle}
                </h1>
                <p className="text-gray-600">{formDescription}</p>
              </div>

              {questions
                .filter((q) => q.question.trim() !== "")
                .map((q, idx) => (
                  <div
                    key={q.id}
                    className="mb-6 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {q.question}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {q.category}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                            {q.level}
                          </span>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                          <p className="text-sm text-gray-600">
                            Response area for participants
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleSubmit();
                }}
                disabled={isSubmitting || completedQuestions === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Publishing..." : "Publish Survey"}
              </button>
            </div>

            {submitMessage && (
              <div className="px-6 pb-4">
                <div
                  className={`p-3 rounded-lg text-sm ${
                    submitMessage.includes("success")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {submitMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
