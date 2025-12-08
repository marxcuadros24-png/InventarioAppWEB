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

            // Obtener la fecha actual formateada
            const today = new Date();
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = today.toLocaleDateString('es-PE', dateOptions);

            // Calcular estadísticas adicionales
            const operativos = stats.porEstado.find(e => e.estado === 'Operativo')?.cantidad || 0;
            const enMantenimiento = stats.porEstado.find(e => e.estado === 'Mantenimiento')?.cantidad || 0;
            const enBaja = stats.porEstado.find(e => e.estado === 'Baja')?.cantidad || 0;

            const dashboardHTML = `
                <!-- Quick Stats -->
                <div class="quick-stats">
                    <div class="quick-stat">
                        <img src="/assets/icon-package.png" alt="Total Bienes" class="quick-stat-icon-img">
                        <div class="quick-stat-value">${stats.totalBienes}</div>
                        <div class="quick-stat-label">Total Bienes</div>
                    </div>
                    <div class="quick-stat">
                        <img src="/assets/icon-money.png" alt="Valor Total" class="quick-stat-icon-img">
                        <div class="quick-stat-value">${formatCurrency(stats.valorTotal)}</div>
                        <div class="quick-stat-label">Valor Total</div>
                    </div>
                    <div class="quick-stat">
                        <img src="/assets/icon-check.png" alt="Operativos" class="quick-stat-icon-img">
                        <div class="quick-stat-value">${operativos}</div>
                        <div class="quick-stat-label">Operativos</div>
                    </div>
                    <div class="quick-stat">
                        <img src="/assets/icon-wrench.png" alt="Mantenimiento" class="quick-stat-icon-img">
                        <div class="quick-stat-value">${enMantenimiento}</div>
                        <div class="quick-stat-label">Mantenimiento</div>
                    </div>
                </div>

                <!-- Charts Grid -->
                <div class="charts-grid">
                    <!-- Estado Chart - Doughnut -->
                    <div class="chart-card chart-animated">
                        <div class="chart-header">
                            <h3><img src="/assets/icon-chart.png" alt="" class="chart-header-icon"> Distribución por Estado</h3>
                            <span class="chart-badge">${stats.porEstado.length} estados</span>
                        </div>
                        <div class="chart-container chart-pie">
                            <canvas id="estadoChart"></canvas>
                        </div>
                    </div>

                    <!-- Áreas Chart - Horizontal Bar -->
                    <div class="chart-card chart-animated">
                        <div class="chart-header">
                            <h3><img src="/assets/icon-building.png" alt="" class="chart-header-icon"> Top 5 Áreas</h3>
                            <span class="chart-badge">${stats.porArea.length} áreas</span>
                        </div>
                        <div class="chart-container chart-bar">
                            <canvas id="areaChart"></canvas>
                        </div>
                    </div>
                </div>
            `;

            // Render HTML first
            setTimeout(() => {
                // Initialize Charts after DOM is ready
                initDashboardCharts(stats);
            }, 100);

            return dashboardHTML;
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
                        <h2 class="card-title">Gestión de Bienes</h2>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-secondary" id="export-selected-btn" onclick="app.exportSelectedQRs()" style="display: none;">
                                Exportar QRs
                            </button>
                            <button class="btn btn-primary" onclick="app.showBienForm()">
                                + Nuevo Bien
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
                                            <button class="btn btn-sm btn-secondary" onclick="app.viewBien(${bien.IdBien})">Ver</button>
                                            <button class="btn btn-sm btn-secondary" onclick="app.editBien(${bien.IdBien})">Editar</button>
                                            <button class="btn btn-sm btn-danger" onclick="app.deleteBien(${bien.IdBien})">Eliminar</button>
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
            const [movimientos, catalogos] = await Promise.all([
                syncManager.hybridOperation(
                    'movimientos',
                    () => api.getMovimientos(),
                    () => localDB.getAll('movimientos')
                ),
                api.getCatalogos()
            ]);

            const tiposMovimiento = catalogos.tiposMovimiento || [];

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
                                <tr data-tipo="${mov.IdTipoMovimiento}" data-fecha="${mov.FechaMovimiento}">
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
                            <span class="badge badge-count" id="movimientos-count">${movimientos.length} registro${movimientos.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-secondary" onclick="app.generarReporteMovimientos()">
                                Generar Reporte
                            </button>
                            <button class="btn btn-primary" onclick="app.showMovimientoForm()">
                                + Registrar Movimiento
                            </button>
                        </div>
                    </div>

                    ${movimientos.length > 0 ? `
                    <div class="filters-container">
                        <div class="filter-group">
                            <label for="filter-tipo">Tipo:</label>
                            <select id="filter-tipo" onchange="app.filterMovimientos()">
                                <option value="">Todos los tipos</option>
                                ${tiposMovimiento.map(tipo => `
                                    <option value="${tipo.IdTipoMovimiento}">${tipo.NombreMovimiento}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-fecha-desde">Desde:</label>
                            <input type="date" id="filter-fecha-desde" onchange="app.filterMovimientos()">
                        </div>
                        <div class="filter-group">
                            <label for="filter-fecha-hasta">Hasta:</label>
                            <input type="date" id="filter-fecha-hasta" onchange="app.filterMovimientos()">
                        </div>
                        <div class="filter-group">
                            <label for="search-movimientos">Buscar:</label>
                            <input type="text" id="search-movimientos" 
                                   placeholder="Código, bien, usuario..." 
                                   oninput="app.filterMovimientos()">
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="app.limpiarFiltrosMovimientos()">
                            Limpiar filtros
                        </button>
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

            // Obtener valores únicos para los filtros
            const tablas = [...new Set(auditoria.map(a => a.Tabla))].filter(Boolean).sort();
            const usuarios = [...new Set(auditoria.map(a => a.Usuario))].filter(Boolean).sort();
            const acciones = [...new Set(auditoria.map(a => a.Accion))].filter(Boolean).sort();

            const emptyState = auditoria.length === 0 ? `
                <div class="empty-state">
                    <h3>No hay registros de auditoría</h3>
                    <p>Los registros de auditoría se generan automáticamente con las acciones del sistema</p>
                </div>
            ` : '';

            const tableContent = auditoria.length > 0 ? `
                <div class="table-container">
                    <table id="auditoria-table">
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
                                <tr data-tabla="${aud.Tabla || ''}" data-usuario="${aud.Usuario || ''}" data-accion="${aud.Accion || ''}" data-fecha="${aud.Fecha}">
                                    <td>${formatDate(aud.Fecha)}</td>
                                    <td><span class="badge badge-info">${aud.Tabla || '-'}</span></td>
                                    <td><span class="badge badge-${aud.Accion === 'INSERT' ? 'success' : aud.Accion === 'DELETE' ? 'danger' : 'warning'}">${aud.Accion || '-'}</span></td>
                                    <td>${aud.Usuario || '-'}</td>
                                    <td>${aud.Descripcion || '-'}</td>
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
                            <h2 class="card-title">Auditoría del Sistema</h2>
                            <span class="badge badge-count" id="auditoria-count">${auditoria.length} registro${auditoria.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-secondary" onclick="app.generarReporteAuditoria()">
                                Generar Reporte
                            </button>
                        </div>
                    </div>

                    ${auditoria.length > 0 ? `
                    <div class="filters-container">
                        <div class="filter-group">
                            <label for="filter-tabla">Tabla:</label>
                            <select id="filter-tabla" onchange="app.filterAuditoria()">
                                <option value="">Todas las tablas</option>
                                ${tablas.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-accion">Acción:</label>
                            <select id="filter-accion" onchange="app.filterAuditoria()">
                                <option value="">Todas las acciones</option>
                                ${acciones.map(a => `<option value="${a}">${a}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-usuario-aud">Usuario:</label>
                            <select id="filter-usuario-aud" onchange="app.filterAuditoria()">
                                <option value="">Todos los usuarios</option>
                                ${usuarios.map(u => `<option value="${u}">${u}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-fecha-desde-aud">Desde:</label>
                            <input type="date" id="filter-fecha-desde-aud" onchange="app.filterAuditoria()">
                        </div>
                        <div class="filter-group">
                            <label for="filter-fecha-hasta-aud">Hasta:</label>
                            <input type="date" id="filter-fecha-hasta-aud" onchange="app.filterAuditoria()">
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="app.limpiarFiltrosAuditoria()">
                            Limpiar filtros
                        </button>
                    </div>
                    ` : ''}

                    ${emptyState}
                    ${tableContent}
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar auditoría:', error);
            return '<div class="card"><p>Error al cargar auditoría. Requiere conexión online.</p></div>';
        }
    },

    // Reportes
    reportes: async () => {
        try {
            // Obtener todos los datos necesarios
            const [bienes, responsables, movimientos, catalogos] = await Promise.all([
                api.getBienes(),
                api.getResponsables(),
                api.getMovimientos(),
                api.getCatalogos()
            ]);

            // Guardar datos para uso en los métodos de reporte
            app.reportesData = { bienes, responsables, movimientos, catalogos };

            const tiposBien = catalogos.tipoBien || [];
            const estados = catalogos.estados || [];
            const areas = catalogos.areas || [];

            return `
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Centro de Reportes</h2>
                    </div>

                    <!-- Filtros Globales -->
                    <div class="filters-container">
                        <div class="filter-group">
                            <label for="report-mes">Mes:</label>
                            <input type="month" id="report-mes">
                        </div>
                        <div class="filter-group">
                            <label for="report-tipo-bien">Tipo de Bien:</label>
                            <select id="report-tipo-bien">
                                <option value="">Todos los tipos</option>
                                ${tiposBien.map(t => `<option value="${t.IdTipoBien}">${t.NombreTipo}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="report-estado">Estado:</label>
                            <select id="report-estado">
                                <option value="">Todos los estados</option>
                                ${estados.map(e => `<option value="${e.IdEstado}">${e.NombreEstado}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="report-responsable">Responsable:</label>
                            <select id="report-responsable">
                                <option value="">Todos los responsables</option>
                                ${responsables.map(r => `<option value="${r.IdResponsable}">${r.Nombres} ${r.Apellidos}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="report-area">Área:</label>
                            <select id="report-area">
                                <option value="">Todas las áreas</option>
                                ${areas.map(a => `<option value="${a.IdArea}">${a.Nombre}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="reports-grid">
                        <div class="report-card" onclick="app.generarReporteBienesConFiltros()">
                            <div class="report-icon">📦</div>
                            <h3>Inventario de Bienes</h3>
                            <p>Listado de bienes según los filtros seleccionados</p>
                            <span class="badge badge-count">${bienes.length} bienes</span>
                        </div>

                        <div class="report-card" onclick="app.generarReporteBienesPorResponsable()">
                            <div class="report-icon">👤</div>
                            <h3>Bienes por Responsable</h3>
                            <p>Qué bienes tiene a cargo cada responsable</p>
                        </div>

                        <div class="report-card" onclick="app.generarReporteBienesPorTipo()">
                            <div class="report-icon">📂</div>
                            <h3>Bienes por Tipo</h3>
                            <p>Agrupados por tipo de bien (muebles, equipos, etc.)</p>
                        </div>

                        <div class="report-card" onclick="app.generarReporteBienesPorEstado()">
                            <div class="report-icon">📊</div>
                            <h3>Bienes por Estado</h3>
                            <p>Agrupados por estado (Bueno, Regular, Malo)</p>
                        </div>

                        <div class="report-card" onclick="app.generarReporteBienesPorArea()">
                            <div class="report-icon">🏢</div>
                            <h3>Bienes por Área</h3>
                            <p>Distribución por departamento/área</p>
                        </div>

                        <div class="report-card" onclick="app.generarReporteMovimientosMes()">
                            <div class="report-icon">📅</div>
                            <h3>Movimientos del Mes</h3>
                            <p>Movimientos registrados en el mes seleccionado</p>
                        </div>

                        <div class="report-card" onclick="app.generarReporteResponsables()">
                            <div class="report-icon">👥</div>
                            <h3>Listado de Responsables</h3>
                            <p>Todos los responsables con datos de contacto</p>
                            <span class="badge badge-count">${responsables.length} responsables</span>
                        </div>

                        <div class="report-card" onclick="app.loadView('auditoria')">
                            <div class="report-icon">📋</div>
                            <h3>Auditoría del Sistema</h3>
                            <p>Registro de acciones con filtros avanzados</p>
                        </div>
                    </div>

                    <!-- Excel Export Section -->
                    <div class="card-header mt-1" style="margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                        <h2 class="card-title">📊 Exportar a Excel</h2>
                    </div>
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">Descarga los datos en formato Excel (.xlsx) para análisis offline</p>
                    
                    <div class="reports-grid">
                        <div class="report-card export-card" onclick="exportBienesToExcel()">
                            <div class="report-icon">📦</div>
                            <h3>Exportar Bienes</h3>
                            <p>Todos los bienes con información completa</p>
                            <span class="badge badge-success">Excel</span>
                        </div>

                        <div class="report-card export-card" onclick="exportMovimientosToExcel()">
                            <div class="report-icon">🔄</div>
                            <h3>Exportar Movimientos</h3>
                            <p>Historial de transferencias y cambios</p>
                            <span class="badge badge-success">Excel</span>
                        </div>

                        <div class="report-card export-card" onclick="exportResponsablesToExcel()">
                            <div class="report-icon">👥</div>
                            <h3>Exportar Responsables</h3>
                            <p>Lista de responsables con datos de contacto</p>
                            <span class="badge badge-success">Excel</span>
                        </div>

                        <div class="report-card export-card" onclick="exportReporteCompletoExcel()" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1));">
                            <div class="report-icon">📈</div>
                            <h3>Reporte Completo</h3>
                            <p>Resumen + Bienes + Estados + Áreas (Múltiples hojas)</p>
                            <span class="badge badge-primary">Completo</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            return '<div class="card"><p>Error al cargar reportes</p></div>';
        }
    },

    // Catálogos
    catalogos: async () => {
        try {
            const catalogos = await api.getCatalogos();

            return `
                <div class="card catalogos-container">
                    <div class="card-header">
                        <h2 class="card-title">Gestión de Catálogos</h2>
                    </div>
                    
                    <!-- Tabs de navegación -->
                    <div class="catalog-tabs">
                        <button class="catalog-tab active" data-catalog="marcas" onclick="app.switchCatalogTab('marcas')">
                            Marcas
                        </button>
                        <button class="catalog-tab" data-catalog="estados" onclick="app.switchCatalogTab('estados')">
                            Estados
                        </button>
                        <button class="catalog-tab" data-catalog="tiposBien" onclick="app.switchCatalogTab('tiposBien')">
                            Tipos de Bien
                        </button>
                        <button class="catalog-tab" data-catalog="categorias" onclick="app.switchCatalogTab('categorias')">
                            Categorías
                        </button>
                        <button class="catalog-tab" data-catalog="areas" onclick="app.switchCatalogTab('areas')">
                            Áreas
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
                            <h3>Marcas</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('marca')">
                                + Nueva Marca
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
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('marca', ${item.IdMarca}, '${item.Nombre.replace(/'/g, "\\'")}')">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('marca', ${item.IdMarca})">Eliminar</button>
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
                            <h3>Estados</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('estado')">
                                + Nuevo Estado
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
                                    ${catalogos.estados.map(item => `
                                        <tr>
                                            <td>${item.IdEstado}</td>
                                            <td><strong>${item.Nombre}</strong></td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('estado', ${item.IdEstado}, '${item.Nombre.replace(/'/g, "\\'")}')">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('estado', ${item.IdEstado})">Eliminar</button>
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
                            <h3>Tipos de Bien</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('tipoBien')">
                                + Nuevo Tipo
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
                                    ${catalogos.tipoBien.map(item => `
                                        <tr>
                                            <td>${item.IdTipoBien}</td>
                                            <td><strong>${item.Nombre}</strong></td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('tipoBien', ${item.IdTipoBien}, '${item.Nombre.replace(/'/g, "\\'")}')">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('tipoBien', ${item.IdTipoBien})">Eliminar</button>
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
                            <h3>Categorías</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('categoria')">
                                + Nueva Categoría
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
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('categoria', ${item.IdCategoria}, '${item.Nombre.replace(/'/g, "\\'")}', ${item.IdTipoBien})">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('categoria', ${item.IdCategoria})">Eliminar</button>
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
                            <h3>Áreas</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('area')">
                                + Nueva Área
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
                                    ${catalogos.areas.map(item => `
                                        <tr>
                                            <td>${item.IdArea}</td>
                                            <td><strong>${item.Nombre}</strong></td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('area', ${item.IdArea}, '${item.Nombre.replace(/'/g, "\\'")}')">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('area', ${item.IdArea})">Eliminar</button>
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
                            <h3>Métodos de Adquisición</h3>
                            <button class="btn btn-primary btn-sm" onclick="app.showCatalogForm('metodo')">
                                + Nuevo Método
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
                                    ${catalogos.metodosAdquisicion.map(item => `
                                        <tr>
                                            <td>${item.IdMetodo}</td>
                                            <td><strong>${item.NombreMetodo}</strong></td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('metodo', ${item.IdMetodo}, '${item.NombreMetodo.replace(/'/g, "\\'")}')">Editar</button>
                                                <button class="btn btn-sm btn-danger" onclick="app.deleteCatalogItem('metodo', ${item.IdMetodo})">Eliminar</button>
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
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(catalogos.tiposMovimiento || []).map(item => `
                                        <tr>
                                            <td>${item.IdTipoMovimiento}</td>
                                            <td><strong>${item.NombreMovimiento}</strong></td>
                                            <td>
                                                <button class="btn btn-sm btn-secondary" onclick="app.editCatalogItem('tipoMovimiento', ${item.IdTipoMovimiento}, '${item.NombreMovimiento.replace(/'/g, "\\'")}')">Editar</button>
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

        // Aplicar permisos al menú lateral
        this.aplicarPermisosMenu();

        // Sincronizar datos iniciales
        await syncManager.syncFromServer();

        // Cargar vista inicial
        await this.loadView('dashboard');

        // Setup event listeners
        this.setupEventListeners();
    }

    // Aplicar permisos al menú lateral (ocultar opciones según rol)
    aplicarPermisosMenu() {
        permisos.init();

        // Mapeo de vistas a elementos del menú
        const menuModulos = ['catalogos', 'usuarios', 'auditoria'];

        menuModulos.forEach(modulo => {
            const menuItem = document.querySelector(`.nav-item[data-view="${modulo}"]`);
            if (menuItem) {
                if (puedeVer(modulo)) {
                    menuItem.style.display = '';
                } else {
                    menuItem.style.display = 'none';
                }
            }
        });

        console.log(`🔐 Menú configurado para rol: ${getRolActual()}`);
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
        // Verificar si el usuario puede ver esta vista
        if (!puedeVer(viewName)) {
            showToast('No tiene permisos para acceder a esta sección', 'error');
            // Redirigir al dashboard si no tiene permiso
            if (viewName !== 'dashboard') {
                this.loadView('dashboard');
            }
            return;
        }

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
            reportes: 'Centro de Reportes',
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

            // Aplicar permisos a los botones después de cargar el contenido
            this.aplicarPermisosVista(viewName);
        } catch (error) {
            console.error('Error al cargar vista:', error);
            content.innerHTML = '<div class="card"><p>Error al cargar la vista</p></div>';
        }
    }

    // Aplicar permisos específicos a la vista actual
    aplicarPermisosVista(viewName) {
        const modulo = viewName;

        // Ocultar botones de crear si no tiene permiso
        if (!puedeCrear(modulo)) {
            document.querySelectorAll('.btn-nuevo, [onclick*="showBienForm()"], [onclick*="showResponsableForm()"]').forEach(btn => {
                btn.style.display = 'none';
            });
        }

        // Ocultar botones de editar si no tiene permiso
        if (!puedeEditar(modulo)) {
            document.querySelectorAll('.btn-editar, [onclick*="editBien"], [onclick*="editResponsable"], [onclick*="editCatalogItem"]').forEach(btn => {
                btn.style.display = 'none';
            });
        }

        // Ocultar botones de eliminar si no tiene permiso
        if (!puedeEliminar(modulo)) {
            document.querySelectorAll('.btn-eliminar, .btn-danger, [onclick*="deleteBien"], [onclick*="deleteResponsable"], [onclick*="deleteCatalogItem"]').forEach(btn => {
                // Solo ocultar si es un botón de eliminar, no todos los btn-danger
                if (btn.textContent.toLowerCase().includes('eliminar') ||
                    btn.onclick?.toString().includes('delete')) {
                    btn.style.display = 'none';
                }
            });
        }

        // Mostrar indicador de rol en el header
        this.mostrarIndicadorRol();
    }

    // Mostrar el rol actual en la interfaz
    mostrarIndicadorRol() {
        const rol = getRolActual();
        const indicator = document.getElementById('rol-indicator');

        if (!indicator) {
            const headerRight = document.querySelector('.header-right');
            if (headerRight) {
                const rolBadge = document.createElement('span');
                rolBadge.id = 'rol-indicator';
                rolBadge.className = 'rol-badge';
                rolBadge.innerHTML = `<i class="icon">👤</i> ${rol}`;
                headerRight.insertBefore(rolBadge, headerRight.firstChild);
            }
        } else {
            indicator.innerHTML = `<i class="icon">👤</i> ${rol}`;
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

    // Cargar catálogos en formulario de bienes
    async loadFormCatalogos() {
        try {
            // Obtener catálogos y responsables
            const [catalogos, responsables] = await Promise.all([
                this.catalogos || api.getCatalogos(),
                api.getResponsables()
            ]);

            // Obtener datos del bien si estamos editando
            const bienData = this.currentBienData;

            // Llenar Tipos de Bien
            const tiposBien = catalogos.tipoBien || [];
            const selectTipoBien = document.getElementById('idTipoBien');
            if (selectTipoBien) {
                tiposBien.forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo.IdTipoBien;
                    option.textContent = tipo.Nombre;
                    if (bienData && bienData.IdTipoBien == tipo.IdTipoBien) {
                        option.selected = true;
                    }
                    selectTipoBien.appendChild(option);
                });
            }

            // Llenar Marcas
            const marcas = catalogos.marcas || [];
            const selectMarca = document.getElementById('idMarca');
            if (selectMarca) {
                marcas.forEach(marca => {
                    const option = document.createElement('option');
                    option.value = marca.IdMarca;
                    option.textContent = marca.Nombre;
                    if (bienData && bienData.IdMarca == marca.IdMarca) {
                        option.selected = true;
                    }
                    selectMarca.appendChild(option);
                });
            }

            // Llenar Estados
            const estados = catalogos.estados || [];
            const selectEstado = document.getElementById('idEstado');
            if (selectEstado) {
                estados.forEach(estado => {
                    const option = document.createElement('option');
                    option.value = estado.IdEstado;
                    option.textContent = estado.Nombre;
                    if (bienData && bienData.IdEstado == estado.IdEstado) {
                        option.selected = true;
                    }
                    selectEstado.appendChild(option);
                });
            }

            // Llenar Áreas
            const areas = catalogos.areas || [];
            const selectArea = document.getElementById('idArea');
            if (selectArea) {
                areas.forEach(area => {
                    const option = document.createElement('option');
                    option.value = area.IdArea;
                    option.textContent = area.Nombre;
                    if (bienData && bienData.IdArea == area.IdArea) {
                        option.selected = true;
                    }
                    selectArea.appendChild(option);
                });
            }

            // Llenar Responsables
            const selectResponsable = document.getElementById('idResponsable');
            if (selectResponsable) {
                responsables.forEach(resp => {
                    const option = document.createElement('option');
                    option.value = resp.IdResponsable;
                    option.textContent = resp.NombreCompleto || `${resp.Nombres} ${resp.Apellidos}`;
                    if (bienData && bienData.IdResponsable == resp.IdResponsable) {
                        option.selected = true;
                    }
                    selectResponsable.appendChild(option);
                });
            }

            // Llenar Métodos de Adquisición
            const metodos = catalogos.metodosAdquisicion || [];
            const selectMetodo = document.getElementById('idMetodo');
            if (selectMetodo) {
                metodos.forEach(metodo => {
                    const option = document.createElement('option');
                    option.value = metodo.IdMetodo;
                    option.textContent = metodo.NombreMetodo || metodo.Nombre;
                    if (bienData && bienData.IdMetodo == metodo.IdMetodo) {
                        option.selected = true;
                    }
                    selectMetodo.appendChild(option);
                });
            }

            // Guardar categorías para filtrar después
            this.categorias = catalogos.categorias || [];

            // Si es edición, cargar las categorías del tipo seleccionado
            if (bienData && bienData.IdTipoBien) {
                this.filterCategoriasByTipo(bienData.IdTipoBien, bienData.IdCategoria);
            }

            // Cargar otros campos si es edición
            if (bienData) {
                // Fecha de adquisición
                const fechaInput = document.getElementById('fechaAdquisicion');
                if (fechaInput && bienData.FechaAdquisicion) {
                    fechaInput.value = bienData.FechaAdquisicion.split('T')[0];
                }

                // Costo
                const costoInput = document.getElementById('costo');
                if (costoInput && bienData.Costo) {
                    costoInput.value = bienData.Costo;
                }

                // Proveedor
                const proveedorInput = document.getElementById('proveedor');
                if (proveedorInput && bienData.Proveedor) {
                    proveedorInput.value = bienData.Proveedor;
                }

                // Campos técnicos opcionales
                if (bienData.Procesador) document.getElementById('procesador').value = bienData.Procesador;
                if (bienData.Memoria) document.getElementById('memoria').value = bienData.Memoria;
                if (bienData.Almacenamiento) document.getElementById('almacenamiento').value = bienData.Almacenamiento;
                if (bienData.Pantalla) document.getElementById('pantalla').value = bienData.Pantalla;
                if (bienData.Otros) document.getElementById('otros').value = bienData.Otros;
                if (bienData.Observacion) document.getElementById('observacion').value = bienData.Observacion;
            }

        } catch (error) {
            console.error('Error al cargar catálogos del formulario:', error);
            showToast('Error al cargar opciones del formulario', 'error');
        }
    }

    // Filtrar categorías por tipo de bien
    filterCategoriasByTipo(idTipoBien, selectedCategoriaId = null) {
        const selectCategoria = document.getElementById('idCategoria');
        if (!selectCategoria) return;

        selectCategoria.innerHTML = '<option value="">Seleccione...</option>';

        if (!idTipoBien || !this.categorias) return;

        const categoriasFiltradas = this.categorias.filter(
            cat => cat.IdTipoBien == idTipoBien
        );

        categoriasFiltradas.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.IdCategoria;
            option.textContent = cat.Nombre;
            if (selectedCategoriaId && cat.IdCategoria == selectedCategoriaId) {
                option.selected = true;
            }
            selectCategoria.appendChild(option);
        });
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
            // Buscar el código más alto del año actual
            const codigosDelAno = bienes
                .map(b => b.CodigoPatrimonial)
                .filter(c => c && c.startsWith(`BIEN-${year}-`))
                .map(c => parseInt(c.split('-')[2]) || 0);
            const maxCodigo = codigosDelAno.length > 0 ? Math.max(...codigosDelAno) : 0;
            codigoPatrimonial = `BIEN-${year}-${String(maxCodigo + 1).padStart(4, '0')}`;
        }

        // Cargar datos del bien si es edición
        let bienData = null;
        if (isEdit) {
            bienData = await api.getBien(idBien);
            codigoPatrimonial = bienData.CodigoPatrimonial;
        }

        // Guardar datos del bien para cargar después los selects
        this.currentBienData = bienData;
        this.currentBienId = idBien;

        const modalHTML = `
            <div class="modal-overlay" id="bien-modal" data-id-bien="${idBien || ''}">
                <div class="modal-container modal-large">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" onclick="app.closeModal()">&times;</button>
                    </div>
                    <form id="bien-form" class="modal-body">
                        <input type="hidden" id="idBien" name="idBien" value="${idBien || ''}">
                        <!-- Datos Básicos -->
                        <div class="form-section">
                            <h3 class="form-section-title">Datos Básicos</h3>
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
                            <h3 class="form-section-title">Datos de Adquisición</h3>
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
                            <h3 class="form-section-title">Especificaciones Técnicas (Opcional)</h3>
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
                            <button type="submit" class="btn btn-primary">Guardar Bien</button>
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

    // Enviar formulario de bien
    async submitBienForm() {
        try {
            const form = document.getElementById('bien-form');
            const formData = new FormData(form);

            // Obtener el ID si es edición
            const idBien = document.getElementById('bien-modal')?.dataset?.idBien;
            const isEdit = idBien && idBien !== '';

            // Construir objeto de datos
            const data = {
                codigoPatrimonial: formData.get('codigoPatrimonial'),
                nombre: formData.get('nombre'),
                idTipoBien: parseInt(formData.get('idTipoBien')) || null,
                idCategoria: parseInt(formData.get('idCategoria')) || null,
                idMarca: parseInt(formData.get('idMarca')) || null,
                modelo: formData.get('modelo') || null,
                idEstado: parseInt(formData.get('idEstado')) || null,
                idArea: parseInt(formData.get('idArea')) || null,
                idResponsable: parseInt(formData.get('idResponsable')) || null,
                fechaAdquisicion: formData.get('fechaAdquisicion'),
                costo: parseFloat(formData.get('costo')) || 0,
                proveedor: formData.get('proveedor') || null,
                idMetodo: parseInt(formData.get('idMetodo')) || null,
                procesador: formData.get('procesador') || null,
                memoria: formData.get('memoria') || null,
                almacenamiento: formData.get('almacenamiento') || null,
                pantalla: formData.get('pantalla') || null,
                otros: formData.get('otros') || null,
                observacion: formData.get('observacion') || null
            };

            // Validar datos requeridos
            if (!data.nombre || !data.idTipoBien || !data.idCategoria || !data.idEstado || !data.idArea) {
                showToast('Complete todos los campos requeridos', 'error');
                return;
            }

            showToast('Guardando...', 'info');

            if (isEdit) {
                await api.updateBien(parseInt(idBien), data);
                showToast('Bien actualizado correctamente', 'success');
            } else {
                await api.createBien(data);
                showToast('Bien creado correctamente', 'success');
            }

            this.closeModal();
            this.loadView('bienes');

        } catch (error) {
            console.error('Error al guardar bien:', error);
            showToast('Error al guardar: ' + error.message, 'error');
        }
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
            const usuario = JSON.parse(sessionStorage.getItem('usuario'));

            // Validar usuario logueado (el backend usa 'idUsuario' en camelCase)
            if (!usuario || !usuario.idUsuario) {
                showToast('Debe iniciar sesión para registrar movimientos', 'error');
                return;
            }

            const data = {
                idBien: parseInt(formData.get('idBien')),
                idTipoMovimiento: parseInt(formData.get('idTipoMovimiento')),
                descripcion: formData.get('descripcion')?.trim() || null,
                idUsuario: usuario.idUsuario
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

            // Pequeño delay para asegurar que el servidor procesó el movimiento
            await new Promise(resolve => setTimeout(resolve, 300));

            // Forzar recarga de la vista
            await this.loadView('movimientos');

        } catch (error) {
            console.error('Error al registrar movimiento:', error);
            showToast('Error al registrar movimiento: ' + error.message, 'error');
        }
    }

    filterMovimientos() {
        const tipoFilter = document.getElementById('filter-tipo')?.value || '';
        const fechaDesde = document.getElementById('filter-fecha-desde')?.value || '';
        const fechaHasta = document.getElementById('filter-fecha-hasta')?.value || '';
        const searchTerm = document.getElementById('search-movimientos')?.value?.toLowerCase() || '';

        const rows = document.querySelectorAll('#movimientos-table tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const tipo = row.dataset.tipo;
            const fecha = row.dataset.fecha ? new Date(row.dataset.fecha) : null;
            const text = row.textContent.toLowerCase();

            let show = true;

            // Filtrar por tipo
            if (tipoFilter && tipo !== tipoFilter) {
                show = false;
            }

            // Filtrar por fecha desde
            if (show && fechaDesde && fecha) {
                const desde = new Date(fechaDesde);
                if (fecha < desde) show = false;
            }

            // Filtrar por fecha hasta
            if (show && fechaHasta && fecha) {
                const hasta = new Date(fechaHasta);
                hasta.setHours(23, 59, 59, 999);
                if (fecha > hasta) show = false;
            }

            // Filtrar por texto
            if (show && searchTerm && !text.includes(searchTerm)) {
                show = false;
            }

            row.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        // Actualizar contador
        const countElement = document.getElementById('movimientos-count');
        if (countElement) {
            countElement.textContent = `${visibleCount} registro${visibleCount !== 1 ? 's' : ''}`;
        }
    }

    limpiarFiltrosMovimientos() {
        const tipoFilter = document.getElementById('filter-tipo');
        const fechaDesde = document.getElementById('filter-fecha-desde');
        const fechaHasta = document.getElementById('filter-fecha-hasta');
        const searchInput = document.getElementById('search-movimientos');

        if (tipoFilter) tipoFilter.value = '';
        if (fechaDesde) fechaDesde.value = '';
        if (fechaHasta) fechaHasta.value = '';
        if (searchInput) searchInput.value = '';

        this.filterMovimientos();
    }

    generarReporteMovimientos() {
        const rows = document.querySelectorAll('#movimientos-table tbody tr');
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');

        if (visibleRows.length === 0) {
            showToast('No hay movimientos para generar el reporte', 'warning');
            return;
        }

        // Obtener filtros aplicados
        const tipoFilter = document.getElementById('filter-tipo');
        const fechaDesde = document.getElementById('filter-fecha-desde')?.value || '';
        const fechaHasta = document.getElementById('filter-fecha-hasta')?.value || '';
        const tipoNombre = tipoFilter?.options[tipoFilter.selectedIndex]?.text || 'Todos';

        // Crear contenido del reporte
        let reportContent = `
            <html>
            <head>
                <title>Reporte de Movimientos</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #1a1a2e; text-align: center; }
                    .info { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                    .info p { margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #4361ee; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Reporte de Movimientos</h1>
                <div class="info">
                    <p><strong>Fecha de generación:</strong> ${new Date().toLocaleString('es-PE')}</p>
                    <p><strong>Tipo de movimiento:</strong> ${tipoNombre}</p>
                    ${fechaDesde ? `<p><strong>Desde:</strong> ${fechaDesde}</p>` : ''}
                    ${fechaHasta ? `<p><strong>Hasta:</strong> ${fechaHasta}</p>` : ''}
                    <p><strong>Total de registros:</strong> ${visibleRows.length}</p>
                </div>
                <table>
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
        `;

        visibleRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            reportContent += '<tr>';
            cells.forEach(cell => {
                reportContent += `<td>${cell.textContent}</td>`;
            });
            reportContent += '</tr>';
        });

        reportContent += `
                    </tbody>
                </table>
                <div class="footer">
                    <p>Sistema de Inventario Institucional</p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;

        // Abrir ventana de impresión
        const printWindow = window.open('', '_blank');
        printWindow.document.write(reportContent);
        printWindow.document.close();
    }

    // === AUDITORÍA ===
    filterAuditoria() {
        const tablaFilter = document.getElementById('filter-tabla')?.value || '';
        const accionFilter = document.getElementById('filter-accion')?.value || '';
        const usuarioFilter = document.getElementById('filter-usuario-aud')?.value || '';
        const fechaDesde = document.getElementById('filter-fecha-desde-aud')?.value || '';
        const fechaHasta = document.getElementById('filter-fecha-hasta-aud')?.value || '';

        const rows = document.querySelectorAll('#auditoria-table tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const tabla = row.dataset.tabla;
            const accion = row.dataset.accion;
            const usuario = row.dataset.usuario;
            const fecha = row.dataset.fecha ? new Date(row.dataset.fecha) : null;

            let show = true;

            if (tablaFilter && tabla !== tablaFilter) show = false;
            if (show && accionFilter && accion !== accionFilter) show = false;
            if (show && usuarioFilter && usuario !== usuarioFilter) show = false;

            if (show && fechaDesde && fecha) {
                const desde = new Date(fechaDesde);
                if (fecha < desde) show = false;
            }

            if (show && fechaHasta && fecha) {
                const hasta = new Date(fechaHasta);
                hasta.setHours(23, 59, 59, 999);
                if (fecha > hasta) show = false;
            }

            row.style.display = show ? '' : 'none';
            if (show) visibleCount++;
        });

        const countElement = document.getElementById('auditoria-count');
        if (countElement) {
            countElement.textContent = `${visibleCount} registro${visibleCount !== 1 ? 's' : ''}`;
        }
    }

    limpiarFiltrosAuditoria() {
        ['filter-tabla', 'filter-accion', 'filter-usuario-aud', 'filter-fecha-desde-aud', 'filter-fecha-hasta-aud'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this.filterAuditoria();
    }

    generarReporteAuditoria() {
        const rows = document.querySelectorAll('#auditoria-table tbody tr');
        const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');

        if (visibleRows.length === 0) {
            showToast('No hay registros para generar el reporte', 'warning');
            return;
        }

        let reportContent = this.getReportHeader('Reporte de Auditoría', visibleRows.length);
        reportContent += `
            <table>
                <thead>
                    <tr><th>Fecha</th><th>Tabla</th><th>Acción</th><th>Usuario</th><th>Descripción</th></tr>
                </thead>
                <tbody>
        `;

        visibleRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            reportContent += '<tr>';
            cells.forEach(cell => reportContent += `<td>${cell.textContent}</td>`);
            reportContent += '</tr>';
        });

        reportContent += this.getReportFooter();
        this.openPrintWindow(reportContent);
    }

    // === REPORTES GENERALES ===
    async generarReporteBienes() {
        try {
            showToast('Generando reporte...', 'info');
            const bienes = await api.getBienes();

            let reportContent = this.getReportHeader('Inventario General de Bienes', bienes.length);
            reportContent += `
                <table>
                    <thead>
                        <tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Estado</th><th>Área</th><th>Responsable</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
            `;

            bienes.forEach(bien => {
                reportContent += `
                    <tr>
                        <td>${bien.CodigoPatrimonial}</td>
                        <td>${bien.Nombre}</td>
                        <td>${bien.Marca || '-'}</td>
                        <td>${bien.Estado || '-'}</td>
                        <td>${bien.Area || '-'}</td>
                        <td>${bien.Responsable || '-'}</td>
                        <td>${formatCurrency(bien.ValorActual || 0)}</td>
                    </tr>
                `;
            });

            reportContent += this.getReportFooter();
            this.openPrintWindow(reportContent);
        } catch (error) {
            showToast('Error al generar reporte', 'error');
        }
    }

    async generarReporteBienesPorEstado() {
        try {
            showToast('Generando reporte...', 'info');
            const bienes = await api.getBienes();

            // Agrupar por estado
            const porEstado = bienes.reduce((acc, bien) => {
                const estado = bien.Estado || 'Sin estado';
                if (!acc[estado]) acc[estado] = [];
                acc[estado].push(bien);
                return acc;
            }, {});

            let reportContent = this.getReportHeader('Bienes por Estado', bienes.length);

            for (const [estado, items] of Object.entries(porEstado)) {
                reportContent += `<h3 style="margin-top:20px;color:#4361ee;">${estado} (${items.length})</h3>`;
                reportContent += `<table><thead><tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Área</th></tr></thead><tbody>`;
                items.forEach(bien => {
                    reportContent += `<tr><td>${bien.CodigoPatrimonial}</td><td>${bien.Nombre}</td><td>${bien.Marca || '-'}</td><td>${bien.Area || '-'}</td></tr>`;
                });
                reportContent += `</tbody></table>`;
            }

            reportContent += this.getReportFooter();
            this.openPrintWindow(reportContent);
        } catch (error) {
            showToast('Error al generar reporte', 'error');
        }
    }

    async generarReporteBienesPorArea() {
        try {
            showToast('Generando reporte...', 'info');
            const bienes = await api.getBienes();

            // Agrupar por área
            const porArea = bienes.reduce((acc, bien) => {
                const area = bien.Area || 'Sin área asignada';
                if (!acc[area]) acc[area] = [];
                acc[area].push(bien);
                return acc;
            }, {});

            let reportContent = this.getReportHeader('Bienes por Área', bienes.length);

            for (const [area, items] of Object.entries(porArea)) {
                reportContent += `<h3 style="margin-top:20px;color:#4361ee;">${area} (${items.length})</h3>`;
                reportContent += `<table><thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>`;
                items.forEach(bien => {
                    reportContent += `<tr><td>${bien.CodigoPatrimonial}</td><td>${bien.Nombre}</td><td>${bien.Estado || '-'}</td><td>${bien.Responsable || '-'}</td></tr>`;
                });
                reportContent += `</tbody></table>`;
            }

            reportContent += this.getReportFooter();
            this.openPrintWindow(reportContent);
        } catch (error) {
            showToast('Error al generar reporte', 'error');
        }
    }

    async generarReporteResponsables() {
        try {
            showToast('Generando reporte...', 'info');
            const responsables = await api.getResponsables();

            let reportContent = this.getReportHeader('Listado de Responsables', responsables.length);
            reportContent += `
                <table>
                    <thead>
                        <tr><th>DNI</th><th>Nombres</th><th>Apellidos</th><th>Área</th><th>Teléfono</th><th>Correo</th></tr>
                    </thead>
                    <tbody>
            `;

            responsables.forEach(resp => {
                reportContent += `
                    <tr>
                        <td>${resp.DNI || '-'}</td>
                        <td>${resp.Nombres}</td>
                        <td>${resp.Apellidos}</td>
                        <td>${resp.AreaNombre || '-'}</td>
                        <td>${resp.Telefono || '-'}</td>
                        <td>${resp.Correo || '-'}</td>
                    </tr>
                `;
            });

            reportContent += this.getReportFooter();
            this.openPrintWindow(reportContent);
        } catch (error) {
            showToast('Error al generar reporte', 'error');
        }
    }

    // === HELPERS DE REPORTES ===
    getReportHeader(titulo, total) {
        return `
            <html>
            <head>
                <title>${titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #1a1a2e; text-align: center; margin-bottom: 5px; }
                    .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
                    .info { margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; }
                    .info p { margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                    th { background-color: #4361ee; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <h1>${titulo}</h1>
                <p class="subtitle">Sistema de Inventario Institucional</p>
                <div class="info">
                    <p><strong>Fecha de generación:</strong> ${new Date().toLocaleString('es-PE')}</p>
                    <p><strong>Total de registros:</strong> ${total}</p>
                </div>
        `;
    }

    getReportFooter() {
        return `
                <div class="footer">
                    <p>Sistema de Inventario Institucional - Reporte generado automáticamente</p>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;
    }

    openPrintWindow(content) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(content);
        printWindow.document.close();
    }

    // Obtener filtros seleccionados en reportes
    getReportFilters() {
        return {
            mes: document.getElementById('report-mes')?.value || '',
            tipoBien: document.getElementById('report-tipo-bien')?.value || '',
            estado: document.getElementById('report-estado')?.value || '',
            responsable: document.getElementById('report-responsable')?.value || '',
            area: document.getElementById('report-area')?.value || ''
        };
    }

    // Aplicar filtros a los bienes
    filtrarBienes(bienes) {
        const filtros = this.getReportFilters();
        return bienes.filter(bien => {
            if (filtros.tipoBien && bien.IdTipoBien != filtros.tipoBien) return false;
            if (filtros.estado && bien.IdEstado != filtros.estado) return false;
            if (filtros.responsable && bien.IdResponsable != filtros.responsable) return false;
            if (filtros.area && bien.IdArea != filtros.area) return false;
            return true;
        });
    }

    async generarReporteBienesConFiltros() {
        try {
            showToast('Generando reporte...', 'info');
            const bienes = this.reportesData?.bienes || await api.getBienes();
            const bienesFiltrados = this.filtrarBienes(bienes);

            if (bienesFiltrados.length === 0) {
                showToast('No hay bienes con los filtros seleccionados', 'warning');
                return;
            }

            const filtros = this.getReportFilters();
            let reportContent = this.getReportHeader('Inventario de Bienes', bienesFiltrados.length);

            // Mostrar filtros aplicados
            reportContent += `<p style="color:#666;font-size:12px;margin-top:-10px;">`;
            if (filtros.tipoBien) reportContent += `Tipo: ${document.getElementById('report-tipo-bien').selectedOptions[0].text} | `;
            if (filtros.estado) reportContent += `Estado: ${document.getElementById('report-estado').selectedOptions[0].text} | `;
            if (filtros.responsable) reportContent += `Responsable: ${document.getElementById('report-responsable').selectedOptions[0].text} | `;
            if (filtros.area) reportContent += `Área: ${document.getElementById('report-area').selectedOptions[0].text}`;
            reportContent += `</p>`;

            reportContent += `
                <table>
                    <thead>
                        <tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Estado</th><th>Área</th><th>Responsable</th><th>Valor</th></tr>
                    </thead>
                    <tbody>
            `;

            bienesFiltrados.forEach(bien => {
                reportContent += `
                    <tr>
                        <td>${bien.CodigoPatrimonial}</td>
                        <td>${bien.Nombre}</td>
                        <td>${bien.Marca || '-'}</td>
                        <td>${bien.Estado || '-'}</td>
                        <td>${bien.Area || '-'}</td>
                        <td>${bien.Responsable || '-'}</td>
                        <td>${formatCurrency(bien.ValorActual || 0)}</td>
                    </tr>
                `;
            });

            reportContent += this.getReportFooter();
            this.openPrintWindow(reportContent);
        } catch (error) {
            showToast('Error al generar reporte', 'error');
        }
    }

    async generarReporteBienesPorResponsable() {
        try {
            showToast('Generando reporte...', 'info');
            const bienes = this.reportesData?.bienes || await api.getBienes();
            const bienesFiltrados = this.filtrarBienes(bienes);

            // Agrupar por responsable
            const porResponsable = bienesFiltrados.reduce((acc, bien) => {
                const resp = bien.Responsable || 'Sin responsable asignado';
                if (!acc[resp]) acc[resp] = [];
                acc[resp].push(bien);
                return acc;
            }, {});

            let reportContent = this.getReportHeader('Bienes por Responsable', bienesFiltrados.length);

            for (const [responsable, items] of Object.entries(porResponsable)) {
                reportContent += `<h3 style="margin-top:20px;color:#4361ee;border-bottom:2px solid #4361ee;padding-bottom:5px;">${responsable} (${items.length} bienes)</h3>`;
                reportContent += `<table><thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th>Área</th><th>Valor</th></tr></thead><tbody>`;
                let totalValor = 0;
                items.forEach(bien => {
                    totalValor += bien.ValorActual || 0;
                    reportContent += `<tr><td>${bien.CodigoPatrimonial}</td><td>${bien.Nombre}</td><td>${bien.Estado || '-'}</td><td>${bien.Area || '-'}</td><td>${formatCurrency(bien.ValorActual || 0)}</td></tr>`;
                });
                reportContent += `</tbody></table>`;
                reportContent += `<p style="text-align:right;font-weight:bold;">Total: ${formatCurrency(totalValor)}</p>`;
            }

            reportContent += this.getReportFooter();
            this.openPrintWindow(reportContent);
        } catch (error) {
            showToast('Error al generar reporte', 'error');
        }
    }

    async generarReporteBienesPorTipo() {
        try {
            showToast('Generando reporte...', 'info');
            const bienes = this.reportesData?.bienes || await api.getBienes();
            const bienesFiltrados = this.filtrarBienes(bienes);

            // Agrupar por tipo
            const porTipo = bienesFiltrados.reduce((acc, bien) => {
                const tipo = bien.TipoBien || 'Sin tipo';
                if (!acc[tipo]) acc[tipo] = [];
                acc[tipo].push(bien);
                return acc;
            }, {});

            let reportContent = this.getReportHeader('Bienes por Tipo', bienesFiltrados.length);

            for (const [tipo, items] of Object.entries(porTipo)) {
                reportContent += `<h3 style="margin-top:20px;color:#4361ee;border-bottom:2px solid #4361ee;padding-bottom:5px;">${tipo} (${items.length})</h3>`;
                reportContent += `<table><thead><tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>`;
                items.forEach(bien => {
                    reportContent += `<tr><td>${bien.CodigoPatrimonial}</td><td>${bien.Nombre}</td><td>${bien.Marca || '-'}</td><td>${bien.Estado || '-'}</td><td>${bien.Responsable || '-'}</td></tr>`;
                });
                reportContent += `</tbody></table>`;
            }

            reportContent += this.getReportFooter();
            this.openPrintWindow(reportContent);
        } catch (error) {
            showToast('Error al generar reporte', 'error');
        }
    }

    async generarReporteMovimientosMes() {
        try {
            const mesSeleccionado = document.getElementById('report-mes')?.value;

            if (!mesSeleccionado) {
                showToast('Seleccione un mes en los filtros', 'warning');
                return;
            }

            showToast('Generando reporte...', 'info');
            const movimientos = this.reportesData?.movimientos || await api.getMovimientos();

            // Filtrar por mes
            const [year, month] = mesSeleccionado.split('-');
            const movimientosFiltrados = movimientos.filter(mov => {
                const fecha = new Date(mov.FechaMovimiento);
                return fecha.getFullYear() === parseInt(year) && (fecha.getMonth() + 1) === parseInt(month);
            });

            if (movimientosFiltrados.length === 0) {
                showToast('No hay movimientos en el mes seleccionado', 'warning');
                return;
            }

            const nombreMes = new Date(year, month - 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
            let reportContent = this.getReportHeader(`Movimientos de ${nombreMes}`, movimientosFiltrados.length);

            reportContent += `
                <table>
                    <thead>
                        <tr><th>Fecha</th><th>Código</th><th>Bien</th><th>Tipo Movimiento</th><th>Usuario</th><th>Descripción</th></tr>
                    </thead>
                    <tbody>
            `;

            movimientosFiltrados.forEach(mov => {
                reportContent += `
                    <tr>
                        <td>${formatDate(mov.FechaMovimiento)}</td>
                        <td>${mov.CodigoPatrimonial}</td>
                        <td>${mov.BienNombre}</td>
                        <td>${mov.NombreMovimiento}</td>
                        <td>${mov.NombreUsuario}</td>
                        <td>${mov.Descripcion || '-'}</td>
                    </tr>
                `;
            });

            reportContent += this.getReportFooter();
            this.openPrintWindow(reportContent);
        } catch (error) {
            showToast('Error al generar reporte', 'error');
        }
    }

    // === SELECCIÓN MÚLTIPLE DE BIENES ===

    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.bien-checkbox');
        checkboxes.forEach(cb => cb.checked = checked);
        this.updateExportButton();
    }

    updateExportButton() {
        const selected = document.querySelectorAll('.bien-checkbox:checked');
        const btn = document.getElementById('export-selected-btn');
        if (btn) {
            if (selected.length > 0) {
                btn.style.display = 'inline-flex';
                btn.textContent = `📄 Exportar ${selected.length} QR${selected.length > 1 ? 's' : ''}`;
            } else {
                btn.style.display = 'none';
            }
        }
    }

    async exportSelectedQRs() {
        const selected = document.querySelectorAll('.bien-checkbox:checked');
        const ids = Array.from(selected).map(cb => parseInt(cb.value));

        if (ids.length === 0) {
            showToast('Seleccione al menos un bien', 'warning');
            return;
        }

        // Llamar a la función de exportación múltiple a PDF
        await exportMultipleQRPDF(ids);
    }

    filterBienes(searchTerm) {
        const rows = document.querySelectorAll('#bienes-table tbody tr');
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
                `;
                break;

            case 'tipoBien':
                title = isEdit ? 'Editar Tipo de Bien' : 'Nuevo Tipo de Bien';
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombre" value="${editData?.nombre || ''}" required>
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
                `;
                break;

            case 'metodo':
                title = isEdit ? 'Editar Método de Adquisición' : 'Nuevo Método de Adquisición';
                formContent = `
                    <div class="form-group">
                        <label for="catalog-nombre">Nombre *</label>
                        <input type="text" id="catalog-nombre" name="nombreMetodo" value="${editData?.nombre || ''}" required>
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
            case 'estado':
            case 'tipoBien':
            case 'area':
            case 'metodo':
            case 'tipoMovimiento':
                editData.nombre = args[0];
                break;
            case 'categoria':
                editData.nombre = args[0];
                editData.idTipoBien = args[1];
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
        const nombre = document.getElementById('catalog-nombre').value;

        try {
            let result;

            switch (type) {
                case 'marca': {
                    if (isEdit) {
                        result = await api.updateMarca(id, nombre);
                    } else {
                        result = await api.createMarca(nombre);
                    }
                    break;
                }
                case 'estado': {
                    if (isEdit) {
                        result = await api.updateEstado(id, nombre);
                    } else {
                        result = await api.createEstado(nombre);
                    }
                    break;
                }
                case 'tipoBien': {
                    if (isEdit) {
                        result = await api.updateTipoBien(id, nombre);
                    } else {
                        result = await api.createTipoBien(nombre);
                    }
                    break;
                }
                case 'categoria': {
                    const idTipoBien = document.getElementById('catalog-tipoBien').value;
                    if (isEdit) {
                        result = await api.updateCategoria(id, nombre, idTipoBien);
                    } else {
                        result = await api.createCategoria(nombre, idTipoBien);
                    }
                    break;
                }
                case 'area': {
                    if (isEdit) {
                        result = await api.updateArea(id, nombre);
                    } else {
                        result = await api.createArea(nombre);
                    }
                    break;
                }
                case 'metodo': {
                    if (isEdit) {
                        result = await api.updateMetodoAdquisicion(id, nombre);
                    } else {
                        result = await api.createMetodoAdquisicion(nombre);
                    }
                    break;
                }
                case 'tipoMovimiento': {
                    if (isEdit) {
                        result = await api.updateTipoMovimiento(id, nombre);
                    } else {
                        result = await api.createTipoMovimiento(nombre);
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

// === CHART.JS DASHBOARD INITIALIZATION ===
// Store chart instances to destroy them before re-creating
let estadoChartInstance = null;
let areaChartInstance = null;

// Color palette for charts - premium gradient colors (12 distinct colors)
const chartColors = {
    // Solid colors
    emerald: 'rgba(16, 185, 129, 1)',       // Green - Operativo
    sky: 'rgba(14, 165, 233, 1)',           // Light Blue - Disponible
    amber: 'rgba(245, 158, 11, 1)',         // Amber - En Mantenimiento  
    rose: 'rgba(244, 63, 94, 1)',           // Rose - Baja
    violet: 'rgba(139, 92, 246, 1)',        // Violet - Asignado
    indigo: 'rgba(99, 102, 241, 1)',        // Indigo - En Almacén
    cyan: 'rgba(6, 182, 212, 1)',           // Cyan - Inoperativo
    orange: 'rgba(249, 115, 22, 1)',        // Orange - Extraviado
    pink: 'rgba(236, 72, 153, 1)',          // Pink - Dañado
    slate: 'rgba(100, 116, 139, 1)',        // Slate - Obsoleto
    lime: 'rgba(132, 204, 22, 1)',          // Lime - Pendiente de Baja
    teal: 'rgba(20, 184, 166, 1)',          // Teal - Extra

    // Background versions (with transparency)
    emeraldBg: 'rgba(16, 185, 129, 0.85)',
    skyBg: 'rgba(14, 165, 233, 0.85)',
    amberBg: 'rgba(245, 158, 11, 0.85)',
    roseBg: 'rgba(244, 63, 94, 0.85)',
    violetBg: 'rgba(139, 92, 246, 0.85)',
    indigoBg: 'rgba(99, 102, 241, 0.85)',
    cyanBg: 'rgba(6, 182, 212, 0.85)',
    orangeBg: 'rgba(249, 115, 22, 0.85)',
    pinkBg: 'rgba(236, 72, 153, 0.85)',
    slateBg: 'rgba(100, 116, 139, 0.85)',
    limeBg: 'rgba(132, 204, 22, 0.85)',
    tealBg: 'rgba(20, 184, 166, 0.85)'
};

// Color array for doughnut chart - 12 distinct colors
const doughnutColors = [
    chartColors.emeraldBg,  // Operativo - Green
    chartColors.skyBg,      // Disponible - Light Blue
    chartColors.cyanBg,     // Inoperativo - Cyan
    chartColors.violetBg,   // Asignado - Violet
    chartColors.indigoBg,   // En Almacén - Indigo
    chartColors.amberBg,    // En Mantenimiento - Amber
    chartColors.orangeBg,   // Extraviado - Orange
    chartColors.pinkBg,     // Dañado - Pink
    chartColors.slateBg,    // Obsoleto - Slate
    chartColors.roseBg,     // Pendiente de Baja - Rose
    chartColors.limeBg,     // Extra 1 - Lime
    chartColors.tealBg      // Extra 2 - Teal
];

const barColors = [
    chartColors.indigoBg,
    chartColors.violetBg,
    chartColors.pinkBg,
    chartColors.skyBg,
    chartColors.tealBg
];

// Estado to color mapping - specific colors for each known estado
const estadoColorMap = {
    'operativo': chartColors.emeraldBg,
    'disponible': chartColors.skyBg,
    'inoperativo': chartColors.cyanBg,
    'asignado': chartColors.violetBg,
    'almacen': chartColors.indigoBg,
    'en almacén': chartColors.indigoBg,
    'mantenimiento': chartColors.amberBg,
    'en mantenimiento': chartColors.amberBg,
    'extraviado': chartColors.orangeBg,
    'dañado': chartColors.pinkBg,
    'obsoleto': chartColors.slateBg,
    'baja': chartColors.roseBg,
    'pendiente de baja': chartColors.limeBg,
    'pendiente': chartColors.limeBg
};

function getEstadoColor(estado, index) {
    const estadoLower = estado.toLowerCase().trim();

    // First try exact match
    if (estadoColorMap[estadoLower]) {
        return estadoColorMap[estadoLower];
    }

    // Then try partial match
    for (const [key, color] of Object.entries(estadoColorMap)) {
        if (estadoLower.includes(key) || key.includes(estadoLower)) {
            return color;
        }
    }

    // Fallback to array color by index
    return doughnutColors[index % doughnutColors.length];
}

function initDashboardCharts(stats) {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded yet');
        return;
    }

    // Configure Chart.js defaults for dark theme
    Chart.defaults.color = 'rgba(203, 213, 225, 1)'; // text-secondary
    Chart.defaults.borderColor = 'rgba(51, 65, 85, 0.5)'; // border color
    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    // Initialize Estado Chart (Doughnut)
    initEstadoChart(stats.porEstado, stats.totalBienes);

    // Initialize Area Chart (Horizontal Bar)
    initAreaChart(stats.porArea);
}

function initEstadoChart(porEstado, totalBienes) {
    const canvas = document.getElementById('estadoChart');
    if (!canvas) return;

    // Destroy existing chart if exists
    if (estadoChartInstance) {
        estadoChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Prepare data
    const labels = porEstado.map(item => item.estado);
    const data = porEstado.map(item => item.cantidad);
    const backgroundColors = porEstado.map((item, index) => getEstadoColor(item.estado, index));

    estadoChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(30, 41, 59, 1)',
                borderWidth: 3,
                hoverBorderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            layout: {
                padding: {
                    top: 10,
                    bottom: 10
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        boxWidth: 12,
                        generateLabels: function (chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = totalBienes > 0 ? ((value / totalBienes) * 100).toFixed(0) : 0;
                                    return {
                                        text: `${label} (${value})`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor,
                                        lineWidth: 0,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            const percentage = totalBienes > 0 ? ((value / totalBienes) * 100).toFixed(1) : 0;
                            return ` ${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 800,
                easing: 'easeOutQuart'
            }
        }
    });
}

function initAreaChart(porArea) {
    const canvas = document.getElementById('areaChart');
    if (!canvas) return;

    // Destroy existing chart if exists
    if (areaChartInstance) {
        areaChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');

    // Get top 5 areas
    const top5 = porArea.slice(0, 5);
    const labels = top5.map(item => {
        // Truncate long names
        const name = item.area || 'Sin área';
        return name.length > 20 ? name.substring(0, 20) + '...' : name;
    });
    const data = top5.map(item => item.cantidad);

    // Create gradient for each bar
    const gradients = top5.map((_, index) => {
        const gradient = ctx.createLinearGradient(0, 0, 400, 0);
        const colors = [
            [chartColors.indigo, chartColors.violet],
            [chartColors.violet, chartColors.pink],
            [chartColors.pink, chartColors.sky],
            [chartColors.sky, chartColors.cyan],
            [chartColors.cyan, chartColors.emerald]
        ];
        const [start, end] = colors[index % colors.length];
        gradient.addColorStop(0, start);
        gradient.addColorStop(1, end);
        return gradient;
    });

    areaChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de Bienes',
                data: data,
                backgroundColor: gradients,
                borderColor: 'transparent',
                borderWidth: 0,
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 30,
                maxBarThickness: 40
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: function (context) {
                            // Show full area name in tooltip
                            const index = context[0].dataIndex;
                            return top5[index]?.area || 'Sin área';
                        },
                        label: function (context) {
                            return ` Bienes: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(51, 65, 85, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(148, 163, 184, 1)',
                        font: {
                            size: 11
                        },
                        stepSize: Math.ceil(Math.max(...data) / 5)
                    }
                },
                y: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(203, 213, 225, 1)',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        padding: 10
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Inicializar aplicación
const app = new App();

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
