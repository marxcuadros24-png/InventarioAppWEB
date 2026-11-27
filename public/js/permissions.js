// SISTEMA DE PERMISOS - Control de Acceso por Roles

// Definición de roles
const ROLES = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    CONSULTOR: 'Consultor'
};

// Matriz de permisos por módulo y acción
const PERMISOS = {
    // Dashboard - todos pueden ver
    dashboard: {
        ver: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CONSULTOR]
    },

    // Bienes
    bienes: {
        ver: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CONSULTOR],
        crear: [ROLES.ADMIN, ROLES.SUPERVISOR],
        editar: [ROLES.ADMIN, ROLES.SUPERVISOR],
        eliminar: [ROLES.ADMIN]
    },

    // Movimientos
    movimientos: {
        ver: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CONSULTOR],
        crear: [ROLES.ADMIN, ROLES.SUPERVISOR],
        eliminar: [ROLES.ADMIN]
    },

    // Responsables
    responsables: {
        ver: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CONSULTOR],
        crear: [ROLES.ADMIN, ROLES.SUPERVISOR],
        editar: [ROLES.ADMIN, ROLES.SUPERVISOR],
        eliminar: [ROLES.ADMIN]
    },

    // Reportes - todos pueden generar
    reportes: {
        ver: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CONSULTOR],
        exportar: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CONSULTOR]
    },

    // Catálogos - solo admin
    catalogos: {
        ver: [ROLES.ADMIN],
        crear: [ROLES.ADMIN],
        editar: [ROLES.ADMIN],
        eliminar: [ROLES.ADMIN]
    },

    // Usuarios - solo admin
    usuarios: {
        ver: [ROLES.ADMIN],
        crear: [ROLES.ADMIN],
        editar: [ROLES.ADMIN],
        eliminar: [ROLES.ADMIN]
    },

    // Auditoría - solo admin
    auditoria: {
        ver: [ROLES.ADMIN]
    }
};

// Clase para manejar permisos
class PermissionManager {
    constructor() {
        this.usuario = null;
        this.rol = null;
    }

    // Inicializar con el usuario actual
    init() {
        const usuarioStr = sessionStorage.getItem('usuario');
        if (usuarioStr) {
            this.usuario = JSON.parse(usuarioStr);
            // El backend envía 'rol' (minúscula)
            this.rol = this.usuario.rol || this.usuario.NombreRol || this.usuario.Rol || 'Consultor';
        }
        return this;
    }

    // Verificar si tiene permiso para una acción
    puede(modulo, accion) {
        if (!this.rol) return false;

        const permisosModulo = PERMISOS[modulo];
        if (!permisosModulo) return false;

        const rolesPermitidos = permisosModulo[accion];
        if (!rolesPermitidos) return false;

        return rolesPermitidos.includes(this.rol);
    }

    // Verificar si puede ver un módulo
    puedeVer(modulo) {
        return this.puede(modulo, 'ver');
    }

    // Verificar si puede crear en un módulo
    puedeCrear(modulo) {
        return this.puede(modulo, 'crear');
    }

    // Verificar si puede editar en un módulo
    puedeEditar(modulo) {
        return this.puede(modulo, 'editar');
    }

    // Verificar si puede eliminar en un módulo
    puedeEliminar(modulo) {
        return this.puede(modulo, 'eliminar');
    }

    // Verificar si es administrador
    esAdmin() {
        return this.rol === ROLES.ADMIN;
    }

    // Verificar si es supervisor
    esSupervisor() {
        return this.rol === ROLES.SUPERVISOR;
    }

    // Verificar si es consultor
    esConsultor() {
        return this.rol === ROLES.CONSULTOR;
    }

    // Obtener rol actual
    getRol() {
        return this.rol;
    }

    // Obtener usuario actual
    getUsuario() {
        return this.usuario;
    }

    // Aplicar permisos a la interfaz
    aplicarPermisos() {
        this.init();

        // Ocultar/mostrar elementos del menú
        this.aplicarPermisosMenu();

        // Ocultar/mostrar botones de acción
        this.aplicarPermisosBotones();

        console.log(`🔐 Permisos aplicados para rol: ${this.rol}`);
    }

    // Aplicar permisos al menú lateral
    aplicarPermisosMenu() {
        const menuItems = {
            'catalogos': document.querySelector('[data-view="catalogos"]'),
            'usuarios': document.querySelector('[data-view="usuarios"]'),
            'auditoria': document.querySelector('[data-view="auditoria"]')
        };

        Object.entries(menuItems).forEach(([modulo, elemento]) => {
            if (elemento) {
                if (this.puedeVer(modulo)) {
                    elemento.style.display = '';
                } else {
                    elemento.style.display = 'none';
                }
            }
        });
    }

    // Aplicar permisos a botones de acción
    aplicarPermisosBotones() {
        // Botones de crear
        document.querySelectorAll('[data-action="crear"]').forEach(btn => {
            const modulo = btn.dataset.modulo;
            if (modulo && !this.puedeCrear(modulo)) {
                btn.style.display = 'none';
            }
        });

        // Botones de editar
        document.querySelectorAll('[data-action="editar"]').forEach(btn => {
            const modulo = btn.dataset.modulo;
            if (modulo && !this.puedeEditar(modulo)) {
                btn.style.display = 'none';
            }
        });

        // Botones de eliminar
        document.querySelectorAll('[data-action="eliminar"]').forEach(btn => {
            const modulo = btn.dataset.modulo;
            if (modulo && !this.puedeEliminar(modulo)) {
                btn.style.display = 'none';
            }
        });
    }

    // Verificar permiso y mostrar mensaje si no tiene
    verificarPermiso(modulo, accion) {
        if (!this.puede(modulo, accion)) {
            showToast(`No tiene permisos para ${accion} en ${modulo}`, 'error');
            return false;
        }
        return true;
    }
}

// Instancia global del gestor de permisos
const permisos = new PermissionManager();

// Funciones helper globales
function puedeVer(modulo) {
    return permisos.init().puedeVer(modulo);
}

function puedeCrear(modulo) {
    return permisos.init().puedeCrear(modulo);
}

function puedeEditar(modulo) {
    return permisos.init().puedeEditar(modulo);
}

function puedeEliminar(modulo) {
    return permisos.init().puedeEliminar(modulo);
}

function esAdmin() {
    return permisos.init().esAdmin();
}

function esSupervisor() {
    return permisos.init().esSupervisor();
}

function esConsultor() {
    return permisos.init().esConsultor();
}

function getRolActual() {
    return permisos.init().getRol();
}

// Aplicar permisos automáticamente cuando se carga una vista
function aplicarPermisosVista() {
    permisos.aplicarPermisos();
}
