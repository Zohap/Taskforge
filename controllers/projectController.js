const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { notifyUser } = require('../utils/notify');
const { ROLES, PROJECT_STATUS, PROJECT_PRIORITY, NOTIFICATION_TYPES } = require('../utils/constants');

// Builds a role-scoped base filter so each role only ever sees what it should
function scopeFilter(user) {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role === ROLES.PROJECT_MANAGER) return { projectManager: user._id };
  return { teamMembers: user._id };
}

exports.canManageProject = (user, project) => {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role !== ROLES.PROJECT_MANAGER || !project.projectManager) return false;

  // projectManager may be a raw ObjectId, or a populated User document/object.
  const pmId = project.projectManager._id
    ? project.projectManager._id.toString()
    : project.projectManager.toString();

  return pmId === user._id.toString();
};

exports.list = catchAsync(async (req, res) => {
  const { q = '', status = '', priority = '', sort = 'newest' } = req.query;
  const filter = { ...scopeFilter(req.user) };
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

  res.render('projects/list', {
    title: 'Projects',
    projects,
    progressMap,
    query: { q, status, priority, sort },
    PROJECT_STATUS,
    PROJECT_PRIORITY,
  });
});

exports.details = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('projectManager', 'name email jobTitle')
    .populate('teamMembers', 'name email jobTitle avatarInitials')
    .populate('createdBy', 'name');
  if (!project) throw new AppError('Project not found', 404);

  // Authorization: team members / PMs can only view projects they belong to
  if (req.user.role === ROLES.PROJECT_MANAGER && (!project.projectManager || project.projectManager._id.toString() !== req.user._id.toString())) {
    throw new AppError('You do not have access to this project.', 403);
  }
  if (req.user.role === ROLES.TEAM_MEMBER && !project.teamMembers.some((m) => m._id.toString() === req.user._id.toString())) {
    throw new AppError('You do not have access to this project.', 403);
  }

  const { status = '', priority = '', assignee = '', sort = 'newest' } = req.query;
  const taskFilter = { project: project._id };
  if (status) taskFilter.status = status;
  if (priority) taskFilter.priority = priority;
  if (assignee) taskFilter.assignedTo = assignee;

  const taskSortMap = { newest: { createdAt: -1 }, deadline: { dueDate: 1 }, priority: { priority: -1 } };
  const tasks = await Task.find(taskFilter).populate('assignedTo', 'name avatarInitials').sort(taskSortMap[sort] || taskSortMap.newest);

  const allTasksUnfiltered = await Task.find({ project: project._id });
  const total = allTasksUnfiltered.length;
  const completed = allTasksUnfiltered.filter((t) => t.status === 'Completed').length;
  const progressPct = total ? Math.round((completed / total) * 100) : 0;

  const availableTeamMembers = await User.find({
    role: ROLES.TEAM_MEMBER,
    isActive: true,
    _id: { $nin: project.teamMembers.map((m) => m._id) },
  }).sort('name');

  res.render('projects/details', {
    title: project.name,
    project,
    tasks,
    progressPct,
    total,
    completed,
    canManage: exports.canManageProject(req.user, project),
    availableTeamMembers,
    query: { status, priority, assignee, sort },
  });
});

exports.addTeamMember = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  if (!exports.canManageProject(req.user, project)) throw new AppError('You cannot manage this project.', 403);

  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user || user.role !== ROLES.TEAM_MEMBER) throw new AppError('Invalid team member selected.', 400);

  if (!project.teamMembers.some((m) => m.toString() === userId)) {
    project.teamMembers.push(userId);
    await project.save();
    await notifyUser({
      user: userId,
      type: NOTIFICATION_TYPES.ADDED_TO_PROJECT,
      message: `You have been added to the project "${project.name}".`,
      link: `/projects/${project._id}`,
    });
  }

  req.flash('success', `${user.name} added to the project.`);
  res.redirect(`/projects/${project._id}`);
});

exports.removeTeamMember = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  if (!exports.canManageProject(req.user, project)) throw new AppError('You cannot manage this project.', 403);

  project.teamMembers = project.teamMembers.filter((m) => m.toString() !== req.params.userId);
  await project.save();

  await Task.updateMany(
    { project: project._id, assignedTo: req.params.userId },
    { $set: { assignedTo: null } }
  );

  await notifyUser({
    user: req.params.userId,
    type: NOTIFICATION_TYPES.REMOVED_FROM_PROJECT,
    message: `You have been removed from the project "${project.name}".`,
    link: `/dashboard`,
  });

  req.flash('success', 'Team member removed from project.');
  res.redirect(`/projects/${project._id}`);
});

exports.updateStatus = catchAsync(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new AppError('Project not found', 404);
  if (!exports.canManageProject(req.user, project)) throw new AppError('You cannot manage this project.', 403);

  const { status } = req.body;
  if (!PROJECT_STATUS.includes(status)) throw new AppError('Invalid status', 400);

  project.status = status;
  await project.save();

  req.flash('success', `Project status updated to "${status}".`);
  res.redirect(`/projects/${project._id}`);
});
