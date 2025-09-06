require('dotenv').config();
const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
});

async function addMissingColumns() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    // Add missing columns to stage1_data table
    await sequelize.query(`
      ALTER TABLE stage1_data 
      ADD COLUMN created_by INT,
      ADD COLUMN updated_by INT
    `);
    console.log('✅ Added created_by and updated_by columns to stage1_data');

    // Add foreign key constraints
    await sequelize.query(`
      ALTER TABLE stage1_data 
      ADD CONSTRAINT fk_stage1_created_by 
      FOREIGN KEY (created_by) REFERENCES users(id)
    `);
    console.log('✅ Added foreign key constraint for created_by');

    await sequelize.query(`
      ALTER TABLE stage1_data 
      ADD CONSTRAINT fk_stage1_updated_by 
      FOREIGN KEY (updated_by) REFERENCES users(id)
    `);
    console.log('✅ Added foreign key constraint for updated_by');

    console.log('🎉 All columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
  } finally {
    await sequelize.close();
  }
}

addMissingColumns();
