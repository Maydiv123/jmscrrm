const taskService = require('../services/taskService');
const userService = require('../services/userService');

exports.getAllTasks  = async (req, res) => {
  try {
if (!req.session.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const tasks = await taskService.getTasksByUserId(req.session.userId);
    res.json(tasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.createTask = async (req, res) => {
  try {
    if (!req.session.isAdmin && !(await userService.isAdminOrSubadmin(req.session.userId))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { job_id, description, priority, deadline, assigned_to } = req.body;
    const task = await taskService.createTask({
      job_id,
      description,
      priority,
      deadline,
      assigned_to
    });

    res.json({ success: true, task_id: task.id });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const taskId = req.params.id;
    const { status, comment } = req.body;
    await taskService.updateTaskStatus(taskId, req.session.userId, status, comment);

    res.json({ success: true });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};