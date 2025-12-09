const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar middlewares de seguridad
const {
    verificarToken,
    soloAdmin,
    adminOSupervisor,
    apiLimiter,
    loginLimiter,
    sanitizar,
    logSecurity,
    validarHeaders
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// MIDDLEWARES GLOBALES
// ========================

// CORS configurado
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Validación de headers
app.use(validarHeaders);

// Sanitización de inputs (aplica a todas las rutas)
app.use(sanitizar);

// Rate limiting global para API
app.use('/api', apiLimiter);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ========================
// IMPORTAR RUTAS
// ========================
const authRoutes = require('./routes/auth');
const bienesRoutes = require('./routes/bienes');
const responsablesRoutes = require('./routes/responsables');
const catalogosRoutes = require('./routes/catalogos');
const movimientosRoutes = require('./routes/movimientos');
const dashboardRoutes = require('./routes/dashboard');
const auditoriaRoutes = require('./routes/auditoria');
const usuariosRoutes = require('./routes/usuarios');

// ========================
// RUTAS PÚBLICAS (sin autenticación)
// ========================
app.use('/api/auth', loginLimiter, authRoutes);

// ========================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================

// Aplicar verificación de token y logging a todas las rutas protegidas
app.use('/api/bienes', verificarToken, logSecurity, bienesRoutes);
app.use('/api/responsables', verificarToken, logSecurity, responsablesRoutes);
app.use('/api/movimientos', verificarToken, logSecurity, movimientosRoutes);
app.use('/api/dashboard', verificarToken, dashboardRoutes);
app.use('/api/reportes', verificarToken, logSecurity);

// Rutas que requieren autenticación pero con control granular interno
app.use('/api/catalogos', verificarToken, logSecurity, catalogosRoutes);

// Rutas solo para administradores
app.use('/api/usuarios', verificarToken, logSecurity, soloAdmin, usuariosRoutes);
app.use('/api/auditoria', verificarToken, logSecurity, soloAdmin, auditoriaRoutes);

// ========================
// RUTA PRINCIPAL
// ========================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================
// MANEJO DE ERRORES
// ========================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);

    // No revelar detalles del error en producción
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(err.status || 500).json({
        error: 'Error interno del servidor',
        message: isProduction ? 'Ha ocurrido un error' : err.message
    });
});

// ========================
// INICIAR SERVIDOR
// ========================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🔐 Seguridad: Autenticación JWT + Rate Limiting + Sanitización`);
    console.log(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
});
