const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Obtener todos los movimientos
router.get('/', async (req, res) => {
    try {
        const { idBien, fechaInicio, fechaFin } = req.query;
        const pool = await getConnection();

        let query = `
            SELECT m.*, 
                   b.CodigoPatrimonial, b.Nombre AS BienNombre,
                   tm.NombreMovimiento,
                   u.NombreUsuario
            FROM Movimiento m
            INNER JOIN Bien b ON m.IdBien = b.IdBien
            INNER JOIN TipoMovimiento tm ON m.IdTipoMovimiento = tm.IdTipoMovimiento
            INNER JOIN Usuario u ON m.IdUsuario = u.IdUsuario
            WHERE 1=1
        `;

        const request = pool.request();

        if (idBien) {
            query += ' AND m.IdBien = @idBien';
            request.input('idBien', sql.Int, idBien);
        }

        if (fechaInicio) {
            query += ' AND m.FechaMovimiento >= @fechaInicio';
            request.input('fechaInicio', sql.Date, fechaInicio);
        }

        if (fechaFin) {
            query += ' AND m.FechaMovimiento <= @fechaFin';
            request.input('fechaFin', sql.Date, fechaFin);
        }

        query += ' ORDER BY m.FechaMovimiento DESC';

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (err) {
        console.error('Error al obtener movimientos:', err);
        res.status(500).json({ error: 'Error al obtener movimientos' });
    }
});

// Crear nuevo movimiento
router.post('/', async (req, res) => {
    try {
        const { idBien, idTipoMovimiento, descripcion, idUsuario } = req.body;

        // Validaciones
        if (!idBien || !idTipoMovimiento || !idUsuario) {
            return res.status(400).json({
                error: 'idBien, idTipoMovimiento e idUsuario son requeridos'
            });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('idBien', sql.Int, idBien)
            .input('idTipoMovimiento', sql.Int, idTipoMovimiento)
            .input('descripcion', sql.NVarChar(500), descripcion || null)
            .input('idUsuario', sql.Int, idUsuario)
            .input('fechaMovimiento', sql.DateTime, new Date())
            .query(`
                INSERT INTO Movimiento (IdBien, IdTipoMovimiento, Descripcion, IdUsuario, FechaMovimiento)
                OUTPUT INSERTED.IdMovimiento
                VALUES (@idBien, @idTipoMovimiento, @descripcion, @idUsuario, @fechaMovimiento)
            `);

        res.json({
            idMovimiento: result.recordset[0].IdMovimiento,
            mensaje: 'Movimiento registrado exitosamente'
        });

    } catch (err) {
        console.error('Error al crear movimiento:', err);
        res.status(500).json({ error: err.message || 'Error al crear movimiento' });
    }
});

module.exports = router;
