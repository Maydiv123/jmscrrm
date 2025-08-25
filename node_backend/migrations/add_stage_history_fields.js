const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('job_updates', 'previous_stage', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Previous stage before the update'
    });

    await queryInterface.addColumn('job_updates', 'stage_history', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON array of last 2 stage updates'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('job_updates', 'previous_stage');
    await queryInterface.removeColumn('job_updates', 'stage_history');
  }
};
