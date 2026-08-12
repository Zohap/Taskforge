const Task = require('../models/Task');
const Project = require('../models/Project');
const catchAsync = require('../utils/catchAsync');
const { ROLES } = require('../utils/constants');

exports.index = catchAsync(async (req, res) => {
  const user = req.user;

  let taskFilter = {};
  let projectFilter = {};

  // ==============================
  // ADMIN
  // ==============================
  if (user.role === ROLES.ADMIN) {
    taskFilter = {};
    projectFilter = {};
  }

  // ==============================
  // PROJECT MANAGER
  // ==============================
  else if (user.role === ROLES.PROJECT_MANAGER) {
    const projects = await Project.find({
      projectManager: user._id,
    }).select('_id');

    const projectIds = projects.map((project) => project._id);

    taskFilter = {
      project: { $in: projectIds },
    };

    projectFilter = {
      _id: { $in: projectIds },
    };
  }

  // ==============================
  // TEAM MEMBER
  // ==============================
  else if (user.role === ROLES.TEAM_MEMBER) {
    const projects = await Project.find({
      teamMembers: user._id,
    }).select('_id');

    const projectIds = projects.map((project) => project._id);

    taskFilter = {
      assignedTo: user._id,
    };

    projectFilter = {
      _id: { $in: projectIds },
    };
  }

  // ==============================
  // TASKS
  // ==============================

  const tasks = await Task.find({
    ...taskFilter,
    dueDate: { $exists: true, $ne: null },
  })
    .populate('project', 'name')
    .populate('assignedTo', 'name')
    .sort({ dueDate: 1 });

  // ==============================
  // PROJECT DEADLINES
  // ==============================

  const projects = await Project.find({
    ...projectFilter,
    endDate: { $exists: true, $ne: null },
  })
    .select('name endDate status')
    .sort({ endDate: 1 });

  // ==============================
  // CALENDAR EVENTS
  // ==============================

  const events = [];

  // Task events
  tasks.forEach((task) => {
    events.push({
      id: `task-${task._id}`,
      title: `Task: ${task.title}`,
      start: task.dueDate,
      url: `/tasks/${task._id}`,
      type: 'task',
      project: task.project ? task.project.name : '',
      status: task.status,
      priority: task.priority,
    });
  });

  // Project deadline events
  projects.forEach((project) => {
    events.push({
      id: `project-${project._id}`,
      title: `Project: ${project.name}`,
      start: project.endDate,
      url: `/projects/${project._id}`,
      type: 'project',
      status: project.status,
    });
  });

  res.render('calendar/index', {
    title: 'Calendar',
    events,
  });
});