const { Shipper } = require('../models');

// Get all shippers
const getAllShippers = async (req, res) => {
  try {
    const shippers = await Shipper.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(shippers);
  } catch (error) {
    console.error('Error fetching shippers:', error);
    res.status(500).json({ error: 'Failed to fetch shippers' });
  }
};

// Get shipper by ID
const getShipperById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipper = await Shipper.findByPk(id);
    
    if (!shipper) {
      return res.status(404).json({ error: 'Shipper not found' });
    }
    
    res.json(shipper);
  } catch (error) {
    console.error('Error fetching shipper:', error);
    res.status(500).json({ error: 'Failed to fetch shipper' });
  }
};

// Create new shipper
const createShipper = async (req, res) => {
  try {
    const { name, address, phone, email, status = 'active' } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    const shipper = await Shipper.create({
      name,
      address,
      phone,
      email,
      status,
      created_by: req.user?.id,
      updated_by: req.user?.id
    });

    res.status(201).json(shipper);
  } catch (error) {
    console.error('Error creating shipper:', error);
    res.status(500).json({ error: 'Failed to create shipper' });
  }
};

// Update shipper
const updateShipper = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, status } = req.body;

    const shipper = await Shipper.findByPk(id);
    if (!shipper) {
      return res.status(404).json({ error: 'Shipper not found' });
    }

    await shipper.update({
      name,
      address,
      phone,
      email,
      status,
      updated_by: req.user?.id
    });

    res.json(shipper);
  } catch (error) {
    console.error('Error updating shipper:', error);
    res.status(500).json({ error: 'Failed to update shipper' });
  }
};

// Delete shipper
const deleteShipper = async (req, res) => {
  try {
    const { id } = req.params;

    const shipper = await Shipper.findByPk(id);
    if (!shipper) {
      return res.status(404).json({ error: 'Shipper not found' });
    }

    await shipper.destroy();
    res.json({ message: 'Shipper deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipper:', error);
    res.status(500).json({ error: 'Failed to delete shipper' });
  }
};

module.exports = {
  getAllShippers,
  getShipperById,
  createShipper,
  updateShipper,
  deleteShipper
};
