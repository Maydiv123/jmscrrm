require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const fileRoutes = require('./routes/fileRoutes');
const debugRoutes = require('./routes/debugRoutes');

const app = express();

// Verify session secret is set
if (!process.env.SESSION_SECRET) {
  console.error('FATAL ERROR: SESSION_SECRET is not defined.');
  process.exit(1);
}
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}
// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_KEY || 'default-session-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax'
  }
}));



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/debug', debugRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: "Test endpoint working" });
});

const PORT = process.env.PORT || 8080;
async function startServer() {
  await testConnection();
  
  // Sync database (set force: true only in development to drop and recreate tables)
  await sequelize.sync({ force: false });
  console.log('Database synced');
  
  app.listen(PORT, () => {
    console.log(`Server started at :${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});