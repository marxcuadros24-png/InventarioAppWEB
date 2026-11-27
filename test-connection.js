// Script de prueba de conexión a SQL Server
const sql = require('mssql');
require('dotenv').config();

async function testConnection() {
    console.log(' Configuración:');
    console.log('   Servidor:', process.env.DB_SERVER);
    console.log('   Base de datos:', process.env.DB_DATABASE);
    console.log('   Usuario:', process.env.DB_USER);
    console.log('');

    const config = {
        server: process.env.DB_SERVER,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        connectionTimeout: 30000,
        requestTimeout: 30000
    };

    try {
        console.log('🔌 Intentando conectar...');
        const pool = await sql.connect(config);
        console.log(' ¡Conexión exitosa!');

        const result = await pool.request().query('SELECT @@VERSION AS version');
        console.log(' Versión de SQL Server:');
        console.log(result.recordset[0].version);

        await pool.close();
        console.log('');
        console.log(' Todo funciona correctamente');
        console.log('');
        console.log('Ahora puedes ejecutar: npm run setup');

    } catch (error) {
        console.error(' Error de conexión:');
        console.error('   Mensaje:', error.message);
        console.error('');
        console.error(' Posibles soluciones:');
        console.error('   1. Verifica que SQL Server esté corriendo');
        console.error('   2. Verifica que el usuario "sa" tenga permisos');
        console.error('   3. Verifica que SQL Server Authentication esté habilitado');
        console.error('   4. Verifica que TCP/IP esté habilitado en SQL Server Configuration Manager');
    }
}

testConnection();
