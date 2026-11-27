const express = require('express');
const projectRoutes = require('./routes/projectRoutes');
const quizAttemptRoutes = require('./routes/quizAttemptRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const requestId = require('./middleware/requestId');

const app = express();

app.use(requestId);
app.use(express.json());
app.use('/api/projects', projectRoutes);
app.use('/api/quiz-attempts', quizAttemptRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
