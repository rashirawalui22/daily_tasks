const mongoose = require('mongoose');
const { isValidEmail } = require('../utils/validation');

const patientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    validate: {
      validator: isValidEmail,
      message: 'Enter a valid email address'
    }
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    maxlength: 20,
    validate: {
      validator: (value) => /^\+?[0-9().\-\s]+$/.test(value)
        && (value.match(/\d/g) || []).length >= 7,
      message: 'Enter a valid phone number'
    }
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: (value) => value === undefined || value <= new Date(),
      message: 'Date of birth cannot be in the future'
    }
  }
}, {
  timestamps: true
});

patientSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Patient', patientSchema);
