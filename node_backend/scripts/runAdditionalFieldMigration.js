const { sequelize } = require('../models');
const migration = require('../migrations/move_fields_stage2_to_stage3_additional');

async function runMigration() {
  try {
    console.log('Running additional field migration...');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
