const mongoose = require('mongoose');
const Patient = require('./Patient');

const appointmentStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120
  },
  appointmentDate: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => value > new Date(),
      message: 'Appointment date must be in the future'
    }
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 500
  },
  status: {
    type: String,
    enum: appointmentStatuses,
    default: 'pending',
    required: true
  }
}, {
  timestamps: true
});

appointmentSchema.index({ patientId: 1, appointmentDate: 1 });

appointmentSchema.pre('validate', async function validatePatientReference() {
  if (!this.patientId || this.$isDefault('patientId')) {
    return;
  }

  const patientExists = await Patient.exists({ _id: this.patientId });
  if (!patientExists) {
    this.invalidate('patientId', 'The referenced patient does not exist');
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
