// ============================================
// QR GENERATOR - Generación de Códigos QR
// Sistema de Inventario Institucional
// ============================================

/**
 * Genera un código QR simple con solo el código patrimonial
 * @param {string} codigoPatrimonial - Código patrimonial del bien
 * @returns {Promise<string>} - Data URL del QR generado
 */
async function generateQRSimple(codigoPatrimonial) {
    return new Promise((resolve, reject) => {
        if (!codigoPatrimonial) {
            reject(new Error('Código patrimonial requerido'));
            return;
        }

        // Crear elemento temporal para generar QR
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        try {
            // Generar QR con solo el código patrimonial
            new QRCode(tempDiv, {
                text: codigoPatrimonial,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
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
            }, 150);
        } catch (error) {
            document.body.removeChild(tempDiv);
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
        const qrDataURL = await generateQRSimple(codigo);

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

        // Obtener datos del bien
        const bien = await api.getBien(idBien);
        const codigo = bien.CodigoPatrimonial;

        // Generar QR
        const qrDataURL = await generateQRSimple(codigo);

        // Crear canvas para combinar plantilla + QR + texto
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Cargar plantilla
        const template = new Image();
        template.crossOrigin = 'anonymous';

        template.onload = async () => {
            // Establecer tamaño del canvas
            canvas.width = template.width;
            canvas.height = template.height;

            // Dibujar plantilla
            ctx.drawImage(template, 0, 0);

            // Cargar y dibujar QR
            const qrImage = new Image();
            qrImage.onload = () => {
                // Posicionar QR en el lado derecho de la plantilla
                const qrSize = Math.min(220, canvas.height * 0.65);
                const qrX = canvas.width - qrSize - 40;
                const qrY = (canvas.height - qrSize) / 2 - 10;

                // Dibujar fondo blanco para el QR
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 40);

                // Dibujar QR
                ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

                // Agregar código debajo del QR
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(codigo, qrX + qrSize / 2, qrY + qrSize + 20);

                // Descargar imagen
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
            // Si no hay plantilla, descargar solo el QR
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

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrImage = new Image();
    qrImage.onload = () => {
        // Dibujar QR centrado
        ctx.drawImage(qrImage, 22, 20, 256, 256);

        // Agregar código
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(codigo, 150, 310);

        // Agregar texto IEST
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText('IEST Coracora - Inventario', 150, 335);

        // Descargar
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

        // Obtener bienes
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

        // Verificar que jsPDF esté disponible
        if (!window.jspdf) {
            showToast('Error: Librería jsPDF no disponible', 'error');
            return;
        }

        // Cargar la plantilla primero
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

        // Configuración: 2 columnas x 5 filas = 10 QRs por página
        // Tamaño ajustado para que quepan 10 etiquetas con la plantilla
        const config = {
            marginX: 8,
            marginY: 8,
            cols: 2,
            rows: 5,
            labelWidth: 95,  // mm
            labelHeight: 54, // mm
            spacingX: 5,
            spacingY: 2
        };

        const qrsPerPage = config.cols * config.rows;

        for (let i = 0; i < bienes.length; i++) {
            const bien = bienes[i];
            const codigo = bien.CodigoPatrimonial;

            // Mostrar progreso cada 5 bienes
            if (i % 5 === 0) {
                showToast(`Procesando ${i + 1} de ${bienes.length}...`, 'info');
            }

            // Nueva página si es necesario
            if (i > 0 && i % qrsPerPage === 0) {
                pdf.addPage();
            }

            // Calcular posición en la página
            const posInPage = i % qrsPerPage;
            const col = posInPage % config.cols;
            const row = Math.floor(posInPage / config.cols);
            const x = config.marginX + col * (config.labelWidth + config.spacingX);
            const y = config.marginY + row * (config.labelHeight + config.spacingY);

            try {
                // Generar QR
                const qrDataURL = await generateQRSimple(codigo);

                // Crear canvas con la plantilla
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Usar dimensiones de la plantilla
                canvas.width = template.width;
                canvas.height = template.height;

                // Dibujar plantilla
                ctx.drawImage(template, 0, 0);

                // Cargar y dibujar el QR en la posición correcta de la plantilla
                const qrImg = new Image();
                await new Promise((resolve) => {
                    qrImg.onload = () => {
                        // Ajustar posición del QR - más cerca del logo (centro-derecha)
                        const qrSize = Math.min(template.height * 0.65, 180);
                        // Posicionar el QR al lado del logo, no tan a la derecha
                        const qrX = template.width * 0.55;  // 55% desde la izquierda
                        const qrY = (template.height - qrSize) / 2 - 15;

                        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                        // Agregar nombre del bien debajo del QR
                        ctx.fillStyle = '#000000';
                        ctx.font = 'bold 14px Arial';
                        ctx.textAlign = 'center';

                        // Truncar nombre si es muy largo
                        const nombreBien = (bien.Bien || bien.Nombre || codigo).substring(0, 25);
                        ctx.fillText(nombreBien, qrX + qrSize / 2, qrY + qrSize + 20);

                        resolve();
                    };
                    qrImg.onerror = resolve;
                    qrImg.src = qrDataURL;
                });

                // Agregar la etiqueta al PDF
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', x, y, config.labelWidth, config.labelHeight);

            } catch (err) {
                console.error(`Error con bien ${codigo}:`, err);
            }
        }

        // Descargar PDF
        const fecha = new Date().toISOString().split('T')[0];
        pdf.save(`QRs_Inventario_${fecha}.pdf`);

        const totalPages = Math.ceil(bienes.length / qrsPerPage);
        showToast(`✅ PDF generado: ${bienes.length} QR(s) en ${totalPages} página(s)`, 'success');

    } catch (error) {
        console.error('Error al generar PDF:', error);
        showToast('Error al generar PDF: ' + error.message, 'error');
    }
}
