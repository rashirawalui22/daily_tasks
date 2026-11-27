const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

class ClinicRequestError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ClinicRequestError';
    this.status = status;
    this.code = code;
  }
}

function assertPatientId(patientId) {
  if (!mongoose.isObjectIdOrHexString(patientId)) {
    throw new ClinicRequestError(
      'Invalid patient ID',
      400,
      'INVALID_PATIENT_ID'
    );
  }
}

async function createAppointment(appointmentData) {
  assertPatientId(appointmentData.patientId);

  const patientExists = await Patient.exists({ _id: appointmentData.patientId });
  if (!patientExists) {
    throw new ClinicRequestError(
      'Patient not found',
      404,
      'PATIENT_NOT_FOUND'
    );
  }

  return Appointment.create(appointmentData);
}

async function getPatientAppointments(patientId) {
  assertPatientId(patientId);

  const patientExists = await Patient.exists({ _id: patientId });
  if (!patientExists) {
    throw new ClinicRequestError(
      'Patient not found',
      404,
      'PATIENT_NOT_FOUND'
    );
  }

  return Appointment.find({ patientId })
    .sort({ appointmentDate: 1 })
    .populate('patientId', 'fullName')
    .lean();
}

module.exports = {
  createAppointment,
  getPatientAppointments,
  ClinicRequestError
};
