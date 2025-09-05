// models/Stage2Data.js - Verify all fields are defined
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stage2Data = sequelize.define('Stage2Data', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    hsn_code: DataTypes.STRING,
    filing_requirement: DataTypes.TEXT,
    checklist_sent_date: DataTypes.DATE,
    approval_date: DataTypes.DATE,
    bill_of_entry_no: DataTypes.STRING,
    bill_of_entry_date: DataTypes.DATE,
    debit_note: DataTypes.STRING,
    debit_paid_by: DataTypes.STRING,
    duty_amount: DataTypes.FLOAT,
    duty_paid_by: DataTypes.STRING,
    ocean_freight: DataTypes.FLOAT,
    destination_charges: DataTypes.FLOAT,
    original_doct_recd_date: DataTypes.DATE,
    drn_no: DataTypes.STRING,
    irn_no: DataTypes.STRING,
    documents_type: DataTypes.STRING,
    document_1: DataTypes.STRING,
    document_2: DataTypes.STRING,
    document_3: DataTypes.STRING,
    document_4: DataTypes.STRING,
    document_5: DataTypes.STRING,
    document_6: DataTypes.STRING,
    query_upload: DataTypes.STRING,
    reply_upload: DataTypes.STRING,
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
    tableName: 'stage2_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Stage2Data;
};