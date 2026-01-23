// Конструктор и управление тренировками
import { exerciseManager } from './exercises.js';
import { db } from './db.js';

class WorkoutManager {
    constructor() {
        this.workouts = [];
        this.currentWorkout = null;
        this.activeWorkout = null;
    }
    
    async init() {
        try {
            await exerciseManager.init();
            await this.loadWorkouts();
            console.log('WorkoutManager инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации WorkoutManager:', error);
        }
    }
    
    async loadWorkouts() {
        this.workouts = await db.getAll('workouts');
        return this.workouts;
    }
    
    async createWorkout(workoutData) {
        const workout = {
            name: workoutData.name,
            description: workoutData.description || '',
            exercises: workoutData.exercises || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavorite: false,
            estimatedDuration: this.calculateEstimatedDuration(workoutData.exercises || []),
            difficulty: this.calculateDifficulty(workoutData.exercises || []),
            tags: workoutData.tags || []
        };
        
        const id = await db.add('workouts', workout);
        workout.id = id;
        
        this.workouts.push(workout);
        return workout;
    }
    
    async updateWorkout(id, workoutData) {
        const workout = await db.get('workouts', id);
        
        if (!workout) {
            throw new Error('Тренировка не найдена');
        }
        
        const updatedWorkout = {
            ...workout,
            ...workoutData,
            updatedAt: new Date().toISOString()
        };
        
        // Пересчитываем продолжительность и сложность
        if (workoutData.exercises) {
            updatedWorkout.estimatedDuration = this.calculateEstimatedDuration(workoutData.exercises);
            updatedWorkout.difficulty = this.calculateDifficulty(workoutData.exercises);
        }
        
        await db.update('workouts', updatedWorkout);
        
        // Обновляем в локальном массиве
        const index = this.workouts.findIndex(w => w.id === id);
        if (index !== -1) {
            this.workouts[index] = updatedWorkout;
        }
        
        return updatedWorkout;
    }
    
    async deleteWorkout(id) {
        await db.delete('workouts', id);
        this.workouts = this.workouts.filter(w => w.id !== id);
        return true;
    }
    
    async toggleFavorite(id) {
        const workout = await db.get('workouts', id);
        if (!workout) return null;
        
        workout.isFavorite = !workout.isFavorite;
        await db.update('workouts', workout);
        
        const index = this.workouts.findIndex(w => w.id === id);
        if (index !== -1) {
            this.workouts[index] = workout;
        }
        
        return workout;
    }
    
    getWorkout(id) {
        return this.workouts.find(w => w.id === id);
    }
    
    getFavoriteWorkouts() {
        return this.workouts.filter(w => w.isFavorite);
    }
    
    searchWorkouts(query) {
        const searchQuery = query.toLowerCase();
        return this.workouts.filter(workout => 
            workout.name.toLowerCase().includes(searchQuery) ||
            workout.description.toLowerCase().includes(searchQuery) ||
            workout.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
    }
    
    calculateEstimatedDuration(exercises) {
        // Предполагаем: каждый подход = 1 минута, отдых между подходами = 1.5 минуты
        let totalDuration = 0;
        
        exercises.forEach(exercise => {
            const sets = exercise.sets || 3;
            const restBetweenSets = exercise.restBetweenSets || 90; // секунды
            const estimatedTime = (sets * 60) + ((sets - 1) * restBetweenSets);
            totalDuration += estimatedTime;
        });
        
        // Добавляем 5 минут на разминку и заминку
        totalDuration += 300;
        
        return Math.round(totalDuration / 60); // возвращаем в минутах
    }
    
    calculateDifficulty(exercises) {
        if (exercises.length === 0) return 'beginner';
        
        let totalDifficulty = 0;
        exercises.forEach(exercise => {
            const exerciseData = exerciseManager.getExercise(exercise.exerciseId);
            if (exerciseData) {
                const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
                totalDifficulty += difficultyMap[exerciseData.difficulty] || 1;
            }
        });
        
        const avgDifficulty = totalDifficulty / exercises.length;
        
        if (avgDifficulty >= 2.5) return 'advanced';
        if (avgDifficulty >= 1.5) return 'intermediate';
        return 'beginner';
    }
    
    // Начинаем новую тренировку
    async startWorkout(workoutId) {
        const workout = this.getWorkout(workoutId);
        if (!workout) {
            throw new Error('Тренировка не найдена');
        }
        
        this.activeWorkout = {
            workoutId: workout.id,
            name: workout.name,
            exercises: workout.exercises.map(exercise => ({
                ...exercise,
                completedSets: Array(exercise.sets || 3).fill(false),
                weights: Array(exercise.sets || 3).fill(exercise.startingWeight || 0),
                reps: Array(exercise.sets || 3).fill(exercise.reps || 10)
            })),
            startTime: new Date().toISOString(),
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            isCompleted: false
        };
        
        return this.activeWorkout;
    }
    
    // Завершаем тренировку
    async finishWorkout() {
        if (!this.activeWorkout) return null;
        
        this.activeWorkout.endTime = new Date().toISOString();
        this.activeWorkout.isCompleted = true;
        
        // Сохраняем в историю
        const historyEntry = {
            workoutId: this.activeWorkout.workoutId,
            name: this.activeWorkout.name,
            exercises: this.activeWorkout.exercises,
            startTime: this.activeWorkout.startTime,
            endTime: this.activeWorkout.endTime,
            date: new Date().toISOString().split('T')[0],
            completedAt: new Date().toISOString(),
            duration: Math.round((new Date(this.activeWorkout.endTime) - new Date(this.activeWorkout.startTime)) / 1000 / 60) // в минутах
        };
        
        await db.add('workoutHistory', historyEntry);
        
        // Обновляем статистику упражнений
        await this.updateExerciseStats();
        
        // Начисляем скинты
        const skinsEarned = this.calculateSkins();
        if (skinsEarned > 0 && window.HealthFlow) {
            window.HealthFlow.addSkins(skinsEarned, 'workout');
        }
        
        const completedWorkout = { ...this.activeWorkout };
        this.activeWorkout = null;
        
        return { workout: completedWorkout, skinsEarned };
    }
    
    async updateExerciseStats() {
        if (!this.activeWorkout) return;
        
        for (const exercise of this.activeWorkout.exercises) {
            const stats = {
                exerciseId: exercise.exerciseId,
                date: new Date().toISOString().split('T')[0],
                sets: exercise.sets || 3,
                reps: exercise.reps || 10,
                weights: exercise.weights.filter(w => w > 0),
                totalVolume: exercise.weights.reduce((sum, weight, index) => {
                    return sum + (weight * exercise.reps[index]);
                }, 0),
                maxWeight: Math.max(...exercise.weights.filter(w => w > 0))
            };
            
            await db.add('exerciseStats', stats);
        }
    }
    
    calculateSkins() {
        if (!this.activeWorkout) return 0;
        
        let skins = 0;
        const workout = this.getWorkout(this.activeWorkout.workoutId);
        
        // Базовые скинты за тренировку
        skins += 10;
        
        // Бонус за сложность
        if (workout.difficulty === 'intermediate') skins += 5;
        if (workout.difficulty === 'advanced') skins += 10;
        
        // Бонус за количество упражнений
        skins += Math.min(this.activeWorkout.exercises.length * 2, 10);
        
        // Бонус за завершённые подходы
        const completedSets = this.activeWorkout.exercises.reduce((total, exercise) => {
            return total + (exercise.completedSets || []).filter(s => s).length;
        }, 0);
        
        skins += Math.floor(completedSets / 3);
        
        return skins;
    }
    
    // Получаем историю тренировок
    async getWorkoutHistory(limit = 10) {
        return await db.getAll('workoutHistory', null, null, limit);
    }
    
    // Получаем статистику за период
    async getStats(startDate, endDate) {
        const history = await db.getAll('workoutHistory');
        
        const filteredHistory = history.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
        });
        
        const stats = {
            totalWorkouts: filteredHistory.length,
            totalDuration: filteredHistory.reduce((sum, entry) => sum + (entry.duration || 0), 0),
            totalSkins: filteredHistory.reduce((sum, entry) => sum + (entry.skinsEarned || 0), 0),
            favoriteWorkout: this.getMostFrequentWorkout(filteredHistory),
            streak: this.calculateStreak(history)
        };
        
        return stats;
    }
    
    getMostFrequentWorkout(history) {
        if (history.length === 0) return null;
        
        const frequency = {};
        history.forEach(entry => {
            frequency[entry.workoutId] = (frequency[entry.workoutId] || 0) + 1;
        });
        
        const mostFrequentId = Object.keys(frequency).reduce((a, b) => 
            frequency[a] > frequency[b] ? a : b
        );
        
        return this.getWorkout(parseInt(mostFrequentId));
    }
    
    calculateStreak(history) {
        if (history.length === 0) return 0;
        
        // Сортируем по дате
        const sortedHistory = [...history].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        // Проверяем сегодняшнюю тренировку
        const today = currentDate.toISOString().split('T')[0];
        if (sortedHistory[0]?.date === today) {
            streak = 1;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        // Проверяем последовательные дни
        for (let i = streak > 0 ? 1 : 0; i < sortedHistory.length; i++) {
            const entryDate = new Date(sortedHistory[i].date);
            const expectedDate = new Date(currentDate);
            
            if (entryDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
}

// Экспортируем синглтон
export const workoutManager = new WorkoutManager();
