// File: src/tests/models/answer.model.test.js

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Answer } from '../../models/answer.model.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('🧪 Answer Model', () => {
  test('✅ should save a valid answer', async () => {
    const answer = new Answer({
      answer: '42',
      score: 10,
      rank: 1,
      isRevealed: true
    });

    const saved = await answer.save();

    expect(saved._id).toBeDefined();
    expect(saved.answer).toBe('42');
    expect(saved.score).toBe(10);
    expect(saved.rank).toBe(1);
    expect(saved.isRevealed).toBe(true);
  });

  test('❌ should not save if score is negative', async () => {
    const answer = new Answer({
      answer: 'Invalid Score',
      score: -5
    });

    let err;
    try {
      await answer.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.score).toBeDefined();
  });

  test('❌ should not save if rank is below 1', async () => {
    const answer = new Answer({
      answer: 'Invalid Rank',
      rank: 0
    });

    let err;
    try {
      await answer.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.rank).toBeDefined();
  });

  test('✅ can save without required fields since all are optional', async () => {
    const answer = new Answer();
    const saved = await answer.save();
    expect(saved._id).toBeDefined();
  });
});
