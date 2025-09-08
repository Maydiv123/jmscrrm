// Migration to move fields from stage2_data to stage3_data
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Starting migration: Move fields from stage2_data to stage3_data');
    
    try {
      // First, add the new columns to stage3_data table
      await queryInterface.addColumn('stage3_data', 'debit_note', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage3_data', 'debit_paid_by', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage3_data', 'duty_amount', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage3_data', 'duty_paid_by', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage3_data', 'destination_charges', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
      
      console.log('Added new columns to stage3_data table');
      
      // Copy data from stage2_data to stage3_data for existing jobs
      await queryInterface.sequelize.query(`
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
      `, { type: QueryTypes.UPDATE });
      
      console.log('Copied data from stage2_data to stage3_data');
      
      // Remove the columns from stage2_data table
      await queryInterface.removeColumn('stage2_data', 'debit_note');
      await queryInterface.removeColumn('stage2_data', 'debit_paid_by');
      await queryInterface.removeColumn('stage2_data', 'duty_amount');
      await queryInterface.removeColumn('stage2_data', 'duty_paid_by');
      await queryInterface.removeColumn('stage2_data', 'destination_charges');
      
      console.log('Removed columns from stage2_data table');
      console.log('Migration completed successfully');
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Rolling back migration: Move fields from stage3_data back to stage2_data');
    
    try {
      // Add columns back to stage2_data
      await queryInterface.addColumn('stage2_data', 'debit_note', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage2_data', 'debit_paid_by', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage2_data', 'duty_amount', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage2_data', 'duty_paid_by', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage2_data', 'destination_charges', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
      
      // Copy data back from stage3_data to stage2_data
      await queryInterface.sequelize.query(`
        UPDATE stage2_data s2
        INNER JOIN stage3_data s3 ON s2.job_id = s3.job_id
        SET 
          s2.debit_note = s3.debit_note,
          s2.debit_paid_by = s3.debit_paid_by,
          s2.duty_amount = s3.duty_amount,
          s2.duty_paid_by = s3.duty_paid_by,
          s2.destination_charges = s3.destination_charges
        WHERE s3.debit_note IS NOT NULL 
           OR s3.debit_paid_by IS NOT NULL 
           OR s3.duty_amount IS NOT NULL 
           OR s3.duty_paid_by IS NOT NULL 
           OR s3.destination_charges IS NOT NULL
      `, { type: QueryTypes.UPDATE });
      
      // Remove columns from stage3_data
      await queryInterface.removeColumn('stage3_data', 'debit_note');
      await queryInterface.removeColumn('stage3_data', 'debit_paid_by');
      await queryInterface.removeColumn('stage3_data', 'duty_amount');
      await queryInterface.removeColumn('stage3_data', 'duty_paid_by');
      await queryInterface.removeColumn('stage3_data', 'destination_charges');
      
      console.log('Rollback completed successfully');
      
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
