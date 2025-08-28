const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

async function createConsigneesTable() {
  try {
    console.log('Starting consignee table creation...');
    
    // Create the consignees table
    await sequelize.getQueryInterface().createTable('consignees', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'pending'),
        defaultValue: 'active'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    console.log('Consignees table created successfully!');
    
    // Add indexes
    await sequelize.getQueryInterface().addIndex('consignees', ['name']);
    await sequelize.getQueryInterface().addIndex('consignees', ['status']);
    console.log('Indexes added successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating consignees table:', error);
    process.exit(1);
  }
}

createConsigneesTable();
