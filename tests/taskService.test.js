const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    it('creates a task with default values', () => {
      const task = taskService.create({ title: 'Test Task' });
      expect(task).toMatchObject({
        title: 'Test Task',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        completedAt: null
      });
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
    });

    it('creates a task with provided values', () => {
      const dueDate = new Date().toISOString();
      const task = taskService.create({
        title: 'Test',
        description: 'Desc',
        status: 'in_progress',
        priority: 'high',
        dueDate
      });
      expect(task).toMatchObject({
        title: 'Test',
        description: 'Desc',
        status: 'in_progress',
        priority: 'high',
        dueDate
      });
    });
  });

  describe('getAll', () => {
    it('returns all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      const tasks = taskService.getAll();
      expect(tasks).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('finds task by id', () => {
      const task = taskService.create({ title: 'Task 1' });
      const found = taskService.findById(task.id);
      expect(found).toEqual(task);
    });

    it('returns undefined for non-existent id', () => {
      expect(taskService.findById('not-found')).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    it('returns tasks matching exact status', () => {
      taskService.create({ title: 'Task 1', status: 'todo' });
      taskService.create({ title: 'Task 2', status: 'done' });
      
      const todoTasks = taskService.getByStatus('todo');
      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0].status).toBe('todo');
      
      const doTasks = taskService.getByStatus('do');
      expect(doTasks).toHaveLength(0); 
    });
  });

  describe('getPaginated', () => {
    it('returns paginated tasks', () => {
      for(let i=0; i<5; i++) taskService.create({ title: `Task ${i}` });
      
      const page0 = taskService.getPaginated(0, 2);
      expect(page0).toHaveLength(2);
      expect(page0[0].title).toBe('Task 0');
      
      const page2 = taskService.getPaginated(2, 2);
      expect(page2).toHaveLength(1);
      expect(page2[0].title).toBe('Task 4');
    });
  });

  describe('getStats', () => {
    it('returns task stats', () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();
      taskService.create({ title: 'Task 1', status: 'todo', dueDate: pastDate });
      taskService.create({ title: 'Task 2', status: 'in_progress' });
      taskService.create({ title: 'Task 3', status: 'done', dueDate: pastDate });

      const stats = taskService.getStats();
      expect(stats).toEqual({
        todo: 1,
        in_progress: 1,
        done: 1, // Actually wait, task 3 is done, but past dueDate, shouldn't be overdue
        overdue: 1 
      });
    });
  });

  describe('update', () => {
    it('updates a task', () => {
      const task = taskService.create({ title: 'Task 1' });
      const updated = taskService.update(task.id, { title: 'Updated Task', status: 'in_progress' });
      expect(updated.title).toBe('Updated Task');
      expect(updated.status).toBe('in_progress');
      expect(taskService.findById(task.id).title).toBe('Updated Task');
    });

    it('should ignore protected fields like id and createdAt', () => {
      const task = taskService.create({ title: 'Task 1' });
      const updated = taskService.update(task.id, { id: 'new-id', createdAt: '2020-01-01' });
      expect(updated.id).toBe(task.id);
      expect(updated.createdAt).toBe(task.createdAt);
    });

    it('returns null if task not found', () => {
      expect(taskService.update('non-existent', { title: 'New' })).toBeNull();
    });
  });

  describe('remove', () => {
    it('removes a task', () => {
      const task = taskService.create({ title: 'Task 1' });
      const removed = taskService.remove(task.id);
      expect(removed).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('returns false if not found', () => {
      expect(taskService.remove('non-existent')).toBe(false);
    });
  });

  describe('completeTask', () => {
    it('marks a task as done without changing other fields', () => {
      const task = taskService.create({ title: 'Task 1', priority: 'high' });
      const completed = taskService.completeTask(task.id);
      expect(completed.status).toBe('done');
      expect(completed.completedAt).not.toBeNull();
      expect(completed.priority).toBe('high');
    });

    it('returns null if task not found', () => {
      expect(taskService.completeTask('non-existent')).toBeNull();
    });
  });

  describe('assignTask', () => {
    it('assigns a task to a user', () => {
      const task = taskService.create({ title: 'Task 1' });
      const assigned = taskService.assignTask(task.id, 'Alice');
      expect(assigned.assignee).toBe('Alice');
      expect(taskService.findById(task.id).assignee).toBe('Alice');
    });

    it('returns null if task not found', () => {
      expect(taskService.assignTask('non-existent', 'Alice')).toBeNull();
    });

    it('returns error if task already assigned', () => {
      const task = taskService.create({ title: 'Task 1' });
      taskService.assignTask(task.id, 'Alice');
      const result = taskService.assignTask(task.id, 'Bob');
      expect(result).toHaveProperty('error');
    });
  });
});
