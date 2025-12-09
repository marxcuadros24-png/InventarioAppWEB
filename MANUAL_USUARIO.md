# Manual de Usuario - Sistema de Inventario Institucional

## Introducción

Este manual proporciona instrucciones para el uso cotidiano del Sistema de Inventario Institucional. Está dirigido a usuarios finales con diferentes niveles de acceso.

---

## Tabla de Contenidos

1. [Acceso al Sistema](#acceso-al-sistema)
2. [Roles y Permisos](#roles-y-permisos)
3. [Panel de Control (Dashboard)](#panel-de-control)
4. [Gestión de Bienes](#gestión-de-bienes)
5. [Gestión de Responsables](#gestión-de-responsables)
6. [Registro de Movimientos](#registro-de-movimientos)
7. [Generación de Reportes](#generación-de-reportes)
8. [Catálogos](#catálogos)
9. [Gestión de Usuarios](#gestión-de-usuarios)
10. [Modo Offline](#trabajar-sin-conexión)
11. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Acceso al Sistema

### Inicio de Sesión

1. Abrir navegador web
2. Navegar a la URL del sistema: `http://[servidor]:3000`
3. Ingresar usuario y contraseña
4. Clic en "Iniciar Sesión"

**Nota:** Las credenciales son proporcionadas por el administrador del sistema.

### Cierre de Sesión

1. Clic en el ícono de usuario (esquina superior derecha)
2. Seleccionar "Cerrar Sesión"

**Importante:** Siempre cierre sesión al terminar, especialmente en equipos compartidos.

---

## Roles y Permisos

El sistema maneja tres niveles de acceso:

### Administrador
- Acceso completo a todos los módulos
- Puede crear, editar y eliminar cualquier información
- Gestiona usuarios y catálogos
- Acceso a auditoría

### Supervisor
- Puede agregar y editar bienes
- Puede crear y editar responsables
- Puede registrar movimientos
- No puede eliminar información
- No puede acceder a gestión de usuarios ni catálogos

### Consultor
- Solo lectura en todos los módulos
- Puede ver información y generar reportes
- No puede crear, editar ni eliminar

---

## Panel de Control

Al iniciar sesión, se muestra el panel de control con:

### Tarjetas de Estadísticas

**Total de Bienes**
- Número total de bienes registrados
- Actualizado en tiempo real

**Responsables Activos**
- Cantidad de responsables con bienes asignados

**Movimientos del Mes**
- Movimientos registrados en el mes actual

**Valor Total**
- Suma del valor de todos los bienes

### Gráficos

**Distribución por Estado**
- Gráfico de barras mostrando bienes por estado
- (Nuevo, Bueno, Regular, Malo, Obsoleto)

**Top 5 Áreas**
- Gráfico circular con las áreas con más bienes

### Actividad Reciente
- Últimos movimientos registrados
- Clic en un movimiento para ver detalles

---

## Gestión de Bienes

### Ver Lista de Bienes

1. Clic en "Bienes" en el menú lateral
2. Se muestra tabla con todos los bienes
3. Usar barra de búsqueda para filtrar
4. Usar filtros por estado, área o categoría

### Registrar Nuevo Bien

**Permisos:** Administrador, Supervisor

1. Clic en "Nuevo Bien"
2. Completar formulario:
   - **Código Patrimonial:** Generado automáticamente o manual
   - **Nombre:** Descripción del bien
   - **Categoría:** Seleccionar tipo y categoría
   - **Marca:** Opcional
   - **Modelo:** Opcional
   - **Estado:** Seleccionar estado actual
   - **Área:** Ubicación del bien
   - **Responsable:** Persona asignada (opcional)
   - **Observaciones:** Información adicional

3. **Información de Adquisición:**
   - Fecha de adquisición
   - Costo
   - Proveedor
   - Método de adquisición

4. **Especificaciones Técnicas** (para equipos):
   - Procesador
   - Memoria RAM
   - Almacenamiento
   - Pantalla
   - Otros detalles

5. Clic en "Guardar"

### Editar Bien

**Permisos:** Administrador, Supervisor

1. En la lista de bienes, clic en el ícono de edición
2. Modificar los campos necesarios
3. Clic en "Guardar"

### Eliminar Bien

**Permisos:** Solo Administrador

1. Clic en el ícono de eliminación
2. Confirmar la acción
3. El bien se elimina permanentemente

**Precaución:** Esta acción no se puede deshacer.

### Generar Código QR

1. Clic en el ícono QR del bien
2. El código QR se genera automáticamente
3. Opciones:
   - Descargar imagen
   - Imprimir directamente
   - Compartir

---

## Gestión de Responsables

### Ver Responsables

1. Clic en "Responsables" en el menú
2. Lista de todos los responsables registrados
3. Ver bienes asignados a cada uno

### Agregar Responsable

**Permisos:** Administrador, Supervisor

1. Clic en "Nuevo Responsable"
2. Completar datos:
   - Nombres
   - Apellidos
   - DNI
   - Teléfono
   - Correo electrónico
   - Área de trabajo
3. Guardar

### Editar Responsable

**Permisos:** Administrador, Supervisor

1. Clic en editar
2. Modificar información
3. Guardar cambios

### Eliminar Responsable

**Permisos:** Solo Administrador

**Restricción:** No se puede eliminar si tiene bienes asignados.

1. Primero reasignar o quitar bienes
2. Luego eliminar responsable

---

## Registro de Movimientos

Los movimientos registran cualquier cambio o acción realizada sobre un bien.

### Tipos de Movimientos

- **Asignación:** Asignar bien a responsable
- **Transferencia:** Cambio de ubicación o responsable
- **Mantenimiento:** Registro de mantenimiento realizado
- **Baja:** Dar de baja un bien

### Registrar Movimiento

**Permisos:** Administrador, Supervisor

1. Ir a "Movimientos"
2. Clic en "Nuevo Movimiento"
3. Seleccionar:
   - Bien (buscar por código o nombre)
   - Tipo de movimiento
   - Descripción detallada
4. Guardar

**Nota:** El sistema registra automáticamente:
- Fecha y hora del movimiento
- Usuario que realizó el registro

### Ver Historial de Movimientos

1. Ver todos los movimientos en lista general
2. Filtrar por:
   - Bien específico
   - Rango de fechas
   - Tipo de movimiento
3. Exportar a Excel para análisis

---

## Generación de Reportes

### Acceder a Reportes

1. Clic en "Reportes" en menú
2. Ver sección de exportación

### Tipos de Reportes

**Reporte de Bienes**
- Lista completa de todos los bienes
- Incluye toda la información de cada bien
- Formato Excel con columnas organizadas

**Reporte de Movimientos**
- Historial completo de movimientos
- Incluye fechas, tipos y responsables
- Útil para auditorías

**Reporte de Responsables**
- Lista de responsables con bienes asignados
- Cantidad y valor de bienes por responsable
- Información de contacto

**Reporte Completo**
- Archivo Excel con múltiples hojas
- Incluye todos los datos del sistema
- Bienes + Movimientos + Responsables + Estadísticas

### Generar Reporte

1. Seleccionar tipo de reporte
2. Clic en "Exportar"
3. El archivo se descarga automáticamente
4. Abrir con Microsoft Excel o similar

### Visualizar Estadísticas

- Ver gráficos interactivos
- Filtrar por periodo
- Cambiar tipo de gráfico

---

## Catálogos

**Permisos:** Solo Administrador

Los catálogos son listas de referencia usadas en el sistema:

### Tipos de Catálogos

- **Estados:** Nuevo, Bueno, Regular, Malo, Obsoleto
- **Tipos de Bien:** Mueble, Equipo, Vehículo, etc.
- **Categorías:** Por cada tipo de bien
- **Áreas:** Departamentos o ubicaciones
- **Marcas:** Marcas comerciales
- **Métodos de Adquisición:** Compra, Donación, etc.

### Gestionar Catálogos

1. Ir a "Catálogos"
2. Seleccionar catálogo a gestionar
3. Opciones:
   - Agregar nuevo elemento
   - Editar existente
   - Eliminar (si no está en uso)

---

## Gestión de Usuarios

**Permisos:** Solo Administrador

### Ver Usuarios

1. Ir a "Usuarios"
2. Lista de todos los usuarios del sistema
3. Ver rol asignado y estado

### Crear Usuario

1. Clic en "Nuevo Usuario"
2. Ingresar:
   - Nombre de usuario
   - Contraseña inicial
   - Rol (Administrador, Supervisor, Consultor)
   - Responsable asociado (opcional)
   - Estado (Activo/Inactivo)
3. Guardar

**Nota:** El usuario debe cambiar su contraseña en el primer inicio de sesión.

### Editar Usuario

1. Clic en editar
2. Modificar datos:
   - Cambiar rol
   - Resetear contraseña
   - Activar/Desactivar
3. Guardar

### Desactivar Usuario

En lugar de eliminar, es recomendable desactivar:
1. Editar usuario
2. Cambiar estado a "Inactivo"
3. El usuario no podrá iniciar sesión

---

## Trabajar sin Conexión

El sistema funciona en modo offline cuando no hay internet.

### Funcionalidad Offline

**Lo que SÍ funciona:**
- Ver información previamente cargada
- Crear nuevos bienes
- Editar información
- Registrar movimientos
- Ver reportes de datos locales

**Lo que NO funciona:**
- Sincronización en tiempo real
- Carga de imágenes nuevas
- Actualización de catálogos

### Cómo Funciona

1. **Automático:** El sistema detecta pérdida de conexión
2. **Almacenamiento Local:** Datos se guardan en el navegador
3. **Indicador:** Se muestra mensaje "Trabajando sin conexión"
4. **Sincronización:** Al recuperar conexión, cambios se sincronizan

### Recomendaciones

- No cerrar el navegador mientras haya cambios sin sincronizar
- Verificar sincronización antes de cerrar sesión
- En caso de conflicto, prevalece el último cambio guardado

---

## Preguntas Frecuentes

### ¿Cómo cambio mi contraseña?

Actualmente debe contactar al administrador. (Funcionalidad de perfil en desarrollo)

### ¿Puedo usar el sistema en mi móvil?

Sí, el sistema es responsive y funciona en navegadores móviles.

### ¿Puedo instalar la aplicación?

Sí, como PWA. En Chrome: Menú > "Instalar aplicación"

### ¿Qué navegadores son compatibles?

Chrome, Firefox, Edge, Safari (versiones recientes)

### ¿Los datos se guardan automáticamente?

Sí, pero debe hacer clic en "Guardar" en cada formulario.

### ¿Puedo recuperar un bien eliminado?

No, las eliminaciones son permanentes. Por eso solo administradores pueden eliminar.

### ¿Cómo busco un bien específico?

Use la barra de búsqueda en la lista de bienes. Busca por código, nombre o responsable.

### ¿Puedo exportar datos a otros formatos?

Actualmente se exporta a Excel. PDF está en desarrollo.

### ¿El sistema registra quién hace cada cambio?

Sí, todas las acciones quedan registradas en auditoría.

### ¿Qué hago si olvido mi contraseña?

Contactar al administrador para reseteo.

---

## Consejos de Uso

### Buenas Prácticas

1. **Cerrar sesión** al terminar
2. **Usar búsqueda** en lugar de scroll en listas largas
3. **Verificar datos** antes de guardar
4. **Agregar observaciones** descriptivas
5. **Generar reportes** periódicamente para respaldo
6. **Mantener catálogos** actualizados (administradores)

### Atajos de Teclado

- `Alt + D`: Ir a Dashboard
- `Alt + B`: Ir a Bienes
- `Alt + R`: Ir a Responsables
- `Esc`: Cerrar modal o formulario

---

## Soporte

Para asistencia técnica:

- Consultar este manual
- Contactar al administrador del sistema
- Reportar problemas con detalles específicos

---

**Sistema de Inventario Institucional**  
Manual de Usuario - Versión 1.0
