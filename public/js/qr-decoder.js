//  
// DECODIFICADOR DE QR - Para usar al escanear
//          

/**
 * Función para decodificar datos del QR con campos ultra cortos
 * Copiar esta función en tu app de escaneo o usar en consola del navegador
 */
function decodificarQR(datosQR) {
    try {
        // Parsear JSON
        const datos = JSON.parse(datosQR);

        // Mapear campos cortos a nombres completos
        const datosCompletos = {
            'Código Patrimonial': datos.c || '',
            'Nombre': datos.n || '',
            'Categoría': datos.t || '',
            'Estado': datos.e || '',
            'Área': datos.a || '',
            'Responsable': datos.r || '',
            'Marca': datos.m || '',
            'Modelo': datos.d || ''
        };

        // Mostrar datos legibles
        console.log('📦 Datos del Bien:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        Object.entries(datosCompletos).forEach(([key, value]) => {
            if (value) console.log(`${key}:`, value);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return datosCompletos;
    } catch (error) {
        console.error('Error al decodificar QR:', error);
        return null;
    }
}

// EJEMPLO DE USO:
// 1. Escanea el QR con tu app de escaneo
// 2. Copia el texto JSON que obtienes
// 3. Ejecuta en consola: decodificarQR('texto_del_qr_aqui')

// EJEMPLO:
// decodificarQR('{"c":"BIEN-2025-0001","n":"Laptop HP","t":"Equipos de Cómputo","e":"Operativo","a":"Lab Cómputo","r":"Juan Pérez","m":"HP","d":"ProBook 450"}')
