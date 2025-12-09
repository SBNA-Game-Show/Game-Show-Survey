describe('Survey Responses Page', () => {
  beforeEach(() => {
    localStorage.setItem('isAdmin', 'true');
    cy.intercept('GET', '**/api/v1/admin/survey', { fixture: 'questionsAndAnswers.json' }).as('getQuestions');
    cy.visit('/responses');
    cy.url().should('include', '/responses');
    cy.contains('Survey Responses').should('be.visible');
  });

  it('displays filter fields and table headers', () => {
    cy.get('input[placeholder="Search by question text..."]').should('exist');

    cy.contains('label', 'Category')
      .parent()
      .find('select')
      .should('exist');

    cy.contains('label', 'Level')
      .parent()
      .find('select')
      .should('exist');

    cy.contains('Responses Table').should('exist');
    cy.contains('Total Questions').should('exist');
    cy.contains('Total Answers').should('exist');
    cy.contains('Total Skips').should('exist');
  });



  it('displays question rows in the table', () => {
    cy.get('table').should('exist');
    cy.get('tr').should('have.length.at.least', 2); 
  });

  it('each question row shows columns: question, category, level, answered, skipped, skip %, total', () => {
    cy.get('tr').eq(1).within(() => {
      cy.get('td').should('have.length.at.least', 7);
    });
  });

  it('highlights skipped questions with 100% skip rate', () => {
    cy.contains('100.0%').should('have.css', 'color').and('include', 'rgb');
  });

  it('allows clicking on a question link', () => {
    cy.get('table tbody tr').first().find('td').eq(1).click();
    cy.url().should('include', '/analytics/question/');
  });


  it('filters questions by category (e.g. Culture)', () => {
    cy.get('select').first().select('Culture');
    cy.get('tr').each(($tr) => {
      if ($tr.find('td').length) {
        cy.wrap($tr).contains('Culture');
      }
    });
  });

  it('filters questions by level (e.g. Intermediate)', () => {
    cy.get('select').eq(1).select('Intermediate');
    cy.get('tr').each(($tr) => {
      if ($tr.find('td').length) {
        cy.wrap($tr).contains('Intermediate');
      }
    });
  });

  it('refreshes table when Refresh button is clicked', () => {
    cy.contains('Refresh').click();
    cy.contains('Total Questions').should('be.visible');
  });

  it('navigates to analytics when Analytics button is clicked', () => {
    cy.contains('Analytics').click();
    cy.url().should('include', '/analytics');
  });

  it('returns to dashboard when Back button is clicked', () => {
    cy.contains('Back').click();
    cy.url().should('include', '/dashboard');
  });

  it('finds question by exact text match', () => {
    cy.get('input[placeholder="Search by question text..."]').type('Namaste');
    cy.contains('td', 'Namaste').should('be.visible');
  });
  
  it('finds question by partial text match', () => {
    cy.get('input[placeholder="Search by question text..."]').type('Trans');
    cy.contains('td', 'Translate').should('exist');
  });
  
  it('search is case insensitive', () => {
    cy.get('input[placeholder="Search by question text..."]').type('dHaRmA');
    cy.contains('td', 'Dharma').should('exist');
  });

  it('trims whitespace in search input', () => {
    cy.get('input[placeholder="Search by question text..."]').type('   Namaste   ');
    cy.contains('td', 'Namaste').should('exist');
  });

  it('shows no results for unmatched search', () => {
    cy.get('input[placeholder="Search by question text..."]').type('xyz!@#');
    cy.contains('No questions found').should('exist');
  });

  it('clears search and shows all questions again', () => {
    cy.get('input[placeholder="Search by question text..."]').type('Namaste');
    cy.contains('td', 'Namaste').should('exist');

    cy.get('input[placeholder="Search by question text..."]').clear();
    cy.get('table tbody tr').should('have.length.at.least', 2);
  });

  it('search works after pressing Enter (if applicable)', () => {
    cy.get('input[placeholder="Search by question text..."]').type('Namaste{enter}');
    cy.contains('td', 'Namaste').should('exist');
  });

  it('shows filtered question count in summary', () => {
    cy.get('input[placeholder="Search by question text..."]').type('Test mcq');
    cy.contains(/Showing \d+ of \d+ questions/).should('exist');
  });

  it('search works with category filter', () => {
    cy.get('input[placeholder="Search by question text..."]').type('Namaste');
    cy.get('select').first().select('Vocabulary');
    cy.contains('td', 'Namaste').should('exist');
  });

  it('clears search using "Clear all filters" button', () => {
    cy.get('input[placeholder="Search by question text..."]').type('Dharma');
    cy.contains('Dharma').should('exist');

    cy.contains('Clear all filters').click();
    cy.get('input[placeholder="Search by question text..."]').should('have.value', '');
    cy.get('table tbody tr').should('have.length.at.least', 2);
  });




});
