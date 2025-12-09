const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const { adminOSupervisor, soloAdmin } = require('../middleware/security');

// Obtener todos los responsables
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query(`
            SELECT r.*, a.Nombre AS AreaNombre
            FROM Responsable r
            INNER JOIN Area a ON r.IdArea = a.IdArea
            ORDER BY r.Apellidos, r.Nombres
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener responsables:', err);
        res.status(500).json({ error: 'Error al obtener responsables' });
    }
});

// Obtener un responsable por ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT r.*, a.Nombre AS AreaNombre
                FROM Responsable r
                INNER JOIN Area a ON r.IdArea = a.IdArea
                WHERE r.IdResponsable = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Responsable no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al obtener responsable:', err);
        res.status(500).json({ error: 'Error al obtener responsable' });
    }
});

// Crear nuevo responsable (Solo Admin y Supervisor)
router.post('/', adminOSupervisor, async (req, res) => {
    try {
        const { nombres, apellidos, dni, telefono, correo, idArea } = req.body;

        const pool = await getConnection();
        const result = await pool.request()
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('dni', sql.Char, dni || null)
            .input('telefono', sql.NVarChar, telefono || null)
            .input('correo', sql.NVarChar, correo || null)
            .input('idArea', sql.Int, idArea)
            .query(`
                INSERT INTO Responsable (Nombres, Apellidos, DNI, Telefono, Correo, IdArea)
                OUTPUT INSERTED.IdResponsable
                VALUES (@nombres, @apellidos, @dni, @telefono, @correo, @idArea)
            `);

        res.json({
            idResponsable: result.recordset[0].IdResponsable,
            mensaje: 'Responsable creado exitosamente'
        });

    } catch (err) {
        console.error('Error al crear responsable:', err);
        res.status(500).json({ error: 'Error al crear responsable' });
    }
});

// Actualizar responsable (Solo Admin y Supervisor)
router.put('/:id', adminOSupervisor, async (req, res) => {
    try {
        const { nombres, apellidos, dni, telefono, correo, idArea } = req.body;

        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('dni', sql.Char, dni || null)
            .input('telefono', sql.NVarChar, telefono || null)
            .input('correo', sql.NVarChar, correo || null)
            .input('idArea', sql.Int, idArea)
            .query(`
                UPDATE Responsable 
                SET Nombres = @nombres,
                    Apellidos = @apellidos,
                    DNI = @dni,
                    Telefono = @telefono,
                    Correo = @correo,
                    IdArea = @idArea
                WHERE IdResponsable = @id
            `);

        res.json({ mensaje: 'Responsable actualizado exitosamente' });

    } catch (err) {
        console.error('Error al actualizar responsable:', err);
        res.status(500).json({ error: 'Error al actualizar responsable' });
    }
});

// Eliminar responsable (Solo Admin)
router.delete('/:id', soloAdmin, async (req, res) => {
    try {
        const pool = await getConnection();

        // Verificar si tiene bienes asignados
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) AS total FROM Bien WHERE IdResponsable = @id');

        if (check.recordset[0].total > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el responsable porque tiene bienes asignados'
            });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Responsable WHERE IdResponsable = @id');

        res.json({ mensaje: 'Responsable eliminado exitosamente' });

    } catch (err) {
        console.error('Error al eliminar responsable:', err);
        res.status(500).json({ error: 'Error al eliminar responsable' });
    }
});

module.exports = router;
