// models/Stage3Container.js - Update to match Golang structure
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stage3Container = sequelize.define('Stage3Container', {
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
    container_no: DataTypes.STRING,
    size: DataTypes.STRING,
    vehicle_no: DataTypes.STRING,
    date_of_offloading: DataTypes.DATE,
    empty_return_date: DataTypes.DATE
  }, {
    tableName: 'stage3_containers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // Matches Golang structure which only has created_at
  });

  Stage3Container.associate = function(models) {
    Stage3Container.belongsTo(models.PipelineJob, {
      foreignKey: 'job_id',
      as: 'job'
    });
  };

  return Stage3Container;
};