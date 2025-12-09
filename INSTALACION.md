# Guía de Instalación Paso a Paso

Esta guía proporciona instrucciones detalladas para la instalación y configuración inicial del Sistema de Inventario Institucional.

---

## Requisitos Previos

Antes de comenzar, asegúrese de tener instalado:

### Software Requerido

1. **Node.js** (versión 16 o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`

2. **SQL Server** (2016 o superior)
   - SQL Server Express (gratuito) o versión completa
   - SQL Server Management Studio (SSMS) recomendado
   - Verificar servicio activo en Services.msc

3. **Git** (opcional, para clonar repositorio)
   - Descargar desde: https://git-scm.com/

4. **Editor de Código** (recomendado)
   - Visual Studio Code
   - Sublime Text
   - Notepad++

---

## Paso 1: Obtener el Código Fuente

### Opción A: Clonar con Git

```bash
git clone [URL_DEL_REPOSITORIO]
cd InventarioWeb
```

### Opción B: Descargar ZIP

1. Descargar el archivo ZIP del proyecto
2. Extraer en la ubicación deseada
3. Abrir terminal en la carpeta extraída

---

## Paso 2: Instalar Dependencias de Node.js

Abrir terminal en el directorio del proyecto y ejecutar:

```bash
npm install
```

**Tiempo estimado:** 2-3 minutos

**Dependencias instaladas:**
- express: Framework web
- mssql: Driver SQL Server
- jsonwebtoken: Autenticación JWT
- bcryptjs: Encriptación
- cors: CORS middleware
- dotenv: Variables de entorno

---

## Paso 3: Configurar SQL Server

### 3.1 Habilitar TCP/IP

1. Abrir **SQL Server Configuration Manager**
2. Navegar a: SQL Server Network Configuration > Protocols for [INSTANCE]
3. Clic derecho en **TCP/IP** > Enable
4. Reiniciar servicio SQL Server

### 3.2 Crear Base de Datos

Abrir **SQL Server Management Studio** y conectarse al servidor.

Ejecutar el siguiente script SQL:

```sql
-- Crear base de datos
CREATE DATABASE InventarioDB;
GO

USE InventarioDB;
GO

-- Crear tablas (ver archivo schema.sql completo)
-- O ejecutar el archivo SQL proporcionado

-- Verificar creación
SELECT name FROM sys.databases WHERE name = 'InventarioDB';
```

### 3.3 Crear Usuario de Aplicación (Recomendado)

```sql
-- Crear login
CREATE LOGIN inventario_app WITH PASSWORD = 'Password_Seguro_123!';

-- Crear usuario en la base de datos
USE InventarioDB;
CREATE USER inventario_app FOR LOGIN inventario_app;

-- Asignar permisos
ALTER ROLE db_datareader ADD MEMBER inventario_app;
ALTER ROLE db_datawriter ADD MEMBER inventario_app;
```

---

## Paso 4: Configurar Variables de Entorno

### 4.1 Copiar Archivo de Ejemplo

```bash
copy .env.example .env
```

En Linux/Mac:
```bash
cp .env.example .env
```

### 4.2 Editar Archivo .env

Abrir `.env` con un editor de texto y configurar:

```bash
# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Configuración de Base de Datos
DB_SERVER=localhost
DB_DATABASE=InventarioDB
DB_USER=inventario_app
DB_PASSWORD=Password_Seguro_123!
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# Autenticación (CAMBIAR antes de producción)
JWT_SECRET=temporal_cambiar_por_clave_segura

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

**Notas Importantes:**
- `DB_SERVER`: Puede ser `localhost`, `127.0.0.1` o nombre del servidor
- `DB_USER` y `DB_PASSWORD`: Usar las credenciales configuradas
- `JWT_SECRET`: Cambiar antes de producción (Paso 5)

---

## Paso 5: Generar JWT Secret Seguro

### 5.1 Ejecutar Generador

```bash
node generate-secret.js
```

### 5.2 Copiar Clave Generada

El script mostrará 3 opciones de claves aleatorias. Ejemplo:

```
Opción 1:
a7f3c9e1d8b4f2a6c5e9d3b7f1a8c4e2d9b6f3a7c1e5d8b2f6a9c3e7d1b5f8a4

Opción 2:
c9e7a3f1d5b8e2a6f4c1d7b3e9a5f2c8d4b6e1a7f3c9d5b2e8a4f6c1d3b7e9a5

Opción 3:
e1a9c5f3d7b4e8a2f6c3d9b1e5a7f4c2d8b6e3a9f1c5d7b2e4a8f6c9d3b5e1a7
```

### 5.3 Actualizar .env

Copiar una de las claves y reemplazar en `.env`:

```bash
JWT_SECRET=a7f3c9e1d8b4f2a6c5e9d3b7f1a8c4e2d9b6f3a7c1e5d8b2f6a9c3e7d1b5f8a4
```

---

## Paso 6: Crear Roles y Usuario Inicial

### 6.1 Insertar Roles

Ejecutar en SQL Server Management Studio:

```sql
USE InventarioDB;

-- Insertar roles del sistema
INSERT INTO RolUsuario (NombreRol) VALUES 
('Administrador'), 
('Supervisor'), 
('Consultor');

-- Verificar inserción
SELECT * FROM RolUsuario;
```

### 6.2 Generar Hash de Contraseña

Opción A - Usar Node.js:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"
```

Opción B - Usar script proporcionado:

```javascript
// Crear archivo hash-password.js
const bcrypt = require('bcryptjs');
const password = process.argv[2] || 'admin123';
console.log(bcrypt.hashSync(password, 10));
```

Ejecutar:
```bash
node hash-password.js admin123
```

### 6.3 Insertar Usuario Administrador

Con el hash generado, ejecutar en SQL Server:

```sql
USE InventarioDB;

-- Reemplazar [HASH_GENERADO] con el hash obtenido
INSERT INTO Usuario (NombreUsuario, Clave, IdRol, Estado)
VALUES ('admin', '[HASH_GENERADO]', 1, 1);

-- Ejemplo (este hash es para 'admin123'):
-- INSERT INTO Usuario (NombreUsuario, Clave, IdRol, Estado)
-- VALUES ('admin', '$2a$10$rOzJQjKvXGKvXGKvXGKvXeN7vXGKvXGKvXGKvXGKvXGKvXGKvXGKv', 1, 1);

-- Verificar inserción
SELECT * FROM Usuario;
```

---

## Paso 7: Verificar Conexión a Base de Datos

Ejecutar el script de prueba:

```bash
node test-connection.js
```

**Salida esperada:**
```
Conectado a SQL Server
Prueba de conexión exitosa
```

**Si hay error:**
- Verificar que SQL Server esté corriendo
- Verificar credenciales en `.env`
- Verificar firewall y puerto 1433
- Verificar que TCP/IP esté habilitado

---

## Paso 8: Iniciar el Servidor

### Modo Desarrollo

```bash
npm start
```

### Con Auto-reload (Desarrollo)

```bash
npm run dev
```

**Salida esperada:**
```
Servidor corriendo en http://localhost:3000
API disponible en http://localhost:3000/api
Seguridad: Autenticación JWT + Rate Limiting + Sanitización
Modo: development
Conectado a SQL Server
```

---

## Paso 9: Acceder a la Aplicación

### 9.1 Abrir Navegador

Navegar a: `http://localhost:3000`

### 9.2 Iniciar Sesión

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

### 9.3 Verificar Funcionalidad

1. Verificar que carga el dashboard
2. Navegar a diferentes módulos
3. Verificar permisos según rol
4. Crear un bien de prueba

---

## Paso 10: Instalación como PWA (Opcional)

### En Escritorio (Chrome/Edge)

1. Abrir la aplicación en el navegador
2. Buscar el ícono de instalación en la barra de direcciones
3. Clic en "Instalar"
4. La aplicación se abrirá en una ventana independiente

### En Móvil

1. Abrir en navegador móvil
2. Menú (⋮) > "Agregar a pantalla de inicio"
3. Confirmar instalación
4. Ícono aparecerá en el menú de aplicaciones

---

## Paso 11: Configuración Adicional (Recomendada)

### Crear Más Usuarios

```sql
USE InventarioDB;

-- Usuario Supervisor
INSERT INTO Usuario (NombreUsuario, Clave, IdRol, Estado)
VALUES ('supervisor', '[HASH_CONTRASEÑA]', 2, 1);

-- Usuario Consultor
INSERT INTO Usuario (NombreUsuario, Clave, IdRol, Estado)
VALUES ('consultor', '[HASH_CONTRASEÑA]', 3, 1);
```

### Poblar Catálogos Básicos

```sql
-- Estados
INSERT INTO Estado (Nombre) VALUES 
('Nuevo'), ('Bueno'), ('Regular'), ('Malo'), ('Obsoleto');

-- Áreas
INSERT INTO Area (Nombre) VALUES 
('Administración'), ('Sistemas'), ('Contabilidad'), ('RRHH');

-- Tipos de Movimiento
INSERT INTO TipoMovimiento (NombreMovimiento) VALUES 
('Asignación'), ('Transferencia'), ('Mantenimiento'), ('Baja');
```

### Configurar Backup Automático (SQL Server)

1. Abrir SQL Server Management Studio
2. Clic derecho en la base de datos > Tasks > Back Up
3. Configurar backup automático en SQL Server Agent

---

## Solución de Problemas Comunes

### Error: "Cannot find module"

**Solución:**
```bash
rm -rf node_modules
npm install
```

### Error: "Port 3000 already in use"

**Solución:**
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso en puerto 3000
npx kill-port 3000
```

### Error: "Login failed for user"

**Solución:**
1. Verificar usuario y contraseña en `.env`
2. Verificar que el usuario tenga permisos en la BD
3. Verificar autenticación de SQL Server (Windows/Mixed)

### No se puede conectar desde otro dispositivo

**Solución:**
1. Verificar firewall de Windows
2. Cambiar `.env`: `DB_SERVER=0.0.0.0`
3. Acceder desde: `http://[IP_SERVIDOR]:3000`

---

## Verificación de Instalación Exitosa

Checklist:

- [ ] Node.js instalado y versión verificada
- [ ] SQL Server instalado y corriendo
- [ ] Base de datos InventarioDB creada
- [ ] Tablas creadas correctamente
- [ ] Archivo .env configurado
- [ ] JWT_SECRET generado y actualizado
- [ ] Roles insertados en base de datos
- [ ] Usuario administrador creado
- [ ] Conexión a BD verificada
- [ ] Servidor iniciado sin errores
- [ ] Aplicación accesible en navegador
- [ ] Login funcional
- [ ] Dashboard carga correctamente

---

## Próximos Pasos

Una vez completada la instalación:

1. **Cambiar contraseña del administrador** desde el sistema
2. **Crear usuarios adicionales** según necesidad
3. **Poblar catálogos** con datos institucionales
4. **Configurar backups** automáticos
5. **Revisar documentación** de uso del sistema
6. **Configurar para producción** (ver README.md > Deployment)

---

## Soporte

Si encuentra problemas durante la instalación:

1. Revisar los logs del servidor en la consola
2. Consultar sección "Solución de Problemas" en README.md
3. Verificar configuración de .env
4. Contactar al administrador del sistema

---

**Instalación completada exitosamente.**
