const { sequelize } = require('../models');
const migration = require('../migrations/move_original_doct_recd_date_to_stage3');

async function runMigration() {
  try {
    console.log('=== RUNNING ORIGINAL DOCUMENT MIGRATION ===\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('Original Document Received Date has been moved from Stage 2 to Stage 3');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();



