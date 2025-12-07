# 📦 Inventario Institucional - Web Application

Sistema web híbrido (online/offline) para gestión de inventario institucional con Progressive Web App (PWA).

## 🚀 Características

- ✅ **Modo Híbrido**: Funciona online y offline
- ✅ **PWA**: Instalable como aplicación nativa
- ✅ **Sincronización Automática**: Los cambios offline se sincronizan automáticamente
- ✅ **Gestión Completa**: Bienes, Responsables, Movimientos, Auditoría
- ✅ **Dashboard**: Estadísticas y métricas en tiempo real
- ✅ **Diseño Moderno**: Interfaz oscura con glassmorphism
- ✅ **Responsive**: Funciona en móvil, tablet y escritorio

## 📋 Requisitos

- Node.js 16+
- SQL Server (con la base de datos InventarioDB)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

## 🛠️ Instalación

### 1. Clonar o descargar el proyecto

```bash
cd "c:\Users\USUARIO\Documents\4to Ciclo\InventarioWeb"
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env` y configurar:

```bash
copy .env.example .env
```

Editar `.env` con tus credenciales de SQL Server:

```env
DB_SERVER=localhost
DB_DATABASE=InventarioDB
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_PORT=1433

PORT=3000

JWT_SECRET=cambiar_por_una_clave_segura
```

### 4. Crear usuario inicial en la base de datos

Ejecutar en SQL Server para crear un usuario de prueba:

```sql
USE InventarioDB;

-- Crear usuario con contraseña hasheada (bcrypt de "admin123")
INSERT INTO Usuario (NombreUsuario, Clave, IdRol, Estado)
VALUES ('admin', '$2a$10$rOzJQjKvXGKvXGKvXGKvXeN7vXGKvXGKvXGKvXGKvXGKvXGKvXGKv', 1, 1);
```

**Nota**: Deberás hashear la contraseña usando bcrypt. Puedes usar este código Node.js:

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('admin123', 10);
console.log(hash);
```

### 5. Iniciar el servidor

```bash
npm start
```

Para desarrollo con auto-reload:

```bash
npm run dev
```

## 🌐 Uso

1. Abrir navegador en: `http://localhost:3000`
2. Iniciar sesión con las credenciales creadas
3. La aplicación se puede instalar como PWA desde el navegador

### Credenciales de ejemplo:
- **Usuario**: admin
- **Contraseña**: admin123

## 📱 Instalación como PWA

### En Chrome/Edge:
1. Abrir la aplicación en el navegador
2. Clic en el ícono de instalación en la barra de direcciones
3. Seguir las instrucciones

### En móvil:
1. Abrir en navegador
2. Menú → "Agregar a pantalla de inicio"

## 🔄 Modo Offline

La aplicación funciona completamente offline:

1. **Con Internet**: Los datos se guardan en SQL Server y se cachean localmente
2. **Sin Internet**: Los datos se guardan en IndexedDB local
3. **Al Recuperar Internet**: Se sincronizan automáticamente todos los cambios

## 📁 Estructura del Proyecto

```
InventarioWeb/
├── config/
│   └── database.js          # Configuración SQL Server
├── routes/
│   ├── auth.js             # Autenticación
│   ├── bienes.js           # CRUD Bienes
│   ├── responsables.js     # CRUD Responsables
│   ├── catalogos.js        # Catálogos
│   ├── movimientos.js      # Movimientos
│   ├── dashboard.js        # Estadísticas
│   └── auditoria.js        # Auditoría
├── public/
│   ├── css/
│   │   └── styles.css      # Estilos
│   ├── js/
│   │   ├── app.js          # Lógica principal
│   │   ├── api.js          # Cliente API
│   │   ├── db.js           # IndexedDB
│   │   ├── sync.js         # Sincronización
│   │   └── auth.js         # Autenticación
│   ├── index.html          # HTML principal
│   ├── manifest.json       # PWA Manifest
│   └── service-worker.js   # Service Worker
├── server.js               # Servidor Express
├── package.json
└── .env                    # Variables de entorno
```

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token

### Bienes
- `GET /api/bienes` - Listar bienes
- `GET /api/bienes/:id` - Obtener bien
- `POST /api/bienes` - Crear bien
- `PUT /api/bienes/:id` - Actualizar bien
- `DELETE /api/bienes/:id` - Eliminar bien

### Responsables
- `GET /api/responsables` - Listar responsables
- `POST /api/responsables` - Crear responsable
- `PUT /api/responsables/:id` - Actualizar responsable
- `DELETE /api/responsables/:id` - Eliminar responsable

### Otros
- `GET /api/catalogos/all` - Obtener todos los catálogos
- `GET /api/movimientos` - Listar movimientos
- `GET /api/dashboard/stats` - Estadísticas
- `GET /api/auditoria` - Historial de auditoría

## 🎨 Tecnologías Utilizadas

### Backend
- Node.js
- Express
- mssql (SQL Server driver)
- JWT (autenticación)
- bcryptjs (hash de contraseñas)

### Frontend
- HTML5
- CSS3 (Variables, Grid, Flexbox, Animations)
- JavaScript (ES6+)
- IndexedDB
- Service Workers
- PWA

## 🐛 Solución de Problemas

### Error de conexión a SQL Server
- Verificar que SQL Server esté corriendo
- Verificar credenciales en `.env`
- Verificar que el puerto 1433 esté abierto

### La app no funciona offline
- Verificar que el Service Worker esté registrado (consola del navegador)
- Limpiar cache del navegador y recargar

### Error de autenticación
- Verificar que el usuario exista en la base de datos
- Verificar que la contraseña esté hasheada correctamente

## 📝 Licencia

Este proyecto es de uso interno institucional.

## 👥 Soporte

Para soporte técnico, contactar al administrador del sistema.
