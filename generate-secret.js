// ============================================
// Generador de JWT_SECRET Seguro
// ============================================

const crypto = require('crypto');

console.log('\n Generador de JWT_SECRET Seguro\n');
console.log('═══════════════════════════════════════════════════════════\n');

// Generar 3 opciones diferentes
for (let i = 1; i <= 3; i++) {
    const secret = crypto.randomBytes(64).toString('hex');
    console.log(`Opción ${i}:`);
    console.log(secret);
    console.log('');
}

console.log('═══════════════════════════════════════════════════════════\n');
console.log('Instrucciones:\n');
console.log('1. Copia una de las claves generadas arriba');
console.log('2. Abre tu archivo .env');
console.log('3. Reemplaza el valor de JWT_SECRET');
console.log('4. Guarda el archivo');
console.log('5. Reinicia el servidor (npm start)\n');
console.log('NUNCA compartas esta clave ni la subas a GitHub!\n');
