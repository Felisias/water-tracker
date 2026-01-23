[file name]: workouts.js
[file content begin]
// Основной класс модуля тренировок
class WorkoutTracker {
    constructor(db, exerciseManager) {
        this.db = db;
        this.exerciseManager = exerciseManager;
        this.currentWorkouts = [];
        this.workoutHistory = [];
        this.activeWorkout = null;
        this.isAnimating = false;
    }

    async init() {
        await this.loadWorkouts();
        await this.loadWorkoutHistory();
        console.log('✅ WorkoutTracker готов');
    }

    async loadWorkouts() {
        try {
            this.currentWorkouts = await this.db.getAll('workouts');
            console.log(`📋 Загружено тренировок: ${this.currentWorkouts.length}`);
            return this.currentWorkouts;
        } catch (error) {
            console.error('❌ Ошибка загрузки тренировок:', error);
            return [];
        }
    }

    async loadWorkoutHistory() {
        try {
            this.workoutHistory = await this.db.getAll('workoutHistory');
            
            // Сортируем по дате (новые сверху)
            this.workoutHistory.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            console.log(`📊 Загружено записей в истории: ${this.workoutHistory.length}`);
            return this.workoutHistory;
        } catch (error) {
            console.error('❌ Ошибка загрузки истории тренировок:', error);
            return [];
        }
    }

    // СОЗДАНИЕ И РЕДАКТИРОВАНИЕ ТРЕНИРОВОК
    async createWorkout(workoutData) {
        const workout = {
            ...workoutData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            exercises: workoutData.exercises || []
        };

        try {
            const id = await this.db.add('workouts', workout);
            workout.id = id;
            this.currentWorkouts.push(workout);
            
            console.log('✅ Тренировка создана:', workout.name);
            return workout;
        } catch (error) {
            console.error('❌ Ошибка создания тренировки:', error);
            throw error;
        }
    }

    async updateWorkout(id, workoutData) {
        const workout = {
            ...workoutData,
            id: parseInt(id),
            updatedAt: new Date().toISOString()
        };

        try {
            await this.db.update('workouts', workout);
            
            // Обновляем в локальном массиве
            const index = this.currentWorkouts.findIndex(w => w.id === parseInt(id));
            if (index !== -1) {
                this.currentWorkouts[index] = workout;
            }
            
            console.log('✅ Тренировка обновлена:', workout.name);
            return workout;
        } catch (error) {
            console.error('❌ Ошибка обновления тренировки:', error);
            throw error;
        }
    }

    async deleteWorkout(id) {
        try {
            await this.db.delete('workouts', parseInt(id));
            
            // Удаляем из локального массива
            this.currentWorkouts = this.currentWorkouts.filter(w => w.id !== parseInt(id));
            
            console.log('✅ Тренировка удалена:', id);
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления тренировки:', error);
            throw error;
        }
    }

    getWorkoutById(id) {
        return this.currentWorkouts.find(w => w.id === parseInt(id));
    }

    // РЕЖИМ ВЫПОЛНЕНИЯ ТРЕНИРОВКИ
    startWorkout(workoutId) {
        const workout = this.getWorkoutById(workoutId);
        if (!workout) {
            throw new Error('Тренировка не найдена');
        }

        this.activeWorkout = {
            ...workout,
            startTime: new Date().toISOString(),
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            completedSets: [],
            notes: '',
            isCompleted: false
        };

        console.log('🏋️ Начата тренировка:', workout.name);
        return this.activeWorkout;
    }

    completeSet(exerciseIndex, setIndex, weight = null, reps = null) {
        if (!this.activeWorkout) return;

        const setData = {
            exerciseIndex,
            setIndex,
            completedAt: new Date().toISOString(),
            weight,
            reps
        };

        this.activeWorkout.completedSets.push(setData);
        console.log('✅ Подход выполнен:', setData);
    }

    nextExercise() {
        if (!this.activeWorkout) return;

        const currentExercise = this.activeWorkout.exercises[this.activeWorkout.currentExerciseIndex];
        const totalSets = currentExercise.sets || 3;

        if (this.activeWorkout.currentSetIndex < totalSets - 1) {
            this.activeWorkout.currentSetIndex++;
        } else {
            this.activeWorkout.currentExerciseIndex++;
            this.activeWorkout.currentSetIndex = 0;
        }

        // Если все упражнения выполнены
        if (this.activeWorkout.currentExerciseIndex >= this.activeWorkout.exercises.length) {
            this.completeWorkout();
        }
    }

    async completeWorkout() {
        if (!this.activeWorkout || this.activeWorkout.isCompleted) return;

        this.activeWorkout.isCompleted = true;
        this.activeWorkout.endTime = new Date().toISOString();
        this.activeWorkout.duration = this.calculateDuration(
            this.activeWorkout.startTime,
            this.activeWorkout.endTime
        );

        try {
            // Сохраняем в историю
            const historyEntry = {
                workoutId: this.activeWorkout.id,
                workoutName: this.activeWorkout.name,
                date: this.activeWorkout.startTime,
                duration: this.activeWorkout.duration,
                completedSets: this.activeWorkout.completedSets,
                notes: this.activeWorkout.notes,
                totalExercises: this.activeWorkout.exercises.length,
                totalSets: this.calculateTotalSets(this.activeWorkout)
            };

            const id = await this.db.add('workoutHistory', historyEntry);
            historyEntry.id = id;
            this.workoutHistory.unshift(historyEntry);

            // Начисляем скинты
            const skinsEarned = this.calculateSkins(this.activeWorkout);
            if (skinsEarned > 0 && window.HealthFlow) {
                window.HealthFlow.addSkins(skinsEarned, 'workout_complete');
            }

            console.log(`🏆 Тренировка завершена! +${skinsEarned} скинтов`);
            
            // Сбрасываем активную тренировку
            const completedWorkout = { ...this.activeWorkout };
            this.activeWorkout = null;

            return {
                workout: completedWorkout,
                historyEntry,
                skinsEarned
            };
        } catch (error) {
            console.error('❌ Ошибка сохранения тренировки:', error);
            throw error;
        }
    }

    calculateDuration(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate - startDate;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    calculateTotalSets(workout) {
        return workout.exercises.reduce((total, exercise) => 
            total + (exercise.sets || 3), 0);
    }

    calculateSkins(workout) {
        // Базовая награда: 10 скинтов за тренировку
        let skins = 10;
        
        // Бонус за количество упражнений
        const exerciseBonus = Math.min(workout.exercises.length * 2, 10);
        skins += exerciseBonus;
        
        // Бонус за общее количество подходов
        const totalSets = this.calculateTotalSets(workout);
        const setBonus = Math.floor(totalSets / 3); // +1 скинт за каждые 3 подхода
        skins += setBonus;
        
        // Бонус за первую тренировку сегодня
        const today = new Date().toDateString();
        const todayWorkouts = this.workoutHistory.filter(w => 
            new Date(w.date).toDateString() === today
        );
        
        if (todayWorkouts.length === 0) {
            skins += 5; // +5 скинтов за первую тренировку дня
        }
        
        return Math.min(skins, 50); // Максимум 50 скинтов за тренировку
    }

    // СТАТИСТИКА
    getStats() {
        const stats = {
            totalWorkouts: this.workoutHistory.length,
            totalTime: 0,
            favoriteExercises: {},
            streak: 0,
            skinsEarned: 0
        };

        // Рассчитываем серию (дней подряд с тренировками)
        let currentStreak = 0;
        let lastDate = null;

        this.workoutHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const workout of this.workoutHistory) {
            const workoutDate = new Date(workout.date);
            
            if (!lastDate) {
                currentStreak = 1;
                lastDate = workoutDate;
            } else {
                const diffDays = Math.floor((lastDate - workoutDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                    lastDate = workoutDate;
                } else if (diffDays > 1) {
                    break;
                }
            }
        }

        stats.streak = currentStreak;

        // Подсчитываем любимые упражнения
        this.workoutHistory.forEach(workout => {
            workout.completedSets?.forEach(set => {
                // Здесь нужно будет доработать с учетом структуры данных упражнений
            });
        });

        return stats;
    }

    // ПОИСК И ФИЛЬТРАЦИЯ
    searchWorkouts(query) {
        const lowerQuery = query.toLowerCase();
        return this.currentWorkouts.filter(workout => 
            workout.name.toLowerCase().includes(lowerQuery) ||
            workout.description?.toLowerCase().includes(lowerQuery)
        );
    }

    getRecentWorkouts(limit = 5) {
        return this.workoutHistory.slice(0, limit);
    }

    getWorkoutsByDate(date) {
        const targetDate = new Date(date).toDateString();
        return this.workoutHistory.filter(workout => 
            new Date(workout.date).toDateString() === targetDate
        );
    }
}

// Экспортируем трекер тренировок
let workoutTrackerInstance = null;

export async function initWorkoutTracker(db, exerciseManager) {
    console.log('Инициализация трекера тренировок...');
    
    workoutTrackerInstance = new WorkoutTracker(db, exerciseManager);
    await workoutTrackerInstance.init();
    
    console.log('✅ Трекер тренировок готов');
    return workoutTrackerInstance;
}

export function getWorkoutTracker() {
    return workoutTrackerInstance;
}
[file content end]