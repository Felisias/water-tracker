// exercises.js
class ExerciseManager {
    constructor(db) {
        this.db = db;
        this.exercises = [];
        this.categories = [
            'Грудь', 'Спина', 'Ноги', 'Плечи', 
            'Руки', 'Пресс', 'Кардио', 'Растяжка'
        ];
        this.emojiMap = {
            'Грудь': '🏋️', 'Спина': '💪', 'Ноги': '🦵',
            'Плечи': '👕', 'Руки': '💪', 'Пресс': '🩲',
            'Кардио': '🏃', 'Растяжка': '🧘'
        };
    }
    
    async init() {
        await this.loadExercises();
    }
    
    async loadExercises() {
        try {
            this.exercises = await this.db.getAll('exercises');
            console.log('Упражнения загружены:', this.exercises.length);
        } catch (error) {
            console.error('Ошибка загрузки упражнений:', error);
            this.exercises = [];
        }
    }
    
    async addExercise(exerciseData) {
        const exercise = {
            ...exerciseData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            const id = await this.db.add('exercises', exercise);
            exercise.id = id;
            this.exercises.unshift(exercise);
            return exercise;
        } catch (error) {
            console.error('Ошибка добавления упражнения:', error);
            throw error;
        }
    }
    
    async updateExercise(id, updateData) {
        try {
            const exercise = await this.db.get('exercises', id);
            if (!exercise) throw new Error('Упражнение не найдено');
            
            const updated = {
                ...exercise,
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            await this.db.update('exercises', updated);
            
            // Обновляем в локальном массиве
            const index = this.exercises.findIndex(e => e.id === id);
            if (index !== -1) this.exercises[index] = updated;
            
            return updated;
        } catch (error) {
            console.error('Ошибка обновления упражнения:', error);
            throw error;
        }
    }
    
    async deleteExercise(id) {
        try {
            await this.db.delete('exercises', id);
            this.exercises = this.exercises.filter(e => e.id !== id);
            return true;
        } catch (error) {
            console.error('Ошибка удаления упражнения:', error);
            throw error;
        }
    }
    
    getExercisesByCategory(category) {
        return this.exercises.filter(e => e.category === category);
    }
    
    searchExercises(query) {
        const lowerQuery = query.toLowerCase();
        return this.exercises.filter(e => 
            e.name.toLowerCase().includes(lowerQuery) ||
            e.description.toLowerCase().includes(lowerQuery) ||
            e.category.toLowerCase().includes(lowerQuery)
        );
    }
    
    // Для начальных данных
    async seedDefaultExercises() {
        const defaultExercises = [
            {
                name: 'Жим лёжа',
                category: 'Грудь',
                emoji: '🏋️',
                description: 'Базовое упражнение для грудных мышц',
                defaultSets: 4,
                defaultReps: '8-12',
                muscles: ['Большая грудная', 'Трицепс', 'Передняя дельта']
            },
            {
                name: 'Приседания со штангой',
                category: 'Ноги',
                emoji: '🦵',
                description: 'Король упражнений для ног',
                defaultSets: 4,
                defaultReps: '6-10',
                muscles: ['Квадрицепсы', 'Ягодичные', 'Бицепс бедра']
            },
            {
                name: 'Тяга верхнего блока',
                category: 'Спина',
                emoji: '💪',
                description: 'Для ширины спины',
                defaultSets: 4,
                defaultReps: '10-15',
                muscles: ['Широчайшие', 'Трапеции', 'Бицепс']
            },
            {
                name: 'Планка',
                category: 'Пресс',
                emoji: '🩲',
                description: 'Упражнение на статику для кора',
                defaultSets: 3,
                defaultReps: '30-60 сек',
                muscles: ['Прямая мышца живота', 'Косые мышцы']
            }
        ];
        
        // Добавляем только если база пуста
        if (this.exercises.length === 0) {
            for (const ex of defaultExercises) {
                await this.addExercise(ex);
            }
            console.log('Добавлены стандартные упражнения');
        }
    }
}

export default ExerciseManager;