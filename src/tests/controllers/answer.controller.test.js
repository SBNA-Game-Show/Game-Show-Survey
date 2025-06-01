// // File: src/tests/controllers/answer.controller.test.js

// import request from 'supertest';
// import mongoose from 'mongoose';
// import { MongoMemoryServer } from 'mongodb-memory-server';
// import app from '../../app.js';
// import { Question } from '../../models/question.model.js';

// let mongoServer;

// // 🔌 Start in-memory MongoDB before all tests
// beforeAll(async () => {
//   mongoServer = await MongoMemoryServer.create();
//   const uri = mongoServer.getUri();
//   await mongoose.connect(uri);
// });

// // 🧹 Clean up after all tests
// afterAll(async () => {
//   await mongoose.disconnect();
//   await mongoServer.stop();
// });

// describe('🧪 Answer Controller (In-Memory DB)', () => {
//   let questionId;
//   let answerId;
//   const apiKey = 'testkey123'; // Replace with real API key if needed

//   // 🏗️ Prepare a question before each test
//   beforeEach(async () => {
//     const question = await Question.create({
//       question: 'What is Node.js?',
//       questionType: 'Input',
//       questionCategory: 'Vocabulary',
//       questionLevel: 'Beginner',
//       answers: [],
//       timesSkipped: 0,
//     });
//     questionId = question._id.toString();
//   });

//   // ❌ PUT with empty questions array
//   test('PUT /api/v1/survey - empty questions array should return 400', async () => {
//     const res = await request(app)
//       .put('/api/v1/survey')
//       .set('x-api-key', apiKey)
//       .send({ questions: [], answers: [] });

//     expect(res.statusCode).toBe(400);
//     expect(res.body.message).toMatch(/Question must not be an empty Array/i);
//   });

//   // ❌ PUT with missing question ID
//   test('PUT /api/v1/survey - missing question ID returns 400', async () => {
//     const res = await request(app)
//       .put('/api/v1/survey')
//       .set('x-api-key', apiKey)
//       .send({ questions: [{}], answers: [{ answer: 'Node' }] });

//     expect(res.statusCode).toBe(400);
//     expect(res.body.message).toMatch(/Missing question ID/i);
//   });

//   // ✅ PUT with valid answer
//   test('PUT /api/v1/survey - adds a new answer', async () => {
//     const res = await request(app)
//       .put('/api/v1/survey')
//       .set('x-api-key', apiKey)
//       .send({
//         questions: [{ _id: questionId }],
//         answers: [{ answer: 'Server-side JS' }],
//       });

//     expect(res.statusCode).toBe(200);
//     expect(res.body.message).toMatch(/Question Updated/i);
//   });

//   // 🔁 PUT with existing answer (should increment count)
//   test('PUT /api/v1/survey - increments existing answer count', async () => {
//     await Question.findByIdAndUpdate(questionId, {
//       $push: {
//         answers: {
//           answer: 'Repeat',
//           responseCount: 1,
//         },
//       },
//     });

//     const res = await request(app)
//       .put('/api/v1/survey')
//       .set('x-api-key', apiKey)
//       .send({ questions: [{ _id: questionId }], answers: [{ answer: 'Repeat' }] });

//     expect(res.statusCode).toBe(200);
//   });

//   // 🚫 DELETE by non-admin
//   test('DELETE /api/v1/admin/answer - non-admin should return 403 or 404', async () => {
//     const res = await request(app)
//       .delete('/api/v1/admin/answer')
//       .set('x-api-key', apiKey)
//       .send({ questionID: questionId, answerID: 'someid' });

//     expect([403, 404]).toContain(res.statusCode);
//   });

//   // ✅ DELETE by admin
//   test('DELETE /api/v1/admin/ - admin deletes real answer', async () => {
//     const updated = await Question.findByIdAndUpdate(
//       questionId,
//       {
//         $push: {
//           answers: {
//             answer: 'To Be Deleted',
//             responseCount: 1,
//           },
//         },
//       },
//       { new: true }
//     );

//     answerId = updated.answers[0]._id.toString();

//     const res = await request(app)
//       .delete('/api/v1/admin/')
//       .set('x-api-key', apiKey)
//       .set('isAdminRoute', 'true')
//       .send({ questionID: questionId, answerID: answerId });

//     expect(res.statusCode).toBe(200);
//     expect(res.body.data.answers.length).toBe(0);
//   });
// });
