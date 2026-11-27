const { createQuizAttempt } = require('../services/quizAttemptService');

function submitQuizAttempt(req, res, next) {
  try {
    const data = createQuizAttempt(req.body);

    return res.status(201).json({
      success: true,
      message: 'Quiz attempt submitted successfully',
      data,
      requestId: req.requestId
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { submitQuizAttempt };
