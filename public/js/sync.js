// 
// SYNC - Sincronización Online/Offline
// 

class SyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.isSyncing = false;
        this.setupListeners();
    }

    // Configurar listeners de conexión
    setupListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus(true);
            this.syncPendingOperations();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus(false);
        });
    }

    // Actualizar indicador de conexión en UI
    updateConnectionStatus(online) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        const dot = statusElement.querySelector('.status-dot');
        const text = statusElement.querySelector('.status-text');

        if (online) {
            dot.classList.remove('offline');
            dot.classList.add('online');
            text.textContent = 'Online';
        } else {
            dot.classList.remove('online');
            dot.classList.add('offline');
            text.textContent = 'Offline';
        }
    }

    // Mostrar indicador de sincronización
    showSyncIndicator(show) {
        const syncElement = document.getElementById('sync-status');
        if (syncElement) {
            syncElement.classList.toggle('hidden', !show);
        }
    }

    // Sincronizar operaciones pendientes
    async syncPendingOperations() {
        if (!this.isOnline || this.isSyncing) return;

        this.isSyncing = true;
        this.showSyncIndicator(true);

        try {
            const pending = await localDB.getPendingSync();

            if (pending.length === 0) {
                this.showSyncIndicator(false);
                this.isSyncing = false;
                return;
            }

            console.log(`🔄 Sincronizando ${pending.length} operaciones pendientes...`);

            for (const item of pending) {
                try {
                    await this.syncOperation(item);
                    await localDB.removePendingSync(item.id);
                    console.log(`✅ Operación sincronizada: ${item.operation} en ${item.storeName}`);
                } catch (error) {
                    console.error(`❌ Error al sincronizar operación:`, error);
                    // Continuar con las demás operaciones
                }
            }

            // Actualizar datos locales desde el servidor
            await this.syncFromServer();

            showToast('Sincronización completada', 'success');

        } catch (error) {
            console.error('Error en sincronización:', error);
            showToast('Error en sincronización', 'error');
        } finally {
            this.showSyncIndicator(false);
            this.isSyncing = false;
        }
    }

    // Sincronizar una operación específica
    async syncOperation(item) {
        const { operation, storeName, data } = item;

        switch (storeName) {
            case 'bienes':
                if (operation === 'create') {
                    await api.createBien(data);
                } else if (operation === 'update') {
                    await api.updateBien(data.IdBien, data);
                } else if (operation === 'delete') {
                    await api.deleteBien(data.IdBien);
                }
                break;

            case 'responsables':
                if (operation === 'create') {
                    await api.createResponsable(data);
                } else if (operation === 'update') {
                    await api.updateResponsable(data.IdResponsable, data);
                } else if (operation === 'delete') {
                    await api.deleteResponsable(data.IdResponsable);
                }
                break;

            case 'movimientos':
                if (operation === 'create') {
                    await api.createMovimiento(data);
                }
                break;
        }
    }

    // Sincronizar datos desde el servidor
    async syncFromServer() {
        if (!this.isOnline) return;

        try {
            // Sincronizar catálogos
            const catalogos = await api.getCatalogos();
            await localDB.saveCatalogos(catalogos);

            // Sincronizar bienes
            const bienes = await api.getBienes();
            await localDB.clear('bienes');
            await localDB.putMany('bienes', bienes);

            // Sincronizar responsables
            const responsables = await api.getResponsables();
            await localDB.clear('responsables');
            await localDB.putMany('responsables', responsables);

            console.log('✅ Datos sincronizados desde el servidor');

        } catch (error) {
            console.error('Error al sincronizar desde servidor:', error);
        }
    }

    // Operación híbrida: intentar online, fallback a offline
    async hybridOperation(operation, onlineFunc, offlineFunc) {
        if (this.isOnline) {
            try {
                const result = await onlineFunc();
                // También guardar en local para cache
                if (offlineFunc) {
                    await offlineFunc(result);
                }
                return result;
            } catch (error) {
                console.error('Error en operación online, usando offline:', error);
                if (offlineFunc) {
                    return await offlineFunc();
                }
                throw error;
            }
        } else {
            // Modo offline
            if (!offlineFunc) {
                throw new Error('Operación no disponible offline');
            }
            return await offlineFunc();
        }
    }
}

// Exportar instancia global
const syncManager = new SyncManager();
