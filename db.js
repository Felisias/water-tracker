// Управление IndexedDB для упражнений и тренировок
class HealthFlowDB {
    constructor() {
        this.db = null;
        this.dbName = 'HealthFlowDB';
        this.version = 2; // Увеличиваем версию для новых хранилищ
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
                    exerciseStore.createIndex('name', 'name', { unique: false });
                    exerciseStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // Создаём хранилище для тренировок (шаблоны)
                if (!db.objectStoreNames.contains('workouts')) {
                    const workoutStore = db.createObjectStore('workouts', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    workoutStore.createIndex('name', 'name', { unique: false });
                    workoutStore.createIndex('createdAt', 'createdAt', { unique: false });
                    workoutStore.createIndex('isFavorite', 'isFavorite', { unique: false });
                }
                
                // Создаём хранилище для истории тренировок
                if (!db.objectStoreNames.contains('workoutHistory')) {
                    const historyStore = db.createObjectStore('workoutHistory', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    historyStore.createIndex('workoutId', 'workoutId', { unique: false });
                    historyStore.createIndex('date', 'date', { unique: false });
                    historyStore.createIndex('completedAt', 'completedAt', { unique: false });
                }
                
                // Создаём хранилище для статистики упражнений
                if (!db.objectStoreNames.contains('exerciseStats')) {
                    const statsStore = db.createObjectStore('exerciseStats', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    statsStore.createIndex('exerciseId', 'exerciseId', { unique: false });
                    statsStore.createIndex('date', 'date', { unique: false });
                }
                
                // Создаём хранилище для прогресса
                if (!db.objectStoreNames.contains('progress')) {
                    const progressStore = db.createObjectStore('progress', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    progressStore.createIndex('type', 'type', { unique: false });
                    progressStore.createIndex('date', 'date', { unique: false });
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
    
    async getAll(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            let store = transaction.objectStore(storeName);
            
            let request;
            if (indexName && query) {
                const index = store.index(indexName);
                const range = IDBKeyRange.only(query);
                request = index.getAll(range);
            } else if (indexName) {
                const index = store.index(indexName);
                request = index.getAll();
            } else {
                request = store.getAll();
            }
            
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
    
    async query(storeName, indexName, query) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(query);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

// Экспортируем экземпляр базы данных
export const db = new HealthFlowDB();
