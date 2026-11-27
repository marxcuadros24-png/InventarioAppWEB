# Sistema de Inventario Institucional

Sistema web híbrido (PWA) para la gestión integral de inventario institucional, con soporte **online/offline**, sincronización automática y control de acceso basado en roles (**RBAC**).

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos](#requisitos)
- [Instalación y Puesta en Marcha](#instalación-y-puesta-en-marcha)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura y Modo Híbrido](#arquitectura-y-modo-híbrido)
- [Seguridad](#seguridad)
- [Endpoints Principales (API)](#endpoints-principales-api)
- [Despliegue en Producción](#despliegue-en-producción)
- [Solución de Problemas](#solución-de-problemas)
- [Documentación Adicional](#documentación-adicional)

---

## Características Principales

- **Gestión de bienes:** Registro completo, códigos patrimoniales, categorización jerárquica (Tipo de Bien / Categoría), estado, ubicación, responsable, datos de adquisición y especificaciones técnicas.
- **Control de acceso (RBAC):** Roles `Administrador`, `Supervisor` y `Consultor` con permisos granulares en frontend y backend.
- **PWA y modo offline:** Instalable en escritorio/móvil, caché de activos estáticos mediante Service Worker, almacenamiento local en `IndexedDB` y cola de sincronización al recuperar conexión.
- **Reportes y utilidades:** Dashboard con métricas, exportación a Excel y PDF (`jspdf`), generación y lectura de códigos QR (`qrcode`), y módulo de auditoría y movimientos.

---

## Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Node.js (>= 16), Express 4, `mssql` (SQL Server), `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv` |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), IndexedDB, Service Worker, `jspdf`, `qrcode` |
| **Base de datos** | Microsoft SQL Server 2016+ |

---

## Requisitos

- **Node.js** >= 16.0.0 y **npm** >= 7.0.0
- **SQL Server** 2016 o superior (puerto `1433` accesible y TCP/IP habilitado)
- Navegador moderno (Chrome, Edge, Firefox o Safari)

---

## Instalación y Puesta en Marcha

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <URL_DEL_REPOSITORIO>
cd InventarioWeb
npm install
```

### 2. Configurar variables de entorno

Copia la plantilla y completa tus propios valores locales (el archivo `.env` está ignorado por Git y **nunca debe subirse al repositorio**):

```bash
copy .env.example .env
```

### 3. Generar un `JWT_SECRET` seguro

```bash
node generate-secret.js
```

Copia la clave generada y asígnala a `JWT_SECRET` en tu archivo `.env`.

### 4. Verificar conexión y configuración inicial

```bash
node test-connection.js
npm run setup
```

> [!IMPORTANT]
> No utilices contraseñas por defecto ni credenciales de ejemplo en entornos reales. Crea el usuario administrador inicial desde el flujo de configuración o insertando un hash `bcrypt` generado de forma segura.

### 5. Iniciar el servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

La aplicación quedará disponible en `http://localhost:3000`.

---

## Variables de Entorno

Usa `.env.example` como referencia y define tus propias credenciales en `.env`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos SQL Server
DB_SERVER=localhost
DB_DATABASE=InventarioDB
DB_USER=<TU_USUARIO_SQL>
DB_PASSWORD=<TU_CONTRASENA_SEGURA>
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# JWT (generar con: node generate-secret.js)
JWT_SECRET=<CLAVE_ALEATORIA_SEGURA>

# CORS (en producción, indicar el dominio exacto, ej. https://inventario.tu-dominio.com)
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

> [!CAUTION]
> Nunca publiques archivos `.env`, contraseñas, cadenas de conexión reales ni claves `JWT_SECRET` en el código fuente, documentación o commits.

---

## Estructura del Proyecto

```text
InventarioWeb/
├── config/
│   └── database.js              # Pool de conexiones a SQL Server
├── middleware/
│   └── security.js              # JWT, RBAC, rate limiting, sanitización y logging
├── routes/
│   ├── auth.js                  # Login y verificación de token
│   ├── bienes.js                # CRUD de bienes
│   ├── responsables.js          # CRUD de responsables
│   ├── catalogos.js             # Gestión de catálogos
│   ├── movimientos.js           # Registro de movimientos
│   ├── dashboard.js             # Estadísticas del inventario
│   ├── auditoria.js             # Auditoría del sistema
│   └── usuarios.js              # Gestión de usuarios y roles
├── public/
│   ├── assets/                  # Íconos, logos y recursos gráficos
│   ├── css/                     # Estilos globales, modales, ayuda y skeletons
│   ├── js/                      # SPA, cliente API, IndexedDB, sync, permisos, QR y Excel
│   ├── index.html               # Aplicación principal (SPA)
│   ├── manifest.json            # Manifiesto PWA
│   └── service-worker.js        # Caché offline y ciclo de vida PWA
├── server.js                    # Servidor Express
├── setup.js                     # Script de configuración inicial
├── test-connection.js           # Prueba de conexión a SQL Server
├── generate-secret.js           # Generador de JWT_SECRET
├── .env.example                 # Plantilla de variables de entorno
└── package.json
```

---

## Arquitectura y Modo Híbrido

```text
[Cliente SPA] <-> [Service Worker] <-> [API Client] <-> [Express + Security] <-> [SQL Server]
                      [IndexedDB]
```

- **Online:** Las peticiones se envían al backend y los datos se almacenan localmente en `IndexedDB` para consulta rápida.
- **Offline:** Las operaciones pendientes se encolan localmente y la interfaz continúa operando con los datos cacheados.
- **Sincronización:** Al restablecerse la conexión, `sync.js` procesa la cola pendiente y actualiza el estado local.

---

## Seguridad

- **Autenticación:** Tokens JWT con expiración de 8 horas (`Authorization: Bearer <token>`), almacenados en `sessionStorage` en el cliente.
- **Contraseñas:** Hasheadas con `bcryptjs` (cost factor `10`). Los campos de contraseña no son alterados por el middleware de sanitización.
- **Autorización (RBAC):**
  - **Administrador:** Acceso total (incluye usuarios y auditoría).
  - **Supervisor:** Gestión operativa de bienes, responsables y movimientos.
  - **Consultor:** Solo lectura.
- **Protección de API:**
  - Consultas SQL parametrizadas mediante `mssql`.
  - Rate limiting por IP (más estricto en `/api/auth` y en `NODE_ENV=production`).
  - Sanitización de entradas en `body`, `query` y `params`, y validación de `Content-Type`.
  - CORS restringido en producción cuando `NODE_ENV=production` requiere `CORS_ORIGIN` explícito.

---

## Endpoints Principales (API)

| Módulo | Ruta base | Acceso |
| :--- | :--- | :--- |
| Autenticación | `/api/auth/login`, `/api/auth/verify` | Público / Token |
| Bienes | `/api/bienes` | Autenticado (escritura: Admin/Supervisor; borrado: Admin) |
| Responsables | `/api/responsables` | Autenticado |
| Movimientos | `/api/movimientos` | Autenticado |
| Catálogos | `/api/catalogos` | Autenticado (escritura: Admin) |
| Dashboard | `/api/dashboard` | Autenticado |
| Usuarios | `/api/usuarios` | Solo Administrador |
| Auditoría | `/api/auditoria` | Solo Administrador |

---

## Despliegue en Producción

1. Configura `NODE_ENV=production`, un `JWT_SECRET` único, credenciales de SQL Server dedicadas (con mínimos privilegios) y `CORS_ORIGIN` con el dominio real.
2. Instala únicamente dependencias de producción:
   ```bash
   npm install --omit=dev
   ```
3. Coloca la aplicación detrás de un proxy inverso con **HTTPS** (por ejemplo, Nginx o IIS con certificado SSL).
4. Ejecuta el proceso con un gestor como `pm2`:
   ```bash
   pm2 start server.js --name inventario
   pm2 save
   ```

---

## Solución de Problemas

- **Error de conexión a SQL Server:** Verifica que el servicio esté activo, que el puerto `1433` esté abierto y que TCP/IP esté habilitado (consulta [GUIA_TCPIP.md](GUIA_TCPIP.md)). Ejecuta `node test-connection.js` para diagnosticar.
- **Sesión expirada / Token inválido:** Los JWT expiran a las 8 horas. Verifica que `JWT_SECRET` no haya cambiado entre reinicios.
- **Cambios en frontend no visibles:** Incrementa `CACHE_NAME` en `public/service-worker.js` o recarga con `Ctrl + Shift + R`.

---

## Documentación Adicional

- [INSTALACION.md](INSTALACION.md) — Guía detallada de instalación
- [ENV_CONFIG.md](ENV_CONFIG.md) — Configuración de variables de entorno
- [GUIA_TCPIP.md](GUIA_TCPIP.md) — Habilitar TCP/IP en SQL Server
- [MANUAL_USUARIO.md](MANUAL_USUARIO.md) — Manual de usuario
- [VALIDACION.md](VALIDACION.md) — Reglas de validación de formularios
- [CHANGELOG.md](CHANGELOG.md) — Historial de cambios

---

## Licencia

Uso exclusivo institucional. Todos los derechos reservados.
