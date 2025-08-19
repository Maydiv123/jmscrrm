const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stage4Data = sequelize.define('Stage4Data', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bill_no: DataTypes.STRING,
    bill_date: DataTypes.DATE,
    amount_taxable: DataTypes.FLOAT,
    gst_5_percent: DataTypes.FLOAT,
    gst_18_percent: DataTypes.FLOAT,
    bill_mail: DataTypes.STRING,
    bill_courier: DataTypes.STRING,
    courier_date: DataTypes.DATE,
    acknowledge_date: DataTypes.DATE,
    acknowledge_name: DataTypes.STRING,
    bill_copy_upload: DataTypes.STRING
  }, {
    tableName: 'stage4_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Stage4Data;
};