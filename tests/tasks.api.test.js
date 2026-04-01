const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Tasks API', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('POST /tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'New Task', priority: 'high' });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('New Task');
      expect(res.body.priority).toBe('high');
      expect(res.body.status).toBe('todo');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ priority: 'high' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Task', status: 'invalid_status' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const res = await request(app).get('/tasks');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by status', async () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });

      const res = await request(app).get('/tasks?status=todo');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Task 1');
    });

    it('should paginate', async () => {
      for(let i=0; i<5; i++) taskService.create({ title: `Task ${i}` });

      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /tasks/stats', () => {
    it('should return correct stats', async () => {
      taskService.create({ title: 'T1', status: 'todo' });
      taskService.create({ title: 'T2', status: 'done' });

      const res = await request(app).get('/tasks/stats');
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        todo: 1,
        in_progress: 0,
        done: 1,
        overdue: 0
      });
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update a task', async () => {
      const task = taskService.create({ title: 'Old Task' });
      
      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'New Task', status: 'in_progress' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('New Task');
      expect(res.body.status).toBe('in_progress');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .put('/tasks/non-existent')
        .send({ title: 'New Task' });
      
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid priority', async () => {
      const task = taskService.create({ title: 'Old Task' });
      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'Old Task', priority: 'invalid' });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const task = taskService.create({ title: 'Task' });
      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.statusCode).toBe(204);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).delete('/tasks/non-existent');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark a task as complete', async () => {
      const task = taskService.create({ title: 'Task' });
      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).not.toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).patch('/tasks/non-existent/complete');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('should assign a task to a user', async () => {
      const task = taskService.create({ title: 'Task' });
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Alice' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.assignee).toBe('Alice');
    });

    it('should return 400 if assignee is missing or empty', async () => {
      const task = taskService.create({ title: 'Task' });
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 if task is already assigned', async () => {
      const task = taskService.create({ title: 'Task' });
      taskService.assignTask(task.id, 'Alice');
      
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Bob' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Task is already assigned');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent/assign')
        .send({ assignee: 'Alice' });
      expect(res.statusCode).toBe(404);
    });
  });
});
