const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Discussion = require('../models/Discussion');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { notifyUser } = require('../utils/notify');
const { canManageProject } = require('./projectController');
const { ROLES, TASK_STATUS, TASK_PRIORITY, NOTIFICATION_TYPES } = require('../utils/constants');

exports.taskValidators = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 150 }),
  body('dueDate').notEmpty().withMessage('Due date is required').isISO8601().withMessage('Invalid due date'),
  body('priority').isIn(TASK_PRIORITY).withMessage('Invalid priority'),
];

exports.newTaskForm = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.projectId).populate('teamMembers', 'name');
  if (!project) throw new AppError('Project not found', 404);
  if (!canManageProject(req.user, project)) throw new AppError('You cannot manage this project.', 403);

  res.render('tasks/form', {
    title: 'Create Task',
    task: {},
    project,
    errors: [],
    formAction: `/projects/${project._id}/tasks`,
    method: 'POST',
    TASK_PRIORITY,
  });
});

exports.createTask = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.projectId).populate('teamMembers', 'name');
  if (!project) throw new AppError('Project not found', 404);
  if (!canManageProject(req.user, project)) throw new AppError('You cannot manage this project.', 403);

  const errors = validationResult(req);
  const { title, description, assignedTo, priority, dueDate } = req.body;

  if (!errors.isEmpty()) {
    return res.status(400).render('tasks/form', {
      title: 'Create Task',
      task: req.body,
      project,
      errors: errors.array(),
      formAction: `/projects/${project._id}/tasks`,
      method: 'POST',
      TASK_PRIORITY,
    });
  }

  const task = await Task.create({
    title,
    description,
    project: project._id,
    assignedTo: assignedTo || null,
    priority,
    dueDate,
    createdBy: req.user._id,
  });

  if (assignedTo) {
    await notifyUser({
      user: assignedTo,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      message: `You were assigned a new task: "${task.title}" in project "${project.name}".`,
      link: `/tasks/${task._id}`,
    });
  }

  req.flash('success', 'Task created successfully.');
  res.redirect(`/projects/${project._id}`);
});

exports.editTaskForm = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new AppError('Task not found', 404);
  if (!canManageProject(req.user, task.project)) throw new AppError('You cannot manage this task.', 403);

  const project = await Project.findById(task.project._id).populate('teamMembers', 'name');

  res.render('tasks/form', {
    title: 'Edit Task',
    task,
    project,
    errors: [],
    formAction: `/tasks/${task._id}?_method=PUT`,
    method: 'POST',
    TASK_PRIORITY,
  });
});

exports.updateTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new AppError('Task not found', 404);
  if (!canManageProject(req.user, task.project)) throw new AppError('You cannot manage this task.', 403);

  const errors = validationResult(req);
  const { title, description, assignedTo, priority, dueDate } = req.body;

  if (!errors.isEmpty()) {
    const project = await Project.findById(task.project._id).populate('teamMembers', 'name');
    return res.status(400).render('tasks/form', {
      title: 'Edit Task',
      task: { ...req.body, _id: task._id },
      project,
      errors: errors.array(),
      formAction: `/tasks/${task._id}?_method=PUT`,
      method: 'POST',
      TASK_PRIORITY,
    });
  }

  const previousAssignee = task.assignedTo ? task.assignedTo.toString() : null;

  task.title = title;
  task.description = description;
  task.assignedTo = assignedTo || null;
  task.priority = priority;
  task.dueDate = dueDate;
  task.deadlineNotified = false;
  await task.save();

  if (assignedTo && assignedTo !== previousAssignee) {
    await notifyUser({
      user: assignedTo,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      message: `You were assigned to task: "${task.title}" in project "${task.project.name}".`,
      link: `/tasks/${task._id}`,
    });
  }

  req.flash('success', 'Task updated successfully.');
  res.redirect(`/projects/${task.project._id}`);
});

exports.deleteTask = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new AppError('Task not found', 404);
  if (!canManageProject(req.user, task.project)) throw new AppError('You cannot manage this task.', 403);

  const projectId = task.project._id;
  await Discussion.deleteMany({ task: task._id });
  await task.deleteOne();

  req.flash('success', 'Task deleted successfully.');
  res.redirect(`/projects/${projectId}`);
});

exports.details = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('project')
    .populate('assignedTo', 'name email avatarInitials')
    .populate('createdBy', 'name');
  if (!task) throw new AppError('Task not found', 404);

  const project = await Project.findById(task.project._id).populate('teamMembers', 'name').populate('projectManager', 'name');

  // Authorization
  const isManager = canManageProject(req.user, task.project);
  const isAssignee = task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString();
  const isTeamMember = project.teamMembers.some((m) => m._id.toString() === req.user._id.toString());
  if (!isManager && !isAssignee && !isTeamMember) {
    throw new AppError('You do not have access to this task.', 403);
  }

  const discussions = await Discussion.find({ task: task._id }).populate('author', 'name avatarInitials role').sort({ createdAt: 1 });

  res.render('tasks/details', {
    title: task.title,
    task,
    project,
    discussions,
    canManage: isManager,
    canUpdateStatus: isManager || isAssignee,
    TASK_STATUS,
  });
});

exports.updateStatusValidators = [body('status').isIn(TASK_STATUS).withMessage('Invalid status')];

exports.updateStatus = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new AppError('Task not found', 404);

  const isManager = canManageProject(req.user, task.project);
  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
  if (!isManager && !isAssignee) throw new AppError('You cannot update this task.', 403);

  const { status } = req.body;
  if (!TASK_STATUS.includes(status)) throw new AppError('Invalid status', 400);

  task.status = status;
  await task.save();

  // Notify the project manager (if the change came from the assignee) and the assignee (if changed by PM)
  const notifyTargets = new Set();
  if (task.project.projectManager) notifyTargets.add(task.project.projectManager.toString());
  if (task.assignedTo) notifyTargets.add(task.assignedTo.toString());
  notifyTargets.delete(req.user._id.toString());

  await Promise.all(
    [...notifyTargets].map((uid) =>
      notifyUser({
        user: uid,
        type: NOTIFICATION_TYPES.STATUS_UPDATED,
        message: `Task "${task.title}" status changed to "${status}" by ${req.user.name}.`,
        link: `/tasks/${task._id}`,
      })
    )
  );

  req.flash('success', `Task status updated to "${status}".`);
  res.redirect(req.get('referer') || `/tasks/${task._id}`);
});

exports.addDiscussion = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new AppError('Task not found', 404);

  const project = await Project.findById(task.project._id);
  const isManager = canManageProject(req.user, task.project);
  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
  const isTeamMember = project.teamMembers.some((m) => m.toString() === req.user._id.toString());
  if (!isManager && !isAssignee && !isTeamMember) throw new AppError('You cannot comment on this task.', 403);

  const { message } = req.body;
  if (!message || !message.trim()) throw new AppError('Message cannot be empty.', 400);

  await Discussion.create({ task: task._id, author: req.user._id, message: message.trim() });

  const notifyTargets = new Set();
  if (task.project.projectManager) notifyTargets.add(task.project.projectManager.toString());
  if (task.assignedTo) notifyTargets.add(task.assignedTo.toString());
  notifyTargets.delete(req.user._id.toString());

  await Promise.all(
    [...notifyTargets].map((uid) =>
      notifyUser({
        user: uid,
        type: NOTIFICATION_TYPES.DISCUSSION_ADDED,
        message: `${req.user.name} commented on task "${task.title}".`,
        link: `/tasks/${task._id}`,
      })
    )
  );

  req.flash('success', 'Comment added.');
  res.redirect(`/tasks/${task._id}`);
});

exports.uploadAttachment = catchAsync(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new AppError('Task not found', 404);

  const project = await Project.findById(task.project._id);
  const isManager = canManageProject(req.user, task.project);
  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
  if (!isManager && !isAssignee) throw new AppError('You cannot attach files to this task.', 403);

  if (!req.file) throw new AppError('No file uploaded.', 400);

  task.attachments.push({
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id,
  });
  await task.save();

  req.flash('success', 'File attached successfully.');
  res.redirect(`/tasks/${task._id}`);
});
