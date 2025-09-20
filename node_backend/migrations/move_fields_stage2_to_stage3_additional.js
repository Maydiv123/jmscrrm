// Migration to move additional fields from stage2_data to stage3_data
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Starting migration: Move additional fields from stage2_data to stage3_data');
    
    try {
      // First, add the new columns to stage3_data table
      await queryInterface.addColumn('stage3_data', 'filing_requirement', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage3_data', 'checklist_sent_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage3_data', 'bill_of_entry_no', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage3_data', 'bill_of_entry_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
      
      console.log('Added new columns to stage3_data table');
      
      // Copy data from stage2_data to stage3_data for existing jobs
      await queryInterface.sequelize.query(`
        UPDATE stage3_data s3
        INNER JOIN stage2_data s2 ON s3.job_id = s2.job_id
        SET 
          s3.filing_requirement = s2.filing_requirement,
          s3.checklist_sent_date = s2.checklist_sent_date,
          s3.bill_of_entry_no = s2.bill_of_entry_no,
          s3.bill_of_entry_date = s2.bill_of_entry_date
        WHERE s2.filing_requirement IS NOT NULL 
           OR s2.checklist_sent_date IS NOT NULL 
           OR s2.bill_of_entry_no IS NOT NULL
           OR s2.bill_of_entry_date IS NOT NULL
      `, { type: QueryTypes.UPDATE });
      
      console.log('Copied data from stage2_data to stage3_data');
      
      // Now remove the columns from stage2_data
      await queryInterface.removeColumn('stage2_data', 'filing_requirement');
      await queryInterface.removeColumn('stage2_data', 'checklist_sent_date');
      await queryInterface.removeColumn('stage2_data', 'bill_of_entry_no');
      await queryInterface.removeColumn('stage2_data', 'bill_of_entry_date');
      
      console.log('Removed columns from stage2_data table');
      console.log('Migration completed successfully');
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Rolling back migration: Move additional fields from stage2_data to stage3_data');
    
    try {
      // Add columns back to stage2_data
      await queryInterface.addColumn('stage2_data', 'filing_requirement', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage2_data', 'checklist_sent_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage2_data', 'bill_of_entry_no', {
        type: Sequelize.STRING,
        allowNull: true
      });
      
      await queryInterface.addColumn('stage2_data', 'bill_of_entry_date', {
        type: Sequelize.DATE,
        allowNull: true
      });
      
      // Copy data back from stage3_data to stage2_data
      await queryInterface.sequelize.query(`
        UPDATE stage2_data s2
        INNER JOIN stage3_data s3 ON s2.job_id = s3.job_id
        SET 
          s2.filing_requirement = s3.filing_requirement,
          s2.checklist_sent_date = s3.checklist_sent_date,
          s2.bill_of_entry_no = s3.bill_of_entry_no,
          s2.bill_of_entry_date = s3.bill_of_entry_date
        WHERE s3.filing_requirement IS NOT NULL 
           OR s3.checklist_sent_date IS NOT NULL 
           OR s3.bill_of_entry_no IS NOT NULL
           OR s3.bill_of_entry_date IS NOT NULL
      `, { type: QueryTypes.UPDATE });
      
      // Remove columns from stage3_data
      await queryInterface.removeColumn('stage3_data', 'filing_requirement');
      await queryInterface.removeColumn('stage3_data', 'checklist_sent_date');
      await queryInterface.removeColumn('stage3_data', 'bill_of_entry_no');
      await queryInterface.removeColumn('stage3_data', 'bill_of_entry_date');
      
      console.log('Rollback completed successfully');
      
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
