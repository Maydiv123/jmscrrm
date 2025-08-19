const { Sequelize } = require('sequelize');
const db = require('../config/db');
const Task = require('../models/Task');

class TaskService {
  async getAllTasks() {
    return await db.query(`
      SELECT t.id, t.job_id, t.description, t.priority, t.deadline,
             GROUP_CONCAT(DISTINCT u.username) as assigned_to,
             COALESCE(latest_status.status, 'Assigned') as status
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN users u ON ta.user_id = u.id
      LEFT JOIN (
        SELECT tu1.task_id, tu1.status
        FROM task_updates tu1
        INNER JOIN (
          SELECT task_id, MAX(id) as max_id
          FROM task_updates
          GROUP BY task_id
        ) tu2 ON tu1.task_id = tu2.task_id AND tu1.id = tu2.max_id
      ) latest_status ON t.id = latest_status.task_id
      GROUP BY t.id, t.job_id, t.description, t.priority, t.deadline, latest_status.status
    `, { type: Sequelize.QueryTypes.SELECT });
  }

  async getTasksByUserId(userId) {
    return await db.query(`
      SELECT t.id, t.job_id, t.description, t.priority, t.deadline,
             COALESCE(tu.status, 'Assigned') as status
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN task_updates tu ON t.id = tu.task_id AND tu.user_id = :userId 
        AND tu.id = (SELECT MAX(id) FROM task_updates WHERE task_id = t.id AND user_id = :userId)
      WHERE ta.user_id = :userId
    `, {
      replacements: { userId },
      type: Sequelize.QueryTypes.SELECT
    });
  }

  async createTask(taskData) {
    const task = await Task.create({
      job_id: taskData.job_id,
      description: taskData.description,
      priority: taskData.priority,
      deadline: taskData.deadline
    });

    // Assign task to users
    if (taskData.assigned_to && taskData.assigned_to.length > 0) {
      const assignments = taskData.assigned_to.map(userId => ({
        task_id: task.id,
        user_id: userId
      }));
      await db.query(
        'INSERT INTO task_assignments (task_id, user_id) VALUES ?',
        { replacements: [assignments.map(a => [a.task_id, a.user_id])] }
      );
    }

    return task;
  }

  async updateTaskStatus(taskId, userId, status, comment) {
    await db.query(
      'INSERT INTO task_updates (task_id, user_id, status, comment) VALUES (?, ?, ?, ?)',
      { replacements: [taskId, userId, status, comment] }
    );
    return true;
  }
}

module.exports = new TaskService();