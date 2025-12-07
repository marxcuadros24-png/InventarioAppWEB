# 🔧 Guía: Habilitar TCP/IP en SQL Server

## Problema Detectado

El error `Port for CUADROS not found` indica que el protocolo TCP/IP no está habilitado para tu instancia de SQL Server, o el puerto no está configurado correctamente.

## Solución: Habilitar TCP/IP

### Paso 1: Abrir SQL Server Configuration Manager

1. Presiona `Win + R`
2. Escribe: `SQLServerManager15.msc` (o `SQLServerManager14.msc` / `SQLServerManager13.msc` dependiendo de tu versión)
3. Presiona Enter

**Si no funciona**, busca "SQL Server Configuration Manager" en el menú inicio.

### Paso 2: Habilitar TCP/IP

1. En el panel izquierdo, expande: **SQL Server Network Configuration**
2. Haz clic en: **Protocols for CUADROS**
3. En el panel derecho, busca **TCP/IP**
4. Haz clic derecho en **TCP/IP** → **Enable**
5. Aparecerá un mensaje diciendo que debes reiniciar el servicio

### Paso 3: Configurar Puerto (Opcional pero Recomendado)

1. Haz clic derecho en **TCP/IP** → **Properties**
2. Ve a la pestaña **IP Addresses**
3. Desplázate hasta el final y busca **IPAll**
4. En **TCP Port**, escribe: `1433`
5. Borra el valor de **TCP Dynamic Ports** (déjalo vacío)
6. Haz clic en **OK**

### Paso 4: Reiniciar SQL Server

1. En el panel izquierdo, haz clic en: **SQL Server Services**
2. Busca: **SQL Server (CUADROS)**
3. Haz clic derecho → **Restart**
4. Espera a que el servicio se reinicie (el estado debe ser "Running")

### Paso 5: Verificar SQL Server Browser

1. En **SQL Server Services**, busca: **SQL Server Browser**
2. Si el estado es "Stopped", haz clic derecho → **Start**
3. Haz clic derecho → **Properties**
4. Cambia **Start Mode** a **Automatic**
5. Haz clic en **OK**

---

## Después de Completar los Pasos

Ejecuta el siguiente comando para probar la conexión:

\`\`\`bash
node test-connection.js
\`\`\`

Si la conexión es exitosa, ejecuta:

\`\`\`bash
npm run setup
\`\`\`

---

## Alternativa: Usar Puerto Específico

Si prefieres no modificar la configuración de SQL Server, puedes conectarte usando el puerto directamente.

### Opción 1: Encontrar el Puerto Actual

Ejecuta en PowerShell:

\`\`\`powershell
Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL*.CUADROS\MSSQLServer\SuperSocketNetLib\Tcp\IPAll'
\`\`\`

Busca el valor de **TcpDynamicPorts** (por ejemplo: 49152)

### Opción 2: Actualizar .env

Modifica tu archivo `.env` para usar el puerto directamente:

\`\`\`env
DB_SERVER=DESKTOP-7V4Q0MK,49152
\`\`\`

(Reemplaza `49152` con el puerto que encontraste)

---

## ¿Necesitas Ayuda?

Si sigues teniendo problemas, avísame y te ayudo con pasos adicionales.
