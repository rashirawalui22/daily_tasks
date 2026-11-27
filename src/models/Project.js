const mongoose = require('mongoose');
const { isHttpUrl } = require('../utils/validation');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  technologies: {
    type: [String],
    required: true,
    validate: {
      validator: (technologies) => technologies.length > 0
        && technologies.every((technology) => technology.trim() !== ''),
      message: 'At least one non-empty technology is required'
    }
  },
  githubUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: isHttpUrl,
      message: 'githubUrl must be a valid HTTP or HTTPS URL'
    }
  },
  liveUrl: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: (value) => value === '' || isHttpUrl(value),
      message: 'liveUrl must be a valid HTTP or HTTPS URL'
    }
  },
  owner: {
    type: String,
    required: true,
    trim: true
  },
  published: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', projectSchema);
