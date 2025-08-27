// models/Stage1Container.js - Container management for Stage 1
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stage1Container = sequelize.define('Stage1Container', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pipeline_jobs',
        key: 'id'
      }
    },
    container_no: {
      type: DataTypes.STRING,
      allowNull: false
    },
    container_size: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '20'
    },
    date_of_arrival: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'stage1_containers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Stage1Container.associate = function(models) {
    Stage1Container.belongsTo(models.PipelineJob, {
      foreignKey: 'job_id',
      as: 'job'
    });
  };

  return Stage1Container;
};
