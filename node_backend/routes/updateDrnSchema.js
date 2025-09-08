const express = require('express');
const { sequelize } = require('../models');
const router = express.Router();

// Migration endpoint to update DRN schema for multiple entries
router.post('/update-drn-schema', async (req, res) => {
  try {
    console.log('Updating DRN schema to support multiple DRN entries...');
    
    // Add new drn_entries JSON column
    await sequelize.query(`
      ALTER TABLE stage2_data 
      ADD COLUMN drn_entries JSON NULL
    `);
    console.log('✓ Added drn_entries JSON column to stage2_data');
    
    // Migrate existing data to new structure
    await sequelize.query(`
      UPDATE stage2_data 
      SET drn_entries = JSON_ARRAY(
        JSON_OBJECT(
          'drn_no', COALESCE(drn_no, ''),
          'documents_type', COALESCE(documents_type, ''),
          'irn_numbers', COALESCE(irn_numbers, JSON_ARRAY())
        )
      )
      WHERE drn_no IS NOT NULL OR documents_type IS NOT NULL OR irn_numbers IS NOT NULL
    `);
    console.log('✓ Migrated existing data to drn_entries structure');
    
    // Remove old columns
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN drn_no`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN documents_type`);
    await sequelize.query(`ALTER TABLE stage2_data DROP COLUMN irn_numbers`);
    console.log('✓ Removed old DRN-related columns');
    
    console.log('🎉 DRN schema update completed successfully!');
    res.json({ success: true, message: 'DRN schema update completed successfully' });
  } catch (error) {
    console.error('❌ DRN schema update failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
