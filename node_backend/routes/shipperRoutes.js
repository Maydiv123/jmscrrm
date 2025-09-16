const express = require('express');
const shipperController = require('../controllers/shipperController');
const { attachment } = require('../middlewares/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(attachment);

// GET /api/shippers - Get all shippers
router.get('/', shipperController.getAllShippers);

// GET /api/shippers/:id - Get shipper by ID
router.get('/:id', shipperController.getShipperById);

// POST /api/shippers - Create new shipper
router.post('/', shipperController.createShipper);

// PUT /api/shippers/:id - Update shipper
router.put('/:id', shipperController.updateShipper);

// DELETE /api/shippers/:id - Delete shipper
router.delete('/:id', shipperController.deleteShipper);

module.exports = router;
