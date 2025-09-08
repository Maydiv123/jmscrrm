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
    ocean_freight: DataTypes.FLOAT,
    original_doct_recd_date: DataTypes.DATE,
    drn_entries: DataTypes.JSON, // Changed to JSON to store array of DRN entries with IRN numbers
    // Moved from Stage 3
    edi_job_no: DataTypes.STRING,
    edi_date: DataTypes.DATE,
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