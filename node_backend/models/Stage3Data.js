const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stage3Data = sequelize.define('Stage3Data', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    exam_date: DataTypes.DATE,
    out_of_charge: DataTypes.DATE,
    clearance_exps: DataTypes.FLOAT,
    stamp_duty: DataTypes.FLOAT,
    custodian: DataTypes.STRING,
    offloading_charges: DataTypes.FLOAT,
    transport_detention: DataTypes.FLOAT,
    dispatch_info: DataTypes.STRING,
    bill_of_entry_upload: DataTypes.STRING
  }, {
    tableName: 'stage3_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Stage3Data;
};