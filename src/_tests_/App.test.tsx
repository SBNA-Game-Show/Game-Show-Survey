import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App";
import '@testing-library/jest-dom';

test("user can create a new survey question", () => {
  render(<App />);

  // Type into the question field
  const questionInput = screen.getByPlaceholderText(/Enter your question/i);
  fireEvent.change(questionInput, { target: { value: "What is your name?" } });

  // Select category
  const [categorySelect] = screen.getAllByRole('combobox');
  fireEvent.change(categorySelect, { target: { value: "Vocabulary" } });


  // Select difficulty
  const [, difficultySelect] = screen.getAllByRole('combobox');
  fireEvent.change(difficultySelect, { target: { value: "Beginner" } });


  // Click Add Next Question
  const addButton = screen.getByText(/Add Next Question/i);
  fireEvent.click(addButton);

  // Check if Question 2 appears
  expect(screen.getByText(/Q2/)).toBeInTheDocument();
});
