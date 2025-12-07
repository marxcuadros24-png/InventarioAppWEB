// ============================================
// QR GENERATOR - Generación de Códigos QR
// Sistema de Inventario Institucional
// Usando: qrcode-generator v1.4.4
// ============================================

/**
 * Genera un código QR con información completa del bien
 * Usa qrcode-generator que maneja automáticamente la versión del QR
 * @param {Object} bien - Objeto con datos del bien
 * @returns {Promise<string>} - Data URL del QR generado
 */
async function generateQRWithData(bien) {
    return new Promise((resolve, reject) => {
        try {
            const codigo = bien.CodigoPatrimonial || bien.codigoPatrimonial || '';

            if (!codigo) {
                reject(new Error('Código patrimonial requerido'));
                return;
            }

            // Crear texto compacto para el QR
            const truncate = (text, max) => {
                if (!text) return '-';
                return text.length > max ? text.substring(0, max) + '..' : text;
            };

            const nombre = truncate(bien.Bien || bien.Nombre, 25);
            const area = truncate(bien.Area, 20);
            const responsable = truncate(bien.Responsable, 20);

            // Formatear fecha
            let fecha = '-';
            const fechaRaw = bien.FechaAdquisicion || bien.FechaRegistro;
            if (fechaRaw) {
                const d = new Date(fechaRaw);
                fecha = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            }

            // Texto del QR
            const qrText = `COD:${codigo}
BIEN:${nombre}
AREA:${area}
RESP:${responsable}
FECHA:${fecha}`;

            console.log('📊 QR contenido:', qrText.length, 'caracteres');

            // Usar qrcode-generator (versión automática = 0)
            const typeNumber = 0; // Auto-detect version
            const errorCorrectionLevel = 'L'; // L=7%, M=15%, Q=25%, H=30%
            const qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData(qrText);
            qr.make();

            // Crear imagen como Data URL
            const dataURL = qr.createDataURL(4, 0); // cellSize=4, margin=0
            resolve(dataURL);

        } catch (error) {
            console.error('Error generando QR:', error);
            reject(error);
        }
    });
}

/**
 * Genera un código QR simple con solo el código (fallback)
 */
async function generateQRSimple(codigoPatrimonial) {
    return new Promise((resolve, reject) => {
        try {
            if (!codigoPatrimonial) {
                reject(new Error('Código patrimonial requerido'));
                return;
            }

            const qr = qrcode(0, 'M');
            qr.addData(codigoPatrimonial);
            qr.make();

            const dataURL = qr.createDataURL(4, 0);
            resolve(dataURL);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Genera previsualización del QR para mostrar en modal
 * @param {Object} bienData - Datos del bien
 * @returns {Promise<string>} - HTML del QR
 */
async function generateQRPreview(bienData) {
    try {
        const codigo = bienData.CodigoPatrimonial || bienData.codigoPatrimonial;
        const qrDataURL = await generateQRWithData(bienData);

        return `
            <div class="qr-preview">
                <img src="${qrDataURL}" alt="Código QR" class="qr-image">
                <p class="qr-code-text"><strong>${codigo}</strong></p>
            </div>
        `;
    } catch (error) {
        console.error('Error al generar QR:', error);
        return '<p class="error">Error al generar código QR</p>';
    }
}

/**
 * Exporta un QR individual como PNG con la plantilla del IEST
 * @param {number} idBien - ID del bien
 */
async function exportSingleQRImage(idBien) {
    try {
        showToast('Generando QR...', 'info');

        const bien = await api.getBien(idBien);
        const codigo = bien.CodigoPatrimonial;
        const qrDataURL = await generateQRWithData(bien);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const template = new Image();
        template.crossOrigin = 'anonymous';

        template.onload = async () => {
            canvas.width = template.width;
            canvas.height = template.height;

            ctx.drawImage(template, 0, 0);

            const qrImage = new Image();
            qrImage.onload = () => {
                const qrSize = Math.min(220, canvas.height * 0.65);
                const qrX = canvas.width - qrSize - 40;
                const qrY = (canvas.height - qrSize) / 2 - 10;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 40);
                ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

                ctx.fillStyle = '#000000';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                // Mostrar nombre del bien (truncado si es muy largo)
                const nombreBien = (bien.Bien || bien.Nombre || codigo).substring(0, 28);
                ctx.fillText(nombreBien, qrX + qrSize / 2, qrY + qrSize + 20);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        showToast('Error al generar imagen', 'error');
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `QR_${codigo}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('QR descargado exitosamente', 'success');
                }, 'image/png');
            };

            qrImage.onerror = () => {
                showToast('Error al procesar código QR', 'error');
            };

            qrImage.src = qrDataURL;
        };

        template.onerror = () => {
            downloadQRWithoutTemplate(qrDataURL, codigo);
        };

        template.src = '/assets/qr-template.png';

    } catch (error) {
        console.error('Error al exportar QR:', error);
        showToast('Error al exportar QR: ' + error.message, 'error');
    }
}

/**
 * Descarga el QR sin plantilla (fallback)
 */
function downloadQRWithoutTemplate(qrDataURL, codigo) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 350;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrImage = new Image();
    qrImage.onload = () => {
        ctx.drawImage(qrImage, 22, 20, 256, 256);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(codigo, 150, 310);

        ctx.font = '12px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText('IEST Coracora - Inventario', 150, 335);

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `QR_${codigo}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('QR descargado exitosamente', 'success');
        }, 'image/png');
    };

    qrImage.src = qrDataURL;
}

/**
 * Exporta múltiples QRs como PDF usando la plantilla institucional
 * 10 etiquetas por página (2 columnas x 5 filas)
 * @param {Array<number>} selectedIds - IDs de bienes seleccionados (vacío = todos)
 */
async function exportMultipleQRPDF(selectedIds = []) {
    try {
        showToast('Preparando PDF...', 'info');

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

        if (!window.jspdf) {
            showToast('Error: Librería jsPDF no disponible', 'error');
            return;
        }

        // Cargar plantilla
        const template = new Image();
        template.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            template.onload = resolve;
            template.onerror = () => reject(new Error('No se pudo cargar la plantilla'));
            template.src = '/assets/qr-template.png';
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const config = {
            marginX: 8,
            marginY: 8,
            cols: 2,
            rows: 5,
            labelWidth: 95,
            labelHeight: 54,
            spacingX: 5,
            spacingY: 2
        };

        const qrsPerPage = config.cols * config.rows;

        for (let i = 0; i < bienes.length; i++) {
            const bien = bienes[i];
            const codigo = bien.CodigoPatrimonial;

            if (i % 5 === 0) {
                showToast(`Procesando ${i + 1} de ${bienes.length}...`, 'info');
            }

            if (i > 0 && i % qrsPerPage === 0) {
                pdf.addPage();
            }

            const posInPage = i % qrsPerPage;
            const col = posInPage % config.cols;
            const row = Math.floor(posInPage / config.cols);
            const x = config.marginX + col * (config.labelWidth + config.spacingX);
            const y = config.marginY + row * (config.labelHeight + config.spacingY);

            try {
                const qrDataURL = await generateQRWithData(bien);

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = template.width;
                canvas.height = template.height;

                ctx.drawImage(template, 0, 0);

                const qrImg = new Image();
                await new Promise((resolve) => {
                    qrImg.onload = () => {
                        // Plantilla: 600px x 300px
                        // QR centrado en la mitad derecha (300-600px)
                        const qrSize = 160;
                        const qrX = 372;     // 5px más a la izquierda
                        const qrY = 62;      // 15px más abajo

                        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                        // Solo nombre del bien debajo del QR
                        ctx.fillStyle = '#000000';
                        ctx.textAlign = 'center';
                        ctx.font = 'bold 13px Arial';
                        const centerX = qrX + qrSize / 2;
                        const nombreBien = (bien.Bien || bien.Nombre || '').substring(0, 28);
                        ctx.fillText(nombreBien, centerX, qrY + qrSize + 22);

                        resolve();
                    };
                    qrImg.onerror = resolve;
                    qrImg.src = qrDataURL;
                });

                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', x, y, config.labelWidth, config.labelHeight);

            } catch (err) {
                console.error(`Error con bien ${codigo}:`, err);
            }
        }

        const fecha = new Date().toISOString().split('T')[0];
        pdf.save(`QRs_Inventario_${fecha}.pdf`);

        const totalPages = Math.ceil(bienes.length / qrsPerPage);
        showToast(`✅ PDF generado: ${bienes.length} QR(s) en ${totalPages} página(s)`, 'success');

    } catch (error) {
        console.error('Error al generar PDF:', error);
        showToast('Error al generar PDF: ' + error.message, 'error');
    }
}
