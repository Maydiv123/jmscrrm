require('dotenv').config();
const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql'
});

async function fixProductionDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check current table structure
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'stage1_data' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Current stage1_data columns:', columns.map(col => col.COLUMN_NAME));

    // Check if created_by exists
    const hasCreatedBy = columns.some(col => col.COLUMN_NAME === 'created_by');
    const hasUpdatedBy = columns.some(col => col.COLUMN_NAME === 'updated_by');

    console.log('created_by exists:', hasCreatedBy);
    console.log('updated_by exists:', hasUpdatedBy);

    // Add created_by if missing
    if (!hasCreatedBy) {
      await sequelize.query(`
        ALTER TABLE stage1_data 
        ADD COLUMN created_by INT
      `);
      console.log('✅ Added created_by column');
    } else {
      console.log('✅ created_by column already exists');
    }

    // Add updated_by if missing
    if (!hasUpdatedBy) {
      await sequelize.query(`
        ALTER TABLE stage1_data 
        ADD COLUMN updated_by INT
      `);
      console.log('✅ Added updated_by column');
    } else {
      console.log('✅ updated_by column already exists');
    }

    // Add foreign key constraints
    try {
      await sequelize.query(`
        ALTER TABLE stage1_data 
        ADD CONSTRAINT fk_stage1_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id)
      `);
      console.log('✅ Added foreign key constraint for created_by');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('✅ Foreign key constraint for created_by already exists');
      } else {
        console.log('⚠️ Could not add foreign key for created_by:', error.message);
      }
    }

    try {
      await sequelize.query(`
        ALTER TABLE stage1_data 
        ADD CONSTRAINT fk_stage1_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id)
      `);
      console.log('✅ Added foreign key constraint for updated_by');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('✅ Foreign key constraint for updated_by already exists');
      } else {
        console.log('⚠️ Could not add foreign key for updated_by:', error.message);
      }
    }

    // Verify final structure
    const [finalColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'stage1_data' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Final stage1_data columns:', finalColumns.map(col => col.COLUMN_NAME));
    console.log('🎉 Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    console.error('Full error:', error);
  } finally {
    await sequelize.close();
  }
}

fixProductionDatabase();
