/* ============================================
   MGHIC FinanceApp - Database Layer (IndexedDB)
   ============================================ */

const DB = {
    name: 'MGHICFinanceDB',
    version: 1,
    db: null,

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Transactions store
                if (!db.objectStoreNames.contains('transactions')) {
                    const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
                    txStore.createIndex('type', 'type', { unique: false });
                    txStore.createIndex('categoryId', 'categoryId', { unique: false });
                    txStore.createIndex('date', 'date', { unique: false });
                    txStore.createIndex('month', 'month', { unique: false });
                }

                // Categories store
                if (!db.objectStoreNames.contains('categories')) {
                    const catStore = db.createObjectStore('categories', { keyPath: 'id' });
                    catStore.createIndex('type', 'type', { unique: false });
                }

                // Savings Goals store
                if (!db.objectStoreNames.contains('savingsGoals')) {
                    const savStore = db.createObjectStore('savingsGoals', { keyPath: 'id' });
                }

                // Savings Transactions store
                if (!db.objectStoreNames.contains('savingsTransactions')) {
                    const savTxStore = db.createObjectStore('savingsTransactions', { keyPath: 'id' });
                    savTxStore.createIndex('goalId', 'goalId', { unique: false });
                    savTxStore.createIndex('date', 'date', { unique: false });
                }

                // Invoices store (binary data)
                if (!db.objectStoreNames.contains('invoices')) {
                    const invStore = db.createObjectStore('invoices', { keyPath: 'id' });
                    invStore.createIndex('transactionId', 'transactionId', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ Database initialized');
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('❌ Database error:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    // Generic CRUD operations
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    },

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    },

    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    async clearAll() {
        const stores = ['transactions', 'categories', 'savingsGoals', 'savingsTransactions', 'invoices', 'settings'];
        for (const store of stores) {
            await this.clear(store);
        }
        return true;
    },

    // Helper: Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // Helper: Get current month key (YYYY-MM)
    getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    // Helper: Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }
};