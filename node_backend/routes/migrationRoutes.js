const express = require('express');
const { sequelize } = require('../models');
const router = express.Router();

// Migration endpoint to add fields to stage3_data
router.post('/add-stage3-fields', async (req, res) => {
  try {
    console.log('Starting migration: Add fields to stage3_data');
    
    // Add columns to stage3_data
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN debit_note VARCHAR(255) NULL
    `);
    console.log('✓ Added debit_note to stage3_data');
    
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN debit_paid_by VARCHAR(255) NULL
    `);
    console.log('✓ Added debit_paid_by to stage3_data');
    
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN duty_amount FLOAT NULL
    `);
    console.log('✓ Added duty_amount to stage3_data');
    
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN duty_paid_by VARCHAR(255) NULL
    `);
    console.log('✓ Added duty_paid_by to stage3_data');
    
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN destination_charges FLOAT NULL
    `);
    console.log('✓ Added destination_charges to stage3_data');
    
    // Copy data from stage2_data to stage3_data
    await sequelize.query(`
      UPDATE stage3_data s3
      INNER JOIN stage2_data s2 ON s3.job_id = s2.job_id
      SET 
        s3.debit_note = s2.debit_note,
        s3.debit_paid_by = s2.debit_paid_by,
        s3.duty_amount = s2.duty_amount,
        s3.duty_paid_by = s2.duty_paid_by,
        s3.destination_charges = s2.destination_charges
      WHERE s2.debit_note IS NOT NULL 
         OR s2.debit_paid_by IS NOT NULL 
         OR s2.duty_amount IS NOT NULL 
         OR s2.duty_paid_by IS NOT NULL 
         OR s2.destination_charges IS NOT NULL
    `);
    console.log('✓ Copied data from stage2_data to stage3_data');
    
    // Remove columns from stage2_data
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN debit_note`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN debit_paid_by`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN duty_amount`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN duty_paid_by`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN destination_charges`);
    
    console.log('✓ Removed columns from stage2_data');
    console.log('🎉 Migration completed successfully!');
    
    res.json({ success: true, message: 'Migration completed successfully' });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
