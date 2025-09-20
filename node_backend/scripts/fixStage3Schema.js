const { sequelize } = require('../models');

async function fixStage3Schema() {
  try {
    console.log('Fixing stage3_data table schema...');
    
    // List of fields that should be in stage3_data but might be missing
    const fieldsToAdd = [
      { name: 'ocean_freight', type: 'DECIMAL(10,2)', nullable: true },
      { name: 'edi_job_no', type: 'VARCHAR(50)', nullable: true },
      { name: 'edi_date', type: 'DATE', nullable: true },
      { name: 'original_doct_recd_date', type: 'DATE', nullable: true },
      { name: 'debit_note', type: 'VARCHAR(50)', nullable: true },
      { name: 'debit_paid_by', type: 'VARCHAR(100)', nullable: true },
      { name: 'duty_amount', type: 'DECIMAL(10,2)', nullable: true },
      { name: 'duty_paid_by', type: 'VARCHAR(100)', nullable: true },
      { name: 'destination_charges', type: 'DECIMAL(10,2)', nullable: true },
      { name: 'filing_requirement', type: 'TEXT', nullable: true },
      { name: 'checklist_sent_date', type: 'DATE', nullable: true },
      { name: 'bill_of_entry_no', type: 'VARCHAR(50)', nullable: true },
      { name: 'bill_of_entry_date', type: 'DATE', nullable: true },
      { name: 'approval_date', type: 'DATE', nullable: true },
      { name: 'created_by', type: 'INT', nullable: true },
      { name: 'updated_by', type: 'INT', nullable: true }
    ];

    // Check which columns already exist
    const [existingColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'stage3_data' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME);
    console.log('Existing columns:', existingColumnNames);

    // Add missing columns
    for (const field of fieldsToAdd) {
      if (!existingColumnNames.includes(field.name)) {
        console.log(`Adding column: ${field.name}`);
        await sequelize.query(`
          ALTER TABLE stage3_data 
          ADD COLUMN ${field.name} ${field.type} ${field.nullable ? 'NULL' : 'NOT NULL'}
        `);
        console.log(`✓ Added ${field.name} column`);
      } else {
        console.log(`✓ Column ${field.name} already exists`);
      }
    }

    console.log('Stage3 schema fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Schema fix failed:', error);
    process.exit(1);
  }
}

fixStage3Schema();
