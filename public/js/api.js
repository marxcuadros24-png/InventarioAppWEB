// ============================================
// API CLIENT - Comunicación con Backend
// ============================================

const API_BASE_URL = 'http://localhost:3000/api';

class API {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    // Headers con autenticación
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Método genérico para hacer requests
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error en la petición');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // === AUTENTICACIÓN ===
    async login(nombreUsuario, clave) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ nombreUsuario, clave })
        });

        this.token = data.token;
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));

        return data;
    }

    async verifyToken() {
        return await this.request('/auth/verify');
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
    }

    // === CATÁLOGOS ===
    async getCatalogos() {
        return await this.request('/catalogos/all');
    }

    async getCategoriasByTipo(idTipoBien) {
        return await this.request(`/catalogos/categorias/${idTipoBien}`);
    }

    async createMarca(nombre) {
        return await this.request('/catalogos/marcas', {
            method: 'POST',
            body: JSON.stringify({ nombre })
        });
    }

    async createCategoria(nombre, idTipoBien) {
        return await this.request('/catalogos/categorias', {
            method: 'POST',
            body: JSON.stringify({ nombre, idTipoBien })
        });
    }

    // === CRUD CATÁLOGOS ===

    // Marcas
    async getMarcas() {
        return await this.request('/catalogos/marcas');
    }

    async updateMarca(id, nombre) {
        return await this.request(`/catalogos/marcas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre })
        });
    }

    async deleteMarca(id) {
        return await this.request(`/catalogos/marcas/${id}`, {
            method: 'DELETE'
        });
    }

    // Estados
    async getEstados() {
        return await this.request('/catalogos/estados');
    }

    async createEstado(nombre, descripcion) {
        return await this.request('/catalogos/estados', {
            method: 'POST',
            body: JSON.stringify({ nombre, descripcion })
        });
    }

    async updateEstado(id, nombre, descripcion) {
        return await this.request(`/catalogos/estados/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, descripcion })
        });
    }

    async deleteEstado(id) {
        return await this.request(`/catalogos/estados/${id}`, {
            method: 'DELETE'
        });
    }

    // Tipos de Bien
    async getTiposBien() {
        return await this.request('/catalogos/tipos-bien');
    }

    async createTipoBien(nombre, descripcion) {
        return await this.request('/catalogos/tipos-bien', {
            method: 'POST',
            body: JSON.stringify({ nombre, descripcion })
        });
    }

    async updateTipoBien(id, nombre, descripcion) {
        return await this.request(`/catalogos/tipos-bien/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, descripcion })
        });
    }

    async deleteTipoBien(id) {
        return await this.request(`/catalogos/tipos-bien/${id}`, {
            method: 'DELETE'
        });
    }

    // Categorías
    async getCategorias() {
        return await this.request('/catalogos/categorias');
    }

    async updateCategoria(id, nombre, idTipoBien, descripcion) {
        return await this.request(`/catalogos/categorias/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, idTipoBien, descripcion })
        });
    }

    async deleteCategoria(id) {
        return await this.request(`/catalogos/categorias/${id}`, {
            method: 'DELETE'
        });
    }

    // Áreas
    async getAreas() {
        return await this.request('/catalogos/areas');
    }

    async createArea(nombre, ubicacion, descripcion) {
        return await this.request('/catalogos/areas', {
            method: 'POST',
            body: JSON.stringify({ nombre, ubicacion, descripcion })
        });
    }

    async updateArea(id, nombre, ubicacion, descripcion) {
        return await this.request(`/catalogos/areas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombre, ubicacion, descripcion })
        });
    }

    async deleteArea(id) {
        return await this.request(`/catalogos/areas/${id}`, {
            method: 'DELETE'
        });
    }

    // Métodos de Adquisición
    async getMetodosAdquisicion() {
        return await this.request('/catalogos/metodos');
    }

    async createMetodoAdquisicion(nombreMetodo, descripcion) {
        return await this.request('/catalogos/metodos', {
            method: 'POST',
            body: JSON.stringify({ nombreMetodo, descripcion })
        });
    }

    async updateMetodoAdquisicion(id, nombreMetodo, descripcion) {
        return await this.request(`/catalogos/metodos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ nombreMetodo, descripcion })
        });
    }

    async deleteMetodoAdquisicion(id) {
        return await this.request(`/catalogos/metodos/${id}`, {
            method: 'DELETE'
        });
    }

    // === BIENES ===
    async getBienes(filtros = {}) {
        const params = new URLSearchParams(filtros);
        return await this.request(`/bienes?${params}`);
    }

    async getBien(id) {
        return await this.request(`/bienes/${id}`);
    }

    async createBien(data) {
        return await this.request('/bienes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateBien(id, data) {
        return await this.request(`/bienes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteBien(id) {
        return await this.request(`/bienes/${id}`, {
            method: 'DELETE'
        });
    }

    // === RESPONSABLES ===
    async getResponsables() {
        return await this.request('/responsables');
    }

    async getResponsable(id) {
        return await this.request(`/responsables/${id}`);
    }

    async createResponsable(data) {
        return await this.request('/responsables', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateResponsable(id, data) {
        return await this.request(`/responsables/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteResponsable(id) {
        return await this.request(`/responsables/${id}`, {
            method: 'DELETE'
        });
    }

    // === MOVIMIENTOS ===
    async getMovimientos(filtros = {}) {
        const params = new URLSearchParams(filtros);
        return await this.request(`/movimientos?${params}`);
    }

    async createMovimiento(data) {
        return await this.request('/movimientos', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // === DASHBOARD ===
    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }

    // === AUDITORÍA ===
    async getAuditoria(filtros = {}) {
        const params = new URLSearchParams(filtros);
        return await this.request(`/auditoria?${params}`);
    }

    // === USUARIOS ===
    async getUsuarios() {
        return await this.request('/usuarios');
    }

    async getUsuario(id) {
        return await this.request(`/usuarios/${id}`);
    }

    async createUsuario(data) {
        return await this.request('/usuarios', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateUsuario(id, data) {
        return await this.request(`/usuarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteUsuario(id) {
        return await this.request(`/usuarios/${id}`, {
            method: 'DELETE'
        });
    }

    // === ROLES DE USUARIO ===
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

    // === RESPONSABLES PARA USUARIOS ===
    async getResponsablesForUsers() {
        return await this.request('/usuarios/responsables/all');
    }
}

// Exportar instancia global
const api = new API();

