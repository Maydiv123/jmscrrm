const { sequelize } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Creating shippers table...');
      
      await queryInterface.createTable('shippers', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        address: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        phone: {
          type: Sequelize.STRING,
          allowNull: true
        },
        email: {
          type: Sequelize.STRING,
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active'
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        updated_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });
      
      console.log('✓ Shippers table created successfully');
      
      // Insert sample data
      await queryInterface.bulkInsert('shippers', [
        {
          name: 'Ocean Shipping Lines',
          address: 'Port Authority, Mumbai',
          phone: '+91-22-12345678',
          email: 'info@oceanshipping.com',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Global Cargo Ltd.',
          address: 'Harbor Terminal, Chennai',
          phone: '+91-44-87654321',
          email: 'contact@globalcargo.com',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Maritime Logistics',
          address: 'Port Complex, Kolkata',
          phone: '+91-33-11223344',
          email: 'support@maritimelogistics.com',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'International Freight',
          address: 'Container Terminal, Kochi',
          phone: '+91-484-55667788',
          email: 'info@intlfreight.com',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      
      console.log('✓ Sample shipper data inserted');
      console.log('🎉 Shipper table migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Dropping shippers table...');
      await queryInterface.dropTable('shippers');
      console.log('✓ Shippers table dropped successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};

