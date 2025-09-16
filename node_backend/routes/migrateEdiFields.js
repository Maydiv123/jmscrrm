const express = require('express');
const { sequelize } = require('../models');
const router = express.Router();

// Migration endpoint to move EDI fields from stage3_data to stage2_data
router.post('/move-edi-fields', async (req, res) => {
  try {
    console.log('Starting migration: Move EDI fields from stage3_data to stage2_data');
    
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
    
    // Copy data from stage3_data to stage2_data
    await sequelize.query(`
      UPDATE stage2_data s2
      INNER JOIN stage3_data s3 ON s2.job_id = s3.job_id
      SET 
        s2.edi_job_no = s3.edi_job_no,
        s2.edi_date = s3.edi_date
      WHERE s3.edi_job_no IS NOT NULL 
         OR s3.edi_date IS NOT NULL
    `);
    console.log('✓ Copied EDI data from stage3_data to stage2_data');
    
    // Remove EDI columns from stage3_data
    await sequelize.query(`ALTER TABLE stage3_data DROP COLUMN edi_job_no`);
    await sequelize.query(`ALTER TABLE stage3_data DROP COLUMN edi_date`);
    console.log('✓ Removed EDI columns from stage3_data');
    
    console.log('🎉 EDI fields migration completed successfully!');
    res.json({ success: true, message: 'EDI fields migration completed successfully' });
  } catch (error) {
    console.error('❌ EDI migration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



