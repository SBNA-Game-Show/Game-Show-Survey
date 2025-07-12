
# 📢 PathFinder v3 Update Summary

## 🔗 Branch
**Branch:** [`PathFinder-v3`](https://github.com/SBNA-Game-Show/GameShow/tree/PathFinder-v3)
This branch has been updated with the latest code and improvements.

---

## 📦 Schema Changes

### `finalQuestionSchema`
- Stores finalized questions and answers.
- For **INPUT** type: stores the correct answer.
- For **MCQ** type: stores all answer options.
- New field: `timesAnswered` – tracks how many times the question was answered.

### `questionSchema`
- Also updated to include `timesAnswered`.

---

## 🏗️ File Structure Changes (Major Update in v3)

### 📁 New Folder: `services/`
- Contains `question.service.js` – handles core database logic.
- Controllers now call service functions to perform actions.

### ✅ Example Usage
```js
questionService.addQuestions(questions, SCHEMA_MODELS.QUESTION);
```
- Logic changes based on model name (`QUESTION` or `FINAL_QUESTION`).

---

## 🔄 Controller Updates

### ✅ `questionController` & `finalQuestionController`
- Both now use `questionService`.
- Each controller passes a model name to determine logic flow.

### ❌ Removed `answerController`
- Answer-related logic is now handled within `questionController` for better organization.

---

## 🛠️ Utility Update
- Added `SCHEMA_MODELS` Enum under the `utils/` folder.

---

## 🧾 MongoDB Update
- `_id` values are now saved as **string** instead of MongoDB's default ObjectId.

---

## ✅ Summary

This update improves:

- 🔍 Project structure by separating concerns via service layer.
- 🧠 Code maintainability and readability.
- 📊 Schema flexibility for tracking usage metrics.

---

Feel free to explore the changes and reach out with any questions!
