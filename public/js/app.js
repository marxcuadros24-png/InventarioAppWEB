// ============================================
// MAIN APP - Lógica Principal de la Aplicación
// ============================================

// === UTILIDADES ===

// Mostrar notificación toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${getToastIcon(type)}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE');
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
}

// === VISTAS ===

const views = {
    // Dashboard
    dashboard: async () => {
        try {
            const stats = await syncManager.hybridOperation(
                'dashboard',
                () => api.getDashboardStats(),
                null
            );

            return `
                <div class="grid grid-4">
                    <div class="stat-card">
                        <div class="stat-icon">📦</div>
                        <div class="stat-value">${stats.totalBienes}</div>
                        <div class="stat-label">Total Bienes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-value">${formatCurrency(stats.valorTotal)}</div>
                        <div class="stat-label">Valor Total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${stats.porEstado.find(e => e.estado === 'Operativo')?.cantidad || 0}</div>
                        <div class="stat-label">Operativos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔧</div>
                        <div class="stat-value">${stats.porEstado.find(e => e.estado === 'Mantenimiento')?.cantidad || 0}</div>
                        <div class="stat-label">Mantenimiento</div>
                    </div>
                </div>

                <div class="grid grid-2 mt-1">
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">📊 Distribución por Estado</h2>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Estado</th>
                                        <th>Cantidad</th>
                                        <th>Porcentaje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.porEstado.map(item => {
                const percentage = ((item.cantidad / stats.totalBienes) * 100).toFixed(1);
                return `
                                        <tr>
                                            <td><strong>${item.estado}</strong></td>
                                            <td>${item.cantidad}</td>
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                    <div style="flex: 1; height: 8px; background: rgba(99, 102, 241, 0.2); border-radius: 4px; overflow: hidden;">
                                                        <div style="height: 100%; width: ${percentage}%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 4px;"></div>
                                                    </div>
                                                    <span style="min-width: 45px; text-align: right;">${percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    `}).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">🏢 Top 5 Áreas</h2>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Área</th>
                                        <th>Cantidad</th>
                                        <th>Porcentaje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.porArea.slice(0, 5).map(item => {
                    const percentage = ((item.cantidad / stats.totalBienes) * 100).toFixed(1);
                    return `
                                        <tr>
                                            <td><strong>${item.area}</strong></td>
                                            <td>${item.cantidad}</td>
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                    <div style="flex: 1; height: 8px; background: rgba(139, 92, 246, 0.2); border-radius: 4px; overflow: hidden;">
                                                        <div style="height: 100%; width: ${percentage}%; background: linear-gradient(90deg, var(--secondary), var(--accent)); border-radius: 4px;"></div>
                                                    </div>
                                                    <span style="min-width: 45px; text-align: right;">${percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    `}).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card mt-1">
                    <div class="card-header">
                        <h2 class="card-title">🔄 Últimos Movimientos</h2>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Código</th>
                                    <th>Bien</th>
                                    <th>Tipo</th>
                                    <th>Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${stats.ultimosMovimientos.map(mov => `
                                    <tr>
                                        <td>${formatDate(mov.FechaMovimiento)}</td>
                                        <td><strong>${mov.CodigoPatrimonial}</strong></td>
                                        <td>${mov.bien}</td>
                                        <td><span style="padding: 0.25rem 0.75rem; background: rgba(99, 102, 241, 0.2); border-radius: 0.375rem; font-size: 0.875rem;">${mov.tipo}</span></td>
                                        <td>${mov.usuario}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            return '<div class="card"><p>Error al cargar estadísticas</p></div>';
        }
    },

    // Bienes
    bienes: async () => {
        try {
            const bienes = await syncManager.hybridOperation(
                'bienes',
                () => api.getBienes(),
                () => localDB.getAll('bienes')
            );

            return `
                <div class="card">
                    <div class="card-header flex-between">
                        <h2 class="card-title">📦 Gestión de Bienes</h2>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" id="export-selected-btn" onclick="app.exportSelectedQRs()" style="display: none;">
                                📄 Exportar QRs Seleccionados
                            </button>
                            <button class="btn btn-primary" onclick="app.showBienForm()">
                                ➕ Nuevo Bien
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <input type="text" id="search-bienes" placeholder="Buscar por código, nombre o responsable..." 
                               oninput="app.filterBienes(this.value)">
                    </div>

                    <div class="table-container">
                        <table id="bienes-table">
                            <thead>
                                <tr>
                                    <th><input type="checkbox" id="select-all-bienes" onchange="app.toggleSelectAll(this.checked)"></th>
                                    <th>Código</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Estado</th>
                                    <th>Área</th>
                                    <th>Responsable</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bienes.map(bien => `
                                    <tr data-id="${bien.IdBien}">
                                        <td><input type="checkbox" class="bien-checkbox" value="${bien.IdBien}" onchange="app.updateExportButton()"></td>
                                        <td><strong>${bien.CodigoPatrimonial}</strong></td>
                                        <td>${bien.Bien}</td>
                                        <td>${bien.Categoria}</td>
                                        <td>${bien.Estado}</td>
                                        <td>${bien.Area}</td>
                                        <td>${bien.Responsable || '-'}</td>
                                        <td>
                                            <button class="btn btn-sm btn-secondary" onclick="app.viewBien(${bien.IdBien})">👁️</button>
                                            <button class="btn btn-sm btn-secondary" onclick="app.editBien(${bien.IdBien})">✏️</button>
                                            <button class="btn btn-sm btn-danger" onclick="app.deleteBien(${bien.IdBien})">🗑️</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar bienes:', error);
            return '<div class="card"><p>Error al cargar bienes</p></div>';
        }
    },

    // Responsables
    responsables: async () => {
        try {
            const responsables = await syncManager.hybridOperation(
                'responsables',
                () => api.getResponsables(),
                () => localDB.getAll('responsables')
            );

            const emptyState = responsables.length === 0 ? `
                <div class="empty-state">
                    <h3>No hay responsables registrados</h3>
                    <p>Comienza agregando un nuevo responsable al sistema</p>
                    <button class="btn btn-primary" onclick="app.showResponsableForm()">
                        + Agregar Responsable
                    </button>
                </div>
            ` : '';

            const tableContent = responsables.length > 0 ? `
                <div class="table-container">
                    <table id="responsables-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>DNI</th>
                                <th>Área</th>
                                <th>Teléfono</th>
                                <th>Correo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${responsables.map(resp => `
                                <tr>
                                    <td><strong>${resp.Nombres} ${resp.Apellidos}</strong></td>
                                    <td>${resp.DNI?.trim() || '-'}</td>
                                    <td>${resp.AreaNombre || '-'}</td>
                                    <td>${resp.Telefono || '-'}</td>
                                    <td>${resp.Correo || '-'}</td>
                                    <td class="actions-cell">
                                        <button type="button" class="btn btn-sm btn-secondary" onclick="event.preventDefault(); app.editResponsable(${resp.IdResponsable})">Editar</button>
                                        <button type="button" class="btn btn-sm btn-danger" onclick="event.preventDefault(); app.deleteResponsable(${resp.IdResponsable})">Eliminar</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '';

            return `
                <div class="card">
                    <div class="card-header flex-between">
                        <div class="header-title-group">
                            <h2 class="card-title">Gestión de Responsables</h2>
                            <span class="badge badge-count">${responsables.length} registro${responsables.length !== 1 ? 's' : ''}</span>
                        </div>
                        <button class="btn btn-primary" onclick="app.showResponsableForm()">
                            + Nuevo Responsable
                        </button>
                    </div>

                    ${responsables.length > 0 ? `
                    <div class="search-bar">
                        <input type="text" id="search-responsables" 
                               placeholder="Buscar por nombre, DNI, área..." 
                               oninput="app.filterResponsables(this.value)">
                    </div>
                    ` : ''}

                    ${emptyState}
                    ${tableContent}
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar responsables:', error);
            return '<div class="card"><p>Error al cargar responsables</p></div>';
        }
    },

    // Movimientos
    movimientos: async () => {
        try {
            const movimientos = await syncManager.hybridOperation(
                'movimientos',
                () => api.getMovimientos(),
                () => localDB.getAll('movimientos')
            );

            const emptyState = movimientos.length === 0 ? `
                <div class="empty-state">
                    <h3>No hay movimientos registrados</h3>
                    <p>Los movimientos se registran cuando hay cambios en los bienes</p>
                    <button class="btn btn-primary" onclick="app.showMovimientoForm()">
                        + Registrar Primer Movimiento
                    </button>
                </div>
            ` : '';

            const tableContent = movimientos.length > 0 ? `
                <div class="table-container">
                    <table id="movimientos-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Código Patrimonial</th>
                                <th>Bien</th>
                                <th>Tipo Movimiento</th>
                                <th>Usuario</th>
                                <th>Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${movimientos.map(mov => `
                                <tr>
                                    <td>${formatDate(mov.FechaMovimiento)}</td>
                                    <td><strong>${mov.CodigoPatrimonial}</strong></td>
                                    <td>${mov.BienNombre}</td>
                                    <td><span class="badge badge-movimiento">${mov.NombreMovimiento}</span></td>
                                    <td>${mov.NombreUsuario}</td>
                                    <td>${mov.Descripcion || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '';

            return `
                <div class="card">
                    <div class="card-header flex-between">
                        <div class="header-title-group">
                            <h2 class="card-title">Historial de Movimientos</h2>
                            <span class="badge badge-count">${movimientos.length} registro${movimientos.length !== 1 ? 's' : ''}</span>
                        </div>
                        <button class="btn btn-primary" onclick="app.showMovimientoForm()">
                            + Registrar Movimiento
                        </button>
                    </div>

                    ${movimientos.length > 0 ? `
                    <div class="search-bar">
                        <input type="text" id="search-movimientos" 
                               placeholder="Buscar por código, bien, tipo..." 
                               oninput="app.filterMovimientos(this.value)">
                    </div>
                    ` : ''}

                    ${emptyState}
                    ${tableContent}
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar movimientos:', error);
            return '<div class="card"><p>Error al cargar movimientos</p></div>';
        }
    },

    // Auditoría
    auditoria: async () => {
        try {
            const auditoria = await api.getAuditoria();

            return `
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">📋 Auditoría del Sistema</h2>
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tabla</th>
                                    <th>Acción</th>
                                    <th>Usuario</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${auditoria.map(aud => `
                                    <tr>
                                        <td>${formatDate(aud.Fecha)}</td>
                                        <td><strong>${aud.Tabla}</strong></td>
                                        <td>${aud.Accion}</td>
                                        <td>${aud.Usuario}</td>
                                        <td>${aud.Descripcion}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar auditoría:', error);
            return '<div class="card"><p>Error al cargar auditoría. Requiere conexión online.</p></div>';
        }
    },

    // Catálogos
    catalogos: async () => {
        try {
            const catalogos = await api.getCatalogos();

            return `
                <div class="card catalogos-container">
                    <div class="card-header">
                        <h2 class="card-title">⚙️ Gestión de Catálogos</h2>
                    </div>
                    
                    <!-- Tabs de navegación -->
                    <div class="catalog-tabs">
                        <button class="catalog-tab active" data-catalog="marcas" onclick="app.switchCatalogTab('marcas')">
                            🏷️ Marcas
                        </button>
                        <button class="catalog-tab" data-catalog="estados" onclick="app.switchCatalogTab('estados')">
                            📊 Estados
                        </button>
                        <button class="catalog-tab" data-catalog="tiposBien" onclick="app.switchCatalogTab('tiposBien')">
                            📦 Tipos de Bien
                        </button>
                        <button class="catalog-tab" data-catalog="categorias" onclick="app.switchCatalogTab('categorias')">
                            📁 Categorías
                        </button>
                        <button class="catalog-tab" data-catalog="areas" onclick="app.switchCatalogTab('areas')">
                            🏢 Áreas
                        </button>
                        <button class="catalog-tab" data-catalog="metodos" onclick="app.switchCatalogTab('metodos')">
                            Métodos de Adquisición
                        </button>
                        <button class="catalog-tab" data-catalog="tiposMovimiento" onclick="app.switchCatalogTab('tiposMovimiento')">
                            Tipos de Movimiento
                        </button>
                    </div>

                    <!-- Panel Marcas -->
                    <div class="catalog-panel active" id="panel-marcas">
                        <div class="panel-header">
                            <h3>🏷️ Marcas</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('marca')">
                                ➕ Nueva Marca
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catalogos.marcas.map(item => `
                                        <tr>
                                            <td>${item.IdMarca}</td>
                                            <td><strong>${item.Nombre}</strong></td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('marca', ${item.IdMarca}, '${item.Nombre.replace(/'/g, "\\'")}')">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('marca', ${item.IdMarca})">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel Estados -->
                    <div class="catalog-panel" id="panel-estados">
                        <div class="panel-header">
                            <h3>📊 Estados</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('estado')">
                                ➕ Nuevo Estado
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catalogos.estados.map(item => `
                                        <tr>
                                            <td>${item.IdEstado}</td>
                                            <td><strong>${item.Nombre}</strong></td>
                                            <td>${item.Descripcion || '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('estado', ${item.IdEstado}, '${item.Nombre.replace(/'/g, "\\'")}', '${(item.Descripcion || '').replace(/'/g, "\\'")}')">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('estado', ${item.IdEstado})">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel Tipos de Bien -->
                    <div class="catalog-panel" id="panel-tiposBien">
                        <div class="panel-header">
                            <h3>📦 Tipos de Bien</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('tipoBien')">
                                ➕ Nuevo Tipo
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catalogos.tipoBien.map(item => `
                                        <tr>
                                            <td>${item.IdTipoBien}</td>
                                            <td><strong>${item.Nombre}</strong></td>
                                            <td>${item.Descripcion || '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('tipoBien', ${item.IdTipoBien}, '${item.Nombre.replace(/'/g, "\\'")}', '${(item.Descripcion || '').replace(/'/g, "\\'")}')">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('tipoBien', ${item.IdTipoBien})">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel Categorías -->
                    <div class="catalog-panel" id="panel-categorias">
                        <div class="panel-header">
                            <h3>📁 Categorías</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('categoria')">
                                ➕ Nueva Categoría
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Tipo de Bien</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catalogos.categorias.map(item => `
                                        <tr>
                                            <td>${item.IdCategoria}</td>
                                            <td><strong>${item.Nombre}</strong></td>
                                            <td><span class="badge badge-info">${item.TipoBienNombre}</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('categoria', ${item.IdCategoria}, '${item.Nombre.replace(/'/g, "\\'")}', ${item.IdTipoBien})">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('categoria', ${item.IdCategoria})">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel Áreas -->
                    <div class="catalog-panel" id="panel-areas">
                        <div class="panel-header">
                            <h3>🏢 Áreas</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('area')">
                                ➕ Nueva Área
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Ubicación</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catalogos.areas.map(item => `
                                        <tr>
                                            <td>${item.IdArea}</td>
                                            <td><strong>${item.Nombre}</strong></td>
                                            <td>${item.Ubicacion || '-'}</td>
                                            <td>${item.Descripcion || '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('area', ${item.IdArea}, '${item.Nombre.replace(/'/g, "\\'")}', '${(item.Ubicacion || '').replace(/'/g, "\\'")}', '${(item.Descripcion || '').replace(/'/g, "\\'")}')">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('area', ${item.IdArea})">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel Métodos de Adquisición -->
                    <div class="catalog-panel" id="panel-metodos">
                        <div class="panel-header">
                            <h3>💳 Métodos de Adquisición</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('metodo')">
                                ➕ Nuevo Método
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${catalogos.metodosAdquisicion.map(item => `
                                        <tr>
                                            <td>${item.IdMetodo}</td>
                                            <td><strong>${item.NombreMetodo}</strong></td>
                                            <td>${item.Descripcion || '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('metodo', ${item.IdMetodo}, '${item.NombreMetodo.replace(/'/g, "\\'")}', '${(item.Descripcion || '').replace(/'/g, "\\'")}')">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('metodo', ${item.IdMetodo})">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel Tipos de Movimiento -->
                    <div class="catalog-panel" id="panel-tiposMovimiento">
                        <div class="panel-header">
                            <h3>Tipos de Movimiento</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('tipoMovimiento')">
                                + Nuevo Tipo
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(catalogos.tiposMovimiento || []).map(item => `
                                        <tr>
                                            <td>${item.IdTipoMovimiento}</td>
                                            <td><strong>${item.NombreMovimiento}</strong></td>
                                            <td>${item.Descripcion || '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('tipoMovimiento', ${item.IdTipoMovimiento}, '${item.NombreMovimiento.replace(/'/g, "\\'")}', '${(item.Descripcion || '').replace(/'/g, "\\'")}')">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('tipoMovimiento', ${item.IdTipoMovimiento})">Eliminar</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
            return '<div class="card"><p>Error al cargar catálogos</p></div>';
        }
    },

    // Usuarios
    usuarios: async () => {
        try {
            const [usuarios, roles, responsables] = await Promise.all([
                api.getUsuarios(),
                api.getRoles(),
                api.getResponsablesForUsers()
            ]);

            // Guardar para uso en formularios
            app.usuariosData = { usuarios, roles, responsables };

            return `
                <div class="card catalogos-container">
                    <div class="card-header">
                        <h2 class="card-title">🔐 Gestión de Usuarios</h2>
                    </div>
                    
                    <!-- Tabs de navegación -->
                    <div class="catalog-tabs">
                        <button class="catalog-tab active" data-catalog="usuarios" onclick="app.switchUserTab('usuarios')">
                            👤 Usuarios
                        </button>
                        <button class="catalog-tab" data-catalog="roles" onclick="app.switchUserTab('roles')">
                            🏷️ Roles de Usuario
                        </button>
                    </div>

                    <!-- Panel Usuarios -->
                    <div class="catalog-panel active" id="panel-usuarios">
                        <div class="panel-header">
                            <h3>👤 Usuarios del Sistema</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showUserForm('usuario')">
                                ➕ Nuevo Usuario
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Usuario</th>
                                        <th>Rol</th>
                                        <th>Responsable</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${usuarios.map(u => `
                                        <tr>
                                            <td>${u.IdUsuario}</td>
                                            <td><strong>${u.NombreUsuario}</strong></td>
                                            <td><span class="badge badge-info">${u.NombreRol || '-'}</span></td>
                                            <td>${u.Nombres ? `${u.Nombres} ${u.Apellidos}` : '-'}</td>
                                            <td>
                                                <span class="badge ${u.Estado ? 'badge-operativo' : 'badge-baja'}">
                                                    ${u.Estado ? '✓ Activo' : '✗ Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editUserItem('usuario', ${u.IdUsuario})">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteUserItem('usuario', ${u.IdUsuario})">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Panel Roles -->
                    <div class="catalog-panel" id="panel-roles">
                        <div class="panel-header">
                            <h3>🏷️ Roles de Usuario</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showUserForm('rol')">
                                ➕ Nuevo Rol
                            </button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre del Rol</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${roles.map(r => `
                                        <tr>
                                            <td>${r.IdRol}</td>
                                            <td><strong>${r.NombreRol}</strong></td>
                                            <td>${r.Descripcion || '-'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editUserItem('rol', ${r.IdRol}, '${r.NombreRol.replace(/'/g, "\\'")}', '${(r.Descripcion || '').replace(/'/g, "\\'")}')">✏️</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteUserItem('rol', ${r.IdRol})">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            return '<div class="card"><p>Error al cargar usuarios</p></div>';
        }
    }
};

// === APLICACIÓN PRINCIPAL ===

class App {
    constructor() {
        this.currentView = 'dashboard';
        this.catalogos = null;
    }

    async init() {
        // Inicializar IndexedDB
        await localDB.init();

        // Verificar autenticación
        if (!authManager.isAuthenticated()) {
            this.showLogin();
            return;
        }

        // Cargar catálogos
        await this.loadCatalogos();

        // Mostrar app
        this.showApp();

        // Sincronizar datos iniciales
        await syncManager.syncFromServer();

        // Cargar vista inicial
        await this.loadView('dashboard');

        // Setup event listeners
        this.setupEventListeners();
    }

    showLogin() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');

        // Login form handler
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('login-error');

            try {
                await authManager.login(username, password);
                window.location.reload();
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    showApp() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        // Mostrar info de usuario
        const user = authManager.getCurrentUser();
        if (user) {
            document.querySelector('.user-name').textContent = user.nombreCompleto || user.nombreUsuario;
        }
    }

    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.loadView(view);
            });
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            authManager.logout();
        });

        // Mobile menu toggle
        document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

    async loadView(viewName) {
        this.currentView = viewName;

        // Actualizar navegación activa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Actualizar título
        const titles = {
            dashboard: 'Dashboard',
            bienes: 'Gestión de Bienes',
            responsables: 'Gestión de Responsables',
            movimientos: 'Historial de Movimientos',
            auditoria: 'Auditoría del Sistema',
            catalogos: 'Gestión de Catálogos',
            usuarios: 'Gestión de Usuarios'
        };
        document.getElementById('page-title').textContent = titles[viewName];

        // Cargar contenido
        const content = document.getElementById('content');
        content.innerHTML = '<div class="loading-screen"><div class="loader"></div></div>';

        try {
            const html = await views[viewName]();
            content.innerHTML = html;
        } catch (error) {
            console.error('Error al cargar vista:', error);
            content.innerHTML = '<div class="card"><p>Error al cargar la vista</p></div>';
        }
    }

    async loadCatalogos() {
        try {
            this.catalogos = await syncManager.hybridOperation(
                'catalogos',
                () => api.getCatalogos(),
                () => localDB.getCatalogos()
            );
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
        }
    }

    // Métodos de formularios
    async showBienForm(idBien = null) {
        const isEdit = idBien !== null;
        const title = isEdit ? 'Editar Bien' : 'Nuevo Bien';

        // Generar código patrimonial automático si es nuevo
        let codigoPatrimonial = '';
        if (!isEdit) {
            const year = new Date().getFullYear();
            const bienes = await api.getBienes();
            const count = bienes.length + 1;
            codigoPatrimonial = `BIEN-${year}-${String(count).padStart(4, '0')}`;
        }

        // Cargar datos del bien si es edición
        let bienData = null;
        if (isEdit) {
            bienData = await api.getBien(idBien);
            codigoPatrimonial = bienData.CodigoPatrimonial;
        }

        const modalHTML = `
            <div class="modal-overlay" id="bien-modal">
                <div class="modal-container modal-large">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <form id="bien-form" class="modal-body">
                        <!-- Datos Básicos -->
                        <div class="form-section">
                            <h3 class="form-section-title">📋 Datos Básicos</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="codigoPatrimonial">Código Patrimonial *</label>
                                    <input type="text" id="codigoPatrimonial" name="codigoPatrimonial" 
                                           value="${codigoPatrimonial}" readonly required>
                                </div>
                                <div class="form-group">
                                    <label for="nombre">Nombre del Bien *</label>
                                    <input type="text" id="nombre" name="nombre" 
                                           value="${bienData?.Bien || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label for="idTipoBien">Tipo de Bien *</label>
                                    <select id="idTipoBien" name="idTipoBien" required 
                                            onchange="app.filterCategoriasByTipo(this.value)">
                                        <option value="">Seleccione...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="idCategoria">Categoría *</label>
                                    <select id="idCategoria" name="idCategoria" required>
                                        <option value="">Primero seleccione tipo de bien</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="idMarca">Marca</label>
                                    <select id="idMarca" name="idMarca">
                                        <option value="">Seleccione...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="modelo">Modelo</label>
                                    <input type="text" id="modelo" name="modelo" 
                                           value="${bienData?.Modelo || ''}" 
                                           placeholder="Opcional">
                                </div>
                                <div class="form-group">
                                    <label for="idEstado">Estado *</label>
                                    <select id="idEstado" name="idEstado" required>
                                        <option value="">Seleccione...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="idArea">Área *</label>
                                    <select id="idArea" name="idArea" required>
                                        <option value="">Seleccione...</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="idResponsable">Responsable</label>
                                    <select id="idResponsable" name="idResponsable">
                                        <option value="">Sin asignar</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Adquisición -->
                        <div class="form-section">
                            <h3 class="form-section-title">💰 Datos de Adquisición</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="fechaAdquisicion">Fecha de Adquisición *</label>
                                    <input type="date" id="fechaAdquisicion" name="fechaAdquisicion" required>
                                </div>
                                <div class="form-group">
                                    <label for="costo">Costo (S/) *</label>
                                    <input type="number" id="costo" name="costo" step="0.01" min="0" required>
                                </div>
                                <div class="form-group">
                                    <label for="proveedor">Proveedor</label>
                                    <input type="text" id="proveedor" name="proveedor">
                                </div>
                                <div class="form-group">
                                    <label for="idMetodo">Método de Adquisición *</label>
                                    <select id="idMetodo" name="idMetodo" required>
                                        <option value="">Seleccione...</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Especificaciones Técnicas -->
                        <div class="form-section">
                            <h3 class="form-section-title">🔧 Especificaciones Técnicas (Opcional)</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="procesador">Procesador</label>
                                    <input type="text" id="procesador" name="procesador">
                                </div>
                                <div class="form-group">
                                    <label for="memoria">Memoria RAM</label>
                                    <input type="text" id="memoria" name="memoria">
                                </div>
                                <div class="form-group">
                                    <label for="almacenamiento">Almacenamiento</label>
                                    <input type="text" id="almacenamiento" name="almacenamiento">
                                </div>
                                <div class="form-group">
                                    <label for="pantalla">Pantalla</label>
                                    <input type="text" id="pantalla" name="pantalla">
                                </div>
                                <div class="form-group form-group-full">
                                    <label for="otros">Otros</label>
                                    <textarea id="otros" name="otros" rows="2"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Observaciones -->
                        <div class="form-section">
                            <div class="form-group">
                                <label for="observacion">Observaciones</label>
                                <textarea id="observacion" name="observacion" rows="3"></textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">💾 Guardar Bien</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Insertar modal en el DOM
        document.getElementById('modal-container').innerHTML = modalHTML;

        // Cargar catálogos
        await this.loadFormCatalogos();

        // Configurar evento de envío
        document.getElementById('bien-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitBienForm();
        });
    }

    async showResponsableForm(idResponsable = null) {
        const isEdit = idResponsable !== null;
        const title = isEdit ? 'Editar Responsable' : 'Nuevo Responsable';

        // Cargar datos del responsable si es edición
        let responsableData = null;
        if (isEdit) {
            try {
                responsableData = await api.getResponsable(idResponsable);
            } catch (error) {
                showToast('Error al cargar datos del responsable', 'error');
                return;
            }
        }

        // Obtener áreas disponibles
        const catalogos = this.catalogos || await api.getCatalogos();
        const areas = catalogos.areas || [];

        const modalHTML = `
            <div class="modal-overlay" id="responsable-modal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <form id="responsable-form" class="modal-body">
                        <input type="hidden" id="responsable-id" value="${idResponsable || ''}">
                        
                        <div class="form-section">
                            <h3 class="form-section-title">Datos Personales</h3>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="resp-nombres">Nombres *</label>
                                    <input type="text" id="resp-nombres" name="nombres" 
                                           value="${responsableData?.Nombres || ''}" 
                                           placeholder="Ingrese los nombres"
                                           required>
                                </div>
                                <div class="form-group">
                                    <label for="resp-apellidos">Apellidos *</label>
                                    <input type="text" id="resp-apellidos" name="apellidos" 
                                           value="${responsableData?.Apellidos || ''}" 
                                           placeholder="Ingrese los apellidos"
                                           required>
                                </div>
                                <div class="form-group">
                                    <label for="resp-dni">DNI</label>
                                    <input type="text" id="resp-dni" name="dni" 
                                           value="${responsableData?.DNI?.trim() || ''}" 
                                           placeholder="8 dígitos"
                                           maxlength="8"
                                           pattern="[0-9]{8}">
                                </div>
                                <div class="form-group">
                                    <label for="resp-telefono">Teléfono</label>
                                    <input type="tel" id="resp-telefono" name="telefono" 
                                           value="${responsableData?.Telefono || ''}" 
                                           placeholder="999 999 999">
                                </div>
                                <div class="form-group form-group-full">
                                    <label for="resp-correo">Correo Electrónico</label>
                                    <input type="email" id="resp-correo" name="correo" 
                                           value="${responsableData?.Correo || ''}" 
                                           placeholder="ejemplo@correo.com">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3 class="form-section-title">Asignación de Área</h3>
                            <div class="form-grid">
                                <div class="form-group form-group-full">
                                    <label for="resp-area">Área *</label>
                                    <select id="resp-area" name="idArea" required>
                                        <option value="">Seleccione un área...</option>
                                        ${areas.map(area => `
                                            <option value="${area.IdArea}" 
                                                    ${responsableData?.IdArea == area.IdArea ? 'selected' : ''}>
                                                ${area.Nombre}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'} Responsable</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Insertar modal en el DOM
        document.getElementById('modal-container').innerHTML = modalHTML;

        // Configurar evento de envío
        document.getElementById('responsable-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitResponsableForm();
        });
    }

    async submitResponsableForm() {
        try {
            const form = document.getElementById('responsable-form');
            const formData = new FormData(form);
            const idResponsable = document.getElementById('responsable-id').value;
            const isEdit = idResponsable !== '';

            // Preparar datos
            const data = {
                nombres: formData.get('nombres').trim(),
                apellidos: formData.get('apellidos').trim(),
                dni: formData.get('dni')?.trim() || null,
                telefono: formData.get('telefono')?.trim() || null,
                correo: formData.get('correo')?.trim() || null,
                idArea: parseInt(formData.get('idArea'))
            };

            // Validaciones básicas
            if (!data.nombres || !data.apellidos) {
                showToast('Nombres y apellidos son obligatorios', 'warning');
                return;
            }

            if (!data.idArea) {
                showToast('Debe seleccionar un área', 'warning');
                return;
            }

            showToast(isEdit ? 'Actualizando responsable...' : 'Guardando responsable...', 'info');

            if (isEdit) {
                await api.updateResponsable(parseInt(idResponsable), data);
                showToast('Responsable actualizado exitosamente', 'success');
            } else {
                await api.createResponsable(data);
                showToast('Responsable creado exitosamente', 'success');
            }

            this.closeModal();
            await this.loadView('responsables');

        } catch (error) {
            console.error('Error al guardar responsable:', error);
            showToast('Error al guardar responsable: ' + error.message, 'error');
        }
    }

    async showMovimientoForm() {
        try {
            // Obtener bienes y tipos de movimiento
            const [bienes, catalogos] = await Promise.all([
                api.getBienes(),
                api.getCatalogos()
            ]);

            const tiposMovimiento = catalogos.tiposMovimiento || [];
            const usuario = JSON.parse(localStorage.getItem('usuario'));

            const modalHTML = `
                <div class="modal-overlay" id="movimiento-modal">
                    <div class="modal-container">
                        <div class="modal-header">
                            <h2>Registrar Movimiento</h2>
                            <button class="modal-close" onclick="app.closeModal()">&times;</button>
                        </div>
                        <form id="movimiento-form" class="modal-body">
                            <div class="form-section">
                                <h3 class="form-section-title">Datos del Movimiento</h3>
                                <div class="form-grid">
                                    <div class="form-group form-group-full">
                                        <label for="mov-bien">Bien *</label>
                                        <select id="mov-bien" name="idBien" required>
                                            <option value="">Seleccione un bien...</option>
                                            ${bienes.map(bien => `
                                                <option value="${bien.IdBien}">
                                                    ${bien.CodigoPatrimonial} - ${bien.Bien}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group form-group-full">
                                        <label for="mov-tipo">Tipo de Movimiento *</label>
                                        <select id="mov-tipo" name="idTipoMovimiento" required>
                                            <option value="">Seleccione un tipo...</option>
                                            ${tiposMovimiento.map(tipo => `
                                                <option value="${tipo.IdTipoMovimiento}">
                                                    ${tipo.NombreMovimiento}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="form-group form-group-full">
                                        <label for="mov-descripcion">Descripción</label>
                                        <textarea id="mov-descripcion" name="descripcion" rows="3" 
                                                  placeholder="Describa el motivo del movimiento..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Registrar Movimiento</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            document.getElementById('modal-container').innerHTML = modalHTML;

            // Configurar evento de envío
            document.getElementById('movimiento-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitMovimientoForm();
            });

        } catch (error) {
            console.error('Error al cargar formulario de movimiento:', error);
            showToast('Error al cargar el formulario', 'error');
        }
    }

    async submitMovimientoForm() {
        try {
            const form = document.getElementById('movimiento-form');
            const formData = new FormData(form);
            const usuario = JSON.parse(localStorage.getItem('usuario'));

            const data = {
                idBien: parseInt(formData.get('idBien')),
                idTipoMovimiento: parseInt(formData.get('idTipoMovimiento')),
                descripcion: formData.get('descripcion')?.trim() || null,
                idUsuario: usuario?.IdUsuario || 1
            };

            if (!data.idBien) {
                showToast('Debe seleccionar un bien', 'warning');
                return;
            }

            if (!data.idTipoMovimiento) {
                showToast('Debe seleccionar un tipo de movimiento', 'warning');
                return;
            }

            showToast('Registrando movimiento...', 'info');

            await api.createMovimiento(data);
            showToast('Movimiento registrado exitosamente', 'success');

            this.closeModal();
            await this.loadView('movimientos');

        } catch (error) {
            console.error('Error al registrar movimiento:', error);
            showToast('Error al registrar movimiento: ' + error.message, 'error');
        }
    }

    filterMovimientos(searchTerm) {
        const rows = document.querySelectorAll('#movimientos-table tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    async viewBien(id) {
        try {
            const bien = await api.getBien(id);

            // Generar previsualización del QR
            const qrPreview = await generateQRPreview(bien);

            const modalHTML = `
                <div class="modal-overlay" id="view-bien-modal">
                    <div class="modal-container modal-medium">
                        <div class="modal-header">
                            <h2>📦 Detalles del Bien</h2>
                            <button class="modal-close" onclick="app.closeModal()">&times;</button>
                        </div>
                        <div class="modal-body">
                            <!-- Información Principal -->
                            <div class="bien-detail-grid">
                                <div class="bien-detail-section">
                                    <h3>Información General</h3>
                                    <div class="detail-item">
                                        <span class="detail-label">Código Patrimonial:</span>
                                        <span class="detail-value"><strong>${bien.CodigoPatrimonial}</strong></span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Nombre:</span>
                                        <span class="detail-value">${bien.Bien}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Tipo de Bien:</span>
                                        <span class="detail-value">${bien.TipoBien || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Categoría:</span>
                                        <span class="detail-value">${bien.Categoria}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Marca:</span>
                                        <span class="detail-value">${bien.Marca || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Modelo:</span>
                                        <span class="detail-value">${bien.Modelo || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Estado:</span>
                                        <span class="detail-value badge badge-${bien.Estado?.toLowerCase()}">${bien.Estado}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Área:</span>
                                        <span class="detail-value">${bien.Area}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Responsable:</span>
                                        <span class="detail-value">${bien.Responsable || 'Sin asignar'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Fecha de Ingreso:</span>
                                        <span class="detail-value">${formatDate(bien.FechaRegistro)}</span>
                                    </div>
                                </div>

                                <!-- Código QR -->
                                <div class="bien-detail-section qr-section">
                                    <h3>Código QR</h3>
                                    ${qrPreview}
                                    <div class="qr-actions">
                                        <button class="btn btn-primary btn-sm" onclick="exportSingleQRImage(${id})">
                                            📥 Descargar PNG
                                        </button>
                                    </div>
                                </div>
                            </div>

                            ${bien.Observacion ? `
                            <div class="detail-item detail-item-full">
                                <span class="detail-label">Observaciones:</span>
                                <span class="detail-value">${bien.Observacion}</span>
                            </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="app.closeModal()">Cerrar</button>
                            <button class="btn btn-primary" onclick="app.editBien(${id})">✏️ Editar</button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('modal-container').innerHTML = modalHTML;
        } catch (error) {
            console.error('Error al ver bien:', error);
            showToast('Error al cargar detalles del bien', 'error');
        }
    }

    editBien(id) {
        // Reutilizar showBienForm pasando el ID para edición
        this.showBienForm(id);
    }

    async deleteBien(id) {
        if (!confirm('¿Está seguro de eliminar este bien?')) return;

        try {
            await syncManager.hybridOperation(
                'delete',
                () => api.deleteBien(id),
                async () => {
                    await localDB.delete('bienes', id);
                    await localDB.addPendingSync('delete', 'bienes', { IdBien: id });
                }
            );

            showToast('Bien eliminado exitosamente', 'success');
            this.loadView('bienes');
        } catch (error) {
            showToast('Error al eliminar bien', 'error');
        }
    }

    editResponsable(id) {
        this.showResponsableForm(id);
    }

    async deleteResponsable(id) {
        const confirmed = await this.showConfirmModal(
            'Eliminar Responsable',
            '¿Está seguro de que desea eliminar este responsable?'
        );

        if (!confirmed) return;

        try {
            await api.deleteResponsable(id);
            showToast('Responsable eliminado exitosamente', 'success');
            await this.loadView('responsables');
        } catch (error) {
            showToast(error.message || 'Error al eliminar responsable', 'error');
        }
    }

    showConfirmModal(title, message) {
        return new Promise((resolve) => {
            const modalHTML = `
                <div class="modal-overlay" id="confirm-modal">
                    <div class="modal-container modal-confirm">
                        <div class="modal-header">
                            <h2>${title}</h2>
                        </div>
                        <div class="modal-body">
                            <p class="confirm-message">${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
                            <button type="button" class="btn btn-danger" id="confirm-accept">Eliminar</button>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('modal-container').innerHTML = modalHTML;

            document.getElementById('confirm-cancel').addEventListener('click', () => {
                document.getElementById('modal-container').innerHTML = '';
                resolve(false);
            });

            document.getElementById('confirm-accept').addEventListener('click', () => {
                document.getElementById('modal-container').innerHTML = '';
                resolve(true);
            });

            document.getElementById('confirm-modal').addEventListener('click', (e) => {
                if (e.target.id === 'confirm-modal') {
                    document.getElementById('modal-container').innerHTML = '';
                    resolve(false);
                }
            });
        });
    }

    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    }

    filterResponsables(searchTerm) {
        const rows = document.querySelectorAll('#responsables-table tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
        });
    }

    // === MÉTODOS DE CATÁLOGOS ===

    switchCatalogTab(tabName) {
        // Actualizar tabs activos
        document.querySelectorAll('.catalog-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.catalog === tabName);
        });

        // Mostrar/ocultar paneles
        document.querySelectorAll('.catalog-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabName}`);
        });
    }

    async showCatalogForm(type, editData = null) {
        const isEdit = editData !== null;
        let title, formContent;

        switch (type) {
            case 'marca':
                title = isEdit ? 'Editar Marca' : 'Nueva Marca';
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombre" value="${editData?.nombre || ''}" required>
                    </div>
                `;
                break;

            case 'estado':
                title = isEdit ? 'Editar Estado' : 'Nuevo Estado';
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombre" value="${editData?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="catalog-descripcion">Descripción</label>
                        <textarea id="catalog-descripcion" name="descripcion" rows="2">${editData?.descripcion || ''}</textarea>
                    </div>
                `;
                break;

            case 'tipoBien':
                title = isEdit ? 'Editar Tipo de Bien' : 'Nuevo Tipo de Bien';
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombre" value="${editData?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="catalog-descripcion">Descripción</label>
                        <textarea id="catalog-descripcion" name="descripcion" rows="2">${editData?.descripcion || ''}</textarea>
                    </div>
                `;
                break;

            case 'categoria':
                title = isEdit ? 'Editar Categoría' : 'Nueva Categoría';
                const tiposBien = this.catalogos?.tipoBien || [];
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombre" value="${editData?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="catalog-tipoBien">Tipo de Bien *</label>
                        <select id="catalog-tipoBien" name="idTipoBien" required>
                            <option value="">Seleccione...</option>
                            ${tiposBien.map(t => `
                                <option value="${t.IdTipoBien}" ${editData?.idTipoBien == t.IdTipoBien ? 'selected' : ''}>${t.Nombre}</option>
                            `).join('')}
                        </select>
                    </div>
                `;
                break;

            case 'area':
                title = isEdit ? 'Editar Área' : 'Nueva Área';
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombre" value="${editData?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="catalog-ubicacion">Ubicación</label>
                        <input type="text" id="catalog-ubicacion" name="ubicacion" value="${editData?.ubicacion || ''}">
                    </div>
                    <div class="form-group">
                        <label for="catalog-descripcion">Descripción</label>
                        <textarea id="catalog-descripcion" name="descripcion" rows="2">${editData?.descripcion || ''}</textarea>
                    </div>
                `;
                break;

            case 'metodo':
                title = isEdit ? 'Editar Método de Adquisición' : 'Nuevo Método de Adquisición';
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombreMetodo" value="${editData?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="catalog-descripcion">Descripción</label>
                        <textarea id="catalog-descripcion" name="descripcion" rows="2">${editData?.descripcion || ''}</textarea>
                    </div>
                `;
                break;

            case 'tipoMovimiento':
                title = isEdit ? 'Editar Tipo de Movimiento' : 'Nuevo Tipo de Movimiento';
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombreMovimiento" value="${editData?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="catalog-descripcion">Descripción</label>
                        <textarea id="catalog-descripcion" name="descripcion" rows="2">${editData?.descripcion || ''}</textarea>
                    </div>
                `;
                break;

            default:
                return;
        }

        const modalHTML = `
            <div class="modal-overlay" id="catalog-modal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <form id="catalog-form" class="modal-body">
                        <input type="hidden" id="catalog-type" value="${type}">
                        <input type="hidden" id="catalog-id" value="${editData?.id || ''}">
                        ${formContent}
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">💾 Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modalHTML;

        // Configurar evento de envío
        document.getElementById('catalog-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCatalogItem();
        });
    }

    editCatalogItem(type, id, ...args) {
        let editData = { id };

        switch (type) {
            case 'marca':
                editData.nombre = args[0];
                break;
            case 'estado':
            case 'tipoBien':
            case 'metodo':
                editData.nombre = args[0];
                editData.descripcion = args[1] || '';
                break;
            case 'categoria':
                editData.nombre = args[0];
                editData.idTipoBien = args[1];
                break;
            case 'area':
                editData.nombre = args[0];
                editData.ubicacion = args[1] || '';
                editData.descripcion = args[2] || '';
                break;
            case 'tipoMovimiento':
                editData.nombre = args[0];
                editData.descripcion = args[1] || '';
                break;
        }

        this.showCatalogForm(type, editData);
    }

    async deleteCatalogItem(type, id) {
        const typeNames = {
            marca: 'marca',
            estado: 'estado',
            tipoBien: 'tipo de bien',
            categoria: 'categoría',
            area: 'área',
            metodo: 'método de adquisición',
            tipoMovimiento: 'tipo de movimiento'
        };

        if (!confirm(`¿Está seguro de eliminar este ${typeNames[type]}?`)) return;

        try {
            switch (type) {
                case 'marca':
                    await api.deleteMarca(id);
                    break;
                case 'estado':
                    await api.deleteEstado(id);
                    break;
                case 'tipoBien':
                    await api.deleteTipoBien(id);
                    break;
                case 'categoria':
                    await api.deleteCategoria(id);
                    break;
                case 'area':
                    await api.deleteArea(id);
                    break;
                case 'metodo':
                    await api.deleteMetodoAdquisicion(id);
                    break;
                case 'tipoMovimiento':
                    await api.deleteTipoMovimiento(id);
                    break;
            }

            showToast(`${typeNames[type].charAt(0).toUpperCase() + typeNames[type].slice(1)} eliminado exitosamente`, 'success');

            // Recargar catálogos y la vista
            await this.loadCatalogos();
            await this.loadView('catalogos');
        } catch (error) {
            showToast(error.message || 'Error al eliminar', 'error');
        }
    }

    async saveCatalogItem() {
        const type = document.getElementById('catalog-type').value;
        const id = document.getElementById('catalog-id').value;
        const isEdit = id !== '';

        try {
            let result;

            switch (type) {
                case 'marca': {
                    const nombre = document.getElementById('catalog-nombre').value;
                    if (isEdit) {
                        result = await api.updateMarca(id, nombre);
                    } else {
                        result = await api.createMarca(nombre);
                    }
                    break;
                }
                case 'estado': {
                    const nombre = document.getElementById('catalog-nombre').value;
                    const descripcion = document.getElementById('catalog-descripcion').value;
                    if (isEdit) {
                        result = await api.updateEstado(id, nombre, descripcion);
                    } else {
                        result = await api.createEstado(nombre, descripcion);
                    }
                    break;
                }
                case 'tipoBien': {
                    const nombre = document.getElementById('catalog-nombre').value;
                    const descripcion = document.getElementById('catalog-descripcion').value;
                    if (isEdit) {
                        result = await api.updateTipoBien(id, nombre, descripcion);
                    } else {
                        result = await api.createTipoBien(nombre, descripcion);
                    }
                    break;
                }
                case 'categoria': {
                    const nombre = document.getElementById('catalog-nombre').value;
                    const idTipoBien = document.getElementById('catalog-tipoBien').value;
                    if (isEdit) {
                        result = await api.updateCategoria(id, nombre, idTipoBien, null);
                    } else {
                        result = await api.createCategoria(nombre, idTipoBien);
                    }
                    break;
                }
                case 'area': {
                    const nombre = document.getElementById('catalog-nombre').value;
                    const ubicacion = document.getElementById('catalog-ubicacion').value;
                    const descripcion = document.getElementById('catalog-descripcion').value;
                    if (isEdit) {
                        result = await api.updateArea(id, nombre, ubicacion, descripcion);
                    } else {
                        result = await api.createArea(nombre, ubicacion, descripcion);
                    }
                    break;
                }
                case 'metodo': {
                    const nombreMetodo = document.getElementById('catalog-nombre').value;
                    const descripcion = document.getElementById('catalog-descripcion').value;
                    if (isEdit) {
                        result = await api.updateMetodoAdquisicion(id, nombreMetodo, descripcion);
                    } else {
                        result = await api.createMetodoAdquisicion(nombreMetodo, descripcion);
                    }
                    break;
                }
                case 'tipoMovimiento': {
                    const nombreMovimiento = document.getElementById('catalog-nombre').value;
                    const descripcion = document.getElementById('catalog-descripcion').value;
                    if (isEdit) {
                        result = await api.updateTipoMovimiento(id, nombreMovimiento, descripcion);
                    } else {
                        result = await api.createTipoMovimiento(nombreMovimiento, descripcion);
                    }
                    break;
                }
            }

            showToast(isEdit ? 'Actualizado exitosamente' : 'Creado exitosamente', 'success');
            this.closeModal();

            // Recargar catálogos y la vista
            await this.loadCatalogos();
            await this.loadView('catalogos');

        } catch (error) {
            showToast(error.message || 'Error al guardar', 'error');
        }
    }

    // === MÉTODOS DE USUARIOS ===

    switchUserTab(tabName) {
        // Actualizar tabs activos
        document.querySelectorAll('.catalog-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.catalog === tabName);
        });

        // Mostrar/ocultar paneles
        document.querySelectorAll('.catalog-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabName}`);
        });
    }

    async showUserForm(type, editData = null) {
        const isEdit = editData !== null;
        let title, formContent;

        switch (type) {
            case 'usuario':
                title = isEdit ? 'Editar Usuario' : 'Nuevo Usuario';
                const rolesOptions = (this.usuariosData?.roles || []).map(r => `
                    <option value="${r.IdRol}" ${editData?.IdRol == r.IdRol ? 'selected' : ''}>${r.NombreRol}</option>
                `).join('');
                const responsablesOptions = (this.usuariosData?.responsables || []).map(p => `
                    <option value="${p.IdResponsable}" ${editData?.IdResponsable == p.IdResponsable ? 'selected' : ''}>${p.Apellidos}, ${p.Nombres}</option>
                `).join('');
                formContent = `
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="user-nombre">Nombre de Usuario *</label>
                            <input type="text" id="user-nombre" name="nombreUsuario" value="${editData?.NombreUsuario || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="user-password">${isEdit ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}</label>
                            <input type="password" id="user-password" name="password" ${isEdit ? '' : 'required'} minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="user-rol">Rol *</label>
                            <select id="user-rol" name="idRol" required>
                                <option value="">Seleccione...</option>
                                ${rolesOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="user-responsable">Responsable Asociado</label>
                            <select id="user-responsable" name="idResponsable">
                                <option value="">Sin vincular</option>
                                ${responsablesOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="user-estado">Estado</label>
                            <select id="user-estado" name="estado">
                                <option value="true" ${editData?.Estado !== false ? 'selected' : ''}>Activo</option>
                                <option value="false" ${editData?.Estado === false ? 'selected' : ''}>Inactivo</option>
                            </select>
                        </div>
                    </div>
                `;
                break;

            case 'rol':
                title = isEdit ? 'Editar Rol' : 'Nuevo Rol';
                formContent = `
                    <div class="form-group">
                        <label for="user-nombreRol">Nombre del Rol *</label>
                        <input type="text" id="user-nombreRol" name="nombreRol" value="${editData?.nombreRol || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="user-descripcion">Descripción</label>
                        <textarea id="user-descripcion" name="descripcion" rows="2">${editData?.descripcion || ''}</textarea>
                    </div>
                `;
                break;

            default:
                return;
        }

        const modalHTML = `
            <div class="modal-overlay" id="user-modal">
                <div class="modal-container modal-medium">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <form id="user-form" class="modal-body">
                        <input type="hidden" id="user-type" value="${type}">
                        <input type="hidden" id="user-id" value="${editData?.id || ''}">
                        ${formContent}
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancelar</button>
                            <button type="submit" class="btn btn-primary">💾 Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('modal-container').innerHTML = modalHTML;

        // Configurar evento de envío
        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUserItem();
        });
    }

    async editUserItem(type, id, ...args) {
        try {
            let editData = { id };

            switch (type) {
                case 'usuario':
                    const usuario = await api.getUsuario(id);
                    editData = {
                        id,
                        NombreUsuario: usuario.NombreUsuario,
                        IdRol: usuario.IdRol,
                        IdResponsable: usuario.IdResponsable,
                        Estado: usuario.Estado
                    };
                    break;
                case 'rol':
                    editData.nombreRol = args[0];
                    editData.descripcion = args[1] || '';
                    break;
            }

            this.showUserForm(type, editData);
        } catch (error) {
            showToast(error.message || 'Error al cargar datos', 'error');
        }
    }

    async deleteUserItem(type, id) {
        const typeNames = {
            usuario: 'usuario',
            rol: 'rol'
        };

        if (!confirm(`¿Está seguro de eliminar este ${typeNames[type]}?`)) return;

        try {
            switch (type) {
                case 'usuario':
                    await api.deleteUsuario(id);
                    break;
                case 'rol':
                    await api.deleteRol(id);
                    break;
            }

            showToast(`${typeNames[type].charAt(0).toUpperCase() + typeNames[type].slice(1)} eliminado exitosamente`, 'success');
            await this.loadView('usuarios');
        } catch (error) {
            showToast(error.message || 'Error al eliminar', 'error');
        }
    }

    async saveUserItem() {
        const type = document.getElementById('user-type').value;
        const id = document.getElementById('user-id').value;
        const isEdit = id !== '';

        try {
            let result;

            switch (type) {
                case 'usuario': {
                    const data = {
                        nombreUsuario: document.getElementById('user-nombre').value,
                        password: document.getElementById('user-password').value || null,
                        idRol: parseInt(document.getElementById('user-rol').value),
                        idResponsable: document.getElementById('user-responsable').value || null,
                        estado: document.getElementById('user-estado').value === 'true'
                    };
                    if (isEdit) {
                        result = await api.updateUsuario(id, data);
                    } else {
                        result = await api.createUsuario(data);
                    }
                    break;
                }
                case 'rol': {
                    const nombreRol = document.getElementById('user-nombreRol').value;
                    const descripcion = document.getElementById('user-descripcion').value;
                    if (isEdit) {
                        result = await api.updateRol(id, nombreRol, descripcion);
                    } else {
                        result = await api.createRol(nombreRol, descripcion);
                    }
                    break;
                }
            }

            showToast(isEdit ? 'Actualizado exitosamente' : 'Creado exitosamente', 'success');
            this.closeModal();
            await this.loadView('usuarios');

        } catch (error) {
            showToast(error.message || 'Error al guardar', 'error');
        }
    }
}

// Inicializar aplicación
const app = new App();

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
