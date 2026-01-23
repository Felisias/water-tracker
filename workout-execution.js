// Режим выполнения тренировки с таймерами и управлением
import { workoutManager } from './workouts.js';

class WorkoutExecution {
    constructor() {
        this.timer = null;
        this.restTimer = null;
        this.currentRestTime = 0;
        this.isResting = false;
        this.onUpdateCallbacks = [];
        this.onRestEndCallbacks = [];
    }
    
    // Начинаем выполнение тренировки
    startWorkoutExecution(workout) {
        if (!workout || !workout.exercises || workout.exercises.length === 0) {
            throw new Error('Нет упражнений для выполнения');
        }
        
        this.workout = workout;
        this.currentExerciseIndex = 0;
        this.currentSetIndex = 0;
        this.startTime = Date.now();
        
        this.updateDisplay();
        this.startTimer();
        
        return this.getCurrentState();
    }
    
    // Получаем текущее состояние
    getCurrentState() {
        if (!this.workout) return null;
        
        const currentExercise = this.workout.exercises[this.currentExerciseIndex];
        const totalExercises = this.workout.exercises.length;
        const totalSets = this.workout.exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0);
        const completedSets = this.calculateCompletedSets();
        
        return {
            currentExercise,
            currentExerciseIndex: this.currentExerciseIndex,
            currentSetIndex: this.currentSetIndex,
            totalExercises,
            totalSets,
            completedSets,
            isResting: this.isResting,
            restTimeRemaining: this.currentRestTime,
            progress: {
                exercise: Math.round((this.currentExerciseIndex / totalExercises) * 100),
                overall: Math.round((completedSets / totalSets) * 100)
            }
        };
    }
    
    // Отмечаем подход как выполненный
    completeSet() {
        if (!this.workout || this.currentExerciseIndex >= this.workout.exercises.length) {
            return false;
        }
        
        const exercise = this.workout.exercises[this.currentExerciseIndex];
        
        if (!exercise.completedSets) {
            exercise.completedSets = Array(exercise.sets || 3).fill(false);
        }
        
        exercise.completedSets[this.currentSetIndex] = true;
        
        // Проверяем, нужно ли начать отдых
        const nextSetExists = this.currentSetIndex + 1 < (exercise.sets || 3);
        const nextExerciseExists = !nextSetExists && this.currentExerciseIndex + 1 < this.workout.exercises.length;
        
        if (nextSetExists) {
            // Начинаем отдых между подходами
            this.startRest(exercise.restBetweenSets || 90);
            this.currentSetIndex++;
        } else if (nextExerciseExists) {
            // Переходим к следующему упражнению
            this.startRest(exercise.restBetweenExercises || 120);
            this.currentExerciseIndex++;
            this.currentSetIndex = 0;
        } else {
            // Тренировка завершена
            this.completeWorkout();
            return true;
        }
        
        this.updateDisplay();
        return true;
    }
    
    // Начинаем таймер отдыха
    startRest(seconds) {
        this.isResting = true;
        this.currentRestTime = seconds;
        
        this.clearRestTimer();
        
        this.restTimer = setInterval(() => {
            this.currentRestTime--;
            
            if (this.currentRestTime <= 0) {
                this.endRest();
            }
            
            this.updateDisplay();
        }, 1000);
    }
    
    // Завершаем отдых
    endRest() {
        this.clearRestTimer();
        this.isResting = false;
        this.currentRestTime = 0;
        
        this.onRestEndCallbacks.forEach(callback => callback());
        this.updateDisplay();
    }
    
    // Пропускаем отдых
    skipRest() {
        this.endRest();
    }
    
    // Завершаем тренировку
    completeWorkout() {
        this.stopTimer();
        this.clearRestTimer();
        
        const endTime = Date.now();
        const duration = Math.round((endTime - this.startTime) / 1000);
        
        return {
            completed: true,
            duration,
            exercises: this.workout.exercises
        };
    }
    
    // Обновляем вес для текущего подхода
    updateWeight(weight) {
        if (!this.workout || !this.workout.exercises[this.currentExerciseIndex]) {
            return false;
        }
        
        const exercise = this.workout.exercises[this.currentExerciseIndex];
        
        if (!exercise.weights) {
            exercise.weights = Array(exercise.sets || 3).fill(0);
        }
        
        exercise.weights[this.currentSetIndex] = weight;
        this.updateDisplay();
        
        return true;
    }
    
    // Обновляем количество повторений для текущего подхода
    updateReps(reps) {
        if (!this.workout || !this.workout.exercises[this.currentExerciseIndex]) {
            return false;
        }
        
        const exercise = this.workout.exercises[this.currentExerciseIndex];
        
        if (!exercise.reps) {
            exercise.reps = Array(exercise.sets || 3).fill(10);
        }
        
        exercise.reps[this.currentSetIndex] = reps;
        this.updateDisplay();
        
        return true;
    }
    
    // Вспомогательные методы
    calculateCompletedSets() {
        if (!this.workout) return 0;
        
        return this.workout.exercises.reduce((total, exercise) => {
            return total + (exercise.completedSets || []).filter(s => s).length;
        }, 0);
    }
    
    startTimer() {
        this.stopTimer();
        
        this.timer = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    clearRestTimer() {
        if (this.restTimer) {
            clearInterval(this.restTimer);
            this.restTimer = null;
        }
    }
    
    updateDisplay() {
        const state = this.getCurrentState();
        this.onUpdateCallbacks.forEach(callback => callback(state));
    }
    
    // Колбэки для обновления UI
    onUpdate(callback) {
        this.onUpdateCallbacks.push(callback);
    }
    
    onRestEnd(callback) {
        this.onRestEndCallbacks.push(callback);
    }
    
    // Очистка
    cleanup() {
        this.stopTimer();
        this.clearRestTimer();
        this.onUpdateCallbacks = [];
        this.onRestEndCallbacks = [];
        this.workout = null;
    }
}

// Экспортируем синглтон
export const workoutExecution = new WorkoutExecution();
