const mongoose = require('mongoose');

const limpiezaSchema = new mongoose.Schema({
    ultimaLimpieza: {
        type: Date,
        required: true
    },
    notas: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

limpiezaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Limpieza', limpiezaSchema);