const express = require('express');
const {
  createProject,
  getAllProjects,
  getProjectById,
  submitFeedback
} = require('../controllers/projectController');

const router = express.Router();

router.post('/', createProject);
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/:id/feedback', submitFeedback);

module.exports = router;
