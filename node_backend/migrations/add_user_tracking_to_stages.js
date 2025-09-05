const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add created_by and updated_by fields to all stage tables
    const stageTables = ['stage1_data', 'stage2_data', 'stage3_data', 'stage4_data'];
    
    for (const table of stageTables) {
      await queryInterface.addColumn(table, 'created_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
      
      await queryInterface.addColumn(table, 'updated_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove created_by and updated_by fields from all stage tables
    const stageTables = ['stage1_data', 'stage2_data', 'stage3_data', 'stage4_data'];
    
    for (const table of stageTables) {
      await queryInterface.removeColumn(table, 'created_by');
      await queryInterface.removeColumn(table, 'updated_by');
    }
  }
};
