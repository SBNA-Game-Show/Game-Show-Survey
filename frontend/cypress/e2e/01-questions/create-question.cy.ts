describe("Login as admin and create a question", () => {
  const LEVELS = ["Beginner", "Intermediate", "Advanced"];
  const CATEGORIES = [
    "Vocabulary",
    "Grammar",
    "Culture",
    "Literature",
    "History",
  ];

  beforeEach(() => {
    cy.viewport("macbook-15");
    cy.loginAsAdmin();
    cy.notEmpty();
  });

  it("Should be logged in as admin", () => {
    cy.url().should("eq", "http://localhost:3000/dashboard");
    cy.get('[data-cy="admin-header"]').should("contain.text", "Dashboard");
  });

  it("Switch to create mode", () => {
    cy.get('[data-cy="add-header-button"]').should("exist").click();
    cy.get('[data-cy="create-mode-badge"]')
      .should("exist")
      .and("have.text", "CREATE MODE");
  });

  it("Create question and delete before saving", () => {
    cy.get('[data-cy="add-header-button"]').should("exist").click();
    cy.get(`[data-cy="level-tab-beginner"]`).should("exist").click();
    cy.get('[data-cy="add-question-button"]').should("exist").click();
    cy.get('[data-cy="question-category-select"]').select("Vocabulary");
    cy.get('[data-cy="question-level-select"]').select("Beginner");
    cy.get('[data-cy="question-type-select"]').select("Text");
    cy.get('[data-cy="question-textarea"]').type(
      "Is this a test question that will be discarded?"
    );
    cy.get('[data-cy="delete-question-button"]').should("exist").click();
    cy.get('[data-cy="confirm-delete-question-button"]')
      .should("exist")
      .click();
  });

  LEVELS.forEach((level) => {
    it(`Click Add Question button in create mode in ${level} Tab`, () => {
      cy.get('[data-cy="add-header-button"]').should("exist").click();
      cy.get(`[data-cy="level-tab-${level.toLowerCase()}"]`)
        .should("exist")
        .click();
      cy.get('[data-cy="add-question-button"]').should("exist").click();
    });
  });

  LEVELS.forEach((level) => {
    it(`Create input questions in each category in the ${level} Tab`, () => {
      cy.get('[data-cy="add-header-button"]').should("exist").click();
      cy.get(`[data-cy="level-tab-${level.toLowerCase()}"]`)
        .should("exist")
        .click();
      CATEGORIES.forEach((category) => {
        cy.get('[data-cy="add-question-button"]').should("exist").click();
        cy.get('[data-cy="question-category-select"]').select(category);
        cy.get('[data-cy="question-level-select"]').select(level);
        cy.get('[data-cy="question-type-select"]').select("Text");
        cy.get('[data-cy="question-textarea"]').type(
          `Is this test ${category.toLowerCase()} ${level.toLowerCase()} text question working?`
        );
      });
      cy.get('[data-cy="save-questions-button"]').click();
      cy.get('[data-cy="save-confirm-button"]').click();

      cy.wait(5000);

    });
  });

  LEVELS.forEach((level) => {
    it(`Create MCQ questions in each category in the ${level} Tab`, () => {
      cy.get('[data-cy="add-header-button"]').should("exist").click();
      cy.get(`[data-cy="level-tab-${level.toLowerCase()}"]`)
        .should("exist")
        .click();
      CATEGORIES.forEach((category) => {
        const randomAnswerIndex = Math.floor(Math.random() * 4);

        cy.get('[data-cy="add-question-button"]').should("exist").click();
        cy.get('[data-cy="question-category-select"]').select(category);
        cy.get('[data-cy="question-level-select"]').select(level);
        cy.get('[data-cy="question-type-select"]').select("Multiple Choice");
        cy.get('[data-cy="question-textarea"]').type(
          `Is this test ${category.toLowerCase()} ${level.toLowerCase()} MCQ question working?`
        );
        cy.get('[data-cy="mcq-option-0-input"]').type("Option 1");
        cy.get('[data-cy="mcq-option-1-input"]').type("Option 2");
        cy.get('[data-cy="mcq-option-2-input"]').type("Option 3");
        cy.get('[data-cy="mcq-option-3-input"]').type("Option 4");
        cy.get(
          `[data-cy="mcq-correct-answer-${randomAnswerIndex}-button"]`
        ).click();
      });
      cy.get('[data-cy="save-questions-button"]').click();
      cy.get('[data-cy="save-confirm-button"]').click();

      cy.wait(5000);

    });
  });
});
