// ============================================
// INDEXEDDB - Almacenamiento Offline Local
// ============================================

class LocalDB {
    constructor() {
        this.dbName = 'InventarioDB';
        this.version = 1;
        this.db = null;
    }

    // Inicializar base de datos
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear object stores si no existen
                if (!db.objectStoreNames.contains('bienes')) {
                    const bienesStore = db.createObjectStore('bienes', { keyPath: 'IdBien' });
                    bienesStore.createIndex('CodigoPatrimonial', 'CodigoPatrimonial', { unique: true });
                    bienesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                }

                if (!db.objectStoreNames.contains('responsables')) {
                    db.createObjectStore('responsables', { keyPath: 'IdResponsable' });
                }

                if (!db.objectStoreNames.contains('catalogos')) {
                    db.createObjectStore('catalogos', { keyPath: 'tipo' });
                }

                if (!db.objectStoreNames.contains('movimientos')) {
                    db.createObjectStore('movimientos', { keyPath: 'IdMovimiento' });
                }

                if (!db.objectStoreNames.contains('pendingSync')) {
                    const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    // Obtener todos los registros de una tabla
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Obtener un registro por ID
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Guardar o actualizar un registro
    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Guardar múltiples registros
    async putMany(storeName, dataArray) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        for (const data of dataArray) {
            store.put(data);
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Eliminar un registro
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Limpiar una tabla
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // === OPERACIONES ESPECÍFICAS ===

    // Agregar operación pendiente de sincronización
    async addPendingSync(operation, storeName, data) {
        const syncData = {
            operation, // 'create', 'update', 'delete'
            storeName,
            data,
            timestamp: new Date().toISOString()
        };

        return await this.put('pendingSync', syncData);
    }

    // Obtener operaciones pendientes de sincronización
    async getPendingSync() {
        return await this.getAll('pendingSync');
    }

    // Eliminar operación sincronizada
    async removePendingSync(id) {
        return await this.delete('pendingSync', id);
    }

    // Guardar catálogos
    async saveCatalogos(catalogos) {
        await this.put('catalogos', { tipo: 'all', data: catalogos });
    }

    // Obtener catálogos
    async getCatalogos() {
        const result = await this.get('catalogos', 'all');
        return result ? result.data : null;
    }
}

// Exportar instancia global
const localDB = new LocalDB();
