
// MIDDLEWARES DE SEGURIDAD


const jwt = require('jsonwebtoken');


// 1. AUTENTICACIÓN - Verificar Token JWT

const verificarToken = (req, res, next) => {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Acceso denegado',
            message: 'Token no proporcionado'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // { idUsuario, nombreUsuario, rol }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Sesión expirada',
                message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
            });
        }
        return res.status(403).json({
            error: 'Token inválido',
            message: 'El token proporcionado no es válido'
        });
    }
};

// ========================
// 2. AUTORIZACIÓN - Verificar Roles
// ========================

// Roles permitidos en el sistema
const ROLES = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    CONSULTOR: 'Consultor'
};

// Middleware factory para verificar roles
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'No autenticado',
                message: 'Debe iniciar sesión primero'
            });
        }

        const rolUsuario = req.usuario.rol;

        if (!rolesPermitidos.includes(rolUsuario)) {
            // Log del intento de acceso no autorizado
            console.warn(` Acceso denegado: Usuario ${req.usuario.nombreUsuario} (${rolUsuario}) intentó acceder a recurso restringido`);

            return res.status(403).json({
                error: 'Acceso prohibido',
                message: 'No tiene permisos para realizar esta acción'
            });
        }

        next();
    };
};

// Shortcuts para combinaciones comunes de roles
const soloAdmin = verificarRol(ROLES.ADMIN);
const adminOSupervisor = verificarRol(ROLES.ADMIN, ROLES.SUPERVISOR);
const todosLosRoles = verificarRol(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CONSULTOR);


// RATE LIMITING - Prevenir ataques


// Almacén simple en memoria para rate limiting
const requestCounts = new Map();

const rateLimiter = (options = {}) => {
    const {
        windowMs = 60000,      // Ventana de tiempo (1 minuto por defecto)
        maxRequests = 100,      // Máximo de requests por ventana
        message = 'Demasiadas solicitudes. Por favor, espere un momento.'
    } = options;

    // Limpiar entradas viejas cada minuto sin bloquear el cierre del proceso
    setInterval(() => {
        const now = Date.now();
        for (const [key, data] of requestCounts.entries()) {
            if (now - data.startTime > windowMs) {
                requestCounts.delete(key);
            }
        }
    }, windowMs).unref();

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const key = `${ip}`;
        const now = Date.now();

        if (!requestCounts.has(key)) {
            requestCounts.set(key, { count: 1, startTime: now });
            return next();
        }

        const data = requestCounts.get(key);

        // Si la ventana expiró, reiniciar
        if (now - data.startTime > windowMs) {
            requestCounts.set(key, { count: 1, startTime: now });
            return next();
        }

        // Incrementar contador
        data.count++;

        if (data.count > maxRequests) {
            console.warn(` Rate limit excedido para IP: ${ip}`);
            return res.status(429).json({
                error: 'Demasiadas solicitudes',
                message,
                retryAfter: Math.ceil((data.startTime + windowMs - now) / 1000)
            });
        }

        next();
    };
};

// Rate limiters específicos
// En producción, reducir a 5 intentos cada 15 minutos
const isProduction = process.env.NODE_ENV === 'production';

const loginLimiter = rateLimiter({
    windowMs: isProduction ? 15 * 60 * 1000 : 5 * 60 * 1000,  // 15 min prod, 5 min dev
    maxRequests: isProduction ? 5 : 20,                        // 5 prod, 20 dev
    message: 'Demasiados intentos de inicio de sesión. Intente más tarde.'
});

const apiLimiter = rateLimiter({
    windowMs: 60000,           // 1 minuto
    maxRequests: isProduction ? 100 : 500,  // más permisivo en desarrollo
    message: 'Demasiadas solicitudes. Por favor, espere un momento.'
});

// ========================
// 4. SANITIZACIÓN - Prevenir SQL Injection y XSS
// ========================

const sanitizar = (req, res, next) => {
    // Función para limpiar strings
    const limpiarString = (str) => {
        if (typeof str !== 'string') return str;

        // Remover caracteres peligrosos para SQL injection
        // Nota: mssql ya parametriza queries, pero es una capa extra
        return str
            .replace(/[<>]/g, '')           // Remover < > (XSS básico)
            .replace(/javascript:/gi, '')    // Remover javascript:
            .replace(/on\w+=/gi, '')         // Remover event handlers
            .trim();
    };

    // Campos de contraseña que no deben alterarse (trim / reemplazo de caracteres)
    const PASSWORD_KEYS = new Set(['clave', 'password', 'newPassword', 'currentPassword']);

    // Función recursiva para sanitizar objetos
    const sanitizarObjeto = (obj) => {
        if (obj === null || obj === undefined) return obj;

        if (typeof obj === 'string') {
            return limpiarString(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitizarObjeto);
        }

        if (typeof obj === 'object') {
            const sanitizado = {};
            for (const [key, value] of Object.entries(obj)) {
                const cleanKey = limpiarString(key);
                if (PASSWORD_KEYS.has(cleanKey) && typeof value === 'string') {
                    sanitizado[cleanKey] = value;
                } else {
                    sanitizado[cleanKey] = sanitizarObjeto(value);
                }
            }
            return sanitizado;
        }

        return obj;
    };

    // Sanitizar body, query y params
    if (req.body) req.body = sanitizarObjeto(req.body);
    if (req.query) req.query = sanitizarObjeto(req.query);
    if (req.params) req.params = sanitizarObjeto(req.params);

    next();
};

// ========================
// 5. LOGGING DE SEGURIDAD
// ========================

const logSecurity = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const usuario = req.usuario ? req.usuario.nombreUsuario : 'Anónimo';
    const ip = req.ip || req.connection.remoteAddress;

    // Log solo para operaciones sensibles (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Usuario: ${usuario} - IP: ${ip}`);
    }

    next();
};

// ========================
// 6. VALIDACIÓN DE HEADERS
// ========================

const validarHeaders = (req, res, next) => {
    // Para requests que modifican datos, verificar Content-Type
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type'];

        // Permitir JSON y form-data (para uploads)
        if (contentType &&
            !contentType.includes('application/json') &&
            !contentType.includes('multipart/form-data') &&
            !contentType.includes('application/x-www-form-urlencoded')) {
            return res.status(415).json({
                error: 'Tipo de contenido no soportado',
                message: 'Content-Type debe ser application/json o multipart/form-data'
            });
        }
    }

    next();
};

// ========================
// EXPORTAR MIDDLEWARES
// ========================

module.exports = {
    // Autenticación
    verificarToken,

    // Autorización
    verificarRol,
    soloAdmin,
    adminOSupervisor,
    todosLosRoles,
    ROLES,

    // Rate Limiting
    rateLimiter,
    loginLimiter,
    apiLimiter,

    // Sanitización
    sanitizar,

    // Logging
    logSecurity,

    // Validación
    validarHeaders
};
