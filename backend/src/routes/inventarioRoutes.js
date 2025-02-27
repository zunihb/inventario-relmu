const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Rutas para inventario
router.get('/', inventarioController.getItems);
router.post('/', inventarioController.addItem);
router.put('/:id', inventarioController.updateItem);
router.delete('/:id', inventarioController.deleteItem);
router.get('/:id/history', inventarioController.getItemHistory);

module.exports = router;