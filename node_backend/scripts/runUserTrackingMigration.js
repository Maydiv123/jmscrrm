const { sequelize } = require('../config/db');
const migration = require('../migrations/add_user_tracking_to_stages');

async function runMigration() {
  try {
    console.log('Running user tracking migration...');
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration();
