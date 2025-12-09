// Loading Helper - Mejora percepción de rendimiento

class LoadingHelper {
    static showSkeleton(container, type = 'table', count = 5) {
        let skeletonHTML = '';

        switch (type) {
            case 'stats':
                skeletonHTML = `
                    <div class="skeleton-grid">
                        ${Array(4).fill('').map(() => '<div class="skeleton skeleton-stat-card"></div>').join('')}
                    </div>
                `;
                break;

            case 'table':
                skeletonHTML = `
                    <div class="loading-state">
                        ${Array(count).fill('').map(() => '<div class="skeleton skeleton-table-row"></div>').join('')}
                    </div>
                `;
                break;

            case 'chart':
                skeletonHTML = `
                    <div class="loading-state">
                        <div class="skeleton skeleton-chart"></div>
                    </div>
                `;
                break;

            case 'card':
                skeletonHTML = `
                    <div class="loading-state">
                        ${Array(count).fill('').map(() => '<div class="skeleton skeleton-card"></div>').join('')}
                    </div>
                `;
                break;
        }

        if (container) {
            container.innerHTML = skeletonHTML;
        }

        return skeletonHTML;
    }

    static fadeIn(element) {
        if (element) {
            element.classList.add('fade-in');
            setTimeout(() => {
                element.classList.remove('fade-in');
            }, 400);
        }
    }

    static startContentLoad(element) {
        if (element) {
            element.classList.add('content-loading');
        }
    }

    static endContentLoad(element) {
        if (element) {
            element.classList.remove('content-loading');
            element.classList.add('content-loaded');
            this.fadeIn(element);
        }
    }
}

// Cache simple para datos
class DataCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.TTL = 60000; // 1 minuto
    }

    set(key, data) {
        this.cache.set(key, data);
        this.timestamps.set(key, Date.now());
    }

    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const timestamp = this.timestamps.get(key);
        const age = Date.now() - timestamp;

        if (age > this.TTL) {
            this.cache.delete(key);
            this.timestamps.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }

    clearKey(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
    }
}

// Instancia global
const dataCache = new DataCache();

// Debounce helper para reducir llamadas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Request Animation Frame para operaciones pesadas
function deferredUpdate(callback) {
    requestAnimationFrame(() => {
        requestAnimationFrame(callback);
    });
}

window.LoadingHelper = LoadingHelper;
window.dataCache = dataCache;
window.debounce = debounce;
window.deferredUpdate = deferredUpdate;
