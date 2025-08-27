// migrations/remove_assignment_fields.js
require('dotenv').config();
const { sequelize } = require('../models');

async function removeAssignmentFields() {
  try {
    console.log('Starting migration to remove assignment fields...');

    // Remove the assignment columns one by one (MySQL syntax)
    try {
      await sequelize.query('ALTER TABLE pipeline_jobs DROP COLUMN assigned_to_stage2');
      console.log('Dropped assigned_to_stage2 column');
    } catch (e) {
      console.log('Column assigned_to_stage2 does not exist or already dropped');
    }

    try {
      await sequelize.query('ALTER TABLE pipeline_jobs DROP COLUMN assigned_to_stage3');
      console.log('Dropped assigned_to_stage3 column');
    } catch (e) {
      console.log('Column assigned_to_stage3 does not exist or already dropped');
    }

    try {
      await sequelize.query('ALTER TABLE pipeline_jobs DROP COLUMN customer_id');
      console.log('Dropped customer_id column');
    } catch (e) {
      console.log('Column customer_id does not exist or already dropped');
    }

    console.log('Successfully removed assignment fields from pipeline_jobs table');
    
  } catch (error) {
    console.error('Error in migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
removeAssignmentFields()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
