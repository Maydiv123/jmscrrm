const express = require('express');
const { sequelize } = require('../models');
const router = express.Router();

// Simple endpoint to add EDI fields to stage2_data
router.post('/add-edi-to-stage2', async (req, res) => {
  try {
    console.log('Adding EDI fields to stage2_data...');
    
    // Add EDI columns to stage2_data
    await sequelize.query(`
      ALTER TABLE stage2_data 
      ADD COLUMN edi_job_no VARCHAR(255) NULL
    `);
    console.log('✓ Added edi_job_no to stage2_data');
    
    await sequelize.query(`
      ALTER TABLE stage2_data 
      ADD COLUMN edi_date DATE NULL
    `);
    console.log('✓ Added edi_date to stage2_data');
    
    console.log('🎉 EDI fields added to stage2_data successfully!');
    res.json({ success: true, message: 'EDI fields added to stage2_data successfully' });
  } catch (error) {
    console.error('❌ Adding EDI fields failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
