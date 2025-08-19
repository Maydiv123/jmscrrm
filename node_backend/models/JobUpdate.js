const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobUpdate = sequelize.define('JobUpdate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stage: DataTypes.STRING,
    update_type: DataTypes.STRING,
    message: DataTypes.STRING,
    old_value: DataTypes.STRING,
    new_value: DataTypes.STRING
  }, {
    tableName: 'job_updates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return JobUpdate;
};