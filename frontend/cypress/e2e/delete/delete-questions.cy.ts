describe("Login as admin and delete questions", () => {
  const LEVELS = ["Beginner", "Intermediate", "Advanced"];

  beforeEach(() => {
    cy.viewport("macbook-15");
    cy.loginAsAdmin();
  });

  LEVELS.forEach((level) => {
    it(`Delete all questions in ${level} tab`, () => {
      cy.get('[data-cy="edit-header-button"]').should("exist").click();
      cy.get(`[data-cy="level-tab-${level.toLowerCase()}"]`)
        .should("exist")
        .click();
      cy.get('[data-cy="delete-all-questions-button"]').should("exist").click();
      cy.get('[data-cy="confirm-delete-all-button"]').should("exist").click();
      cy.wait(5000);
    });
  });
});
