const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Obtener estadísticas del dashboard
router.get('/stats', async (req, res) => {
    try {
        const pool = await getConnection();

        // Total de bienes
        const totalBienes = await pool.request()
            .query('SELECT COUNT(*) AS total FROM Bien');

        // Bienes por estado
        const porEstado = await pool.request()
            .query(`
                SELECT e.Nombre AS estado, COUNT(b.IdBien) AS cantidad
                FROM Estado e
                LEFT JOIN Bien b ON e.IdEstado = b.IdEstado
                GROUP BY e.Nombre
                ORDER BY cantidad DESC
            `);

        // Bienes por área
        const porArea = await pool.request()
            .query(`
                SELECT a.Nombre AS area, COUNT(b.IdBien) AS cantidad
                FROM Area a
                LEFT JOIN Bien b ON a.IdArea = b.IdArea
                GROUP BY a.Nombre
                ORDER BY cantidad DESC
            `);

        // Valor total del inventario
        const valorTotal = await pool.request()
            .query(`
                SELECT SUM(ad.Costo) AS valorTotal
                FROM Bien b
                INNER JOIN Adquisicion ad ON b.IdAdquisicion = ad.IdAdquisicion
            `);

        // Últimos movimientos
        const ultimosMovimientos = await pool.request()
            .query(`
                SELECT TOP 10 
                    m.FechaMovimiento,
                    b.CodigoPatrimonial,
                    b.Nombre AS bien,
                    tm.NombreMovimiento AS tipo,
                    u.NombreUsuario AS usuario
                FROM Movimiento m
                INNER JOIN Bien b ON m.IdBien = b.IdBien
                INNER JOIN TipoMovimiento tm ON m.IdTipoMovimiento = tm.IdTipoMovimiento
                INNER JOIN Usuario u ON m.IdUsuario = u.IdUsuario
                ORDER BY m.FechaMovimiento DESC
            `);

        // Bienes por categoría
        const porCategoria = await pool.request()
            .query(`
                SELECT TOP 5
                    c.Nombre AS categoria,
                    COUNT(b.IdBien) AS cantidad
                FROM Categoria c
                LEFT JOIN Bien b ON c.IdCategoria = b.IdCategoria
                GROUP BY c.Nombre
                ORDER BY cantidad DESC
            `);

        res.json({
            totalBienes: totalBienes.recordset[0].total,
            valorTotal: valorTotal.recordset[0].valorTotal || 0,
            porEstado: porEstado.recordset,
            porArea: porArea.recordset,
            porCategoria: porCategoria.recordset,
            ultimosMovimientos: ultimosMovimientos.recordset
        });

    } catch (err) {
        console.error('Error al obtener estadísticas:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
