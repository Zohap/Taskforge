const dayjs = require('dayjs');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { notifyUser, notifyMany } = require('./notify');
const { NOTIFICATION_TYPES } = require('./constants');

// Notifies assignees (and the project manager) about tasks due within the next 24 hours.
// Each task is only notified once (tracked via Task.deadlineNotified).
async function checkTaskDeadlines() {
  const windowEnd = dayjs().add(24, 'hour').toDate();
  const now = new Date();

  const dueSoon = await Task.find({
    dueDate: { $gte: now, $lte: windowEnd },
    status: { $ne: 'Completed' },
    deadlineNotified: false,
  }).populate('project', 'name projectManager');

  for (const task of dueSoon) {
    const recipients = [];
    if (task.assignedTo) recipients.push(task.assignedTo);
    if (task.project && task.project.projectManager) recipients.push(task.project.projectManager);

    if (recipients.length) {
      await notifyMany(recipients, {
        type: NOTIFICATION_TYPES.DEADLINE_APPROACHING,
        message: `Task "${task.title}" is due ${dayjs(task.dueDate).format('MMM D, YYYY h:mm A')} — deadline approaching.`,
        link: `/tasks/${task._id}`,
      });
    }
    task.deadlineNotified = true;
    await task.save({ validateBeforeSave: false });
  }

  return dueSoon.length;
}

function startDeadlineChecker(intervalMs = 15 * 60 * 1000) {
  checkTaskDeadlines().catch((err) => console.error('[DeadlineChecker] initial run failed:', err.message));
  setInterval(() => {
    checkTaskDeadlines().catch((err) => console.error('[DeadlineChecker] run failed:', err.message));
  }, intervalMs);
}

module.exports = { checkTaskDeadlines, startDeadlineChecker };
