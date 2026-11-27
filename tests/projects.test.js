const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Project = require('../src/models/Project');
const Feedback = require('../src/models/Feedback');

jest.setTimeout(120000);

let mongoServer;
let project;

const projectInput = {
  title: 'Portfolio API',
  description: 'A project showcase built for a course.',
  technologies: ['Node.js', 'Express', 'MongoDB'],
  githubUrl: 'https://github.com/example/portfolio-api',
  liveUrl: 'https://portfolio.example.com',
  owner: 'Alex Student'
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Promise.all([Project.deleteMany({}), Feedback.deleteMany({})]);
  project = await Project.create(projectInput);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Project API', () => {
  test('POST /api/projects creates a project with status 201', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ ...projectInput, title: 'New project' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBeTruthy();
    expect(response.body.data.title).toBe('New project');
  });

  test('GET /api/projects returns published projects with status 200', async () => {
    const response = await request(app).get('/api/projects');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]._id).toBe(project.id);
  });

  test('GET /api/projects/:id returns project details and feedback', async () => {
    await Feedback.create({
      project: project.id,
      name: 'Taylor Visitor',
      email: 'taylor@example.com',
      rating: 5,
      comment: 'Great work!'
    });

    const response = await request(app).get(`/api/projects/${project.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data._id).toBe(project.id);
    expect(response.body.data.feedback).toHaveLength(1);
    expect(response.body.data.feedback[0].rating).toBe(5);
  });

  test('POST /api/projects/:id/feedback creates feedback with status 201', async () => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/feedback`)
      .send({
        name: 'Taylor Visitor',
        email: 'taylor@example.com',
        rating: 4,
        comment: 'Clear and useful project.'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.project).toBe(project.id);
    expect(await Feedback.countDocuments({ project: project.id })).toBe(1);
  });

  test('returns the specified 404 and creates no feedback for a missing project', async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .post(`/api/projects/${missingId}/feedback`)
      .send({
        name: 'Taylor Visitor',
        email: 'taylor@example.com',
        rating: 4,
        comment: 'This must not be stored.'
      });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Project not found',
      error: {
        code: 'PROJECT_NOT_FOUND',
        details: 'No project exists with the supplied ID'
      }
    });
    expect(await Feedback.countDocuments()).toBe(0);
  });

  test('returns 404 for a malformed project ID', async () => {
    const response = await request(app).get('/api/projects/not-an-object-id');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('INVALID_PROJECT_ID');
  });

  test.each([
    [{ name: 'Visitor', email: 'not-an-email', rating: 4, comment: 'Hello' }],
    [{ name: 'Visitor', email: 'visitor@example.com', rating: 6, comment: 'Hello' }],
    [{ name: 'Visitor', email: 'visitor@example.com', rating: 4, comment: 'x'.repeat(501) }],
    [{ name: '', email: 'visitor@example.com', rating: 4, comment: 'Hello' }]
  ])('rejects invalid feedback with status 400 and saves nothing', async (body) => {
    const response = await request(app)
      .post(`/api/projects/${project.id}/feedback`)
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(await Feedback.countDocuments()).toBe(0);
  });

  test('rejects missing project fields and invalid URLs without creating a project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ ...projectInput, title: '', githubUrl: 'ftp://invalid.example.com' });

    expect(response.status).toBe(400);
    expect(await Project.countDocuments()).toBe(1);
  });

  test('returns an empty array when there are no published projects', async () => {
    await Project.deleteMany({});
    const response = await request(app).get('/api/projects');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});
