// ============================================
// EXCEL EXPORTER - Exportación a Excel
// Sistema de Inventario Institucional
// ============================================

/**
 * Exporta los bienes a un archivo Excel
 * @param {Array} bienes - Array de bienes a exportar (null = todos)
 */
async function exportBienesToExcel(bienes = null) {
    try {
        showToast('Preparando exportación...', 'info');

        // Si no se proporcionan bienes, obtenerlos de la API
        if (!bienes) {
            bienes = await api.getBienes();
        }

        if (bienes.length === 0) {
            showToast('No hay bienes para exportar', 'warning');
            return;
        }

        // Preparar datos para Excel
        const data = bienes.map((bien, index) => ({
            'N°': index + 1,
            'Código Patrimonial': bien.CodigoPatrimonial || '',
            'Bien': bien.Bien || bien.Nombre || '',
            'Descripción': bien.Descripcion || '',
            'Marca': bien.Marca || '',
            'Modelo': bien.Modelo || '',
            'Serie': bien.Serie || '',
            'Color': bien.Color || '',
            'Estado': bien.Estado || '',
            'Responsable': bien.Responsable || '',
            'Área': bien.Area || '',
            'Ubicación': bien.Ubicacion || '',
            'Valor (S/)': bien.Valor || 0,
            'Fecha Adquisición': bien.FechaAdquisicion ? formatDate(bien.FechaAdquisicion) : '',
            'Observaciones': bien.Observaciones || ''
        }));

        // Crear workbook y worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar ancho de columnas
        const colWidths = [
            { wch: 5 },   // N°
            { wch: 18 },  // Código
            { wch: 30 },  // Bien
            { wch: 40 },  // Descripción
            { wch: 12 },  // Marca
            { wch: 15 },  // Modelo
            { wch: 15 },  // Serie
            { wch: 10 },  // Color
            { wch: 12 },  // Estado
            { wch: 25 },  // Responsable
            { wch: 20 },  // Área
            { wch: 20 },  // Ubicación
            { wch: 12 },  // Valor
            { wch: 15 },  // Fecha
            { wch: 30 }   // Observaciones
        ];
        ws['!cols'] = colWidths;

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Bienes');

        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        const filename = `Inventario_IEST_${fecha}.xlsx`;

        // Descargar archivo
        XLSX.writeFile(wb, filename);

        showToast(`✅ Exportados ${bienes.length} bienes a Excel`, 'success');

    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        showToast('Error al exportar: ' + error.message, 'error');
    }
}

/**
 * Exporta los movimientos a Excel
 * @param {Array} movimientos - Array de movimientos (null = todos)
 */
async function exportMovimientosToExcel(movimientos = null) {
    try {
        showToast('Preparando exportación...', 'info');

        if (!movimientos) {
            movimientos = await api.getMovimientos();
        }

        if (movimientos.length === 0) {
            showToast('No hay movimientos para exportar', 'warning');
            return;
        }

        const data = movimientos.map((mov, index) => ({
            'N°': index + 1,
            'Fecha': mov.FechaMovimiento ? formatDate(mov.FechaMovimiento) : '',
            'Código Bien': mov.CodigoPatrimonial || '',
            'Bien': mov.Bien || mov.bien || '',
            'Tipo Movimiento': mov.TipoMovimiento || mov.tipo || '',
            'Responsable Origen': mov.ResponsableOrigen || '',
            'Responsable Destino': mov.ResponsableDestino || '',
            'Usuario': mov.Usuario || mov.usuario || '',
            'Observaciones': mov.Observaciones || ''
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        ws['!cols'] = [
            { wch: 5 },   // N°
            { wch: 12 },  // Fecha
            { wch: 18 },  // Código
            { wch: 30 },  // Bien
            { wch: 15 },  // Tipo
            { wch: 25 },  // Origen
            { wch: 25 },  // Destino
            { wch: 15 },  // Usuario
            { wch: 40 }   // Observaciones
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');

        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Movimientos_${fecha}.xlsx`);

        showToast(`✅ Exportados ${movimientos.length} movimientos a Excel`, 'success');

    } catch (error) {
        console.error('Error al exportar movimientos:', error);
        showToast('Error al exportar: ' + error.message, 'error');
    }
}

/**
 * Exporta los responsables a Excel
 */
async function exportResponsablesToExcel() {
    try {
        showToast('Preparando exportación...', 'info');

        const responsables = await api.getResponsables();

        if (responsables.length === 0) {
            showToast('No hay responsables para exportar', 'warning');
            return;
        }

        const data = responsables.map((resp, index) => ({
            'N°': index + 1,
            'DNI': resp.DNI || '',
            'Nombres': resp.Nombres || '',
            'Apellidos': resp.Apellidos || '',
            'Cargo': resp.Cargo || '',
            'Área': resp.Area || '',
            'Email': resp.Email || '',
            'Teléfono': resp.Telefono || '',
            'Estado': resp.Estado === 1 || resp.Estado === true ? 'Activo' : 'Inactivo'
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        ws['!cols'] = [
            { wch: 5 },   // N°
            { wch: 12 },  // DNI
            { wch: 20 },  // Nombres
            { wch: 25 },  // Apellidos
            { wch: 25 },  // Cargo
            { wch: 20 },  // Área
            { wch: 30 },  // Email
            { wch: 12 },  // Teléfono
            { wch: 10 }   // Estado
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Responsables');

        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Responsables_${fecha}.xlsx`);

        showToast(`✅ Exportados ${responsables.length} responsables a Excel`, 'success');

    } catch (error) {
        console.error('Error al exportar responsables:', error);
        showToast('Error al exportar: ' + error.message, 'error');
    }
}

/**
 * Exporta un reporte completo del inventario
 * Incluye múltiples hojas: Bienes, Por Estado, Por Área, Resumen
 */
async function exportReporteCompletoExcel() {
    try {
        showToast('Generando reporte completo...', 'info');

        // Obtener todos los datos
        const [bienes, stats] = await Promise.all([
            api.getBienes(),
            api.getDashboardStats()
        ]);

        const wb = XLSX.utils.book_new();

        // Hoja 1: Resumen
        const resumenData = [
            ['REPORTE DE INVENTARIO INSTITUCIONAL'],
            ['IEST Coracora'],
            [''],
            ['Fecha de Generación:', new Date().toLocaleString('es-PE')],
            [''],
            ['RESUMEN GENERAL'],
            ['Total de Bienes:', stats.totalBienes],
            ['Valor Total:', `S/ ${(stats.valorTotal || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`],
            [''],
            ['DISTRIBUCIÓN POR ESTADO'],
            ...stats.porEstado.map(e => [e.estado, e.cantidad]),
            [''],
            ['TOP ÁREAS POR CANTIDAD'],
            ...stats.porArea.slice(0, 10).map(a => [a.area, a.cantidad])
        ];
        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        wsResumen['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

        // Hoja 2: Todos los bienes
        const bienesData = bienes.map((bien, index) => ({
            'N°': index + 1,
            'Código': bien.CodigoPatrimonial || '',
            'Bien': bien.Bien || '',
            'Estado': bien.Estado || '',
            'Responsable': bien.Responsable || '',
            'Área': bien.Area || '',
            'Valor': bien.Valor || 0
        }));
        const wsBienes = XLSX.utils.json_to_sheet(bienesData);
        wsBienes['!cols'] = [
            { wch: 5 }, { wch: 18 }, { wch: 35 }, { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, wsBienes, 'Bienes');

        // Hoja 3: Por Estado
        const estadoData = stats.porEstado.map(e => ({
            'Estado': e.estado,
            'Cantidad': e.cantidad,
            'Porcentaje': `${((e.cantidad / stats.totalBienes) * 100).toFixed(1)}%`
        }));
        const wsEstado = XLSX.utils.json_to_sheet(estadoData);
        XLSX.utils.book_append_sheet(wb, wsEstado, 'Por Estado');

        // Hoja 4: Por Área
        const areaData = stats.porArea.map(a => ({
            'Área': a.area,
            'Cantidad': a.cantidad,
            'Porcentaje': `${((a.cantidad / stats.totalBienes) * 100).toFixed(1)}%`
        }));
        const wsArea = XLSX.utils.json_to_sheet(areaData);
        XLSX.utils.book_append_sheet(wb, wsArea, 'Por Área');

        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Reporte_Inventario_IEST_${fecha}.xlsx`);

        showToast('✅ Reporte completo exportado exitosamente', 'success');

    } catch (error) {
        console.error('Error al generar reporte:', error);
        showToast('Error al generar reporte: ' + error.message, 'error');
    }
}
