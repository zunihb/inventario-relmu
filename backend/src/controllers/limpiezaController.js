const Limpieza = require('../models/Limpieza');

exports.getRegistros = async (req, res) => {
    try {
        const registros = await Limpieza.find().sort({ ultimaLimpieza: -1 });
        res.json(registros);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addRegistro = async (req, res) => {
    try {
        const registro = new Limpieza(req.body);
        const savedRegistro = await registro.save();
        res.status(201).json(savedRegistro);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateRegistro = async (req, res) => {
    try {
        const registro = await Limpieza.findById(req.params.id);
        if (!registro) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        
        Object.assign(registro, req.body);
        const updatedRegistro = await registro.save();
        res.json(updatedRegistro);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteRegistro = async (req, res) => {
    try {
        const registro = await Limpieza.findById(req.params.id);
        if (!registro) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        await registro.delete();
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};