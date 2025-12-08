const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// ========================
// OBTENER TODOS LOS CATÁLOGOS
// ========================
router.get('/all', async (req, res) => {
    try {
        const pool = await getConnection();

        const [tipoBien, categorias, estados, areas, marcas, metodos, tipoMovimiento, roles] = await Promise.all([
            pool.request().query('SELECT * FROM TipoBien ORDER BY Nombre'),
            pool.request().query('SELECT c.*, tb.Nombre AS TipoBienNombre FROM Categoria c INNER JOIN TipoBien tb ON c.IdTipoBien = tb.IdTipoBien ORDER BY c.Nombre'),
            pool.request().query('SELECT * FROM Estado ORDER BY Nombre'),
            pool.request().query('SELECT * FROM Area ORDER BY Nombre'),
            pool.request().query('SELECT * FROM Marca ORDER BY Nombre'),
            pool.request().query('SELECT * FROM MetodoAdquisicion ORDER BY NombreMetodo'),
            pool.request().query('SELECT * FROM TipoMovimiento ORDER BY NombreMovimiento'),
            pool.request().query('SELECT * FROM RolUsuario ORDER BY NombreRol')
        ]);

        res.json({
            tipoBien: tipoBien.recordset,
            categorias: categorias.recordset,
            estados: estados.recordset,
            areas: areas.recordset,
            marcas: marcas.recordset,
            metodosAdquisicion: metodos.recordset,
            tiposMovimiento: tipoMovimiento.recordset,
            roles: roles.recordset
        });

    } catch (err) {
        console.error('Error al obtener catálogos:', err);
        res.status(500).json({ error: 'Error al obtener catálogos' });
    }
});

// ========================
// MARCAS
// ========================
router.get('/marcas', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Marca ORDER BY Nombre');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener marcas:', err);
        res.status(500).json({ error: 'Error al obtener marcas' });
    }
});

router.post('/marcas', async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.NVarChar(100), nombre.trim())
            .query('INSERT INTO Marca (Nombre) OUTPUT INSERTED.IdMarca, INSERTED.Nombre VALUES (@nombre)');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear marca:', err);
        res.status(500).json({ error: 'Error al crear marca' });
    }
});

router.put('/marcas/:id', async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar(100), nombre.trim())
            .query('UPDATE Marca SET Nombre = @nombre WHERE IdMarca = @id');
        res.json({ message: 'Marca actualizada exitosamente' });
    } catch (err) {
        console.error('Error al actualizar marca:', err);
        res.status(500).json({ error: 'Error al actualizar marca' });
    }
});

router.delete('/marcas/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        // Verificar si hay bienes usando esta marca
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Bien WHERE IdMarca = @id');

        if (check.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar la marca porque tiene bienes asociados' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Marca WHERE IdMarca = @id');
        res.json({ message: 'Marca eliminada exitosamente' });
    } catch (err) {
        console.error('Error al eliminar marca:', err);
        res.status(500).json({ error: 'Error al eliminar marca' });
    }
});

// ========================
// ESTADOS
// ========================
router.get('/estados', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Estado ORDER BY Nombre');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener estados:', err);
        res.status(500).json({ error: 'Error al obtener estados' });
    }
});

router.post('/estados', async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.NVarChar(50), nombre.trim())
            .query('INSERT INTO Estado (Nombre) OUTPUT INSERTED.IdEstado, INSERTED.Nombre VALUES (@nombre)');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear estado:', err);
        res.status(500).json({ error: 'Error al crear estado' });
    }
});

router.put('/estados/:id', async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar(50), nombre.trim())
            .query('UPDATE Estado SET Nombre = @nombre WHERE IdEstado = @id');
        res.json({ message: 'Estado actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar estado:', err);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

router.delete('/estados/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Bien WHERE IdEstado = @id');

        if (check.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el estado porque tiene bienes asociados' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Estado WHERE IdEstado = @id');
        res.json({ message: 'Estado eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar estado:', err);
        res.status(500).json({ error: 'Error al eliminar estado' });
    }
});

// ========================
// TIPOS DE BIEN
// ========================
router.get('/tipos-bien', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM TipoBien ORDER BY Nombre');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener tipos de bien:', err);
        res.status(500).json({ error: 'Error al obtener tipos de bien' });
    }
});

router.post('/tipos-bien', async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.NVarChar(100), nombre.trim())
            .query('INSERT INTO TipoBien (Nombre) OUTPUT INSERTED.IdTipoBien, INSERTED.Nombre VALUES (@nombre)');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear tipo de bien:', err);
        res.status(500).json({ error: 'Error al crear tipo de bien' });
    }
});

router.put('/tipos-bien/:id', async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar(100), nombre.trim())
            .query('UPDATE TipoBien SET Nombre = @nombre WHERE IdTipoBien = @id');
        res.json({ message: 'Tipo de bien actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar tipo de bien:', err);
        res.status(500).json({ error: 'Error al actualizar tipo de bien' });
    }
});

router.delete('/tipos-bien/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        // Verificar si hay categorías usando este tipo
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Categoria WHERE IdTipoBien = @id');

        if (check.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el tipo de bien porque tiene categorías asociadas' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM TipoBien WHERE IdTipoBien = @id');
        res.json({ message: 'Tipo de bien eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar tipo de bien:', err);
        res.status(500).json({ error: 'Error al eliminar tipo de bien' });
    }
});

// ========================
// CATEGORÍAS
// ========================
router.get('/categorias', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query('SELECT c.*, tb.Nombre AS TipoBienNombre FROM Categoria c INNER JOIN TipoBien tb ON c.IdTipoBien = tb.IdTipoBien ORDER BY c.Nombre');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

router.get('/categorias/:idTipoBien', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('idTipoBien', sql.Int, req.params.idTipoBien)
            .query('SELECT * FROM Categoria WHERE IdTipoBien = @idTipoBien ORDER BY Nombre');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

router.post('/categorias', async (req, res) => {
    try {
        const { nombre, idTipoBien } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        if (!idTipoBien) {
            return res.status(400).json({ error: 'El tipo de bien es requerido' });
        }
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.NVarChar(100), nombre.trim())
            .input('idTipoBien', sql.Int, idTipoBien)
            .query('INSERT INTO Categoria (Nombre, IdTipoBien) OUTPUT INSERTED.IdCategoria, INSERTED.Nombre, INSERTED.IdTipoBien VALUES (@nombre, @idTipoBien)');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear categoría:', err);
        res.status(500).json({ error: 'Error al crear categoría' });
    }
});

router.put('/categorias/:id', async (req, res) => {
    try {
        const { nombre, idTipoBien } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar(100), nombre.trim())
            .input('idTipoBien', sql.Int, idTipoBien)
            .query('UPDATE Categoria SET Nombre = @nombre, IdTipoBien = @idTipoBien WHERE IdCategoria = @id');
        res.json({ message: 'Categoría actualizada exitosamente' });
    } catch (err) {
        console.error('Error al actualizar categoría:', err);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
});

router.delete('/categorias/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Bien WHERE IdCategoria = @id');

        if (check.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene bienes asociados' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Categoria WHERE IdCategoria = @id');
        res.json({ message: 'Categoría eliminada exitosamente' });
    } catch (err) {
        console.error('Error al eliminar categoría:', err);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

// ========================
// ÁREAS
// ========================
router.get('/areas', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Area ORDER BY Nombre');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener áreas:', err);
        res.status(500).json({ error: 'Error al obtener áreas' });
    }
});

router.post('/areas', async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.NVarChar(150), nombre.trim())
            .query('INSERT INTO Area (Nombre) OUTPUT INSERTED.IdArea, INSERTED.Nombre VALUES (@nombre)');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear área:', err);
        res.status(500).json({ error: 'Error al crear área' });
    }
});

router.put('/areas/:id', async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar(150), nombre.trim())
            .query('UPDATE Area SET Nombre = @nombre WHERE IdArea = @id');
        res.json({ message: 'Área actualizada exitosamente' });
    } catch (err) {
        console.error('Error al actualizar área:', err);
        res.status(500).json({ error: 'Error al actualizar área' });
    }
});

router.delete('/areas/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        // Verificar bienes y responsables
        const checkBienes = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Bien WHERE IdArea = @id');

        if (checkBienes.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el área porque tiene bienes asociados' });
        }

        const checkResponsables = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Responsable WHERE IdArea = @id');

        if (checkResponsables.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el área porque tiene responsables asociados' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Area WHERE IdArea = @id');
        res.json({ message: 'Área eliminada exitosamente' });
    } catch (err) {
        console.error('Error al eliminar área:', err);
        res.status(500).json({ error: 'Error al eliminar área' });
    }
});

// ========================
// MÉTODOS DE ADQUISICIÓN
// ========================
router.get('/metodos', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM MetodoAdquisicion ORDER BY NombreMetodo');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener métodos:', err);
        res.status(500).json({ error: 'Error al obtener métodos de adquisición' });
    }
});

router.post('/metodos', async (req, res) => {
    try {
        const { nombreMetodo } = req.body;
        if (!nombreMetodo || nombreMetodo.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.NVarChar(100), nombreMetodo.trim())
            .query('INSERT INTO MetodoAdquisicion (NombreMetodo) OUTPUT INSERTED.IdMetodo, INSERTED.NombreMetodo VALUES (@nombre)');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear método:', err);
        res.status(500).json({ error: 'Error al crear método de adquisición' });
    }
});

router.put('/metodos/:id', async (req, res) => {
    try {
        const { nombreMetodo } = req.body;
        if (!nombreMetodo || nombreMetodo.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar(100), nombreMetodo.trim())
            .query('UPDATE MetodoAdquisicion SET NombreMetodo = @nombre WHERE IdMetodo = @id');
        res.json({ message: 'Método actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar método:', err);
        res.status(500).json({ error: 'Error al actualizar método de adquisición' });
    }
});

router.delete('/metodos/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Adquisicion WHERE IdMetodo = @id');

        if (check.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el método porque tiene adquisiciones asociadas' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM MetodoAdquisicion WHERE IdMetodo = @id');
        res.json({ message: 'Método eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar método:', err);
        res.status(500).json({ error: 'Error al eliminar método de adquisición' });
    }
});

// ========================
// TIPOS DE MOVIMIENTO
// ========================
router.get('/tipos-movimiento', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM TipoMovimiento ORDER BY NombreMovimiento');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener tipos de movimiento:', err);
        res.status(500).json({ error: 'Error al obtener tipos de movimiento' });
    }
});

router.post('/tipos-movimiento', async (req, res) => {
    try {
        const { nombreMovimiento } = req.body;
        if (!nombreMovimiento || nombreMovimiento.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.NVarChar(100), nombreMovimiento.trim())
            .query('INSERT INTO TipoMovimiento (NombreMovimiento) OUTPUT INSERTED.IdTipoMovimiento, INSERTED.NombreMovimiento VALUES (@nombre)');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear tipo de movimiento:', err);
        res.status(500).json({ error: 'Error al crear tipo de movimiento' });
    }
});

router.put('/tipos-movimiento/:id', async (req, res) => {
    try {
        const { nombreMovimiento } = req.body;
        if (!nombreMovimiento || nombreMovimiento.trim() === '') {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.NVarChar(100), nombreMovimiento.trim())
            .query('UPDATE TipoMovimiento SET NombreMovimiento = @nombre WHERE IdTipoMovimiento = @id');
        res.json({ message: 'Tipo de movimiento actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar tipo de movimiento:', err);
        res.status(500).json({ error: 'Error al actualizar tipo de movimiento' });
    }
});

router.delete('/tipos-movimiento/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Movimiento WHERE IdTipoMovimiento = @id');

        if (check.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el tipo de movimiento porque tiene movimientos asociados' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM TipoMovimiento WHERE IdTipoMovimiento = @id');
        res.json({ message: 'Tipo de movimiento eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar tipo de movimiento:', err);
        res.status(500).json({ error: 'Error al eliminar tipo de movimiento' });
    }
});

module.exports = router;
