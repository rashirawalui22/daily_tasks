const { randomUUID } = require('crypto');

const quizAttempts = new Map();

function createQuizAttempt(input) {
  const attemptId = randomUUID();
  quizAttempts.set(attemptId, {
    attemptId,
    studentId: input.studentId,
    courseId: input.courseId,
    quizId: input.quizId,
    answers: input.answers.map((answer) => ({ ...answer })),
    timeTaken: input.timeTaken,
    submittedAt: new Date()
  });

  return {
    attemptId,
    studentId: input.studentId,
    courseId: input.courseId,
    quizId: input.quizId,
    totalQuestions: input.answers.length,
    timeTaken: input.timeTaken
  };
}

module.exports = { createQuizAttempt };
