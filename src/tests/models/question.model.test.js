import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Question } from '../../models/question.model.js';
import {
  QUESTION_CATEGORY,
  QUESTION_LEVEL,
  QUESTION_TYPE,
} from '../../constants.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('🧪 Question Model', () => {
  test('✅ should save a valid question', async () => {
    const q = new Question({
      question: 'What is JavaScript?',
      questionType: QUESTION_TYPE.Input,
      questionCategory: QUESTION_CATEGORY.Vocabulary,
      questionLevel: QUESTION_LEVEL.Beginner,
    });

    const saved = await q.save();
    expect(saved._id).toBeDefined();
    expect(saved.timesSkipped).toBe(0);
  });

  test('❌ should fail with invalid questionType', async () => {
    const q = new Question({
      question: 'Invalid type',
      questionType: 'Essay',
    });

    await expect(q.save()).rejects.toThrow(/is not a valid enum value/);
  });

  test('❌ should fail with invalid questionCategory', async () => {
    const q = new Question({
      question: 'Invalid category',
      questionCategory: 'Frontend',
    });

    await expect(q.save()).rejects.toThrow(/is not a valid enum value/);
  });

  test('❌ should fail with invalid questionLevel', async () => {
    const q = new Question({
      question: 'Invalid level',
      questionLevel: 'Hard',
    });

    await expect(q.save()).rejects.toThrow(/is not a valid enum value/);
  });

  test('❌ should fail with negative timesSkipped', async () => {
    const q = new Question({
      question: 'Negative skip',
      timesSkipped: -1,
    });

    await expect(q.save()).rejects.toThrow(/is less than minimum allowed value/);
  });

  test('✅ should allow answers array with default responseCount', async () => {
    const q = new Question({
      question: 'Favorite color?',
      answers: [{ answer: 'Blue' }],
    });

    const saved = await q.save();
    expect(saved.answers[0].responseCount).toBe(0);
  });

  test('❌ should fail with negative responseCount', async () => {
    const q = new Question({
      question: 'Bad count',
      answers: [{ answer: 'Red', responseCount: -2 }],
    });

    await expect(q.save()).rejects.toThrow(/is less than minimum allowed value/);
  });
});
