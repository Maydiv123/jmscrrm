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
      allowNull: false
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
    updatedAt: 'updated_at'
  });

  return Stage3Container;
};