require('dotenv').config();
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { loadUser } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { ROLE_LABELS } = require('./utils/constants');
const dayjs = require('dayjs');

const app = express();

// --- Database ---
connectDB();

// --- View engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// --- Core middleware ---
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  methodOverride((req) => {
    if (req.query && '_method' in req.query) return req.query._method;
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      const method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);
app.use(express.static(path.join(__dirname, 'public')));

// --- Sessions ---
const sessionSecret = process.env.SESSION_SECRET || 'dev_secret_change_me';
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskforge',
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
    },
  })
);

app.use(flash());

// --- Locals available to all views ---
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.ROLE_LABELS = ROLE_LABELS;
  res.locals.dayjs = dayjs;
  res.locals.currentPath = req.path;
  const { taskStatusClass, priorityClass, projectStatusClass } = require('./utils/viewHelpers');
  res.locals.taskStatusClass = taskStatusClass;
  res.locals.priorityClass = priorityClass;
  res.locals.projectStatusClass = projectStatusClass;
  next();
});

app.use(loadUser);

// --- Routes ---
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/dashboardRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/pm', require('./routes/pmRoutes'));
app.use('/team', require('./routes/teamRoutes'));
app.use('/projects', require('./routes/projectRoutes'));
app.use('/', require('./routes/taskRoutes'));
app.use('/notifications', require('./routes/notificationRoutes'));
app.use('/profile', require('./routes/profileRoutes'));

// --- 404 ---
app.use((req, res) => {
  res.status(404).render('errors/error', {
    title: 'Not Found',
    statusCode: 404,
    message: 'The page you are looking for does not exist.',
    layout: false,
  });
});

// --- Global error handler ---
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Server] TaskForge running at http://localhost:${PORT}`);
  // Periodically checks for tasks with approaching deadlines and notifies users
  require('./utils/deadlineChecker').startDeadlineChecker();
});

module.exports = app;
