describe("Ranking page (Preview → Rank → Post)", () => {
  beforeEach(() => {
    cy.visit("http://localhost:5000");
  });

  it("Test core sections and buttons", () => {
    cy.contains("Actions").should("be.visible");
    cy.contains("Status").should("be.visible");
    cy.contains("Statistics").should("be.visible");
    cy.contains("Preview Ranking").should("be.visible");
    cy.contains("System Logs").should("be.visible");

    cy.get('[data-cy="btn-preview"]').should("exist");
    cy.get('[data-cy="btn-rank"]').should("exist");
    cy.get('[data-cy="btn-post"]').should("exist");

    cy.get('[data-cy="status-text"]').should("contain.text", "Ready to start");
    cy.get('[data-cy="stat-total-answered"]').should("have.text", "-");
    cy.get('[data-cy="stat-processed"]').should("have.text", "-");
    cy.get('[data-cy="stat-answers-ranked"]').should("have.text", "-");

    cy.get('[data-cy="preview-list"]').should("exist");
    cy.get('[data-cy="log-panel"]').should("exist");
  });

  it("Preview shows question cards with metadata", () => {
    cy.get('[data-cy="btn-preview"]').scrollIntoView().click();

    cy.get('[data-cy="preview-card"]', { timeout: 30000 })
      .should("have.length.at.least", 1)
      .first()
      .within(() => {
        cy.get("strong")
          .invoke("text")
          .should("not.be.empty");

        cy.contains(/Rankable|Skipped/).should("exist");

        cy.contains("responses").should("exist");
      });
  });

  it("Rank updates status, logs, and statistics", () => {
    cy.get('[data-cy="btn-rank"]').click();

    cy.get('[data-cy="status-text"]', { timeout: 30000 })
      .should("contain.text", "Ranking completed");

    cy.get('[data-cy="log-panel"]', { timeout: 15000 }).should(($el) => {
      const t = $el.text();
      expect(t).to.include("/api/test-connection");
      expect(t).to.include("/api/get-questions");
      expect(t).to.include("/api/process-ranking");
    });

    cy.get('[data-cy="stat-total-answered"]').should("not.have.text", "-");
    cy.get('[data-cy="stat-processed"]').should("not.have.text", "-");
    cy.get('[data-cy="stat-answers-ranked"]').should("not.have.text", "-");
  });

  it("Post finalizes results and updates status + logs", () => {
    cy.get('[data-cy="btn-post"]').click();

    cy.get('[data-cy="status-text"]', { timeout: 30000 })
      .should("contain.text", "Final operation completed!");

    cy.get('[data-cy="log-panel"]', { timeout: 15000 }).should(($el) => {
      const t = $el.text();
      expect(t).to.include("Starting final endpoint operation");
      expect(t).to.include("/api/post-final-answers");
      expect(t).to.include("Final operation completed successfully");
    });
  });
});
