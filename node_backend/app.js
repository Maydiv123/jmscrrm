// app.js - Update session configuration
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');
// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const consigneeRoutes = require('./routes/consigneeRoutes');
const shipperRoutes = require('./routes/shipperRoutes');
const migrationRoutes = require('./routes/migrationRoutes');
const ediMigrationRoutes = require('./routes/migrateEdiFields');
const addEdiRoutes = require('./routes/addEdiFields');
const irnSchemaRoutes = require('./routes/updateIrnSchema');
const drnSchemaRoutes = require('./routes/updateDrnSchema');

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

// Middleware - IMPORTANT: Session middleware should come before routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session store configuration - Use a proper session store for production
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 900000, // Check every 15 minutes
  expiration: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-session-key-change-in-production',
  store: sessionStore, // Use database store for persistence
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on every request
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax'
  }
}));

// Add session debugging middleware
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/consignees', consigneeRoutes);
app.use('/api/shippers', shipperRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/migration', ediMigrationRoutes);
app.use('/api/migration', addEdiRoutes);
app.use('/api/migration', irnSchemaRoutes);
app.use('/api/migration', drnSchemaRoutes);

// Test endpoint with session check
app.get('/api/test-session', (req, res) => {
  console.log('Test session endpoint - Session data:', req.session);
  res.json({ 
    message: "Session test endpoint working",
    session: req.session,
    sessionId: req.sessionID
  });
});

const PORT = process.env.PORT || 8080;

async function startServer() {
  await testConnection();
  
  // Sync database
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
