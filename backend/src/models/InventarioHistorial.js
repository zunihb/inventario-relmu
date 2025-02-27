const mongoose = require('mongoose');

const inventarioHistorialSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventario',
        required: true
    },
    type: {
        type: String,
        enum: ['create', 'update', 'delete'],
        required: true
    },
    oldQuantity: Number,
    newQuantity: Number,
    notes: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('InventarioHistorial', inventarioHistorialSchema);