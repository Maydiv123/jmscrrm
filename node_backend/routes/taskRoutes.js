const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/', taskController.getTasks);
router.get('/mytasks', taskController.getMyTasks);
router.post('/', taskController.createTask);
router.post('/:id/status', taskController.updateTaskStatus);

module.exports = router;