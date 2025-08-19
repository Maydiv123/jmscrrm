const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
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
const Stage2DataModel = require('./Stage2Data');
const Stage3DataModel = require('./Stage3Data');
const Stage3ContainerModel = require('./Stage3Container');
const Stage4DataModel = require('./Stage4Data');
const JobUpdateModel = require('./JobUpdate');
const JobFileModel = require('./JobFile');

// Initialize models
const User = UserModel(sequelize);
const PipelineJob = PipelineJobModel(sequelize);
const Stage1Data = Stage1DataModel(sequelize);
const Stage2Data = Stage2DataModel(sequelize);
const Stage3Data = Stage3DataModel(sequelize);
const Stage3Container = Stage3ContainerModel(sequelize);
const Stage4Data = Stage4DataModel(sequelize);
const JobUpdate = JobUpdateModel(sequelize);
const JobFile = JobFileModel(sequelize);

// Define associations
PipelineJob.hasOne(Stage1Data, { foreignKey: 'job_id' });
Stage1Data.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasOne(Stage2Data, { foreignKey: 'job_id' });
Stage2Data.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasOne(Stage3Data, { foreignKey: 'job_id' });
Stage3Data.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasMany(Stage3Container, { foreignKey: 'job_id' });
Stage3Container.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasOne(Stage4Data, { foreignKey: 'job_id' });
Stage4Data.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasMany(JobUpdate, { foreignKey: 'job_id' });
JobUpdate.belongsTo(PipelineJob, { foreignKey: 'job_id' });

PipelineJob.hasMany(JobFile, { foreignKey: 'job_id' });
JobFile.belongsTo(PipelineJob, { foreignKey: 'job_id' });

User.hasMany(PipelineJob, { foreignKey: 'created_by' });
PipelineJob.belongsTo(User, { foreignKey: 'created_by', as: 'CreatedByUser' });

User.hasMany(PipelineJob, { foreignKey: 'assigned_to_stage2' });
PipelineJob.belongsTo(User, { foreignKey: 'assigned_to_stage2', as: 'Stage2User' });

User.hasMany(PipelineJob, { foreignKey: 'assigned_to_stage3' });
PipelineJob.belongsTo(User, { foreignKey: 'assigned_to_stage3', as: 'Stage3User' });

User.hasMany(PipelineJob, { foreignKey: 'customer_id' });
PipelineJob.belongsTo(User, { foreignKey: 'customer_id', as: 'Customer' });

User.hasMany(JobFile, { foreignKey: 'uploaded_by' });
JobFile.belongsTo(User, { foreignKey: 'uploaded_by', as: 'UploadedByUser' });

User.hasMany(JobUpdate, { foreignKey: 'user_id' });
JobUpdate.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  PipelineJob,
  Stage1Data,
  Stage2Data,
  Stage3Data,
  Stage3Container,
  Stage4Data,
  JobUpdate,
  JobFile
};