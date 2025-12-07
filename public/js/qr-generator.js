// ============================================
// QR GENERATOR - Generación y Exportación de QR
// ============================================

// Helper para formatear fecha en formato corto
function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Genera un código QR con información completa del bien
 * @param {Object} bienData - Datos del bien
 * @returns {Promise<string>} - Data URL del QR generado
 */
async function generateQRCode(bienData) {
    return new Promise((resolve, reject) => {
        // Helper para truncar texto
        const truncate = (text, maxLen) => {
            if (!text || text === 'N/A') return text || 'N/A';
            return text.length > maxLen ? text.substring(0, maxLen - 2) + '..' : text;
        };

        // Helper para extraer solo primer nombre y apellido
        const extractShortName = (fullName) => {
            if (!fullName || fullName === 'N/A') return 'N/A';
            const parts = fullName.trim().split(/\s+/);
            if (parts.length === 1) return truncate(parts[0], 15);
            // Primer nombre + primer apellido
            return truncate(`${parts[0]} ${parts[1] || ''}`.trim(), 15);
        };

        // Preparar datos en formato LEGIBLE con límites MÍNIMOS ABSOLUTOS
        const lineas = [
            `Cod Pat: ${truncate(bienData.CodigoPatrimonial || bienData.codigoPatrimonial, 15)}`,
            `Nom: ${truncate(bienData.Bien || bienData.Nombre || bienData.nombre, 20)}`,
            `Est: ${truncate(bienData.Estado || bienData.estado, 8)}`,
            `Area: ${truncate(bienData.Area || bienData.area, 18)}`,
            `Resp: ${extractShortName(bienData.Responsable || bienData.responsable)}`,
            `Fech: ${formatDateShort(bienData.FechaAdquisicion || bienData.FechaRegistro)}`
        ];

        // Unir con saltos de línea
        const qrText = lineas.join('\n');

        console.log('📊 Tamaño del QR:', qrText.length, 'caracteres (máx: 864)');
        console.log('📦 Contenido:\n' + qrText);

        // Crear elemento temporal para generar QR
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        try {
            // Generar QR usando QRCode.js con nivel de corrección BAJO para mayor capacidad
            const qr = new QRCode(tempDiv, {
                text: qrText,
                width: 400,
                height: 400,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.L  // Nivel BAJO necesario para máxima capacidad
            });

            // Esperar a que se genere el QR
            setTimeout(() => {
                const canvas = tempDiv.querySelector('canvas');
                if (canvas) {
                    const dataURL = canvas.toDataURL('image/png');
                    document.body.removeChild(tempDiv);
                    resolve(dataURL);
                } else {
                    document.body.removeChild(tempDiv);
                    reject(new Error('No se pudo generar el QR'));
                }
            }, 100);
        } catch (error) {
            document.body.removeChild(tempDiv);
            reject(error);
        }
    });
}

/**
 * Exporta un QR individual como PNG con plantilla del IEST
 * @param {number} idBien - ID del bien
 */
async function exportSingleQRImage(idBien) {
    try {
        showToast('Generando QR...', 'info');

        // Obtener datos del bien
        const bien = await api.getBien(idBien);

        // Generar QR
        const qrDataURL = await generateQRCode(bien);

        // Crear canvas para combinar plantilla + QR
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Cargar plantilla
        const template = new Image();
        template.crossOrigin = 'anonymous';

        template.onload = () => {
            // Establecer tamaño del canvas igual a la plantilla
            canvas.width = template.width;
            canvas.height = template.height;

            // Dibujar plantilla
            ctx.drawImage(template, 0, 0);

            // Cargar QR
            const qrImage = new Image();
            qrImage.onload = () => {
                // Calcular posición del QR para el recuadro blanco derecho
                // Ajustado para mejor centrado en la plantilla
                const qrSize = Math.min(250, canvas.height * 0.7); // Tamaño adaptativo
                const qrX = canvas.width - qrSize - 50; // Margen derecho de 50px
                const qrY = (canvas.height - qrSize) / 2; // Centrado verticalmente

                // Dibujar QR sobre la plantilla
                ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

                // Descargar imagen
                canvas.toBlob((blob) => {
                    if (!blob) {
                        showToast('Error al generar imagen', 'error');
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `QR_${bien.CodigoPatrimonial}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    showToast('QR descargado exitosamente', 'success');
                }, 'image/png');
            };

            qrImage.onerror = () => {
                showToast('Error al cargar el código QR', 'error');
            };

            qrImage.src = qrDataURL;
        };

        template.onerror = () => {
            showToast('Error al cargar la plantilla. Verifica que existe /assets/qr-template.png', 'error');
        };

        template.src = '/assets/qr-template.png';

    } catch (error) {
        console.error('Error al exportar QR:', error);
        showToast('Error al exportar QR: ' + error.message, 'error');
    }
}

/**
 * Exporta múltiples QRs como PDF (10 por página, 2x5)
 * @param {Array<number>} selectedIds - IDs de bienes seleccionados
 */
async function exportMultipleQRPDF(selectedIds = []) {
    try {
        showToast('Generando PDF con QRs...', 'info');

        // Si no hay selección, obtener todos los bienes
        let bienes;
        if (selectedIds.length === 0) {
            bienes = await api.getBienes();
        } else {
            bienes = await Promise.all(selectedIds.map(id => api.getBien(id)));
        }

        if (bienes.length === 0) {
            showToast('No hay bienes para exportar', 'warning');
            return;
        }

        // Crear PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Cargar plantilla
        const template = new Image();
        template.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            template.onload = resolve;
            template.onerror = () => reject(new Error('No se pudo cargar la plantilla'));
            template.src = '/assets/qr-template.png';
        });

        // Configuración del layout (2 columnas x 5 filas = 10 QRs por página)
        const qrsPerPage = 10;
        const cols = 2;
        const rows = 5;
        const marginX = 10;
        const marginY = 10;
        const qrWidth = 90;
        const qrHeight = 55;
        const spacingX = 10;
        const spacingY = 5;

        // Procesar bienes en lotes de 10
        for (let i = 0; i < bienes.length; i++) {
            const bien = bienes[i];
            const pageIndex = Math.floor(i / qrsPerPage);
            const positionInPage = i % qrsPerPage;
            const col = positionInPage % cols;
            const row = Math.floor(positionInPage / cols);

            // Mostrar progreso
            if (i % 5 === 0) {
                showToast(`Procesando QR ${i + 1} de ${bienes.length}...`, 'info');
            }

            // Agregar nueva página si es necesario
            if (i > 0 && positionInPage === 0) {
                pdf.addPage();
            }

            // Generar QR para este bien
            const qrDataURL = await generateQRCode(bien);

            // Calcular posición
            const x = marginX + col * (qrWidth + spacingX);
            const y = marginY + row * (qrHeight + spacingY);

            // Crear canvas temporal para combinar plantilla + QR
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = template.width;
            canvas.height = template.height;

            // Dibujar plantilla
            ctx.drawImage(template, 0, 0);

            // Dibujar QR
            const qrImage = new Image();
            await new Promise((resolve) => {
                qrImage.onload = () => {
                    // Posicionamiento optimizado del QR en la plantilla
                    const qrSize = Math.min(250, canvas.height * 0.7);
                    const qrX = canvas.width - qrSize - 50; // Margen derecho
                    const qrY = (canvas.height - qrSize) / 2; // Centrado vertical
                    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
                    resolve();
                };
                qrImage.onerror = () => {
                    console.error('Error al cargar QR para bien:', bien.CodigoPatrimonial);
                    resolve(); // Continuar aunque falle uno
                };
                qrImage.src = qrDataURL;
            });

            // Agregar al PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', x, y, qrWidth, qrHeight);
        }

        // Descargar PDF
        const filename = `QRs_Bienes_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);

        const totalPages = Math.ceil(bienes.length / qrsPerPage);
        showToast(`✅ PDF generado: ${bienes.length} QR(s) en ${totalPages} página(s)`, 'success');

    } catch (error) {
        console.error('Error al exportar PDF:', error);
        showToast('Error al exportar PDF: ' + error.message, 'error');
    }
}

/**
 * Muestra previsualización del QR en un modal
 * @param {Object} bienData - Datos del bien
 * @returns {Promise<string>} - HTML del QR para mostrar
 */
async function generateQRPreview(bienData) {
    try {
        const qrDataURL = await generateQRCode(bienData);
        return `
            <div class="qr-preview">
                <img src="${qrDataURL}" alt="Código QR" class="qr-image">
                <div class="qr-info">
                    <p><strong>Código:</strong> ${bienData.CodigoPatrimonial || bienData.codigoPatrimonial}</p>
                    <p><strong>Bien:</strong> ${bienData.Bien || bienData.Nombre || bienData.nombre}</p>
                    <p><strong>Categoría:</strong> ${bienData.Categoria || bienData.categoria || '-'}</p>
                    <p><strong>Estado:</strong> ${bienData.Estado || bienData.estado || '-'}</p>
                    <p><strong>Área:</strong> ${bienData.Area || bienData.area || '-'}</p>
                    <p><strong>Responsable:</strong> ${bienData.Responsable || bienData.responsable || 'Sin asignar'}</p>
                    ${(bienData.Marca || bienData.marca) ? `<p><strong>Marca:</strong> ${bienData.Marca || bienData.marca}</p>` : ''}
                    ${(bienData.Modelo || bienData.modelo) ? `<p><strong>Modelo:</strong> ${bienData.Modelo || bienData.modelo}</p>` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error al generar previsualización:', error);
        return '<p class="error">Error al generar QR. Verifica que todos los datos del bien estén completos.</p>';
    }
}

