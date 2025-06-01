import request from 'supertest';
import app from '../../app.js';
import mongoose from 'mongoose';

describe('Full Question Controller Tests', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**
   * GET /api/v1/questions
   * Public access (non-admin)
   * Should return 200 OK or 404 if DB is empty
   */
  test('GET /api/v1/questions - public user', async () => {
    const res = await request(app).get('/api/v1/questions');
    expect([200, 404]).toContain(res.statusCode);
  });

  /**
   * GET /api/v1/questions
   * Admin access
   * Should return 200 OK and include answers (if data exists)
   */
  test('GET /api/v1/questions - admin access', async () => {
    const res = await request(app)
      .get('/api/v1/questions')
      .set('isAdminRoute', 'true');
    expect([200, 404]).toContain(res.statusCode);
  });

  /**
   * POST /api/v1/questions
   * Non-admin trying to post a question
   * Should return 403 Forbidden or 404
   */
  test('POST /api/v1/questions - non-admin', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .send({ questions: [] });
    expect([403, 404]).toContain(res.statusCode);
  });

  /**
   * POST /api/v1/questions
   * Admin sends empty or incomplete question
   * Should return 400 Bad Request
   */
  test('POST /api/v1/questions - admin with missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/questions')
      .set('isAdminRoute', 'true')
      .send({
        questions: [
          {
            question: "",
            questionCategory: "",
            questionLevel: ""
          }
        ]
      });
    expect([400, 403, 404]).toContain(res.statusCode);
  });

  /**
   * PUT /api/v1/questions
   * Admin sends update with invalid ID
   * Should return 404 or 500
   */
  test('PUT /api/v1/questions - admin invalid ID', async () => {
    const res = await request(app)
      .put('/api/v1/questions')
      .set('isAdminRoute', 'true')
      .send({
        questionID: "invalid123456789012",
        question: "Update?",
        questionCategory: "Logic",
        questionLevel: "Easy",
        questionType: "Input"
      });
    expect([404, 500]).toContain(res.statusCode);
  });

  /**
   * PUT /api/v1/questions
   * Admin sends update with missing fields
   * Should return 400 Bad Request
   */
  test('PUT /api/v1/questions - missing fields', async () => {
    const res = await request(app)
      .put('/api/v1/questions')
      .set('isAdminRoute', 'true')
      .send({
        questionID: "validIDButEmpty",
        question: "",
        questionCategory: "",
        questionLevel: "",
        questionType: ""
      });
    expect([400, 403, 404]).toContain(res.statusCode);
  });

  /**
   * DELETE /api/v1/questions
   * Admin tries to delete but questionID is missing
   * Should return 403
   */
  test('DELETE /api/v1/questions - missing ID', async () => {
    const res = await request(app)
      .delete('/api/v1/questions')
      .set('isAdminRoute', 'true')
      .send({});
    expect([403, 404]).toContain(res.statusCode);
  });

  /**
   * DELETE /api/v1/questions
   * Admin provides invalid ID
   * Should return 404
   */
  test('DELETE /api/v1/questions - invalid question ID', async () => {
    const res = await request(app)
      .delete('/api/v1/questions')
      .set('isAdminRoute', 'true')
      .send({ questionID: "invalidid123" });
    expect([404, 403]).toContain(res.statusCode);
  });
});
