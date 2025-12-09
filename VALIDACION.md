# 📝 Guía de Validación de Formularios

## Uso Básico

```javascript
// 1. Crear validador para un formulario
const validator = validateForm('#mi-formulario', {
    nombre: {
        required: true,
        maxLength: 100,
        message: 'El nombre es requerido'
    },
    email: {
        required: true,
        email: true
    },
    telefono: {
        pattern: /^\d{9}$/,
        patternMessage: 'Teléfono debe tener 9 dígitos'
    },
    precio: {
        number: true,
        min: 0,
        message: 'Ingrese un precio válido'
    }
});
```

## Reglas Disponibles

| Regla | Descripción | Ejemplo |
|-------|-------------|---------|
| `required` | Campo obligatorio | `required: true` |
| `minLength` | Longitud mínima | `minLength: 6` |
| `maxLength` | Longitud máxima | `maxLength: 100` |
| `email` | Formato email | `email: true` |
| `number` | Solo números | `number: true` |
| `min` | Valor mínimo | `min: 0` |
| `max` | Valor máximo | `max: 1000` |
| `pattern` | Regex personalizado | `pattern: /^\d{8}$/` |
| `custom` | Función de validación | `custom: (value) => {...}` |

## Ejemplo Completo: Formulario de Login

```javascript
// En tu código de login
const loginValidator = validateForm('#login-form', {
    nombreUsuario: {
        required: true,
        minLength: 3,
        message: 'Usuario requerido (mínimo 3 caracteres)'
    },
    clave: {
        required: true,
        minLength: 6,
        message: 'Contraseña requerida (mínimo 6 caracteres)'
    }
});

// El formulario se validará automáticamente
// - Al perder foco de cada campo (blur)
// - Al escribir (si ya hay error)
// - Al enviar el formulario (submit)
```

## Validación Personalizada

```javascript
const validator = validateForm('#usuario-form', {
    dni: {
        custom: (value) => {
            if (!/^\d{8}$/.test(value)) {
                return 'DNI debe tener 8 dígitos';
            }
            // Puedes hacer validaciones más complejas
            const suma = value.split('').reduce((a, b) => a + parseInt(b), 0);
            if (suma % 10 !== 0) {
                return 'DNI inválido';
            }
            return null; // null = campo válido
        }
    }
});
```

## Reglas Predefinidas

```javascript
// Usar ValidationRules para reglas comunes
const validator = validateForm('#form', {
    nombre: ValidationRules.nombre(),
    email: ValidationRules.email(),
    password: ValidationRules.password(8), // mínimo 8 caracteres
    dni: ValidationRules.dni(),
    telefono: ValidationRules.telefono(),
    precio: ValidationRules.precio()
});
```

## HTML Requerido

Los campos deben tener `name` o `id`:

```html
<form id="mi-formulario">
    <div class="form-group">
        <label for="nombre">Nombre <span class="required">*</span></label>
        <input type="text" id="nombre" name="nombre">
        <!-- El mensaje de error se insertará automáticamente aquí -->
    </div>
    
    <button type="submit">Guardar</button>
</form>
```

## Clases CSS Automáticas

El validador agrega estas clases automáticamente:

- `.is-valid` - Campo válido (borde verde)
- `.is-invalid` - Campo inválido (borde rojo)
- `.has-error` - Form group con error
- `.has-success` - Form group válido
- `.form-error` - Mensaje de error

## Métodos Útiles

```javascript
// Validar todos los campos manualmente
const esValido = validator.validateAll();

// Validar un campo específico
const campo = document.getElementById('email');
validator.validateField(campo);

// Limpiar todos los errores
validator.clearAll();

// Verificar si hay errores
if (validator.hasErrors()) {
    console.log('Hay errores en el formulario');
}

// Enfocar primer campo con error
validator.focusFirstError();
```

## Aplicar en Formularios Existentes

### Ejemplo: Formulario de Bienes

```javascript
// En showBienForm(), después de crear el modal:
const bienValidator = validateForm('#bien-form', {
    'bien-codigo': {
        required: true,
        message: 'Código patrimonial requerido'
    },
    'bien-nombre': {
        required: true,
        maxLength: 200,
        message: 'Nombre del bien requerido'
    },
    'bien-categoria': {
        required: true,
        message: 'Seleccione una categoría'
    },
    'bien-costo': {
        number: true,
        min: 0,
        message: 'Ingrese un costo válido'
    }
});
```

### Ejemplo: Formulario de Usuario

```javascript
const usuarioValidator = validateForm('#user-form', {
    'user-nombre': {
        required: true,
        minLength: 3,
        maxLength: 100
    },
    'user-password': {
        minLength: 6,
        message: 'Contraseña debe tener al menos 6 caracteres'
    },
    'user-rol': {
        required: true,
        message: 'Seleccione un rol'
    }
});
```

## Tips

1. **Siempre usa `name` o `id`** en tus campos
2. **Define reglas solo para campos que necesitan validación**
3. **Los mensajes personalizados** sobrescriben los predeterminados
4. **La validación es automática** una vez configurada
5. **Prueba la validación** antes de desplegar

---

¡Listo! Ahora tus formularios tendrán validación profesional con feedback visual inmediato.
