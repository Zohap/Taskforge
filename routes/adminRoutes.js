const express = require('express');

const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const admin = require('../controllers/adminController');

router.use(
  requireAuth,
  requireRole(ROLES.ADMIN)
);


// ===============================
// USERS
// ===============================

router.get('/users', admin.listUsers);

router.get('/users/new', admin.newUserForm);

router.post(
  '/users',
  admin.userValidators,
  admin.createUser
);

router.get(
  '/users/:id/edit',
  admin.editUserForm
);

router.put(
  '/users/:id',
  admin.userValidators,
  admin.updateUser
);

router.patch(
  '/users/:id/toggle-active',
  admin.toggleActive
);

router.delete(
  '/users/:id',
  admin.deleteUser
);


// ===============================
// PROJECTS
// ===============================

router.get(
  '/projects',
  admin.listAllProjects
);

router.get(
  '/projects/new',
  admin.newProjectForm
);

router.post(
  '/projects',
  admin.projectValidators,
  admin.createProject
);

router.get(
  '/projects/:id/edit',
  admin.editProjectForm
);

router.put(
  '/projects/:id',
  admin.projectValidators,
  admin.updateProject
);

router.delete(
  '/projects/:id',
  admin.deleteProject
);


module.exports = router;