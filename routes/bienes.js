const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const { adminOSupervisor, soloAdmin } = require('../middleware/security');

// Obtener todos los bienes con detalles
router.get('/', async (req, res) => {
    try {
        const { estado, area, categoria, busqueda } = req.query;
        const pool = await getConnection();

        let query = 'SELECT * FROM vw_BienesDetallado WHERE 1=1';
        const request = pool.request();

        if (estado) {
            query += ' AND Estado = @estado';
            request.input('estado', sql.NVarChar, estado);
        }

        if (area) {
            query += ' AND Area = @area';
            request.input('area', sql.NVarChar, area);
        }

        if (categoria) {
            query += ' AND Categoria = @categoria';
            request.input('categoria', sql.NVarChar, categoria);
        }

        if (busqueda) {
            query += ' AND (CodigoPatrimonial LIKE @busqueda OR Bien LIKE @busqueda OR Responsable LIKE @busqueda)';
            request.input('busqueda', sql.NVarChar, `%${busqueda}%`);
        }

        query += ' ORDER BY FechaAdquisicion DESC';

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (err) {
        console.error('Error al obtener bienes:', err);
        res.status(500).json({ error: 'Error al obtener bienes' });
    }
});

// Obtener un bien por ID (incluye IDs para edición)
router.get('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT 
                    b.IdBien,
                    b.CodigoPatrimonial,
                    b.Nombre AS Bien,
                    b.Modelo,
                    b.Observacion,
                    b.IdCategoria,
                    b.IdMarca,
                    b.IdEstado,
                    b.IdArea,
                    b.IdResponsable,
                    b.IdAdquisicion,
                    b.IdEspecificacion,
                    c.Nombre AS Categoria,
                    c.IdTipoBien,
                    tb.Nombre AS TipoBien,
                    m.Nombre AS Marca,
                    e.Nombre AS Estado,
                    a.Nombre AS Area,
                    CONCAT(r.Nombres, ' ', r.Apellidos) AS Responsable,
                    ad.FechaAdquisicion,
                    ad.Costo,
                    ad.Proveedor,
                    ad.IdMetodo,
                    ma.NombreMetodo AS MetodoAdquisicion,
                    et.Procesador,
                    et.Memoria,
                    et.Almacenamiento,
                    et.Pantalla,
                    et.Otros
                FROM Bien b
                LEFT JOIN Categoria c ON b.IdCategoria = c.IdCategoria
                LEFT JOIN TipoBien tb ON c.IdTipoBien = tb.IdTipoBien
                LEFT JOIN Marca m ON b.IdMarca = m.IdMarca
                LEFT JOIN Estado e ON b.IdEstado = e.IdEstado
                LEFT JOIN Area a ON b.IdArea = a.IdArea
                LEFT JOIN Responsable r ON b.IdResponsable = r.IdResponsable
                LEFT JOIN Adquisicion ad ON b.IdAdquisicion = ad.IdAdquisicion
                LEFT JOIN MetodoAdquisicion ma ON ad.IdMetodo = ma.IdMetodo
                LEFT JOIN EspecificacionTecnica et ON b.IdEspecificacion = et.IdEspecificacion
                WHERE b.IdBien = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Bien no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al obtener bien:', err);
        res.status(500).json({ error: 'Error al obtener bien' });
    }
});

// Crear nuevo bien (Solo Admin y Supervisor)
router.post('/', adminOSupervisor, async (req, res) => {
    console.log('POST /api/bienes - Petición recibida');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    try {
        const {
            codigoPatrimonial, nombre, idCategoria, idMarca, idEstado,
            idArea, idResponsable, observacion, modelo,
            // Adquisición
            fechaAdquisicion, costo, proveedor, idMetodo,
            // Especificaciones técnicas (opcional)
            procesador, memoria, almacenamiento, pantalla, otros
        } = req.body;

        const pool = await getConnection();
        const transaction = pool.transaction();

        await transaction.begin();

        try {
            // 1. Crear especificación técnica si hay datos
            let idEspecificacion = null;
            if (procesador || memoria || almacenamiento || pantalla || otros) {
                const especResult = await transaction.request()
                    .input('procesador', sql.NVarChar, procesador || null)
                    .input('memoria', sql.NVarChar, memoria || null)
                    .input('almacenamiento', sql.NVarChar, almacenamiento || null)
                    .input('pantalla', sql.NVarChar, pantalla || null)
                    .input('otros', sql.NVarChar, otros || null)
                    .query(`
                        DECLARE @InsertedIds TABLE (Id INT);
                        INSERT INTO EspecificacionTecnica (Procesador, Memoria, Almacenamiento, Pantalla, Otros)
                        OUTPUT INSERTED.IdEspecificacion INTO @InsertedIds
                        VALUES (@procesador, @memoria, @almacenamiento, @pantalla, @otros);
                        SELECT Id AS IdEspecificacion FROM @InsertedIds;
                    `);
                idEspecificacion = especResult.recordset[0].IdEspecificacion;
            }

            // 2. Crear adquisición
            const adqResult = await transaction.request()
                .input('fechaAdquisicion', sql.Date, fechaAdquisicion)
                .input('costo', sql.Decimal(12, 2), costo)
                .input('proveedor', sql.NVarChar, proveedor || null)
                .input('idMetodo', sql.Int, idMetodo)
                .query(`
                    DECLARE @InsertedIds TABLE (Id INT);
                    INSERT INTO Adquisicion (FechaAdquisicion, Costo, Proveedor, IdMetodo)
                    OUTPUT INSERTED.IdAdquisicion INTO @InsertedIds
                    VALUES (@fechaAdquisicion, @costo, @proveedor, @idMetodo);
                    SELECT Id AS IdAdquisicion FROM @InsertedIds;
                `);
            const idAdquisicion = adqResult.recordset[0].IdAdquisicion;

            // 3. Crear bien
            const bienResult = await transaction.request()
                .input('codigoPatrimonial', sql.NVarChar, codigoPatrimonial)
                .input('nombre', sql.NVarChar, nombre)
                .input('idCategoria', sql.Int, idCategoria)
                .input('idMarca', sql.Int, idMarca || null)
                .input('idEstado', sql.Int, idEstado)
                .input('idEspecificacion', sql.Int, idEspecificacion)
                .input('idAdquisicion', sql.Int, idAdquisicion)
                .input('idArea', sql.Int, idArea)
                .input('idResponsable', sql.Int, idResponsable || null)
                .input('observacion', sql.NVarChar, observacion || null)
                .input('modelo', sql.VarChar, modelo || null)
                .query(`
                    DECLARE @InsertedIds TABLE (Id INT);
                    INSERT INTO Bien (CodigoPatrimonial, Nombre, IdCategoria, IdMarca, IdEstado, 
                                     IdEspecificacion, IdAdquisicion, IdArea, IdResponsable, Observacion, Modelo)
                    OUTPUT INSERTED.IdBien INTO @InsertedIds
                    VALUES (@codigoPatrimonial, @nombre, @idCategoria, @idMarca, @idEstado,
                           @idEspecificacion, @idAdquisicion, @idArea, @idResponsable, @observacion, @modelo);
                    SELECT Id AS IdBien FROM @InsertedIds;
                `);

            await transaction.commit();

            res.json({
                idBien: bienResult.recordset[0].IdBien,
                mensaje: 'Bien creado exitosamente'
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Error al crear bien:', err);
        console.error('Error detallado:', {
            message: err.message,
            code: err.code,
            number: err.number,
            state: err.state,
            class: err.class,
            serverName: err.serverName,
            procName: err.procName,
            lineNumber: err.lineNumber
        });
        res.status(500).json({
            error: 'Error al crear bien',
            detalle: err.message,
            codigo: err.number || err.code
        });
    }
});

// Actualizar bien (Solo Admin y Supervisor)
router.put('/:id', adminOSupervisor, async (req, res) => {
    try {
        const {
            nombre, idCategoria, idMarca, idEstado,
            idArea, idResponsable, observacion
        } = req.body;

        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar, nombre)
            .input('idCategoria', sql.Int, idCategoria)
            .input('idMarca', sql.Int, idMarca || null)
            .input('idEstado', sql.Int, idEstado)
            .input('idArea', sql.Int, idArea)
            .input('idResponsable', sql.Int, idResponsable || null)
            .input('observacion', sql.NVarChar, observacion || null)
            .query(`
                UPDATE Bien 
                SET Nombre = @nombre,
                    IdCategoria = @idCategoria,
                    IdMarca = @idMarca,
                    IdEstado = @idEstado,
                    IdArea = @idArea,
                    IdResponsable = @idResponsable,
                    Observacion = @observacion
                WHERE IdBien = @id
            `);

        res.json({ mensaje: 'Bien actualizado exitosamente' });

    } catch (err) {
        console.error('Error al actualizar bien:', err);
        res.status(500).json({ error: 'Error al actualizar bien' });
    }
});

// Eliminar bien (Solo Admin)
router.delete('/:id', soloAdmin, async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Bien WHERE IdBien = @id');

        res.json({ mensaje: 'Bien eliminado exitosamente' });

    } catch (err) {
        console.error('Error al eliminar bien:', err);
        res.status(500).json({ error: 'Error al eliminar bien' });
    }
});

module.exports = router;
