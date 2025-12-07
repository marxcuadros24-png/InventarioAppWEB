const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Obtener auditoría con filtros
router.get('/', async (req, res) => {
    try {
        const { tabla, usuario, fechaInicio, fechaFin } = req.query;
        const pool = await getConnection();

        let query = 'SELECT * FROM Auditoria WHERE 1=1';
        const request = pool.request();

        if (tabla) {
            query += ' AND Tabla = @tabla';
            request.input('tabla', sql.NVarChar, tabla);
        }

        if (usuario) {
            query += ' AND Usuario = @usuario';
            request.input('usuario', sql.NVarChar, usuario);
        }

        if (fechaInicio) {
            query += ' AND Fecha >= @fechaInicio';
            request.input('fechaInicio', sql.DateTime, fechaInicio);
        }

        if (fechaFin) {
            query += ' AND Fecha <= @fechaFin';
            request.input('fechaFin', sql.DateTime, fechaFin);
        }

        query += ' ORDER BY Fecha DESC';

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (err) {
        console.error('Error al obtener auditoría:', err);
        res.status(500).json({ error: 'Error al obtener auditoría' });
    }
});

module.exports = router;
