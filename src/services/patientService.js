const Patient = require('../models/Patient');

class DuplicatePatientEmailError extends Error {
  constructor() {
    super('A patient with this email already exists');
    this.name = 'DuplicatePatientEmailError';
    this.code = 'DUPLICATE_PATIENT_EMAIL';
    this.status = 409;
  }
}

async function createPatient(patientData) {
  try {
    return await Patient.create(patientData);
  } catch (error) {
    if (error.code === 11000
      && ((error.keyPattern && error.keyPattern.email)
        || (error.keyValue && error.keyValue.email))) {
      throw new DuplicatePatientEmailError();
    }

    throw error;
  }
}

module.exports = { createPatient, DuplicatePatientEmailError };
