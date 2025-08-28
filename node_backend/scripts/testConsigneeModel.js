const { sequelize, Consignee } = require('../models');

async function testConsigneeModel() {
  try {
    console.log('Testing Consignee model...');
    
    // Test if the model exists
    console.log('Consignee model:', typeof Consignee);
    console.log('Consignee.findAll:', typeof Consignee.findAll);
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection successful');
    
    // Test if table exists
    const [results] = await sequelize.query("SHOW TABLES LIKE 'consignees'");
    if (results.length > 0) {
      console.log('✓ Consignees table exists');
    } else {
      console.log('❌ Consignees table does not exist - creating it...');
      
      // Create the table manually
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS consignees (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          address TEXT,
          phone VARCHAR(255),
          email VARCHAR(255),
          status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Consignees table created');
    }
    
    // Test model methods
    const count = await Consignee.count();
    console.log(`✓ Consignee.count() works: ${count} records`);
    
    console.log('✅ Consignee model is working correctly!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing Consignee model:', error);
    process.exit(1);
  }
}

testConsigneeModel();
