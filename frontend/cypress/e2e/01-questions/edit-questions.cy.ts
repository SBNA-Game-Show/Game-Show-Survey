describe("Login as admin and delete questions", () => {
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

  it("Edit the first question in beginner tab, update text and save changes", () => {
    cy.get('[data-cy="level-tab-beginner"]').should("exist").click();
    cy.get('[data-cy="Beginner-question-0"]').should("exist").click();
    cy.get('[data-cy="question-textarea"]')
      .should("exist")
      .clear()
      .type("updated question text for testing purposes.");
    cy.get('[data-cy="save-changes-button"]').should("exist").click();
    cy.get('[data-cy="update-confirm-button"]').should("exist").click();
  });

  it("Verify the updated question in Beginner tab", () => {
    cy.get('[data-cy="edit-header-button"]').should("exist").click();
    cy.get(`[data-cy="level-tab-beginner"]`).should("exist").click();
    cy.get('[data-cy="Beginner-question-0"]').click();
    cy.get('[data-cy="question-textarea"]').should(
      "have.text",
      "updated question text for testing purposes."
    );
  });

  it("Change the level of the first question in Beginner tab to Intermediate and save changes", () => {
    cy.get('[data-cy="Beginner-question-0"]').should("exist").click();
    cy.get('[data-cy="question-level-select"]')
      .should("exist")
      .select("Intermediate");
    cy.get('[data-cy="save-changes-button"]').should("exist").click();
    cy.get('[data-cy="update-confirm-button"]').should("exist").click();
  });
});
