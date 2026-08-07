# TaskForge — Project Management & Team Collaboration Platform

TaskForge is a full-stack, server-rendered project management and team collaboration platform built with **Express, EJS, Bootstrap 5, and MongoDB**. It provides three role-based portals — **Administrator**, **Project Manager**, and **Team Member** — for planning projects, assigning tasks, and tracking progress from a single application.

## Tech Stack

- **Backend:** Node.js + Express.js
- **Views:** EJS templates + `express-ejs-layouts`, styled with Bootstrap 5 + a custom design system
- **Database:** MongoDB with Mongoose ODM
- **Auth:** Session-based authentication (`express-session` + `connect-mongo`), bcrypt password hashing
- **Other:** `express-validator` (validation), `multer` (file attachments), `connect-flash` (flash messages), `method-override` (PUT/DELETE from HTML forms), `dayjs` (dates)

## Features

- **Role-based access control** — Administrator, Project Manager, Team Member, each with a distinct portal and permissions enforced at the route/controller level (not just hidden UI).
- **Admin Portal** — full user management (create/edit/deactivate/delete, role assignment), full project management (create/edit/delete), assigning a Project Manager to each project, and organization-wide monitoring.
- **Project Manager Portal** — view/manage only assigned projects, add/remove team members, create and assign tasks, set priority/deadlines, monitor task progress.
- **Team Member Portal** — view assigned projects/tasks, update task status (`To Do → In Progress → Review → Completed`), participate in task discussions, manage own profile.
- **Task Discussions** — per-task comment thread for project-related communication.
- **Notifications** — in-app notifications for task assignment, status changes, new discussion comments, and approaching deadlines (checked by a background job every 15 minutes).
- **File Attachments** — upload supporting files to a task.
- **Search, filter, and sort** on Users, Projects, and Tasks throughout the app.
- **Form validation, error handling, and flash messages** across the app.
- **Responsive UI** — usable on desktop, tablet, and mobile (collapsible sidebar).

## Project Structure

```
pm-platform/
├── app.js                 # App entry point
├── config/db.js           # MongoDB connection
├── models/                # Mongoose schemas (User, Project, Task, Discussion, Notification)
├── middleware/             # auth, upload (multer), error handler
├── controllers/            # Business logic per domain
├── routes/                 # Express routers
├── views/                  # EJS templates (layouts, partials, per-portal pages)
├── public/                 # Static assets (css, js, uploads)
├── seed/seed.js            # Creates the first Administrator account
└── utils/                  # Helpers (constants, notify, deadline checker, etc.)
```

## Getting Started

### 1. Prerequisites
- Node.js 18+
- A running MongoDB instance (local install, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in your own values:
```bash
cp .env.example .env
```
```
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/taskforge
SESSION_SECRET=change_this_to_a_long_random_string

# Used only by the seed script to create the first Admin account
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@taskforge.com
ADMIN_PASSWORD=Admin@12345
```

### 4. Seed the first Administrator account
There is no public registration — accounts are created by the Administrator from the Admin Portal. Run the seed script once to create the very first admin login:
```bash
npm run seed
```
This creates an Administrator account using the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env` file.

### 5. Run the app
```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start
```
Visit **http://localhost:3000** and log in with the admin credentials from step 4.

## Using the App

1. **Log in as Admin** → go to *Manage Users* to create Project Managers and Team Members, and *Manage Projects* to create a project and assign a Project Manager to it.
2. **Log in as that Project Manager** → open the project from *My Projects*, add Team Members to it, then create tasks and assign them to team members with a priority and due date.
3. **Log in as a Team Member** → see assigned projects/tasks on the dashboard or *My Tasks*, open a task to update its status, attach files, or leave a comment in the Task Discussion.
4. Notifications appear in the bell icon and the *Notifications* page whenever a task is assigned, a status changes, a comment is added, or a deadline is approaching.

## Notes on Design Decisions

- **Server-rendered architecture**: All pages are rendered on the server with EJS (no separate frontend build step), which keeps the codebase simple, fast to load, and easy to reason about for a role-gated internal tool like this.
- **Shared, role-scoped controllers**: Rather than duplicating a "Projects" page three times, `/projects` and `/tasks` are shared routes whose queries and permissions are scoped by `req.user.role` in the controller layer. This keeps business logic (like "a PM can only manage a project they're assigned to") centralized and consistent, while each portal still gets its own dashboard and nav entry points.
- **Deadline notifications**: implemented via a lightweight in-process interval (checks every 15 minutes) rather than a separate cron service, to keep local setup to a single `npm start`.

## Future Enhancements (Bonus Ideas Not Yet Implemented)

- Real-time updates via Socket.io (currently notifications are polled on page load)
- Calendar view of tasks/deadlines
- Activity timeline per project
- Email notifications
- Dark/light theme toggle
