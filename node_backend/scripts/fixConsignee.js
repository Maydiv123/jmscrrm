const { sequelize } = require('../models');

async function fixConsignee() {
  try {
    console.log('🔧 Fixing Consignee model...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Check if consignees table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'consignees'");
    
    if (tables.length === 0) {
      console.log('❌ Consignees table not found - creating it...');
      
      // Create the table
      await sequelize.query(`
        CREATE TABLE consignees (
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
      console.log('✅ Consignees table created');
    } else {
      console.log('✅ Consignees table already exists');
    }
    
    // Test if we can query the table
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM consignees');
    console.log(`✅ Table query works: ${results[0].count} records found`);
    
    // Test inserting a sample record
    await sequelize.query(`
      INSERT INTO consignees (name, address, phone, email, status) 
      VALUES ('Test Company', 'Test Address', '1234567890', 'test@example.com', 'active')
      ON DUPLICATE KEY UPDATE name = name
    `);
    console.log('✅ Sample record inserted/updated');
    
    // Test reading records
    const [consignees] = await sequelize.query('SELECT * FROM consignees');
    console.log(`✅ Read test successful: ${consignees.length} consignees found`);
    
    console.log('\n🎉 Consignee model should now work!');
    console.log('Restart your backend server and try adding a consignee again.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing consignee:', error);
    process.exit(1);
  }
}

fixConsignee();
