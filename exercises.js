// Управление базой упражнений
class ExerciseManager {
    constructor() {
        this.exercises = [];
        this.categories = [
            { id: 'chest', name: 'Грудь', emoji: '💪', color: '#FF6B6B' },
            { id: 'back', name: 'Спина', emoji: '🦾', color: '#06B48F' },
            { id: 'legs', name: 'Ноги', emoji: '🦵', color: '#4ECDC4' },
            { id: 'shoulders', name: 'Плечи', emoji: '👤', color: '#FF9A76' },
            { id: 'arms', name: 'Руки', emoji: '💪', color: '#95E1D3' },
            { id: 'abs', name: 'Пресс', emoji: '🦴', color: '#FCE38A' },
            { id: 'cardio', name: 'Кардио', emoji: '🏃', color: '#F38181' },
            { id: 'full_body', name: 'Все тело', emoji: '👥', color: '#87CEEB' },
            { id: 'stretch', name: 'Растяжка', emoji: '🧘', color: '#A8E6CF' }
        ];
    }
    
    async init() {
        try {
            await this.loadExercises();
            console.log('ExerciseManager инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации ExerciseManager:', error);
        }
    }
    
    async loadExercises() {
        // Загружаем из IndexedDB
        const db = (await import('./db.js')).db;
        if (await db.init()) {
            this.exercises = await db.getAll('exercises');
            
            // Если упражнений нет, добавляем базовые
            if (this.exercises.length === 0) {
                await this.createDefaultExercises();
            }
        }
        
        return this.exercises;
    }
    
    async createDefaultExercises() {
        const defaultExercises = [
            {
                name: 'Жим лёжа',
                description: 'Базовое упражнение для развития грудных мышц',
                category: 'chest',
                emoji: '🛏️',
                difficulty: 'intermediate',
                createdAt: new Date().toISOString()
            },
            {
                name: 'Приседания',
                description: 'Король упражнений для ног',
                category: 'legs',
                emoji: '🦵',
                difficulty: 'beginner',
                createdAt: new Date().toISOString()
            },
            {
                name: 'Тяга верхнего блока',
                description: 'Упражнение для широчайших мышц спины',
                category: 'back',
                emoji: '⬇️',
                difficulty: 'beginner',
                createdAt: new Date().toISOString()
            },
            {
                name: 'Жим штанги стоя',
                description: 'Базовое упражнение для дельтовидных мышц',
                category: 'shoulders',
                emoji: '🏋️',
                difficulty: 'intermediate',
                createdAt: new Date().toISOString()
            },
            {
                name: 'Подъём штанги на бицепс',
                description: 'Классическое упражнение для бицепса',
                category: 'arms',
                emoji: '💪',
                difficulty: 'beginner',
                createdAt: new Date().toISOString()
            },
            {
                name: 'Планка',
                description: 'Статическое упражнение для пресса и кора',
                category: 'abs',
                emoji: '🛡️',
                difficulty: 'beginner',
                createdAt: new Date().toISOString()
            },
            {
                name: 'Бег на дорожке',
                description: 'Кардио тренировка для выносливости',
                category: 'cardio',
                emoji: '🏃',
                difficulty: 'beginner',
                createdAt: new Date().toISOString()
            }
        ];
        
        const db = (await import('./db.js')).db;
        for (const exercise of defaultExercises) {
            await db.add('exercises', exercise);
        }
        
        this.exercises = await this.loadExercises();
    }
    
    async addExercise(exerciseData) {
        const exercise = {
            ...exerciseData,
            createdAt: new Date().toISOString(),
            isCustom: true
        };
        
        const db = (await import('./db.js')).db;
        const id = await db.add('exercises', exercise);
        
        exercise.id = id;
        this.exercises.push(exercise);
        
        return exercise;
    }
    
    async updateExercise(id, exerciseData) {
        const db = (await import('./db.js')).db;
        const exercise = await db.get('exercises', id);
        
        if (!exercise) {
            throw new Error('Упражнение не найдено');
        }
        
        const updatedExercise = { ...exercise, ...exerciseData };
        await db.update('exercises', updatedExercise);
        
        // Обновляем в локальном массиве
        const index = this.exercises.findIndex(e => e.id === id);
        if (index !== -1) {
            this.exercises[index] = updatedExercise;
        }
        
        return updatedExercise;
    }
    
    async deleteExercise(id) {
        const db = (await import('./db.js')).db;
        await db.delete('exercises', id);
        
        // Удаляем из локального массива
        this.exercises = this.exercises.filter(e => e.id !== id);
        
        return true;
    }
    
    getExercise(id) {
        return this.exercises.find(e => e.id === id);
    }
    
    getExercisesByCategory(categoryId) {
        return this.exercises.filter(e => e.category === categoryId);
    }
    
    searchExercises(query) {
        const searchQuery = query.toLowerCase();
        return this.exercises.filter(exercise => 
            exercise.name.toLowerCase().includes(searchQuery) ||
            exercise.description.toLowerCase().includes(searchQuery)
        );
    }
    
    getCategoryInfo(categoryId) {
        return this.categories.find(c => c.id === categoryId);
    }
    
    getAllCategories() {
        return this.categories;
    }
    
    getRecentExercises(limit = 5) {
        return [...this.exercises]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
    
    getFavoriteExercises() {
        return this.exercises.filter(e => e.isFavorite);
    }
}

// Экспортируем синглтон
export const exerciseManager = new ExerciseManager();
