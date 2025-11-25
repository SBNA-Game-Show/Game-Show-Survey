describe("Participant Login and Intermediate Level Testing", () => {
  beforeEach(() => {
    cy.viewport("macbook-15");
    cy.visit("http://localhost:3000/login");
  });

  it("Should verify intermediate game elements load properly", () => {
    cy.get('[data-cy="username-input"]').type("Intermediate Player");
    cy.get('[data-cy="login-button"]').click();
    cy.get('[data-cy="proficiency-title"]', { timeout: 8000 }).should("be.visible");
    cy.get('[data-cy="intermediate-button"]').click();
    cy.get('[data-cy="confirm-button"]').click();

    let answeredCount = 0;

    function handleQuestion() {
      cy.get("body").then(($body) => {
        if ($body.find('[data-cy="submit-survey"]').length > 0) {
          cy.get('[data-cy="submit-survey"]').click();
          return;
        }

        cy.log(`Handling intermediate question #${answeredCount + 1}`);

        if (answeredCount < 4) {
          cy.get('[data-cy="text-area"]')
            .clear()
            .type(`Example ${answeredCount + 1}`);

          cy.wait(300);

          if ($body.find('[data-cy="save-continue-button"]').length > 0) {
            cy.get('[data-cy="save-continue-button"]').click();
          } else if ($body.find('[data-cy="review-answers-button"]').length > 0) {
            cy.get('[data-cy="review-answers-button"]').click();
          }

          answeredCount++;
        } else {
          cy.get('[data-cy="skip-button"]').click();
        }

        cy.wait(400);
        handleQuestion();
      });
    }

    handleQuestion();
  });
});
