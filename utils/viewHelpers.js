function taskStatusClass(status) {
  const map = { 'To Do': 'stamp-todo', 'In Progress': 'stamp-inprogress', Review: 'stamp-review', Completed: 'stamp-completed' };
  return map[status] || 'stamp-todo';
}

function priorityClass(priority) {
  const map = { Low: 'stamp-low', Medium: 'stamp-medium', High: 'stamp-high', Critical: 'stamp-critical' };
  return map[priority] || 'stamp-low';
}

function projectStatusClass(status) {
  const map = {
    Planning: 'stamp-planning',
    Active: 'stamp-active',
    'On Hold': 'stamp-onhold',
    Completed: 'stamp-completed-p',
    Cancelled: 'stamp-cancelled',
  };
  return map[status] || 'stamp-planning';
}

module.exports = { taskStatusClass, priorityClass, projectStatusClass };
