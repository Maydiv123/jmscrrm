const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PipelineJob = sequelize.define('PipelineJob', {
    id: {
      type: DataTypes.INTEGER,const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PipelineJob = sequelize.define('PipelineJob', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    current_stage: {
      type: DataTypes.STRING,
      defaultValue: 'stage1'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    notification_email: DataTypes.STRING
  }, {
    tableName: 'pipeline_jobs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PipelineJob;
};
      primaryKey: true,
      autoIncrement: true
    },
    job_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    current_stage: {
      type: DataTypes.STRING,
      defaultValue: 'stage1'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    assigned_to_stage2: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    assigned_to_stage3: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    notification_email: DataTypes.STRING
  }, {
    tableName: 'pipeline_jobs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PipelineJob;
};
