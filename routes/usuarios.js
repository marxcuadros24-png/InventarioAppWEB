const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

// ========================
// USUARIOS
// ========================

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT u.IdUsuario, u.NombreUsuario, u.Estado,
                       r.IdRol, r.NombreRol,
                       resp.IdResponsable, resp.Nombres, resp.Apellidos, resp.DNI
                FROM Usuario u
                LEFT JOIN RolUsuario r ON u.IdRol = r.IdRol
                LEFT JOIN Responsable resp ON u.IdResponsable = resp.IdResponsable
                ORDER BY u.NombreUsuario
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener usuarios:', err);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Obtener un usuario por ID
router.get('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT u.IdUsuario, u.NombreUsuario, u.Estado,
                       r.IdRol, r.NombreRol,
                       resp.IdResponsable, resp.Nombres, resp.Apellidos, resp.DNI
                FROM Usuario u
                LEFT JOIN RolUsuario r ON u.IdRol = r.IdRol
                LEFT JOIN Responsable resp ON u.IdResponsable = resp.IdResponsable
                WHERE u.IdUsuario = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al obtener usuario:', err);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// Crear usuario
router.post('/', async (req, res) => {
    try {
        const { nombreUsuario, password, idRol, idResponsable, estado } = req.body;

        if (!nombreUsuario || nombreUsuario.trim() === '') {
            return res.status(400).json({ error: 'El nombre de usuario es requerido' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }
        if (!idRol) {
            return res.status(400).json({ error: 'El rol es requerido' });
        }

        const pool = await getConnection();

        // Verificar si el usuario ya existe
        const existCheck = await pool.request()
            .input('nombreUsuario', sql.NVarChar(100), nombreUsuario.trim())
            .query('SELECT IdUsuario FROM Usuario WHERE NombreUsuario = @nombreUsuario');

        if (existCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.request()
            .input('nombreUsuario', sql.NVarChar(100), nombreUsuario.trim())
            .input('clave', sql.NVarChar(255), hashedPassword)
            .input('idRol', sql.Int, idRol)
            .input('idResponsable', sql.Int, idResponsable || null)
            .input('estado', sql.Bit, estado !== false)
            .query(`
                INSERT INTO Usuario (NombreUsuario, Clave, IdRol, IdResponsable, Estado)
                VALUES (@nombreUsuario, @clave, @idRol, @idResponsable, @estado);
                SELECT IdUsuario, NombreUsuario, Estado FROM Usuario WHERE NombreUsuario = @nombreUsuario
            `);

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear usuario:', err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// Actualizar usuario
router.put('/:id', async (req, res) => {
    try {
        const { nombreUsuario, password, idRol, idResponsable, estado } = req.body;

        if (!nombreUsuario || nombreUsuario.trim() === '') {
            return res.status(400).json({ error: 'El nombre de usuario es requerido' });
        }

        const pool = await getConnection();

        // Verificar si el nombre de usuario ya existe en otro usuario
        const existCheck = await pool.request()
            .input('nombreUsuario', sql.NVarChar(100), nombreUsuario.trim())
            .input('id', sql.Int, req.params.id)
            .query('SELECT IdUsuario FROM Usuario WHERE NombreUsuario = @nombreUsuario AND IdUsuario != @id');

        if (existCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'El nombre de usuario ya existe' });
        }

        // Si se proporciona nueva contraseña, hashearla
        let updateQuery = `
            UPDATE Usuario SET 
                NombreUsuario = @nombreUsuario,
                IdRol = @idRol,
                IdResponsable = @idResponsable,
                Estado = @estado
        `;

        const request = pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombreUsuario', sql.NVarChar(100), nombreUsuario.trim())
            .input('idRol', sql.Int, idRol)
            .input('idResponsable', sql.Int, idResponsable || null)
            .input('estado', sql.Bit, estado !== false);

        if (password && password.length >= 6) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', Clave = @clave';
            request.input('clave', sql.NVarChar(255), hashedPassword);
        }

        updateQuery += ' WHERE IdUsuario = @id';
        await request.query(updateQuery);

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// Eliminar usuario
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getConnection();

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Usuario WHERE IdUsuario = @id');

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// ========================
// ROLES DE USUARIO
// ========================

// Obtener todos los roles
router.get('/roles/all', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM RolUsuario ORDER BY NombreRol');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener roles:', err);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
});

// Crear rol
router.post('/roles', async (req, res) => {
    try {
        const { nombreRol, descripcion } = req.body;
        if (!nombreRol || nombreRol.trim() === '') {
            return res.status(400).json({ error: 'El nombre del rol es requerido' });
        }
        const pool = await getConnection();
        const result = await pool.request()
            .input('nombreRol', sql.NVarChar(50), nombreRol.trim())
            .input('descripcion', sql.NVarChar(200), descripcion ? descripcion.trim() : null)
            .query('INSERT INTO RolUsuario (NombreRol, Descripcion) OUTPUT INSERTED.IdRol, INSERTED.NombreRol, INSERTED.Descripcion VALUES (@nombreRol, @descripcion)');
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear rol:', err);
        res.status(500).json({ error: 'Error al crear rol' });
    }
});

// Actualizar rol
router.put('/roles/:id', async (req, res) => {
    try {
        const { nombreRol, descripcion } = req.body;
        if (!nombreRol || nombreRol.trim() === '') {
            return res.status(400).json({ error: 'El nombre del rol es requerido' });
        }
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombreRol', sql.NVarChar(50), nombreRol.trim())
            .input('descripcion', sql.NVarChar(200), descripcion ? descripcion.trim() : null)
            .query('UPDATE RolUsuario SET NombreRol = @nombreRol, Descripcion = @descripcion WHERE IdRol = @id');
        res.json({ message: 'Rol actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar rol:', err);
        res.status(500).json({ error: 'Error al actualizar rol' });
    }
});

// Eliminar rol
router.delete('/roles/:id', async (req, res) => {
    try {
        const pool = await getConnection();

        // Verificar si hay usuarios con este rol
        const check = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM Usuario WHERE IdRol = @id');

        if (check.recordset[0].count > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el rol porque tiene usuarios asociados' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM RolUsuario WHERE IdRol = @id');
        res.json({ message: 'Rol eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar rol:', err);
        res.status(500).json({ error: 'Error al eliminar rol' });
    }
});

// ========================
// RESPONSABLES (para vincular a usuarios)
// ========================

// Obtener todos los responsables (para dropdown en usuarios)
router.get('/responsables/all', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT r.*, a.Nombre AS AreaNombre
                FROM Responsable r
                LEFT JOIN Area a ON r.IdArea = a.IdArea
                ORDER BY r.Apellidos, r.Nombres
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener responsables:', err);
        res.status(500).json({ error: 'Error al obtener responsables' });
    }
});

module.exports = router;
