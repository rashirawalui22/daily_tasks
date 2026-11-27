const allowedFields = new Set([
  'studentId',
  'courseId',
  'quizId',
  'answers',
  'timeTaken'
]);
const allowedAnswerFields = new Set(['questionId', 'selectedOption']);

class QuizAttemptValidationError extends Error {
  constructor(errors) {
    super('Quiz attempt validation failed');
    this.name = 'QuizAttemptValidationError';
    this.errors = errors;
  }
}

function validateQuizAttempt(req, res, next) {
  const errors = [];
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    errors.push({
      field: 'body',
      message: 'Request body must be a JSON object'
    });
  } else {
    for (const field of Object.keys(body)) {
      if (!allowedFields.has(field)) {
        errors.push({ field: `body.${field}`, message: 'Unexpected field' });
      }
    }

    for (const field of ['studentId', 'courseId', 'quizId']) {
      if (typeof body[field] !== 'string' || body[field].trim() === '') {
        errors.push({
          field,
          message: `${field} must be a non-empty string`
        });
      }
    }

    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      errors.push({
        field: 'answers',
        message: 'answers must be a non-empty array'
      });
    } else {
      body.answers.forEach((answer, index) => {
        const fieldPrefix = `answers.${index}`;
        if (!answer || typeof answer !== 'object' || Array.isArray(answer)) {
          errors.push({
            field: fieldPrefix,
            message: 'Each answer must be an object'
          });
          return;
        }

        for (const field of Object.keys(answer)) {
          if (!allowedAnswerFields.has(field)) {
            errors.push({
              field: `${fieldPrefix}.${field}`,
              message: 'Unexpected field'
            });
          }
        }

        for (const field of allowedAnswerFields) {
          if (typeof answer[field] !== 'string' || answer[field].trim() === '') {
            errors.push({
              field: `${fieldPrefix}.${field}`,
              message: `${field} must be a non-empty string`
            });
          }
        }
      });
    }

    if (!Number.isInteger(body.timeTaken) || body.timeTaken <= 0) {
      errors.push({
        field: 'timeTaken',
        message: 'timeTaken must be a positive integer'
      });
    }
  }

  if (errors.length > 0) {
    return next(new QuizAttemptValidationError(errors));
  }

  return next();
}

module.exports = {
  validateQuizAttempt,
  QuizAttemptValidationError
};
