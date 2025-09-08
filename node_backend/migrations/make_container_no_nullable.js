const db = require('../config/db');

async function makeContainerNoNullable() {
  try {
    console.log('Making container_no nullable in stage1_containers table...');
    
    // Check if stage1_containers table exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'stage1_containers'");
    
    if (tables.length === 0) {
      console.log('stage1_containers table does not exist. Creating it...');
      
      // Create the table with nullable container_no
      await db.execute(`
        CREATE TABLE stage1_containers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          job_id INT NOT NULL,
          container_no VARCHAR(50) NULL,
          container_size VARCHAR(10) NOT NULL DEFAULT '20',
          date_of_arrival DATE NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (job_id) REFERENCES pipeline_jobs(id) ON DELETE CASCADE
        )
      `);
      console.log('stage1_containers table created successfully');
    } else {
      console.log('stage1_containers table exists. Updating container_no to be nullable...');
      
      // Make container_no nullable
      await db.execute(`
        ALTER TABLE stage1_containers 
        MODIFY COLUMN container_no VARCHAR(50) NULL
      `);
      console.log('container_no field updated to be nullable');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run the migration
makeContainerNoNullable()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });


