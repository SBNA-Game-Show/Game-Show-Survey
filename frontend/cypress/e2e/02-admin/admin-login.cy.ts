describe("Admin login page test with no 'get' on TailwindCSS", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000/login");
  });

  it("Test Admin tab", () => {
    cy.get('[data-cy="admin-tab"]')
      .should("exist")
      .should("have.text", "Admin")
      .click();
  });

  it("Test Admin login button error with no name or password input", () => {
    cy.get('[data-cy="admin-tab"]').click();
    cy.get('[data-cy="login-button"]').click();
    cy.contains("Please enter admin name.").should("be.visible");
  });

  it("Test Admin login button error with no password input", () => {
    cy.get('[data-cy="admin-tab"]').click();
    cy.get('[data-cy="username-input"]').type("Jimmy");
    cy.get('[data-cy="login-button"]').click();
    cy.contains("Please enter password.").should("be.visible");
  });

  it("Test Admin login button error with no name input", () => {
    cy.get('[data-cy="admin-tab"]').click();
    cy.get('[data-cy="password-input"]').type("Dummy Password");
    cy.get('[data-cy="login-button"]').click();
    cy.contains("Please enter admin name.").should("be.visible");
  });

  it("Test with incorrect password", () => {
    cy.get('[data-cy="admin-tab"]').click();
    cy.get('[data-cy="username-input"]').type("Jimmy");
    cy.get('[data-cy="password-input"]').type("Dummy Password");
    cy.get('[data-cy="login-button"]').click();
    cy.contains("Incorrect admin password.").should("be.visible");
  });

  it("Test with correct password", () => {
    cy.get('[data-cy="admin-tab"]').click();
    cy.get('[data-cy="username-input"]').type("Jimmy");
    cy.get('[data-cy="password-input"]').type("AdminForm123");
    cy.get('[data-cy="login-button"]').click();
    cy.url().should("eq", "http://localhost:3000/dashboard");
  });

  it("Test logout", () => {
    cy.get('[data-cy="admin-tab"]').click();
    cy.get('[data-cy="username-input"]').type("Jimmy");
    cy.get('[data-cy="password-input"]').type("AdminForm123");
    cy.get('[data-cy="login-button"]').click();
    cy.url().should("eq", "http://localhost:3000/dashboard");
    cy.get('[data-cy="logout-button"]').should("exist").click();
    cy.get('[data-cy="confirm-logout-button"]').should("exist").click();
    cy.wait(2000);
    cy.url().should("eq", "http://localhost:3000/login");
  });
});
