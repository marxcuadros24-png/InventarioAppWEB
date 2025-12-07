// ============================================
// AUTH - Gestión de Autenticación
// ============================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = sessionStorage.getItem('token');
    }

    // Verificar si hay sesión activa
    isAuthenticated() {
        return !!this.token;
    }

    // Obtener usuario actual
    getCurrentUser() {
        const userData = sessionStorage.getItem('usuario');
        return userData ? JSON.parse(userData) : null;
    }

    // Login
    async login(nombreUsuario, clave) {
        try {
            const data = await api.login(nombreUsuario, clave);
            this.token = data.token;
            this.currentUser = data.usuario;
            return data;
        } catch (error) {
            throw error;
        }
    }

    // Logout
    logout() {
        api.logout();
        this.token = null;
        this.currentUser = null;
        window.location.reload();
    }

    // Verificar token
    async verifyToken() {
        if (!this.token) return false;

        try {
            await api.verifyToken();
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }
}

// Exportar instancia global
const authManager = new AuthManager();
