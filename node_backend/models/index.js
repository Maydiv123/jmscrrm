// models/index.js - Fix the associations
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'jms_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import model functions
const UserModel = require('./User');
const PipelineJobModel = require('./PipelineJob');
const Stage1DataModel = require('./Stage1Data');
const Stage1ContainerModel = require('./Stage1Container');
const Stage2DataModel = require('./Stage2Data');
const Stage3DataModel = require('./Stage3Data');
const Stage3ContainerModel = require('./Stage3Container');
const Stage4DataModel = require('./Stage4Data');
const JobUpdateModel = require('./JobUpdate');
const JobFileModel = require('./JobFile');
const TaskModel = require('./Task');
const TaskAssignmentModel = require('./TaskAssignment');
const TaskUpdateModel = require('./TaskUpdate');
const ConsigneeModel = require('./Consignee');

// Initialize models
const User = UserModel(sequelize);
const PipelineJob = PipelineJobModel(sequelize);
const Stage1Data = Stage1DataModel(sequelize);
const Stage1Container = Stage1ContainerModel(sequelize);
const Stage2Data = Stage2DataModel(sequelize);
const Stage3Data = Stage3DataModel(sequelize);
const Stage3Container = Stage3ContainerModel(sequelize);
const Stage4Data = Stage4DataModel(sequelize);
const JobUpdate = JobUpdateModel(sequelize);
const JobFile = JobFileModel(sequelize);
const Task = TaskModel(sequelize);
const TaskAssignment = TaskAssignmentModel(sequelize);
const TaskUpdate = TaskUpdateModel(sequelize);
const Consignee = ConsigneeModel(sequelize);

// Define associations - CORRECTED based on Golang structure
PipelineJob.hasOne(Stage1Data, { foreignKey: 'job_id', as: 'Stage1' });
Stage1Data.belongsTo(PipelineJob, { foreignKey: 'job_id' });

// Stage1Container association
PipelineJob.hasMany(Stage1Container, { foreignKey: 'job_id', as: 'Stage1Containers' });
Stage1Container.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasOne(Stage2Data, { foreignKey: 'job_id', as: 'Stage2' });
Stage2Data.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasOne(Stage3Data, { foreignKey: 'job_id', as: 'Stage3' });
Stage3Data.belongsTo(PipelineJob, { foreignKey: 'job_id' });

// CORRECTION: Stage3Container is directly associated with PipelineJob, not Stage3Data
PipelineJob.hasMany(Stage3Container, { foreignKey: 'job_id', as: 'Stage3Containers' });
Stage3Container.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasOne(Stage4Data, { foreignKey: 'job_id', as: 'Stage4' });
Stage4Data.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasMany(JobUpdate, { foreignKey: 'job_id', as: 'Updates' });
JobUpdate.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasMany(JobFile, { foreignKey: 'job_id', as: 'Files' });
JobFile.belongsTo(PipelineJob, { foreignKey: 'job_id' });

// Task associations
Task.hasMany(TaskAssignment, { foreignKey: 'task_id', as: 'Assignments' });
TaskAssignment.belongsTo(Task, { foreignKey: 'task_id' });

Task.hasMany(TaskUpdate, { foreignKey: 'task_id', as: 'Updates' });
TaskUpdate.belongsTo(Task, { foreignKey: 'task_id' });

// User associations
User.hasMany(PipelineJob, { foreignKey: 'created_by', as: 'CreatedJobs' });
PipelineJob.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedByUser' });



User.hasMany(JobFile, { foreignKey: 'uploaded_by', as: 'UploadedFiles' });
JobFile.belongsTo(User, { foreignKey: 'uploaded_by', as: 'UploadedByUser' });

User.hasMany(JobUpdate, { foreignKey: 'user_id', as: 'JobUpdates' });
JobUpdate.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

User.hasMany(TaskAssignment, { foreignKey: 'user_id', as: 'TaskAssignments' });
TaskAssignment.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(TaskUpdate, { foreignKey: 'user_id', as: 'TaskUpdates' });
TaskUpdate.belongsTo(User, { foreignKey: 'user_id' });

// Sync database
async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Call associations for all models
    Object.values(module.exports).forEach(model => {
      if (model.associate) {
        model.associate(module.exports);
      }
    });
    
    // Sync all models
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Export the models and sync function
module.exports = {
  sequelize,
  syncDatabase,
  User,
  PipelineJob,
  Stage1Data,
  Stage1Container,
  Stage2Data,
  Stage3Data,
  Stage3Container,
  Stage4Data,
  JobUpdate,
  JobFile,
  Task,
  TaskAssignment,
  TaskUpdate,
  Consignee
};
