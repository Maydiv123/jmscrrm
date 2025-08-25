const { sequelize } = require('../models');

async function runMigration() {
  try {
    console.log('Running stage history migration...');
    
    // Add previous_stage column
    await sequelize.query(`
      ALTER TABLE job_updates 
      ADD COLUMN previous_stage VARCHAR(255) NULL COMMENT 'Previous stage before the update'
    `);
    console.log('✓ Added previous_stage column');

    // Add stage_history column
    await sequelize.query(`
      ALTER TABLE job_updates 
      ADD COLUMN stage_history JSON NULL COMMENT 'JSON array of last 2 stage updates'
    `);
    console.log('✓ Added stage_history column');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
