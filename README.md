# Sistema de Inventario Institucional

Sistema web profesional para la gestión integral de inventario institucional con capacidades de Progressive Web Application (PWA), arquitectura híbrida online/offline y control de acceso basado en roles.

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características Principales](#características-principales)
- [Requisitos del Sistema](#requisitos-del-sistema)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Seguridad](#seguridad)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Solución de Problemas](#solución-de-problemas)

---

## Descripción General

Este sistema permite la gestión completa del inventario institucional mediante una interfaz web moderna y responsive. Implementa un modelo híbrido que permite operaciones tanto con conexión a internet como en modo offline, sincronizando automáticamente los cambios cuando la conectividad se restablece.

### Tecnologías Implementadas

**Backend:**
- Node.js v16+
- Express.js 4.x
- SQL Server (mssql driver)
- JWT para autenticación
- bcryptjs para encriptación de contraseñas

**Frontend:**
- HTML5 / CSS3 / JavaScript ES6+
- IndexedDB para almacenamiento local
- Service Workers para funcionalidad offline
- Chart.js para visualización de datos
- SheetJS para exportación a Excel

**Seguridad:**
- Autenticación basada en JWT
- Control de acceso por roles (RBAC)
- Rate limiting
- Sanitización de inputs
- Validación de datos en tiempo real

---

## Características Principales

### Gestión de Inventario
- Registro completo de bienes institucionales
- Códigos patrimoniales únicos con generación automática
- Categorización jerárquica (Tipo de Bien > Categoría)
- Seguimiento de estado y ubicación
- Especificaciones técnicas detalladas
- Información de adquisición completa

### Control de Acceso
- Sistema de roles: Administrador, Supervisor, Consultor
- Permisos granulares por módulo y operación
- Matriz de permisos configurable
- Auditoría de acciones

### Funcionalidad Offline
- Modo híbrido automático
- Almacenamiento local con IndexedDB
- Sincronización bidireccional
- Queue de operaciones pendientes
- Resolución de conflictos

### Reportes y Exportación
- Dashboard con métricas en tiempo real
- Gráficos interactivos (Chart.js)
- Exportación a Excel multi-hoja
- Generación de códigos QR
- Exportación a PDF
- Reportes personalizados

### Progressive Web App
- Instalable en dispositivos
- Funciona offline
- Notificaciones push (preparado)
- Actualización automática
- Responsive design

---

## Requisitos del Sistema

### Servidor
- Node.js >= 16.0.0
- npm >= 7.0.0
- SQL Server 2016 o superior
- Windows Server / Linux (recomendado Ubuntu 20.04+)
- Mínimo 2GB RAM
- 10GB espacio en disco

### Cliente
- Navegadores modernos:
  - Chrome >= 90
  - Firefox >= 88
  - Edge >= 90
  - Safari >= 14
- JavaScript habilitado
- Conexión a internet (para primera carga)

### Base de Datos
- SQL Server 2016+
- Base de datos `InventarioDB` creada
- Usuario con permisos de lectura/escritura
- Puerto 1433 accesible

---

## Instalación

### 1. Clonar el Repositorio

```bash
git clone [URL_REPOSITORIO]
cd InventarioWeb
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Base de Datos

Ejecutar el script SQL de creación de base de datos:

```bash
# El archivo SQL debe ejecutarse en SQL Server Management Studio
# Ubicación: database/schema.sql
```

### 4. Configurar Variables de Entorno

Copiar el archivo de ejemplo y configurar:

```bash
copy .env.example .env
```

Editar `.env` con los valores apropiados (ver sección [Configuración](#configuración)).

### 5. Generar JWT Secret

```bash
node generate-secret.js
```

Copiar una de las claves generadas y actualizarla en `.env`.

### 6. Crear Usuario Inicial

Ejecutar en SQL Server:

```sql
USE InventarioDB;

-- Insertar roles
INSERT INTO RolUsuario (NombreRol) VALUES 
('Administrador'), 
('Supervisor'), 
('Consultor');

-- Crear usuario administrador
-- Contraseña: admin123
INSERT INTO Usuario (NombreUsuario, Clave, IdRol, Estado)
VALUES ('admin', '$2a$10$rOzJQjKvXGKvXGKvXGKvXeN7vXGKvXGKvXGKvXGKvXGKvXGKvXGKv', 1, 1);
```

### 7. Iniciar Servidor

**Modo producción:**
```bash
npm start
```

**Modo desarrollo:**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

---

## Configuración

### Variables de Entorno (.env)

```bash
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
DB_SERVER=localhost
DB_DATABASE=InventarioDB
DB_USER=sa
DB_PASSWORD=tu_password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Autenticación
JWT_SECRET=[GENERAR_CON_generate-secret.js]

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**IMPORTANTE:** Para producción:
- Cambiar `NODE_ENV` a `production`
- Generar `JWT_SECRET` único y seguro
- Configurar `CORS_ORIGIN` con el dominio real
- Usar contraseñas seguras para la base de datos

Ver `ENV_CONFIG.md` para guía completa de configuración.

---

## Estructura del Proyecto

```
InventarioWeb/
├── config/
│   └── database.js              # Conexión SQL Server
├── middleware/
│   └── security.js              # Middlewares de seguridad
├── routes/
│   ├── auth.js                  # Autenticación JWT
│   ├── bienes.js                # CRUD Bienes
│   ├── responsables.js          # CRUD Responsables
│   ├── catalogos.js             # Gestión de catálogos
│   ├── movimientos.js           # Registro de movimientos
│   ├── dashboard.js             # Estadísticas
│   ├── auditoria.js             # Auditoría
│   └── usuarios.js              # Gestión de usuarios
├── public/
│   ├── css/
│   │   └── styles.css           # Estilos globales
│   ├── js/
│   │   ├── app.js               # Controlador principal
│   │   ├── api.js               # Cliente API
│   │   ├── auth.js              # Autenticación
│   │   ├── db.js                # IndexedDB
│   │   ├── sync.js              # Sincronización
│   │   ├── permissions.js       # Control de permisos
│   │   ├── form-validator.js    # Validación de formularios
│   │   ├── qr-generator.js      # Generación de QR
│   │   └── excel-exporter.js    # Exportación Excel
│   ├── index.html               # Single Page Application
│   ├── manifest.json            # PWA Manifest
│   └── service-worker.js        # Service Worker
├── server.js                    # Servidor Express
├── generate-secret.js           # Generador JWT Secret
├── package.json                 # Dependencias
├── .env.example                 # Template variables
├── .gitignore                   # Archivos ignorados
├── README.md                    # Este archivo
├── ENV_CONFIG.md                # Guía configuración
└── VALIDACION.md                # Guía validación formularios
```

---

## Arquitectura

### Patrón de Diseño

El sistema implementa una arquitectura de tres capas:

1. **Capa de Presentación (Frontend)**
   - SPA (Single Page Application)
   - Gestión de estado local
   - Renderizado dinámico de vistas

2. **Capa de Lógica de Negocio (Backend API)**
   - RESTful API
   - Autenticación y autorización
   - Validación de datos
   - Lógica de negocio

3. **Capa de Datos**
   - SQL Server (persistencia)
   - IndexedDB (cache local)
   - Sincronización bidireccional

### Flujo de Datos

```
[Cliente] <-> [Service Worker] <-> [API Client] <-> [Express Routes] <-> [SQL Server]
              [IndexedDB]                                  |
                                                   [Middleware Security]
```

### Modo Híbrido

**Online:**
1. Request enviado al servidor
2. Respuesta cacheada en IndexedDB
3. UI actualizada con datos del servidor

**Offline:**
1. Request guardado en queue local
2. Datos obtenidos de IndexedDB
3. UI actualizada con datos locales

**Sincronización:**
1. Detecta recuperación de conexión
2. Procesa queue de operaciones pendientes
3. Resuelve conflictos (last-write-wins)
4. Actualiza IndexedDB con datos del servidor

---

## Seguridad

### Autenticación

- JWT (JSON Web Tokens) con expiración de 8 horas
- Refresh token automático
- Logout con invalidación de token
- Protección contra CSRF

### Autorización

Sistema de control de acceso basado en roles (RBAC):

| Rol | Permisos |
|-----|----------|
| **Administrador** | Acceso completo a todos los módulos |
| **Supervisor** | Crear y editar bienes, responsables, movimientos |
| **Consultor** | Solo lectura en todos los módulos |

### Protecciones Implementadas

**Backend:**
- Rate limiting (100 req/min general, 5 login/15min)
- Sanitización de inputs contra XSS y SQL injection
- Validación de tipos de datos
- Headers de seguridad
- Logging de operaciones críticas

**Frontend:**
- Validación en tiempo real de formularios
- Escape de contenido HTML
- Token almacenado en sessionStorage
- Timeout de sesión

### Buenas Prácticas

- Contraseñas hasheadas con bcrypt (cost factor 10)
- JWT_SECRET aleatorio de 128+ caracteres
- Variables sensibles en .env (no versionado)
- HTTPS recomendado para producción
- Auditoría de todas las operaciones

---

## API Reference

### Autenticación

**POST** `/api/auth/login`
```json
Request:
{
  "nombreUsuario": "string",
  "clave": "string"
}

Response:
{
  "token": "string",
  "usuario": {
    "idUsuario": "number",
    "nombreUsuario": "string",
    "rol": "string",
    "nombreCompleto": "string"
  }
}
```

**GET** `/api/auth/verify`
```
Headers: Authorization: Bearer [token]
Response: { "valid": true, "usuario": {...} }
```

### Bienes

**GET** `/api/bienes`
- Query params: `estado`, `area`, `categoria`, `busqueda`
- Requiere: Autenticación
- Permisos: Todos

**POST** `/api/bienes`
- Requiere: Autenticación
- Permisos: Administrador, Supervisor

**PUT** `/api/bienes/:id`
- Requiere: Autenticación
- Permisos: Administrador, Supervisor

**DELETE** `/api/bienes/:id`
- Requiere: Autenticación
- Permisos: Administrador

### Catálogos

**GET** `/api/catalogos/all`
- Retorna todos los catálogos (estados, tipos, áreas, etc.)
- Requiere: Autenticación
- Permisos: Todos

**POST/PUT/DELETE** `/api/catalogos/*`
- Requiere: Autenticación
- Permisos: Solo Administrador

### Dashboard

**GET** `/api/dashboard/stats`
- Estadísticas generales del inventario
- Requiere: Autenticación
- Permisos: Todos

Ver documentación completa de API en el código fuente de cada ruta.

---

## Deployment

### Preparación para Producción

**1. Configurar Variables de Entorno**
```bash
NODE_ENV=production
JWT_SECRET=[clave_aleatoria_segura]
CORS_ORIGIN=https://tu-dominio.com
```

**2. Instalar Dependencias de Producción**
```bash
npm install --production
```

**3. Configurar HTTPS**
- Obtener certificado SSL (Let's Encrypt recomendado)
- Configurar reverse proxy (nginx)

**4. Configurar Proceso Manager**
```bash
npm install -g pm2
pm2 start server.js --name inventario
pm2 startup
pm2 save
```

### Deployment con Docker (Opcional)

Ver `Dockerfile` para instrucciones de contenedorización.

### Deployment en Cloud

**Azure:**
- Azure App Service
- Azure SQL Database
- Azure CDN para assets estáticos

**AWS:**
- EC2 para aplicación
- RDS SQL Server
- CloudFront para CDN

### Checklist Pre-Deploy

- [ ] JWT_SECRET configurado y seguro
- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN configurado
- [ ] Base de datos respaldada
- [ ] Usuario administrador creado
- [ ] HTTPS habilitado
- [ ] Firewall configurado
- [ ] Logging configurado
- [ ] Backups automáticos
- [ ] Monitoreo configurado

---

## Solución de Problemas

### Error: Cannot connect to SQL Server

**Síntomas:** Error de conexión al iniciar el servidor

**Soluciones:**
1. Verificar que SQL Server esté corriendo
2. Verificar credenciales en `.env`
3. Verificar firewall: puerto 1433
4. Verificar que TCP/IP esté habilitado en SQL Server Configuration Manager

### Error: Invalid token / Token expirado

**Síntomas:** Usuario es deslogueado inesperadamente

**Soluciones:**
1. Verificar que JWT_SECRET sea consistente
2. Tokens expiran en 8 horas (comportamiento esperado)
3. Limpiar sessionStorage del navegador

### Service Worker no se actualiza

**Síntomas:** Cambios no se reflejan en la app

**Soluciones:**
1. Incrementar versión en `service-worker.js`
2. Ctrl+Shift+R para recarga forzada
3. Application > Service Workers > Unregister

### Sincronización offline no funciona

**Síntomas:** Cambios offline no se sincronizan

**Soluciones:**
1. Verificar consola de errores del navegador
2. Verificar que IndexedDB esté disponible
3. Limpiar IndexedDB y recargar

### Error 403: Forbidden

**Síntomas:** Usuario no puede acceder a módulos

**Soluciones:**
1. Verificar rol del usuario en la base de datos
2. Verificar matriz de permisos en `permissions.js`
3. Verificar token válido

---

## Mantenimiento

### Backups

**Base de Datos:**
```sql
BACKUP DATABASE InventarioDB
TO DISK = 'C:\Backups\InventarioDB.bak'
WITH FORMAT;
```

**Archivos:**
Respaldar directorio completo excepto `node_modules`

### Actualizaciones

**Dependencias:**
```bash
npm outdated
npm update
```

**Seguridad:**
```bash
npm audit
npm audit fix
```

### Logs

Los logs se generan en la consola del servidor. Para producción, configurar:
- Winston para logging estructurado
- Rotación de logs diaria
- Envío a servicio de monitoreo

---

## Soporte Técnico

Para soporte técnico, reportes de bugs o solicitudes de funcionalidades:

- **Documentación:** Consultar archivos .md en el proyecto
- **Issues:** Reportar en el sistema de gestión de proyectos
- **Contacto:** Administrador del sistema

---

## Licencia

Este sistema es de uso exclusivo institucional. Todos los derechos reservados.

---

## Changelog

### Versión 1.0.0 (2024)
- Sistema de inventario base
- Autenticación y autorización
- CRUD completo de bienes
- Dashboard con métricas
- Exportación Excel/PDF
- PWA funcional
- Modo offline/online híbrido
- Sistema de permisos por roles
- Validación de formularios
- Generación de códigos QR

---

**Desarrollado para gestión eficiente del inventario institucional.**
