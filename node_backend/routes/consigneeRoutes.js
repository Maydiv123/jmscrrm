const express = require('express');
const router = express.Router();
const { Consignee } = require('../models');
const { requireAuth } = require('../middlewares/auth');

// Get all consignees
router.get('/', requireAuth, async (req, res) => {
  try {
    const consignees = await Consignee.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
    res.json(consignees);
  } catch (error) {
    console.error('Error fetching consignees:', error);
    res.status(500).json({ error: 'Failed to fetch consignees' });
  }
});

// Create new consignee
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, address, phone, email, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const consignee = await Consignee.create({
      name,
      address,
      phone,
      email,
      status: status || 'active'
    });

    res.status(201).json(consignee);
  } catch (error) {
    console.error('Error creating consignee:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Consignee with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create consignee' });
    }
  }
});

// Update consignee
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, status } = req.body;

    const consignee = await Consignee.findByPk(id);
    if (!consignee) {
      return res.status(404).json({ error: 'Consignee not found' });
    }

    await consignee.update({
      name,
      address,
      phone,
      email,
      status
    });

    res.json(consignee);
  } catch (error) {
    console.error('Error updating consignee:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Consignee with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update consignee' });
    }
  }
});

// Delete consignee
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const consignee = await Consignee.findByPk(id);
    if (!consignee) {
      return res.status(404).json({ error: 'Consignee not found' });
    }

    await consignee.destroy();
    res.json({ message: 'Consignee deleted successfully' });
  } catch (error) {
    console.error('Error deleting consignee:', error);
    res.status(500).json({ error: 'Failed to delete consignee' });
  }
});

module.exports = router;
