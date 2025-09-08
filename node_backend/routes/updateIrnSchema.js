const express = require('express');
const { sequelize } = require('../models');
const router = express.Router();

// Migration endpoint to update IRN schema
router.post('/update-irn-schema', async (req, res) => {
  try {
    console.log('Updating IRN schema to support multiple IRN numbers...');
    
    // Add new irn_numbers JSON column
    await sequelize.query(`
      ALTER TABLE stage2_data 
      ADD COLUMN irn_numbers JSON NULL
    `);
    console.log('✓ Added irn_numbers JSON column to stage2_data');
    
    // Migrate existing irn_no data to irn_numbers array
    await sequelize.query(`
      UPDATE stage2_data 
      SET irn_numbers = JSON_ARRAY(irn_no)
      WHERE irn_no IS NOT NULL AND irn_no != ''
    `);
    console.log('✓ Migrated existing irn_no data to irn_numbers array');
    
    // Remove old irn_no column
    await sequelize.query(`
      ALTER TABLE stage2_data 
      DROP COLUMN irn_no
    `);
    console.log('✓ Removed old irn_no column');
    
    console.log('🎉 IRN schema update completed successfully!');
    res.json({ success: true, message: 'IRN schema update completed successfully' });
  } catch (error) {
    console.error('❌ IRN schema update failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
