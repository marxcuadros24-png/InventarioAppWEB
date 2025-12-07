const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getConnection, sql } = require('../config/database');

// Login
router.post('/login', async (req, res) => {
    try {
        const { nombreUsuario, clave } = req.body;

        if (!nombreUsuario || !clave) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('nombreUsuario', sql.NVarChar, nombreUsuario)
            .query(`
                SELECT u.IdUsuario, u.NombreUsuario, u.Clave, u.Estado, 
                       r.NombreRol, u.IdResponsable,
                       CASE WHEN u.IdResponsable IS NOT NULL 
                            THEN resp.Nombres + ' ' + resp.Apellidos 
                            ELSE NULL END AS NombreCompleto
                FROM Usuario u
                INNER JOIN RolUsuario r ON u.IdRol = r.IdRol
                LEFT JOIN Responsable resp ON u.IdResponsable = resp.IdResponsable
                WHERE u.NombreUsuario = @nombreUsuario
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const usuario = result.recordset[0];

        if (!usuario.Estado) {
            return res.status(401).json({ error: 'Usuario inactivo' });
        }

        // Convertir Buffer a string si es necesario
        let storedHash = usuario.Clave;
        if (Buffer.isBuffer(storedHash)) {
            storedHash = storedHash.toString('utf8');
        }

        let passwordValid = false;

        // Intentar bcrypt primero (hash empieza con $2a$, $2b$, etc.)
        if (storedHash.startsWith('$2')) {
            passwordValid = await bcrypt.compare(clave, storedHash);
            console.log('🔐 Validación bcrypt:', passwordValid);
        }
        // Si no es bcrypt, intentar SHA-256 (64 caracteres hexadecimales)
        else if (storedHash.length === 64 && /^[a-f0-9]+$/i.test(storedHash)) {
            const sha256Hash = crypto.createHash('sha256').update(clave).digest('hex');
            passwordValid = (sha256Hash === storedHash.toLowerCase());
            console.log('🔐 Validación SHA-256:', passwordValid);
        }
        // Fallback a texto plano
        else if (storedHash === clave) {
            passwordValid = true;
            console.log('🔐 Validación texto plano:', passwordValid);
        }

        if (!passwordValid) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Generar token JWT
        const token = jwt.sign(
            {
                idUsuario: usuario.IdUsuario,
                nombreUsuario: usuario.NombreUsuario,
                rol: usuario.NombreRol
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: {
                idUsuario: usuario.IdUsuario,
                nombreUsuario: usuario.NombreUsuario,
                rol: usuario.NombreRol,
                nombreCompleto: usuario.NombreCompleto
            }
        });

    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Middleware para verificar token
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Verificar token
router.get('/verify', verificarToken, (req, res) => {
    res.json({ valid: true, usuario: req.usuario });
});

module.exports = router;
