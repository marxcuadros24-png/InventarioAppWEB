// ============================================
// API CLIENT - Comunicación con Backend
// Versión 2.0 - Con mejoras de seguridad y arquitectura
// ============================================

// === CONFIGURACIÓN DE ENTORNO ===
// Detectar automáticamente si estamos en desarrollo o producción
const API_CONFIG = {
    // En producción, usar URL relativa o definir en variable de entorno
    baseUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : `${window.location.origin}/api`,
    timeout: 30000, // 30 segundos
    retryAttempts: 1
};

class API {
    constructor() {
        // Ya no almacenamos el token aquí - lo leemos dinámicamente
        this._onSessionExpired = null;
    }

    // === GESTIÓN DE SESIÓN ===

    // Getter dinámico para el token (Mejora #1 - Token dinámico)
    get token() {
        return sessionStorage.getItem('token');
    }

    // Setter para el token
    set token(value) {
        if (value) {
            sessionStorage.setItem('token', value);
        } else {
            sessionStorage.removeItem('token');
        }
    }

    // Callback para sesión expirada
    set onSessionExpired(callback) {
        this._onSessionExpired = callback;
    }

    // === HEADERS (Mejora #4 - Soporte FormData) ===

    // Headers con autenticación - ahora soporta FormData
    getHeaders(isFormData = false) {
        const headers = {};

        // Solo agregar Content-Type si NO es FormData
        // FormData establece su propio boundary automáticamente
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        // Leer token dinámicamente (no del constructor)
        const currentToken = this.token;
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        return headers;
    }

    // === MÉTODO REQUEST MEJORADO (Mejora #2 - Manejo 401) ===

    async request(endpoint, options = {}) {
        const isFormData = options.body instanceof FormData;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

            const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(isFormData),
                    ...options.headers // Permite headers personalizados
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Mejora #2: Interceptar error 401 (sesión expirada)
            if (response.status === 401) {
                console.warn('⚠️ Sesión expirada o no autorizado');
                this.handleSessionExpired();
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            }

            // Manejar error 403 (forbidden)
            if (response.status === 403) {
                throw new Error('No tiene permisos para realizar esta acción.');
            }

            // Manejar otros errores
            if (!response.ok) {
                let errorMessage = 'Error en la petición';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                } catch {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            // Manejar timeout
            if (error.name === 'AbortError') {
                throw new Error('La petición tardó demasiado. Intente nuevamente.');
            }

            console.error('API Error:', error);
            throw error;
        }
    }

    // Manejar sesión expirada
    handleSessionExpired() {
        // Limpiar datos de sesión
        this.token = null;
        sessionStorage.removeItem('usuario');

        // Llamar callback si existe
        if (this._onSessionExpired) {
            this._onSessionExpired();
        } else {
            // Comportamiento por defecto: recargar para ir al login
            showToast('Sesión expirada. Redirigiendo al login...', 'warning');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }

    // === MÉTODOS CRUD GENÉRICOS (Mejora #3 - Principio DRY) ===

    // Método privado para operaciones CRUD estándar
    _crud(basePath) {
        return {
            getAll: (filtros = {}) => {
                const params = new URLSearchParams(filtros);
                const query = params.toString() ? `?${params}` : '';
                return this.request(`${basePath}${query}`);
            },
            getOne: (id) => this.request(`${basePath}/${id}`),
            create: (data) => this.request(basePath, {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            update: (id, data) => this.request(`${basePath}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
            delete: (id) => this.request(`${basePath}/${id}`, {
                method: 'DELETE'
            })
        };
    }

    // CRUD helpers para catálogos
    _catalogCrud(entity) {
        return this._crud(`/catalogos/${entity}`);
    }

    // === AUTENTICACIÓN ===

    async login(nombreUsuario, clave) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ nombreUsuario, clave })
        });

        this.token = data.token;
        sessionStorage.setItem('usuario', JSON.stringify(data.usuario));

        return data;
    }

    async verifyToken() {
        return await this.request('/auth/verify');
    }

    logout() {
        this.token = null;
        sessionStorage.removeItem('usuario');
    }

    // === CATÁLOGOS (Usando CRUD genérico) ===

    async getCatalogos() {
        return await this.request('/catalogos/all');
    }

    async getCategoriasByTipo(idTipoBien) {
        return await this.request(`/catalogos/categorias/${idTipoBien}`);
    }

    // Marcas
    getMarcas = () => this._catalogCrud('marcas').getAll();
    createMarca = (nombre) => this._catalogCrud('marcas').create({ nombre });
    updateMarca = (id, nombre) => this._catalogCrud('marcas').update(id, { nombre });
    deleteMarca = (id) => this._catalogCrud('marcas').delete(id);

    // Estados
    getEstados = () => this._catalogCrud('estados').getAll();
    createEstado = (nombre, descripcion) => this._catalogCrud('estados').create({ nombre, descripcion });
    updateEstado = (id, nombre, descripcion) => this._catalogCrud('estados').update(id, { nombre, descripcion });
    deleteEstado = (id) => this._catalogCrud('estados').delete(id);

    // Tipos de Bien
    getTiposBien = () => this._catalogCrud('tipos-bien').getAll();
    createTipoBien = (nombre, descripcion) => this._catalogCrud('tipos-bien').create({ nombre, descripcion });
    updateTipoBien = (id, nombre, descripcion) => this._catalogCrud('tipos-bien').update(id, { nombre, descripcion });
    deleteTipoBien = (id) => this._catalogCrud('tipos-bien').delete(id);

    // Categorías
    getCategorias = () => this._catalogCrud('categorias').getAll();
    createCategoria = (nombre, idTipoBien) => this._catalogCrud('categorias').create({ nombre, idTipoBien });
    updateCategoria = (id, nombre, idTipoBien, descripcion) => this._catalogCrud('categorias').update(id, { nombre, idTipoBien, descripcion });
    deleteCategoria = (id) => this._catalogCrud('categorias').delete(id);

    // Áreas
    getAreas = () => this._catalogCrud('areas').getAll();
    createArea = (nombre, ubicacion, descripcion) => this._catalogCrud('areas').create({ nombre, ubicacion, descripcion });
    updateArea = (id, nombre, ubicacion, descripcion) => this._catalogCrud('areas').update(id, { nombre, ubicacion, descripcion });
    deleteArea = (id) => this._catalogCrud('areas').delete(id);

    // Métodos de Adquisición
    getMetodosAdquisicion = () => this._catalogCrud('metodos').getAll();
    createMetodoAdquisicion = (nombreMetodo, descripcion) => this._catalogCrud('metodos').create({ nombreMetodo, descripcion });
    updateMetodoAdquisicion = (id, nombreMetodo, descripcion) => this._catalogCrud('metodos').update(id, { nombreMetodo, descripcion });
    deleteMetodoAdquisicion = (id) => this._catalogCrud('metodos').delete(id);

    // Tipos de Movimiento
    getTiposMovimiento = () => this._catalogCrud('tipos-movimiento').getAll();
    createTipoMovimiento = (nombreMovimiento) => this._catalogCrud('tipos-movimiento').create({ nombreMovimiento });
    updateTipoMovimiento = (id, nombreMovimiento) => this._catalogCrud('tipos-movimiento').update(id, { nombreMovimiento });
    deleteTipoMovimiento = (id) => this._catalogCrud('tipos-movimiento').delete(id);

    // === BIENES (Usando CRUD genérico) ===

    getBienes = (filtros = {}) => this._crud('/bienes').getAll(filtros);
    getBien = (id) => this._crud('/bienes').getOne(id);
    createBien = (data) => this._crud('/bienes').create(data);
    updateBien = (id, data) => this._crud('/bienes').update(id, data);
    deleteBien = (id) => this._crud('/bienes').delete(id);

    // === RESPONSABLES ===

    getResponsables = () => this._crud('/responsables').getAll();
    getResponsable = (id) => this._crud('/responsables').getOne(id);
    createResponsable = (data) => this._crud('/responsables').create(data);
    updateResponsable = (id, data) => this._crud('/responsables').update(id, data);
    deleteResponsable = (id) => this._crud('/responsables').delete(id);

    // === MOVIMIENTOS ===

    getMovimientos = (filtros = {}) => this._crud('/movimientos').getAll(filtros);
    createMovimiento = (data) => this._crud('/movimientos').create(data);

    // === DASHBOARD ===

    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }

    // === AUDITORÍA ===

    getAuditoria = (filtros = {}) => this._crud('/auditoria').getAll(filtros);

    // === USUARIOS ===

    getUsuarios = () => this._crud('/usuarios').getAll();
    getUsuario = (id) => this._crud('/usuarios').getOne(id);
    createUsuario = (data) => this._crud('/usuarios').create(data);
    updateUsuario = (id, data) => this._crud('/usuarios').update(id, data);
    deleteUsuario = (id) => this._crud('/usuarios').delete(id);

    // === ROLES DE USUARIO ===

    getRoles = () => this.request('/usuarios/roles/all');
    createRol = (nombreRol, descripcion) => this.request('/usuarios/roles', {
        method: 'POST',
        body: JSON.stringify({ nombreRol, descripcion })
    });
    updateRol = (id, nombreRol, descripcion) => this.request(`/usuarios/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombreRol, descripcion })
    });
    deleteRol = (id) => this.request(`/usuarios/roles/${id}`, {
        method: 'DELETE'
    });

    // === RESPONSABLES PARA USUARIOS ===

    getResponsablesForUsers = () => this.request('/usuarios/responsables/all');

    // === SUBIDA DE ARCHIVOS (Mejora #4) ===

    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);

        // Agregar datos adicionales al FormData
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        return await this.request(endpoint, {
            method: 'POST',
            body: formData
        });
    }
}

// Exportar instancia global
const api = new API();

// Configurar callback de sesión expirada
api.onSessionExpired = () => {
    if (typeof showToast === 'function') {
        showToast('Su sesión ha expirado. Por favor, inicie sesión nuevamente.', 'warning');
    }
    setTimeout(() => {
        window.location.reload();
    }, 2000);
};
