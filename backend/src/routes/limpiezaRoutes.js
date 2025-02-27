const express = require('express');
const router = express.Router();
const limpiezaController = require('../controllers/limpiezaController');

// Rutas para registros de limpieza
router.get('/', limpiezaController.getRegistros);
router.post('/', limpiezaController.addRegistro);
router.put('/:id', limpiezaController.updateRegistro);
router.delete('/:id', limpiezaController.deleteRegistro);

module.exports = router;