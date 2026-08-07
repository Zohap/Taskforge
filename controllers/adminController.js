const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { notifyUser } = require('../utils/notify');
const { ROLES, PROJECT_STATUS, PROJECT_PRIORITY, NOTIFICATION_TYPES } = require('../utils/constants');

// ---------- USER MANAGEMENT ----------

exports.listUsers = catchAsync(async (req, res) => {
  const { q = '', role = '', status = '', sort = 'newest' } = req.query;
  const filter = {};

  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { name: 1 },
    name_desc: { name: -1 },
  };

  const users = await User.find(filter).sort(sortMap[sort] || sortMap.newest);

  res.render('admin/users/list', {
    title: 'Manage Users',
    users,
    query: { q, role, status, sort },
  });
});

exports.newUserForm = (req, res) => {
  res.render('admin/users/form', { title: 'Create User', user: {}, errors: [], formAction: '/admin/users', method: 'POST' });
};

exports.userValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').isIn(Object.values(ROLES)).withMessage('Invalid role'),
];

exports.createUser = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  const { name, email, role, jobTitle, phone, password } = req.body;

  if (!password || password.length < 6) {
    errors.errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (!errors.isEmpty()) {
    return res.status(400).render('admin/users/form', {
      title: 'Create User',
      user: req.body,
      errors: errors.array(),
      formAction: '/admin/users',
      method: 'POST',
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).render('admin/users/form', {
      title: 'Create User',
      user: req.body,
      errors: [{ msg: 'A user with that email already exists.' }],
      formAction: '/admin/users',
      method: 'POST',
    });
  }

  await User.create({ name, email, role, jobTitle, phone, password });
  req.flash('success', `User "${name}" created successfully.`);
  res.redirect('/admin/users');
});

exports.editUserForm = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.render('admin/users/form', {
    title: 'Edit User',
    user,
    errors: [],
    formAction: `/admin/users/${user._id}?_method=PUT`,
    method: 'POST',
  });
});

exports.updateUser = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  const { name, email, role, jobTitle, phone, password } = req.body;

  if (!errors.isEmpty()) {
    return res.status(400).render('admin/users/form', {
      title: 'Edit User',
      user: { ...req.body, _id: req.params.id },
      errors: errors.array(),
      formAction: `/admin/users/${req.params.id}?_method=PUT`,
      method: 'POST',
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  user.name = name;
  user.email = email;
  user.role = role;
  user.jobTitle = jobTitle;
  user.phone = phone;
  if (password && password.trim()) user.password = password;

  await user.save();
  req.flash('success', 'User updated successfully.');
  res.redirect('/admin/users');
});

exports.toggleActive = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  req.flash('success', `${user.name} is now ${user.isActive ? 'active' : 'deactivated'}.`);
  res.redirect('/admin/users');
});

exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (user.role === ROLES.PROJECT_MANAGER) {
    await Project.updateMany({ projectManager: user._id }, { $set: { projectManager: null } });
  }
  await Project.updateMany({ teamMembers: user._id }, { $pull: { teamMembers: user._id } });
  await Task.updateMany({ assignedTo: user._id }, { $set: { assignedTo: null } });
  await user.deleteOne();

  req.flash('success', 'User deleted successfully.');
  res.redirect('/admin/users');
});

// ---------- PROJECT MANAGEMENT (admin creates & assigns PM) ----------

exports.newProjectForm = catchAsync(async (req, res) => {
  const managers = await User.find({ role: ROLES.PROJECT_MANAGER, isActive: true }).sort('name');
  res.render('admin/projects/form', {
    title: 'Create Project',
    project: {},
    managers,
    errors: [],
    formAction: '/admin/projects',
    method: 'POST',
    PROJECT_STATUS,
    PROJECT_PRIORITY,
  });
});

exports.projectValidators = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 120 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid start date'),
  body('endDate').notEmpty().withMessage('End date is required').isISO8601().withMessage('Invalid end date'),
  body('priority').isIn(PROJECT_PRIORITY).withMessage('Invalid priority'),
  body('status').isIn(PROJECT_STATUS).withMessage('Invalid status'),
];

exports.createProject = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  const { name, description, startDate, endDate, priority, status, projectManager } = req.body;

  if (new Date(endDate) < new Date(startDate)) {
    errors.errors.push({ msg: 'End date must be after the start date.' });
  }

  if (!errors.isEmpty()) {
    const managers = await User.find({ role: ROLES.PROJECT_MANAGER, isActive: true }).sort('name');
    return res.status(400).render('admin/projects/form', {
      title: 'Create Project',
      project: req.body,
      managers,
      errors: errors.array(),
      formAction: '/admin/projects',
      method: 'POST',
      PROJECT_STATUS,
      PROJECT_PRIORITY,
    });
  }

  const project = await Project.create({
    name,
    description,
    startDate,
    endDate,
    priority,
    status,
    projectManager: projectManager || null,
    createdBy: req.user._id,
  });

  if (projectManager) {
    await notifyUser({
      user: projectManager,
      type: NOTIFICATION_TYPES.PROJECT_ASSIGNED,
      message: `You have been assigned as Project Manager for "${project.name}".`,
      link: `/projects/${project._id}`,
    });
  }

  req.flash('success', `Project "${name}" created successfully.`);
  res.redirect('/admin/projects');
});

exports.listAllProjects = catchAsync(async (req, res) => {
  const { q = '', status = '', priority = '', sort = 'newest' } = req.query;
  const filter = {};
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    name_asc: { name: 1 },
    deadline: { endDate: 1 },
  };

  const projects = await Project.find(filter)
    .populate('projectManager', 'name email')
    .populate('teamMembers', 'name')
    .sort(sortMap[sort] || sortMap.newest);

  const projectIds = projects.map((p) => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const progressMap = {};
  projectIds.forEach((id) => (progressMap[id] = { total: 0, completed: 0 }));
  taskCounts.forEach((row) => {
    const pid = row._id.project.toString();
    progressMap[pid].total += row.count;
    if (row._id.status === 'Completed') progressMap[pid].completed += row.count;
  });

  res.render('admin/projects/list', {
    title: 'Manage Projects',
    projects,
    progressMap,
    query: { q, status, priority, sort },
    PROJECT_STATUS,
    PROJECT_PRIORITY,
  });
});

exports.editProjectForm = catchAsync(async (req, res) => {
  const [project, managers] = await Promise.all([
    Project.findById(req.params.id),
    User.find({ role: ROLES.PROJECT_MANAGER, isActive: true }).sort('name'),
  ]);
  if (!project) throw new AppError('Project not found', 404);

  res.render('admin/projects/form', {
    title: 'Edit Project',
    project,
    managers,
    errors: [],
    formAction: `/admin/projects/${project._id}?_method=PUT`,
    method: 'POST',
    PROJECT_STATUS,
    PROJECT_PRIORITY,
  });
});

exports.updateProject = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  const { name, description, startDate, endDate, priority, status, projectManager } = req.body;

  if (new Date(endDate) < new Date(startDate)) {
    errors.errors.push({ msg: 'End date must be after the start date.' });
  }

  if (!errors.isEmpty()) {
    const managers = await User.find({ role: ROLES.PROJECT_MANAGER, isActive: true }).sort('name');
    return res.status(400).render('admin/projects/form', {
      title: 'Edit Project',
      project: { ...req.body, _id: req.params.id },
      managers,
      errors: errors.array(),
      formAction: `/admin/projects/${req.params.id}?_method=PUT`,
      method: 'POST',
      PROJECT_STATUS,
      PROJECT_PRIORITY,
    });
  }

  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);

  const previousManager = project.projectManager ? project.projectManager.toString() : null;

  project.name = name;
  project.description = description;
  project.startDate = startDate;
  project.endDate = endDate;
  project.priority = priority;
  project.status = status;
  project.projectManager = projectManager || null;
  await project.save();

  if (projectManager && projectManager !== previousManager) {
    await notifyUser({
      user: projectManager,
      type: NOTIFICATION_TYPES.PROJECT_ASSIGNED,
      message: `You have been assigned as Project Manager for "${project.name}".`,
      link: `/projects/${project._id}`,
    });
  }

  req.flash('success', 'Project updated successfully.');
  res.redirect('/admin/projects');
});

exports.deleteProject = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  req.flash('success', 'Project and its tasks were deleted.');
  res.redirect('/admin/projects');
});
