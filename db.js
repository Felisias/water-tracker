// Управление IndexedDB для упражнений и тренировок
class HealthFlowDB {
    constructor() {
        this.db = null;
        this.dbName = 'HealthFlowDB';
        this.version = 1;
    }
    
    // Инициализация базы данных
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Создаём хранилище для упражнений
                if (!db.objectStoreNames.contains('exercises')) {
                    const exerciseStore = db.createObjectStore('exercises', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    exerciseStore.createIndex('category', 'category', { unique: false });
                    exerciseStore.createIndex('name', 'name', { unique: true });
                }
                
                // Создаём хранилище для тренировок
                if (!db.objectStoreNames.contains('workouts')) {
                    const workoutStore = db.createObjectStore('workouts', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    workoutStore.createIndex('date', 'date', { unique: false });
                    workoutStore.createIndex('name', 'name', { unique: false });
                }
                
                // Создаём хранилище для истории тренировок
                if (!db.objectStoreNames.contains('workoutHistory')) {
                    const historyStore = db.createObjectStore('workoutHistory', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    historyStore.createIndex('workoutId', 'workoutId', { unique: false });
                    historyStore.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }
    
    // Общие методы CRUD
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

// Экспортируем экземпляр базы данных
export const db = new HealthFlowDB();
