const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const task = require('../controllers/taskController');

router.use(requireAuth);

// Nested under project (creation)
router.get('/projects/:projectId/tasks/new', task.newTaskForm);
router.post('/projects/:projectId/tasks', task.taskValidators, task.createTask);

// Direct task routes
router.get('/tasks/:id', task.details);
router.get('/tasks/:id/edit', task.editTaskForm);
router.put('/tasks/:id', task.taskValidators, task.updateTask);
router.delete('/tasks/:id', task.deleteTask);
router.patch('/tasks/:id/status', task.updateStatusValidators, task.updateStatus);
router.post('/tasks/:id/discussion', task.addDiscussion);
router.post('/tasks/:id/attachments', upload.single('attachment'), task.uploadAttachment);

module.exports = router;
