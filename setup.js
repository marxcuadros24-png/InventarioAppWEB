// ============================================
// SCRIPT DE CONFIGURACIÓN INICIAL
// ============================================
// Este script crea un usuario administrador inicial

const bcrypt = require('bcryptjs');
const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function createAdminUser() {
    try {
        console.log('🔌 Conectando a SQL Server...');
        const pool = await sql.connect(config);

        // Hash de la contraseña
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('👤 Creando usuario administrador...');

        // Verificar si ya existe el rol de administrador
        const rolResult = await pool.request()
            .query("SELECT IdRol FROM RolUsuario WHERE NombreRol = 'Administrador'");

        let idRol;
        if (rolResult.recordset.length === 0) {
            // Crear rol de administrador
            const newRol = await pool.request()
                .query("INSERT INTO RolUsuario (NombreRol) OUTPUT INSERTED.IdRol VALUES ('Administrador')");
            idRol = newRol.recordset[0].IdRol;
            console.log('✅ Rol de Administrador creado');
        } else {
            idRol = rolResult.recordset[0].IdRol;
            console.log('ℹ️  Rol de Administrador ya existe');
        }

        // Verificar si ya existe el usuario admin
        const userCheck = await pool.request()
            .query("SELECT IdUsuario FROM Usuario WHERE NombreUsuario = 'admin'");

        if (userCheck.recordset.length > 0) {
            console.log('⚠️  El usuario "admin" ya existe');
            console.log('ℹ️  Si deseas cambiar la contraseña, elimina el usuario primero');
        } else {
            // Crear usuario administrador
            await pool.request()
                .input('nombreUsuario', sql.NVarChar, 'admin')
                .input('clave', sql.NVarChar, hashedPassword)
                .input('idRol', sql.Int, idRol)
                .query(`
                    INSERT INTO Usuario (NombreUsuario, Clave, IdRol, Estado)
                    VALUES (@nombreUsuario, @clave, @idRol, 1)
                `);

            console.log('✅ Usuario administrador creado exitosamente');
            console.log('');
            console.log('📝 Credenciales de acceso:');
            console.log('   Usuario: admin');
            console.log('   Contraseña: admin123');
            console.log('');
            console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer inicio de sesión');
        }

        await pool.close();
        console.log('');
        console.log('✅ Configuración completada');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdminUser();
