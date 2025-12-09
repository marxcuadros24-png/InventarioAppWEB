# ✅ Checklist de Variables de Entorno para Producción

## 📋 Variables Críticas a Verificar

### 1. JWT_SECRET (🔴 MUY IMPORTANTE)

```bash
# Actual (INSEGURO para producción):
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura_cambiar_en_produccion_123456

# Debe ser (SEGURO):
JWT_SECRET=un_string_aleatorio_muy_largo_y_unico_de_al_menos_64_caracteres_que_nadie_pueda_adivinar
```

**Generar clave segura:**
```powershell
# PowerShell (Windows)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

O usa un generador online: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx

---

### 2. NODE_ENV

```bash
# Desarrollo:
NODE_ENV=development

# Producción:
NODE_ENV=production
```

⚠️ **Cambiar a `production` antes de desplegar** - esto activa:
- Rate limiting más estricto
- Ocultación de detalles de errores
- Optimizaciones de rendimiento

---

### 3. CORS_ORIGIN

```bash
# Desarrollo (permite todo):
CORS_ORIGIN=*

# Producción (especificar dominio):
CORS_ORIGIN=https://tu-dominio.com
```

---

### 4. Base de Datos

```bash
DB_SERVER=localhost          # O tu servidor SQL Server
DB_DATABASE=InventarioDB
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_ENCRYPT=false             # true si usas Azure SQL
DB_TRUST_SERVER_CERTIFICATE=true
```

---

### 5. Puerto

```bash
PORT=3000  # O el puerto que prefieras
```

---

## 🚀 Pasos para Configurar

1. **Abre tu archivo `.env`**
2. **Verifica que tengas TODAS estas variables**
3. **Cambia `JWT_SECRET` por una clave aleatoria ANTES de producción**
4. **Cambia `NODE_ENV` a `production` cuando despliegues**
5. **Configura `CORS_ORIGIN` con tu dominio real**

---

## ⚠️ Seguridad

- ✅ El archivo `.env` ya está en `.gitignore` (no se sube a GitHub)
- ❌ NUNCA compartas tu `JWT_SECRET`
- ❌ NUNCA pongas passwords reales en `.env.example`
- ✅ Usa `.env.example` como plantilla pero con valores de ejemplo

---

## 🔍 Verificar Configuración Actual

```powershell
# Ver variables actuales (SIN mostrar valores sensibles)
npm run test-connection
```

---

## 📝 Ejemplo Completo para Producción

```bash
# Servidor
PORT=3000
NODE_ENV=production

# Base de Datos
DB_SERVER=tu-servidor-sql.database.windows.net
DB_DATABASE=InventarioDB
DB_USER=adminuser
DB_PASSWORD=Password_Seguro_123!
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

# JWT (CAMBIAR OBLIGATORIAMENTE)
JWT_SECRET=8j2k9Lm3Np4Qr5St6Uv7Wx8Yz9Ab0Cd1Ef2Gh3Ij4Kl5Mn6Op7Qr8St9Uv0Wx1Yz2

# CORS (Tu dominio real)
CORS_ORIGIN=https://inventario.miempresa.com

# Rate Limiting (opcional)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## ✅ Listo para Producción Cuando:

- [ ] `JWT_SECRET` es único y aleatorio (mínimo 64 caracteres)
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` apunta a tu dominio
- [ ] Credenciales de BD son correctas
- [ ] `.env` NO está en control de versiones (verificar `.gitignore`)

---

**Siguiente paso:** Crear script de verificación pre-deploy
