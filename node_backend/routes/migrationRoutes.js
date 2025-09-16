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

// Migration endpoint to move EDI and Ocean Freight fields from stage2 to stage3
router.post('/move-edi-ocean-fields', async (req, res) => {
  try {
    console.log('Starting migration: Move EDI and Ocean Freight fields from stage2_data to stage3_data');
    
    // Add fields to stage3_data
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN ocean_freight FLOAT NULL
    `);
    console.log('✓ Added ocean_freight to stage3_data');
    
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN edi_job_no VARCHAR(255) NULL
    `);
    console.log('✓ Added edi_job_no to stage3_data');
    
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN edi_date DATE NULL
    `);
    console.log('✓ Added edi_date to stage3_data');
    
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN original_doct_recd_date DATE NULL
    `);
    console.log('✓ Added original_doct_recd_date to stage3_data');
    
    // Copy data from stage2_data to stage3_data
    await sequelize.query(`
      UPDATE stage3_data s3
      INNER JOIN stage2_data s2 ON s3.job_id = s2.job_id
      SET 
        s3.ocean_freight = s2.ocean_freight,
        s3.edi_job_no = s2.edi_job_no,
        s3.edi_date = s2.edi_date,
        s3.original_doct_recd_date = s2.original_doct_recd_date
      WHERE s2.ocean_freight IS NOT NULL 
         OR s2.edi_job_no IS NOT NULL 
         OR s2.edi_date IS NOT NULL
         OR s2.original_doct_recd_date IS NOT NULL
    `);
    console.log('✓ Copied EDI and Ocean Freight data from stage2_data to stage3_data');
    
    // Remove fields from stage2_data
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN ocean_freight`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN edi_job_no`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN edi_date`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN original_doct_recd_date`);
    console.log('✓ Removed EDI and Ocean Freight fields from stage2_data');
    
    console.log('🎉 Migration completed successfully!');
    res.json({ success: true, message: 'EDI and Ocean Freight migration completed successfully' });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migration endpoint to create shippers table
router.post('/create-shippers-table', async (req, res) => {
  try {
    console.log('Starting migration: Create shippers table');
    
    // Check if table already exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'shippers'");
    if (tables.length > 0) {
      console.log('✓ Shippers table already exists');
      return res.json({ success: true, message: 'Shippers table already exists' });
    }
    
    // Create table
    await sequelize.query(`
      CREATE TABLE shippers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_by INT,
        updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `);
    console.log('✓ Shippers table created');
    
    // Insert sample data
    await sequelize.query(`
      INSERT INTO shippers (name, address, phone, email, status) VALUES
      ('Ocean Shipping Lines', 'Port Authority, Mumbai', '+91-22-12345678', 'info@oceanshipping.com', 'active'),
      ('Global Cargo Ltd.', 'Harbor Terminal, Chennai', '+91-44-87654321', 'contact@globalcargo.com', 'active'),
      ('Maritime Logistics', 'Port Complex, Kolkata', '+91-33-11223344', 'support@maritimelogistics.com', 'active'),
      ('International Freight', 'Container Terminal, Kochi', '+91-484-55667788', 'info@intlfreight.com', 'active')
    `);
    console.log('✓ Sample shipper data inserted');
    
    console.log('🎉 Shippers table migration completed successfully!');
    res.json({ success: true, message: 'Shippers table created successfully' });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
