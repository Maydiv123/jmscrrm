require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('../config/db');

async function runMigrations() {
  try {
    // Create database if it doesn't exist
    const sequelize = new Sequelize('', process.env.DB_USER, process.env.DB_PASS, {
      host: process.env.DB_HOST,
      dialect: 'mysql'
    });

    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await sequelize.close();

    // Connect to the database
    await db.authenticate();
    console.log('Database connection established');

    // SQL statements to execute
    const sqlStatements = [
      // Disable foreign key checks
      'SET FOREIGN_KEY_CHECKS = 0',
      
      // Drop tables in reverse order of dependency
      'DROP TABLE IF EXISTS task_updates',
      'DROP TABLE IF EXISTS task_assignments',
      'DROP TABLE IF EXISTS job_files',
      'DROP TABLE IF EXISTS job_updates',
      'DROP TABLE IF EXISTS stage4_data',
      'DROP TABLE IF EXISTS stage3_containers',
      'DROP TABLE IF EXISTS stage3_data',
      'DROP TABLE IF EXISTS stage2_data',
      'DROP TABLE IF EXISTS stage1_data',
      'DROP TABLE IF EXISTS pipeline_jobs',
      'DROP TABLE IF EXISTS tasks',
      'DROP TABLE IF EXISTS users',
      
      // Re-enable foreign key checks
      'SET FOREIGN_KEY_CHECKS = 1',
      
      // Create users table
      `CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        designation VARCHAR(50) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        role ENUM('admin', 'subadmin', 'stage1_employee', 'stage2_employee', 'stage3_employee', 'customer') DEFAULT 'stage1_employee',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Create pipeline_jobs table
      `CREATE TABLE pipeline_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_no VARCHAR(50) NOT NULL UNIQUE,
        current_stage ENUM('stage1', 'stage2', 'stage3', 'stage4', 'completed') DEFAULT 'stage1',
        status ENUM('active', 'on_hold', 'completed', 'cancelled') DEFAULT 'active',
        created_by INT NOT NULL,
        assigned_to_stage2 INT NULL,
        assigned_to_stage3 INT NULL,
        customer_id INT NULL,
        notification_email VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (assigned_to_stage2) REFERENCES users(id),
        FOREIGN KEY (assigned_to_stage3) REFERENCES users(id),
        FOREIGN KEY (customer_id) REFERENCES users(id)
      )`,
      
      // Create tasks table
      `CREATE TABLE tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        priority ENUM('Low', 'Medium', 'High') NOT NULL,
        deadline DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Create task_assignments table
      `CREATE TABLE task_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // Create task_updates table
      `CREATE TABLE task_updates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('Assigned', 'In Progress', 'Completed') NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`,
      
      // Insert sample users
      `INSERT INTO users (username, password_hash, designation, is_admin, role) VALUES
        ('admin', '123456', 'Administrator', TRUE, 'admin'),
        ('stage2_emp', '123456', 'Customs Officer', FALSE, 'stage2_employee'),
        ('stage3_emp', '123456', 'Logistics Coordinator', FALSE, 'stage3_employee'),
        ('customer1', '123456', 'Client', FALSE, 'customer'),
        ('subadmin', '123456', 'Sub Administrator', FALSE, 'subadmin')`,
      
      // Insert sample tasks
      `INSERT INTO tasks (job_id, description, priority, deadline) VALUES
        ('JOB001', 'Implement user authentication system', 'High', DATE_ADD(NOW(), INTERVAL 7 DAY)),
        ('JOB002', 'Design database schema for CRM', 'Medium', DATE_ADD(NOW(), INTERVAL 14 DAY)),
        ('JOB003', 'Create responsive dashboard UI', 'High', DATE_ADD(NOW(), INTERVAL 5 DAY)),
        ('JOB004', 'Write API documentation', 'Low', DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      
      // Insert task assignments
      `INSERT INTO task_assignments (task_id, user_id) VALUES
        (1, 2), (1, 3), (2, 2), (3, 3), (4, 4)`,
      
      // Insert task updates
      `INSERT INTO task_updates (task_id, user_id, status, comment) VALUES
        (1, 2, 'In Progress', 'Started working on authentication'),
        (2, 2, 'Assigned', 'Waiting for requirements'),
        (3, 3, 'Completed', 'Dashboard UI finished'),
        (4, 4, 'In Progress', 'Documentation in progress')`
    ];

    // Execute each statement sequentially
    for (const sql of sqlStatements) {
      try {
        await db.query(sql);
        console.log(`Executed: ${sql.split('\n')[0]}...`);
      } catch (err) {
        console.error(`Error executing: ${sql.split('\n')[0]}`, err);
        throw err;
      }
    }

    console.log('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();