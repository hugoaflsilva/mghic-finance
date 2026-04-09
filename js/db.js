/* ============================================
   MGHIC FinanceApp - Database Layer (IndexedDB)
   ============================================ */

const DB = {
    name: 'MGHICFinanceDB',
    version: 2,  // Bumped version to trigger upgrade
    db: null,

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Delete old stores if upgrading
                const storeNames = ['transactions', 'categories', 'savingsGoals', 'savingsTransactions', 'invoices', 'settings'];
                storeNames.forEach(name => {
                    if (db.objectStoreNames.contains(name)) {
                        db.deleteObjectStore(name);
                    }
                });

                // Transactions store
                const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
                txStore.createIndex('type', 'type', { unique: false });
                txStore.createIndex('categoryId', 'categoryId', { unique: false });
                txStore.createIndex('date', 'date', { unique: false });

                // Categories store
                const catStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
                catStore.createIndex('type', 'type', { unique: false });

                // Savings Goals store
                db.createObjectStore('savingsGoals', { keyPath: 'id', autoIncrement: true });

                // Invoices store
                const invStore = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
                invStore.createIndex('transactionId', 'transactionId', { unique: false });

                // Settings store
                db.createObjectStore('settings', { keyPath: 'key' });

                console.log('✅ Database schema created/upgraded');
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

    // Add record (auto-generates ID)
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            // Remove id if present so autoIncrement works
            const cleanData = { ...data };
            if (cleanData.id === undefined || cleanData.id === null) {
                delete cleanData.id;
            }
            const request = store.add(cleanData);
            request.onsuccess = () => {
                cleanData.id = request.result;
                resolve(cleanData);
            };
            request.onerror = () => reject(request.error);
        });
    },

    // Update record
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    },

    // Get single record
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Get all records
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    // Get by index
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

    // Delete record
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    // Clear single store
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    // Clear all stores
    async clearAll() {
        const stores = ['transactions', 'categories', 'savingsGoals', 'invoices', 'settings'];
        for (const store of stores) {
            await this.clear(store);
        }
        return true;
    },

    // Get current month key (YYYY-MM)
    getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }
};