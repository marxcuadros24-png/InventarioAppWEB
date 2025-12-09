# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

---

## [1.0.0] - 2024-12-09

### Añadido

**Sistema Base**
- Sistema de inventario institucional completo
- Arquitectura MVC con backend Express y frontend SPA
- Base de datos SQL Server con esquema completo
- Progressive Web App (PWA) funcional
- Service Worker para funcionalidad offline

**Autenticación y Seguridad**
- Sistema de autenticación con JWT
- Control de acceso basado en roles (RBAC)
- Tres niveles de permisos: Administrador, Supervisor, Consultor
- Matriz de permisos granular por módulo y operación
- Rate limiting (100 req/min API, 5 intentos de login/15min)
- Sanitización de inputs contra XSS y SQL injection
- Validación de datos en backend y frontend
- Logging de operaciones sensibles
- Generador de JWT_SECRET seguro

**Módulos Funcionales**
- Gestión completa de bienes (CRUD)
- Gestión de responsables
- Registro de movimientos
- Catálogos configurables (estados, tipos, áreas, marcas, etc.)
- Dashboard con estadísticas y métricas
- Sistema de auditoría
- Gestión de usuarios y roles

**Funcionalidad Híbrida**
- Modo online/offline automático
- Almacenamiento local con IndexedDB
- Sincronización bidireccional
- Queue de operaciones pendientes
- Resolución de conflictos (last-write-wins)

**Reportes y Exportación**
- Dashboard con gráficos Chart.js
- Exportación a Excel (multi-hoja)
- Generación de códigos QR
- Preparado para exportación PDF

**Validación de Formularios**
- Sistema de validación en tiempo real
- 10+ reglas predefinidas
- Feedback visual (bordes verde/rojo)
- Mensajes de error personalizados
- Validación aplicada en formulario de login

**Interfaz de Usuario**
- Design system moderno con variables CSS
- Tema oscuro con glassmorphism
- Responsive design (móvil, tablet, escritorio)
- Animaciones y micro-interacciones
- Loading states y feedback visual

**Documentación**
- README.md completo con arquitectura
- Guía de instalación paso a paso (INSTALACION.md)
- Manual de usuario completo (MANUAL_USUARIO.md)
- Guía de configuración de entorno (ENV_CONFIG.md)
- Guía de validación de formularios (VALIDACION.md)
- Documentación de API inline
- Comentarios en código

### Configuración

**Variables de Entorno**
- Archivo .env.example como plantilla
- Configuración de base de datos
- JWT secret configurable
- CORS configurable
- Rate limiting configurable

**Seguridad**
- .gitignore configurado correctamente
- Secrets no versionados
- Preparado para HTTPS
- Headers de seguridad

---

## [Próximas Versiones]

### Planeado para v1.1.0

- [ ] Paginación en tablas grandes
- [ ] Perfil de usuario (cambiar contraseña)
- [ ] Compresión gzip de respuestas
- [ ] Dockerfile para contenedorización
- [ ] Guía de deployment completa

### Planeado para v1.2.0

- [ ] Recuperación de contraseña
- [ ] Historial de cambios por bien
- [ ] Importación masiva desde Excel
- [ ] Notificaciones push
- [ ] Tema claro/oscuro

### Planeado para v2.0.0

- [ ] Multi-idioma (i18n)
- [ ] API REST documentada con Swagger
- [ ] Tests unitarios y de integración
- [ ] Dashboard avanzado con más métricas
- [ ] Escaneo de códigos QR/barras
- [ ] Mantenimiento preventivo programado

---

## Categorías

- **Añadido**: para funcionalidades nuevas
- **Cambiado**: para cambios en funcionalidades existentes
- **Obsoleto**: para funcionalidades que serán eliminadas
- **Eliminado**: para funcionalidades eliminadas
- **Corregido**: para correcciones de bugs
- **Seguridad**: para vulnerabilidades

---

## Versionado

El proyecto usa versionado semántico (SemVer):

- **MAJOR** (X.0.0): Cambios incompatibles en API
- **MINOR** (0.X.0): Nuevas funcionalidades compatibles
- **PATCH** (0.0.X): Correcciones de bugs
