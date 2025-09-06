require('dotenv').config();
const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
});

async function addUpdatedByColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    // Check if updated_by column exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'stage1_data' 
      AND COLUMN_NAME = 'updated_by'
    `);

    if (columns.length === 0) {
      // Add updated_by column
      await sequelize.query(`
        ALTER TABLE stage1_data 
        ADD COLUMN updated_by INT
      `);
      console.log('✅ Added updated_by column to stage1_data');

      // Add foreign key constraint
      await sequelize.query(`
        ALTER TABLE stage1_data 
        ADD CONSTRAINT fk_stage1_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id)
      `);
      console.log('✅ Added foreign key constraint for updated_by');
    } else {
      console.log('✅ updated_by column already exists');
    }

    console.log('🎉 All columns are ready!');
    
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
  } finally {
    await sequelize.close();
  }
}

addUpdatedByColumn();
