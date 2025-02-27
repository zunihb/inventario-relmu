const Inventario = require('../models/Inventario');
const InventarioHistorial = require('../models/InventarioHistorial');

exports.getItems = async (req, res) => {
    try {
        const items = await Inventario.find().sort({ name: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addItem = async (req, res) => {
    try {
        const item = new Inventario(req.body);
        const savedItem = await item.save();

        // Registrar en el historial
        await new InventarioHistorial({
            itemId: savedItem._id,
            type: 'create',
            newQuantity: savedItem.quantity,
            notes: savedItem.notes
        }).save();

        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const item = await Inventario.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }

        const oldQuantity = item.quantity;
        
        // Actualizar solo los campos proporcionados
        Object.assign(item, req.body);
        const updatedItem = await item.save();

        // Si la cantidad cambió, registrar en el historial
        if (oldQuantity !== updatedItem.quantity) {
            await new InventarioHistorial({
                itemId: updatedItem._id,
                type: 'update',
                oldQuantity: oldQuantity,
                newQuantity: updatedItem.quantity,
                notes: updatedItem.notes
            }).save();
        }

        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await Inventario.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Artículo no encontrado' });
        }

        // Registrar en el historial antes de eliminar
        await new InventarioHistorial({
            itemId: item._id,
            type: 'delete',
            oldQuantity: item.quantity,
            notes: 'Artículo eliminado'
        }).save();

        await item.delete();
        res.json({ message: 'Artículo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getItemHistory = async (req, res) => {
    try {
        const history = await InventarioHistorial
            .find({ itemId: req.params.id })
            .sort({ timestamp: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};