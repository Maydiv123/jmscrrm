const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobFile = sequelize.define('JobFile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stage: DataTypes.STRING,
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file_name: DataTypes.STRING,
    original_name: DataTypes.STRING,
    file_path: DataTypes.STRING,
    file_size: DataTypes.BIGINT,
    file_type: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    tableName: 'job_files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return JobFile;
};