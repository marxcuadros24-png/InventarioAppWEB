// ============================================
// API CLIENT - Comunicación con Backend
// Versión 3.0 - Arquitectura CRUD Fluida
// ============================================

// === CONFIGURACIÓN DE ENTORNO ===
const API_CONFIG = {
    baseUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : `${window.location.origin}/api`,
    timeout: 30000,
    retryAttempts: 1
};

class API {
    constructor() {
        this._onSessionExpired = null;
    }

    // === GESTIÓN DE SESIÓN ===

    get token() {
        return sessionStorage.getItem('token');
    }

    set token(value) {
        if (value) {
            sessionStorage.setItem('token', value);
        } else {
            sessionStorage.removeItem('token');
        }
    }

    set onSessionExpired(callback) {
        this._onSessionExpired = callback;
    }

    // === HEADERS ===

    getHeaders(isFormData = false) {
        const headers = {};

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const currentToken = this.token;
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        return headers;
    }

    // === MÉTODO REQUEST ===

    async request(endpoint, options = {}) {
        const isFormData = options.body instanceof FormData;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

            const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getHeaders(isFormData),
                    ...options.headers
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 401) {
                console.warn('⚠️ Sesión expirada o no autorizado');
                this.handleSessionExpired();
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            }

            if (response.status === 403) {
                throw new Error('No tiene permisos para realizar esta acción.');
            }

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
            if (error.name === 'AbortError') {
                throw new Error('La petición tardó demasiado. Intente nuevamente.');
            }
            console.error('API Error:', error);
            throw error;
        }
    }

    handleSessionExpired() {
        this.token = null;
        sessionStorage.removeItem('usuario');

        if (this._onSessionExpired) {
            this._onSessionExpired();
        } else {
            showToast('Sesión expirada. Redirigiendo al login...', 'warning');
            setTimeout(() => window.location.reload(), 1500);
        }
    }

    // === FACTORY DE CRUD ===

    _crud(basePath) {
        const self = this;
        return {
            getAll: (filtros = {}) => {
                const params = new URLSearchParams(filtros);
                const query = params.toString() ? `?${params}` : '';
                return self.request(`${basePath}${query}`);
            },
            getOne: (id) => self.request(`${basePath}/${id}`),
            create: (data) => self.request(basePath, {
                method: 'POST',
                body: JSON.stringify(data)
            }),
            update: (id, data) => self.request(`${basePath}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
            delete: (id) => self.request(`${basePath}/${id}`, {
                method: 'DELETE'
            })
        };
    }

    _catalogCrud(entity) {
        return this._crud(`/catalogos/${entity}`);
    }

    // ====================================================
    // RECURSOS - API FLUIDA (Nuevo estilo: api.marcas.getAll())
    // ====================================================

    // Catálogos
    get marcas() { return this._catalogCrud('marcas'); }
    get estados() { return this._catalogCrud('estados'); }
    get tiposBien() { return this._catalogCrud('tipos-bien'); }
    get categorias() { return this._catalogCrud('categorias'); }
    get areas() { return this._catalogCrud('areas'); }
    get metodos() { return this._catalogCrud('metodos'); }
    get tiposMovimiento() { return this._catalogCrud('tipos-movimiento'); }

    // Entidades principales
    get bienes() { return this._crud('/bienes'); }
    get responsables() { return this._crud('/responsables'); }
    get movimientos() { return this._crud('/movimientos'); }
    get usuarios() { return this._crud('/usuarios'); }
    get auditoria() { return this._crud('/auditoria'); }

    // ====================================================
    // MÉTODOS ESPECIALES (No siguen patrón CRUD estándar)
    // ====================================================

    // Autenticación
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

    // Catálogos (endpoint especial que devuelve todos)
    async getCatalogos() {
        return await this.request('/catalogos/all');
    }

    async getCategoriasByTipo(idTipoBien) {
        return await this.request(`/catalogos/categorias/${idTipoBien}`);
    }

    // Dashboard
    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }

    // Roles (endpoint diferente)
    async getRoles() {
        return await this.request('/usuarios/roles/all');
    }

    async createRol(nombreRol, descripcion) {
        return await this.request('/usuarios/roles', {
            method: 'POST',
            body: JSON.stringify({ nombreRol, descripcion })
        });
    }

    async updateRol(id, nombreRol, descripcion) {
        return await this.request(`/usuarios/roles/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombreRol, descripcion })
        });
    }

    async deleteRol(id) {
        return await this.request(`/usuarios/roles/${id}`, {
            method: 'DELETE'
        });
    }

    // Responsables para usuarios
    async getResponsablesForUsers() {
        return await this.request('/usuarios/responsables/all');
    }

    // Subida de archivos
    async uploadFile(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });
        return await this.request(endpoint, {
            method: 'POST',
            body: formData
        });
    }

    // ====================================================
    // RETROCOMPATIBILIDAD (Para no romper código existente)
    // Estos métodos llaman a la API fluida internamente
    // TODO: Migrar gradualmente y eliminar
    // ====================================================

    // Bienes
    getBienes = (filtros) => this.bienes.getAll(filtros);
    getBien = (id) => this.bienes.getOne(id);
    createBien = (data) => this.bienes.create(data);
    updateBien = (id, data) => this.bienes.update(id, data);
    deleteBien = (id) => this.bienes.delete(id);

    // Responsables
    getResponsables = () => this.responsables.getAll();
    getResponsable = (id) => this.responsables.getOne(id);
    createResponsable = (data) => this.responsables.create(data);
    updateResponsable = (id, data) => this.responsables.update(id, data);
    deleteResponsable = (id) => this.responsables.delete(id);

    // Movimientos
    getMovimientos = (filtros) => this.movimientos.getAll(filtros);
    createMovimiento = (data) => this.movimientos.create(data);

    // Usuarios
    getUsuarios = () => this.usuarios.getAll();
    getUsuario = (id) => this.usuarios.getOne(id);
    createUsuario = (data) => this.usuarios.create(data);
    updateUsuario = (id, data) => this.usuarios.update(id, data);
    deleteUsuario = (id) => this.usuarios.delete(id);

    // Auditoría
    getAuditoria = (filtros) => this.auditoria.getAll(filtros);

    // Catálogos (retrocompatibilidad)
    getMarcas = () => this.marcas.getAll();
    createMarca = (nombre) => this.marcas.create({ nombre });
    updateMarca = (id, nombre) => this.marcas.update(id, { nombre });
    deleteMarca = (id) => this.marcas.delete(id);

    getEstados = () => this.estados.getAll();
    createEstado = (nombre, descripcion) => this.estados.create({ nombre, descripcion });
    updateEstado = (id, nombre, descripcion) => this.estados.update(id, { nombre, descripcion });
    deleteEstado = (id) => this.estados.delete(id);

    getTiposBien = () => this.tiposBien.getAll();
    createTipoBien = (nombre, descripcion) => this.tiposBien.create({ nombre, descripcion });
    updateTipoBien = (id, nombre, descripcion) => this.tiposBien.update(id, { nombre, descripcion });
    deleteTipoBien = (id) => this.tiposBien.delete(id);

    getCategorias = () => this.categorias.getAll();
    createCategoria = (nombre, idTipoBien) => this.categorias.create({ nombre, idTipoBien });
    updateCategoria = (id, nombre, idTipoBien, descripcion) => this.categorias.update(id, { nombre, idTipoBien, descripcion });
    deleteCategoria = (id) => this.categorias.delete(id);

    getAreas = () => this.areas.getAll();
    createArea = (nombre, ubicacion, descripcion) => this.areas.create({ nombre, ubicacion, descripcion });
    updateArea = (id, nombre, ubicacion, descripcion) => this.areas.update(id, { nombre, ubicacion, descripcion });
    deleteArea = (id) => this.areas.delete(id);

    getMetodosAdquisicion = () => this.metodos.getAll();
    createMetodoAdquisicion = (nombreMetodo, descripcion) => this.metodos.create({ nombreMetodo, descripcion });
    updateMetodoAdquisicion = (id, nombreMetodo, descripcion) => this.metodos.update(id, { nombreMetodo, descripcion });
    deleteMetodoAdquisicion = (id) => this.metodos.delete(id);

    getTiposMovimiento = () => this.tiposMovimiento.getAll();
    createTipoMovimiento = (nombreMovimiento) => this.tiposMovimiento.create({ nombreMovimiento });
    updateTipoMovimiento = (id, nombreMovimiento) => this.tiposMovimiento.update(id, { nombreMovimiento });
    deleteTipoMovimiento = (id) => this.tiposMovimiento.delete(id);
}

// Exportar instancia global
const api = new API();

// Configurar callback de sesión expirada
api.onSessionExpired = () => {
    if (typeof showToast === 'function') {
        showToast('Su sesión ha expirado. Por favor, inicie sesión nuevamente.', 'warning');
    }
    setTimeout(() => window.location.reload(), 2000);
};
