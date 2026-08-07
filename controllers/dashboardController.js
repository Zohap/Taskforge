const dayjs = require('dayjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const catchAsync = require('../utils/catchAsync');
const { ROLES } = require('../utils/constants');

exports.dashboard = catchAsync(async (req, res) => {
  const user = req.user;
  const soon = dayjs().add(3, 'day').toDate();
  const now = new Date();

  if (user.role === ROLES.ADMIN) {
    const [totalUsers, totalProjects, activeProjects, totalTasks, completedTasks, overdueProjects, recentProjects] =
      await Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        Project.countDocuments({ status: 'Active' }),
        Task.countDocuments(),
        Task.countDocuments({ status: 'Completed' }),
        Project.countDocuments({ endDate: { $lt: now }, status: { $ne: 'Completed' } }),
        Project.find().populate('projectManager', 'name').sort({ createdAt: -1 }).limit(6),
      ]);

    return res.render('admin/dashboard', {
      title: 'Administrator Dashboard',
      stats: { totalUsers, totalProjects, activeProjects, totalTasks, completedTasks, overdueProjects },
      recentProjects,
    });
  }

  if (user.role === ROLES.PROJECT_MANAGER) {
    const myProjects = await Project.find({ projectManager: user._id }).sort({ createdAt: -1 });
    const projectIds = myProjects.map((p) => p._id);

    const [totalTasks, pendingTasks, completedTasks, upcomingDeadlines] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'Completed' } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'Completed' }),
      Task.find({ project: { $in: projectIds }, dueDate: { $lte: soon, $gte: now }, status: { $ne: 'Completed' } })
        .populate('project', 'name')
        .populate('assignedTo', 'name')
        .sort({ dueDate: 1 })
        .limit(8),
    ]);

    return res.render('pm/dashboard', {
      title: 'Project Manager Dashboard',
      stats: {
        activeProjects: myProjects.filter((p) => p.status === 'Active').length,
        totalProjects: myProjects.length,
        totalTasks,
        pendingTasks,
        completedTasks,
      },
      myProjects: myProjects.slice(0, 6),
      upcomingDeadlines,
    });
  }

  // Team member
  const myTasks = await Task.find({ assignedTo: user._id }).populate('project', 'name');
  const myProjects = await Project.find({ teamMembers: user._id }).sort({ createdAt: -1 });
  const upcomingDeadlines = myTasks
    .filter((t) => t.status !== 'Completed' && t.dueDate <= soon && t.dueDate >= now)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 8);

  res.render('team/dashboard', {
    title: 'My Dashboard',
    stats: {
      assignedProjects: myProjects.length,
      assignedTasks: myTasks.length,
      pendingTasks: myTasks.filter((t) => t.status !== 'Completed').length,
      completedTasks: myTasks.filter((t) => t.status === 'Completed').length,
    },
    myProjects: myProjects.slice(0, 6),
    upcomingDeadlines,
  });
});
