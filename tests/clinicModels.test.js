const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Appointment = require('../src/models/Appointment');
const Patient = require('../src/models/Patient');
const { createPatient } = require('../src/services/patientService');
const {
  createAppointment,
  getPatientAppointments
} = require('../src/services/appointmentService');

jest.setTimeout(120000);

let mongoServer;

const validPatient = {
  fullName: '  Morgan Patient  ',
  email: '  MORGAN@example.com  ',
  phoneNumber: '+1 (415) 555-0132'
};

const appointmentFor = (patientId, overrides = {}) => ({
  patientId,
  doctorName: 'Dr. Rivera',
  appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
  reason: 'Annual checkup',
  ...overrides
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await Promise.all([Patient.init(), Appointment.init()]);
});

beforeEach(async () => {
  await Promise.all([Patient.deleteMany({}), Appointment.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Clinic MongoDB models', () => {
  test('creates a normalized patient with timestamps', async () => {
    const patient = await createPatient(validPatient);

    expect(patient.fullName).toBe('Morgan Patient');
    expect(patient.email).toBe('morgan@example.com');
    expect(patient.createdAt).toBeInstanceOf(Date);
    expect(patient.updatedAt).toBeInstanceOf(Date);
  });

  test('rejects missing patient fields', async () => {
    await expect(Patient.create({})).rejects.toMatchObject({
      name: 'ValidationError'
    });
    expect(await Patient.countDocuments()).toBe(0);
  });

  test('rejects invalid patient email', async () => {
    await expect(createPatient({
      ...validPatient,
      email: 'not-an-email'
    })).rejects.toMatchObject({ name: 'ValidationError' });
    expect(await Patient.countDocuments()).toBe(0);
  });

  test('rejects duplicate email with a safe, meaningful error', async () => {
    await createPatient(validPatient);

    await expect(createPatient({
      ...validPatient,
      fullName: 'Another Patient'
    })).rejects.toMatchObject({
      name: 'DuplicatePatientEmailError',
      code: 'DUPLICATE_PATIENT_EMAIL',
      status: 409,
      message: 'A patient with this email already exists'
    });
    expect(await Patient.countDocuments()).toBe(1);
  });

  test('creates a valid appointment linked to a patient', async () => {
    const patient = await createPatient(validPatient);
    const appointment = await createAppointment(appointmentFor(patient._id));

    expect(appointment.patientId.toString()).toBe(patient._id.toString());
    expect(appointment.status).toBe('pending');
    expect(appointment.createdAt).toBeInstanceOf(Date);
  });

  test('rejects missing appointment fields', async () => {
    await expect(Appointment.create({})).rejects.toMatchObject({
      name: 'ValidationError'
    });
    expect(await Appointment.countDocuments()).toBe(0);
  });

  test('rejects unsupported status and past appointment dates', async () => {
    const patient = await createPatient(validPatient);

    await expect(Appointment.create(appointmentFor(patient._id, {
      status: 'scheduled'
    }))).rejects.toMatchObject({ name: 'ValidationError' });

    await expect(Appointment.create(appointmentFor(patient._id, {
      appointmentDate: new Date(Date.now() - 60 * 1000)
    }))).rejects.toMatchObject({ name: 'ValidationError' });
    expect(await Appointment.countDocuments()).toBe(0);
  });

  test('rejects an invalid or nonexistent patient reference', async () => {
    await expect(createAppointment(appointmentFor('not-an-object-id')))
      .rejects.toMatchObject({ code: 'INVALID_PATIENT_ID', status: 400 });

    const missingPatientId = new mongoose.Types.ObjectId();
    await expect(createAppointment(appointmentFor(missingPatientId)))
      .rejects.toMatchObject({ code: 'PATIENT_NOT_FOUND', status: 404 });

    await expect(Appointment.create(appointmentFor(missingPatientId)))
      .rejects.toMatchObject({ name: 'ValidationError' });
    expect(await Appointment.countDocuments()).toBe(0);
  });

  test("retrieves a patient's appointments populated and sorted via the compound index", async () => {
    const patient = await createPatient(validPatient);
    const later = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const sooner = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await createAppointment(appointmentFor(patient._id, {
      appointmentDate: later,
      reason: 'Follow-up'
    }));
    await createAppointment(appointmentFor(patient._id, {
      appointmentDate: sooner
    }));

    const appointments = await getPatientAppointments(patient._id.toString());

    expect(appointments).toHaveLength(2);
    expect(appointments[0].appointmentDate.getTime()).toBe(sooner.getTime());
    expect(appointments[1].appointmentDate.getTime()).toBe(later.getTime());
    expect(appointments[0].patientId.fullName).toBe('Morgan Patient');

    const indexedAppointments = await Appointment.find({ patientId: patient._id })
      .sort({ appointmentDate: 1 })
      .hint({ patientId: 1, appointmentDate: 1 });
    expect(indexedAppointments).toHaveLength(2);
  });

  test('defines exactly the requested application indexes', () => {
    expect(Patient.schema.indexes()).toEqual([
      [{ email: 1 }, { unique: true, background: true }]
    ]);
    expect(Appointment.schema.indexes()).toEqual([
      [{ patientId: 1, appointmentDate: 1 }, { background: true }]
    ]);
  });
});
