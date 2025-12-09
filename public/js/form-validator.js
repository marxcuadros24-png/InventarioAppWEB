// ============================================
// VALIDACIÓN DE FORMULARIOS
// ============================================

class FormValidator {
    constructor(formElement) {
        this.form = typeof formElement === 'string'
            ? document.querySelector(formElement)
            : formElement;
        this.errors = {};
        this.rules = {};

        if (this.form) {
            this.init();
        }
    }

    // Inicializar validación en tiempo real
    init() {
        // Validar en blur (cuando el usuario sale del campo)
        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => {
                // Limpiar error mientras escribe
                if (field.classList.contains('is-invalid')) {
                    this.validateField(field);
                }
            });
        });

        // Prevenir envío si hay errores
        this.form.addEventListener('submit', (e) => {
            if (!this.validateAll()) {
                e.preventDefault();
                this.focusFirstError();
                showToast('Por favor, corrija los errores en el formulario', 'error');
            }
        });
    }

    // Definir reglas de validación
    setRules(rules) {
        this.rules = rules;
        return this;
    }

    // Validar un campo específico
    validateField(field) {
        const name = field.name || field.id;
        const value = field.value.trim();
        const rules = this.rules[name] || {};

        // Limpiar estado anterior
        this.clearFieldError(field);

        // Validar required
        if (rules.required && !value) {
            return this.setFieldError(field, rules.message || 'Este campo es requerido');
        }

        // Validar minLength
        if (rules.minLength && value.length < rules.minLength) {
            return this.setFieldError(field, `Mínimo ${rules.minLength} caracteres`);
        }

        // Validar maxLength
        if (rules.maxLength && value.length > rules.maxLength) {
            return this.setFieldError(field, `Máximo ${rules.maxLength} caracteres`);
        }

        // Validar email
        if (rules.email && value && !this.isValidEmail(value)) {
            return this.setFieldError(field, 'Ingrese un email válido');
        }

        // Validar número
        if (rules.number && value && isNaN(value)) {
            return this.setFieldError(field, 'Debe ser un número');
        }

        // Validar mínimo numérico
        if (rules.min !== undefined && value && parseFloat(value) < rules.min) {
            return this.setFieldError(field, `El valor mínimo es ${rules.min}`);
        }

        // Validar máximo numérico
        if (rules.max !== undefined && value && parseFloat(value) > rules.max) {
            return this.setFieldError(field, `El valor máximo es ${rules.max}`);
        }

        // Validar patrón regex
        if (rules.pattern && value && !rules.pattern.test(value)) {
            return this.setFieldError(field, rules.patternMessage || 'Formato inválido');
        }

        // Validar select (que tenga valor seleccionado)
        if (rules.required && field.tagName === 'SELECT' && (field.value === '' || field.value === 'null')) {
            return this.setFieldError(field, 'Seleccione una opción');
        }

        // Validación personalizada
        if (rules.custom && typeof rules.custom === 'function') {
            const customError = rules.custom(value, field);
            if (customError) {
                return this.setFieldError(field, customError);
            }
        }

        // Campo válido
        this.setFieldValid(field);
        return true;
    }

    // Marcar campo como inválido
    setFieldError(field, message) {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');

        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('has-error');
            formGroup.classList.remove('has-success');

            // Crear o actualizar mensaje de error
            let errorEl = formGroup.querySelector('.form-error');
            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'form-error';
                field.parentNode.insertBefore(errorEl, field.nextSibling);
            }
            errorEl.textContent = message;
        }

        this.errors[field.name || field.id] = message;
        return false;
    }

    // Marcar campo como válido
    setFieldValid(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');

        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error');
            formGroup.classList.add('has-success');
        }

        delete this.errors[field.name || field.id];
        return true;
    }

    // Limpiar error de un campo
    clearFieldError(field) {
        field.classList.remove('is-invalid', 'is-valid');

        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('has-error', 'has-success');
            const errorEl = formGroup.querySelector('.form-error');
            if (errorEl) {
                errorEl.remove();
            }
        }

        delete this.errors[field.name || field.id];
    }

    // Validar todos los campos
    validateAll() {
        let isValid = true;

        Object.keys(this.rules).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (field && !this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Enfocar primer campo con error
    focusFirstError() {
        const firstInvalid = this.form.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Limpiar todos los errores
    clearAll() {
        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            this.clearFieldError(field);
        });
        this.errors = {};
    }

    // Verificar si hay errores
    hasErrors() {
        return Object.keys(this.errors).length > 0;
    }

    // Helpers de validación
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidDNI(dni) {
        return /^\d{8}$/.test(dni);
    }

    isValidPhone(phone) {
        return /^\d{9}$/.test(phone);
    }
}

// ============================================
// FUNCIÓN HELPER PARA VALIDACIÓN RÁPIDA
// ============================================

function validateForm(formSelector, rules) {
    const validator = new FormValidator(formSelector);
    validator.setRules(rules);
    return validator;
}

// ============================================
// REGLAS PREDEFINIDAS COMUNES
// ============================================

const ValidationRules = {
    required: (message = 'Este campo es requerido') => ({
        required: true,
        message
    }),

    email: () => ({
        required: true,
        email: true,
        message: 'Email requerido'
    }),

    password: (minLength = 6) => ({
        required: true,
        minLength,
        message: 'Contraseña requerida'
    }),

    nombre: (maxLength = 100) => ({
        required: true,
        maxLength,
        message: 'Nombre requerido'
    }),

    dni: () => ({
        pattern: /^\d{8}$/,
        patternMessage: 'DNI debe tener 8 dígitos'
    }),

    telefono: () => ({
        pattern: /^\d{9}$/,
        patternMessage: 'Teléfono debe tener 9 dígitos'
    }),

    precio: () => ({
        number: true,
        min: 0,
        message: 'Ingrese un precio válido'
    }),

    select: (message = 'Seleccione una opción') => ({
        required: true,
        message
    })
};

// Exponer globalmente
window.FormValidator = FormValidator;
window.validateForm = validateForm;
window.ValidationRules = ValidationRules;
