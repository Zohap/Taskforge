const Task = require('../models/Task');
const catchAsync = require('../utils/catchAsync');
const { TASK_STATUS, TASK_PRIORITY } = require('../utils/constants');

exports.myTasks = catchAsync(async (req, res) => {
  const { q = '', status = '', priority = '', sort = 'deadline' } = req.query;
  const filter = { assignedTo: req.user._id };
  if (q) filter.title = new RegExp(q, 'i');
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const sortMap = {
    deadline: { dueDate: 1 },
    newest: { createdAt: -1 },
    priority: { priority: -1 },
  };

  const tasks = await Task.find(filter).populate('project', 'name status').sort(sortMap[sort] || sortMap.deadline);

  res.render('team/my-tasks', {
    title: 'My Tasks',
    tasks,
    query: { q, status, priority, sort },
    TASK_STATUS,
    TASK_PRIORITY,
  });
});

exports.myProjects = (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  res.redirect(`/projects${qs ? `?${qs}` : ''}`);
};
