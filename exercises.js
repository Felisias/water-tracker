[file name]: exercises.js
[file content begin]
// Управление упражнениями для модуля тренировок
class ExerciseManager {
    constructor(db) {
        this.db = db;
        this.currentExercises = [];
        this.categories = [
            { id: 'chest', name: 'Грудь', emoji: '💪' },
            { id: 'back', name: 'Спина', emoji: '🏋️' },
            { id: 'legs', name: 'Ноги', emoji: '🦵' },
            { id: 'shoulders', name: 'Плечи', emoji: '👤' },
            { id: 'arms', name: 'Руки', emoji: '💪' },
            { id: 'abs', name: 'Пресс', emoji: '🔥' },
            { id: 'cardio', name: 'Кардио', emoji: '🏃' },
            { id: 'other', name: 'Другое', emoji: '✨' }
        ];
    }

    async init() {
        await this.loadExercises();
        console.log('✅ ExerciseManager готов');
    }

    async loadExercises() {
        try {
            this.currentExercises = await this.db.getAll('exercises');
            
            // Если упражнений нет, добавляем базовые
            if (this.currentExercises.length === 0) {
                await this.addDefaultExercises();
            }
            
            return this.currentExercises;
        } catch (error) {
            console.error('❌ Ошибка загрузки упражнений:', error);
            return [];
        }
    }

    async addDefaultExercises() {
        const defaultExercises = [
            {
                name: 'Жим лёжа',
                description: 'Базовое упражнение для развития грудных мышц',
                category: 'chest',
                emoji: '🏋️',
                defaultSets: 4,
                defaultReps: '8-12',
                tips: 'Держите лопатки сведёнными, не отрывайте таз от скамьи'
            },
            {
                name: 'Приседания со штангой',
                description: 'Король всех упражнений для ног',
                category: 'legs',
                emoji: '🦵',
                defaultSets: 4,
                defaultReps: '6-10',
                tips: 'Спина прямая, колени не выходят за носки'
            },
            {
                name: 'Становая тяга',
                description: 'Развивает всю заднюю цепь',
                category: 'back',
                emoji: '🏋️‍♂️',
                defaultSets: 3,
                defaultReps: '5-8',
                tips: 'Сохраняйте спину прямой, тяните ногами'
            },
            {
                name: 'Подтягивания',
                description: 'Лучшее упражнение для спины с весом тела',
                category: 'back',
                emoji: '🤸',
                defaultSets: 4,
                defaultReps: 'до отказа',
                tips: 'Полный вис в нижней точке, подбородок над перекладиной'
            },
            {
                name: 'Отжимания',
                description: 'Базовое упражнение для груди и трицепса',
                category: 'chest',
                emoji: '💪',
                defaultSets: 3,
                defaultReps: '15-20',
                tips: 'Корпус напряжён, локти под 45 градусов'
            },
            {
                name: 'Планка',
                description: 'Укрепление кора и мышц стабилизаторов',
                category: 'abs',
                emoji: '🛡️',
                defaultSets: 3,
                defaultReps: '60 сек',
                tips: 'Тело образует прямую линию, ягодицы напряжены'
            },
            {
                name: 'Бег на дорожке',
                description: 'Кардио для выносливости и жиросжигания',
                category: 'cardio',
                emoji: '🏃',
                defaultSets: 1,
                defaultReps: '20-30 мин',
                tips: 'Соблюдайте пульсовую зону 120-150 уд/мин'
            }
        ];

        for (const exercise of defaultExercises) {
            await this.addExercise(exercise);
        }
        
        await this.loadExercises();
    }

    async addExercise(exerciseData) {
        const exercise = {
            ...exerciseData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: true
        };

        try {
            const id = await this.db.add('exercises', exercise);
            exercise.id = id;
            this.currentExercises.push(exercise);
            
            console.log('✅ Упражнение добавлено:', exercise.name);
            return exercise;
        } catch (error) {
            console.error('❌ Ошибка добавления упражнения:', error);
            throw error;
        }
    }

    async updateExercise(id, exerciseData) {
        const exercise = {
            ...exerciseData,
            id: parseInt(id),
            updatedAt: new Date().toISOString()
        };

        try {
            await this.db.update('exercises', exercise);
            
            // Обновляем в локальном массиве
            const index = this.currentExercises.findIndex(e => e.id === parseInt(id));
            if (index !== -1) {
                this.currentExercises[index] = exercise;
            }
            
            console.log('✅ Упражнение обновлено:', exercise.name);
            return exercise;
        } catch (error) {
            console.error('❌ Ошибка обновления упражнения:', error);
            throw error;
        }
    }

    async deleteExercise(id) {
        try {
            await this.db.delete('exercises', parseInt(id));
            
            // Удаляем из локального массива
            this.currentExercises = this.currentExercises.filter(e => e.id !== parseInt(id));
            
            console.log('✅ Упражнение удалено:', id);
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления упражнения:', error);
            throw error;
        }
    }

    getExerciseById(id) {
        return this.currentExercises.find(e => e.id === parseInt(id));
    }

    getExercisesByCategory(category) {
        return this.currentExercises.filter(e => e.category === category);
    }

    searchExercises(query) {
        const lowerQuery = query.toLowerCase();
        return this.currentExercises.filter(exercise => 
            exercise.name.toLowerCase().includes(lowerQuery) ||
            exercise.description.toLowerCase().includes(lowerQuery)
        );
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Неизвестно';
    }

    getCategoryEmoji(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.emoji : '❓';
    }

    getAllCategories() {
        return this.categories;
    }

    getStats() {
        const stats = {
            total: this.currentExercises.length,
            byCategory: {}
        };

        this.categories.forEach(category => {
            stats.byCategory[category.id] = 
                this.currentExercises.filter(e => e.category === category.id).length;
        });

        return stats;
    }
}

// Экспортируем менеджер упражнений
let exerciseManagerInstance = null;

export async function initExerciseManager(db) {
    console.log('Инициализация менеджера упражнений...');
    
    exerciseManagerInstance = new ExerciseManager(db);
    await exerciseManagerInstance.init();
    
    console.log('✅ Менеджер упражнений готов');
    return exerciseManagerInstance;
}

export function getExerciseManager() {
    return exerciseManagerInstance;
}
[file content end]