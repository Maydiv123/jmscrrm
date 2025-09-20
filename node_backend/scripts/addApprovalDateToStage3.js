const { sequelize } = require('../models');

async function addApprovalDateToStage3() {
  try {
    console.log('Adding approval_date column to stage3_data table...');
    
    // Add approval_date column to stage3_data table
    await sequelize.query(`
      ALTER TABLE stage3_data 
      ADD COLUMN approval_date DATE NULL COMMENT 'Approval date for stage 3'
    `);
    console.log('✓ Added approval_date column to stage3_data table');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addApprovalDateToStage3();
