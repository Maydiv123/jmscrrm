const { sequelize } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting migration: Move original_doct_recd_date from stage2_data to stage3_data');
      
      // Add original_doct_recd_date column to stage3_data
      await queryInterface.addColumn('stage3_data', 'original_doct_recd_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✓ Added original_doct_recd_date to stage3_data');
      
      // Copy data from stage2_data to stage3_data
      await sequelize.query(`
        UPDATE stage3_data s3
        INNER JOIN stage2_data s2 ON s3.job_id = s2.job_id
        SET s3.original_doct_recd_date = s2.original_doct_recd_date
        WHERE s2.original_doct_recd_date IS NOT NULL
      `);
      console.log('✓ Copied original_doct_recd_date data from stage2_data to stage3_data');
      
      // Remove original_doct_recd_date column from stage2_data
      await queryInterface.removeColumn('stage2_data', 'original_doct_recd_date');
      console.log('✓ Removed original_doct_recd_date from stage2_data');
      
      console.log('🎉 Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Rolling back migration: Move original_doct_recd_date back to stage2_data');
      
      // Add original_doct_recd_date column back to stage2_data
      await queryInterface.addColumn('stage2_data', 'original_doct_recd_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('✓ Added original_doct_recd_date back to stage2_data');
      
      // Copy data from stage3_data back to stage2_data
      await sequelize.query(`
        UPDATE stage2_data s2
        INNER JOIN stage3_data s3 ON s2.job_id = s3.job_id
        SET s2.original_doct_recd_date = s3.original_doct_recd_date
        WHERE s3.original_doct_recd_date IS NOT NULL
      `);
      console.log('✓ Copied original_doct_recd_date data from stage3_data back to stage2_data');
      
      // Remove original_doct_recd_date column from stage3_data
      await queryInterface.removeColumn('stage3_data', 'original_doct_recd_date');
      console.log('✓ Removed original_doct_recd_date from stage3_data');
      
      console.log('🎉 Rollback completed successfully!');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};



