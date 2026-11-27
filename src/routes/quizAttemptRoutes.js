const express = require('express');
const { submitQuizAttempt } = require('../controllers/quizAttemptController');
const { validateQuizAttempt } = require('../middleware/validateQuizAttempt');

const router = express.Router();

router.post('/', validateQuizAttempt, submitQuizAttempt);

module.exports = router;
