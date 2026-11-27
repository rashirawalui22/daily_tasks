const express = require('express');
const request = require('supertest');
const app = require('../src/app');
const errorHandler = require('../src/middleware/errorHandler');
const requestId = require('../src/middleware/requestId');

const validAttempt = {
  studentId: 'STU101',
  courseId: 'COURSE101',
  quizId: 'QUIZ101',
  answers: [
    { questionId: 'Q1', selectedOption: 'B' },
    { questionId: 'Q2', selectedOption: 'A' }
  ],
  timeTaken: 300
};

describe('POST /api/quiz-attempts', () => {
  test('submits a valid attempt with a response request ID', async () => {
    const requestLog = jest.spyOn(console, 'info').mockImplementation(() => {});
    const response = await request(app)
      .post('/api/quiz-attempts')
      .send(validAttempt);
    const responseRequestId = response.headers['x-request-id'];

    try {
      expect(response.status).toBe(201);
      expect(responseRequestId).toMatch(/^[0-9a-f-]{36}$/i);
      expect(response.body).toEqual({
        success: true,
        message: 'Quiz attempt submitted successfully',
        data: {
          attemptId: expect.any(String),
          studentId: 'STU101',
          courseId: 'COURSE101',
          quizId: 'QUIZ101',
          totalQuestions: 2,
          timeTaken: 300
        },
        requestId: responseRequestId
      });
      expect(requestLog).toHaveBeenCalledWith(
        expect.stringContaining(`"requestId":"${responseRequestId}"`)
      );
    } finally {
      requestLog.mockRestore();
    }
  });

  test('rejects a missing studentId with HTTP 400 and a traceable error', async () => {
    const body = { ...validAttempt };
    delete body.studentId;
    const response = await request(app)
      .post('/api/quiz-attempts')
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Validation failed',
      errors: [{
        field: 'studentId',
        message: 'studentId must be a non-empty string'
      }],
      requestId: response.headers['x-request-id']
    });
  });

  test('rejects an empty answers array', async () => {
    const response = await request(app)
      .post('/api/quiz-attempts')
      .send({ ...validAttempt, answers: [] });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: 'answers',
      message: 'answers must be a non-empty array'
    });
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
  });

  test.each([-1, 0, '300', 1.5])('rejects invalid timeTaken value %p', async (timeTaken) => {
    const response = await request(app)
      .post('/api/quiz-attempts')
      .send({ ...validAttempt, timeTaken });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: 'timeTaken',
      message: 'timeTaken must be a positive integer'
    });
  });

  test('rejects missing answer fields and unexpected fields', async () => {
    const response = await request(app)
      .post('/api/quiz-attempts')
      .send({
        ...validAttempt,
        extra: true,
        answers: [{ questionId: 'Q1', extraAnswer: 'A' }]
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(expect.arrayContaining([
      { field: 'body.extra', message: 'Unexpected field' },
      { field: 'answers.0.extraAnswer', message: 'Unexpected field' },
      {
        field: 'answers.0.selectedOption',
        message: 'selectedOption must be a non-empty string'
      }
    ]));
  });

  test('returns a new request ID for each request', async () => {
    const first = await request(app).post('/api/quiz-attempts').send(validAttempt);
    const second = await request(app).post('/api/quiz-attempts').send(validAttempt);

    expect(first.headers['x-request-id']).toBeTruthy();
    expect(second.headers['x-request-id']).toBeTruthy();
    expect(second.headers['x-request-id']).not.toBe(first.headers['x-request-id']);
  });

  test('returns a safe centralized 400 for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/quiz-attempts')
      .set('Content-Type', 'application/json')
      .send('{"studentId":');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Invalid JSON body',
      errors: [{
        field: 'body',
        message: 'Request body must contain valid JSON'
      }],
      requestId: response.headers['x-request-id']
    });
  });
});

describe('centralized unexpected error handling', () => {
  test('returns HTTP 500 with a request ID without exposing stack details', async () => {
    const errorApp = express();
    errorApp.use(requestId);
    errorApp.get('/controlled-error', (req, res, next) => {
      next(new Error('internal sentinel message'));
    });
    errorApp.use(errorHandler);

    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await request(errorApp).get('/controlled-error');
      const responseText = JSON.stringify(response.body);
      const responseRequestId = response.headers['x-request-id'];

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'An unexpected error occurred'
        },
        requestId: responseRequestId
      });
      expect(responseText).not.toContain('internal sentinel message');
      expect(responseText).not.toContain('stack');
      expect(errorLog).toHaveBeenCalledWith(
        `[${responseRequestId}] Unexpected server error: internal sentinel message`
      );
    } finally {
      errorLog.mockRestore();
    }
  });
});
