const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add approval_date column to stage3_data table
      await queryInterface.addColumn('stage3_data', 'approval_date', {
        type: DataTypes.DATE,
        allowNull: true
      });
      
      console.log('Successfully added approval_date column to stage3_data table');
    } catch (error) {
      console.error('Error adding approval_date column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove approval_date column from stage3_data table
      await queryInterface.removeColumn('stage3_data', 'approval_date');
      
      console.log('Successfully removed approval_date column from stage3_data table');
    } catch (error) {
      console.error('Error removing approval_date column:', error);
      throw error;
    }
  }
};
