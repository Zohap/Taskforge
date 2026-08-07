module.exports = {
  ROLES: {
    ADMIN: 'admin',
    PROJECT_MANAGER: 'project_manager',
    TEAM_MEMBER: 'team_member',
  },
  ROLE_LABELS: {
    admin: 'Administrator',
    project_manager: 'Project Manager',
    team_member: 'Team Member',
  },
  PROJECT_STATUS: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
  PROJECT_PRIORITY: ['Low', 'Medium', 'High', 'Critical'],
  TASK_STATUS: ['To Do', 'In Progress', 'Review', 'Completed'],
  TASK_PRIORITY: ['Low', 'Medium', 'High', 'Critical'],
  NOTIFICATION_TYPES: {
    TASK_ASSIGNED: 'task_assigned',
    STATUS_UPDATED: 'status_updated',
    DISCUSSION_ADDED: 'discussion_added',
    DEADLINE_APPROACHING: 'deadline_approaching',
    PROJECT_ASSIGNED: 'project_assigned',
    ADDED_TO_PROJECT: 'added_to_project',
    REMOVED_FROM_PROJECT: 'removed_from_project',
  },
};
