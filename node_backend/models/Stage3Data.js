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
    // Moved from Stage 2
    ocean_freight: DataTypes.FLOAT,
    edi_job_no: DataTypes.STRING,
    edi_date: DataTypes.DATE,
    original_doct_recd_date: DataTypes.DATE,
    debit_note: DataTypes.STRING,
    debit_paid_by: DataTypes.STRING,
    duty_amount: DataTypes.FLOAT,
    duty_paid_by: DataTypes.STRING,
    destination_charges: DataTypes.FLOAT,
    // Additional fields moved from Stage 2
    filing_requirement: DataTypes.TEXT,
    checklist_sent_date: DataTypes.DATE,
    bill_of_entry_no: DataTypes.STRING,
    bill_of_entry_date: DataTypes.DATE,
    bill_of_entry_upload: DataTypes.STRING,
    created_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'stage3_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Stage3Data;
};