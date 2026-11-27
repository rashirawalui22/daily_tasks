const mongoose = require('mongoose');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');
const {
  validateFeedbackInput,
  validateProjectInput
} = require('../utils/validation');

function sendError(res, status, message, code, details) {
  return res.status(status).json({
    success: false,
    message,
    error: { code, details },
    requestId: res.getHeader('X-Request-ID') || null
  });
}

function validateObjectId(id, res) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    sendError(
      res,
      404,
      'Invalid project ID',
      'INVALID_PROJECT_ID',
      'The supplied ID is not a valid MongoDB ObjectId'
    );
    return false;
  }

  return true;
}

async function createProject(req, res, next) {
  const errors = validateProjectInput(req.body);
  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR', errors);
  }

  try {
    const project = await Project.create({
      title: req.body.title,
      description: req.body.description,
      technologies: req.body.technologies,
      githubUrl: req.body.githubUrl,
      liveUrl: req.body.liveUrl || '',
      owner: req.body.owner
    });

    return res.status(201).json({ success: true, data: project });
  } catch (error) {
    return next(error);
  }
}

async function getAllProjects(req, res, next) {
  try {
    const projects = await Project.find({ published: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: projects });
  } catch (error) {
    return next(error);
  }
}

async function getProjectById(req, res, next) {
  if (!validateObjectId(req.params.id, res)) {
    return undefined;
  }

  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return sendError(
        res,
        404,
        'Project not found',
        'PROJECT_NOT_FOUND',
        'No project exists with the supplied ID'
      );
    }

    const feedback = await Feedback.find({ project: project._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: { ...project, feedback }
    });
  } catch (error) {
    return next(error);
  }
}

async function submitFeedback(req, res, next) {
  if (!validateObjectId(req.params.id, res)) {
    return undefined;
  }

  try {
    const project = await Project.findById(req.params.id).select('_id');
    if (!project) {
      return sendError(
        res,
        404,
        'Project not found',
        'PROJECT_NOT_FOUND',
        'No project exists with the supplied ID'
      );
    }

    const errors = validateFeedbackInput(req.body);
    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR', errors);
    }

    const feedback = await Feedback.create({
      project: project._id,
      name: req.body.name,
      email: req.body.email,
      rating: Number(req.body.rating),
      comment: req.body.comment
    });

    return res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  submitFeedback
};
