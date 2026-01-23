// utils.js

// Таймер отдыха
export class RestTimer {
    constructor(seconds, onTick, onComplete) {
        this.seconds = seconds;
        this.remaining = seconds;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.timer = null;
        this.isRunning = false;
        this.startTime = null;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        // Вибрация при старте
        this.vibrate([200]);
        
        this.tick();
    }
    
    tick() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const elapsed = Math.floor((now - this.startTime) / 1000);
        this.remaining = Math.max(0, this.seconds - elapsed);
        
        if (this.onTick) {
            this.onTick(this.remaining);
        }
        
        // Вибрация каждые 30 секунд
        if (this.remaining === 30 || this.remaining === 10 || this.remaining === 5) {
            this.vibrate([100]);
        }
        
        if (this.remaining <= 0) {
            this.stop();
            if (this.onComplete) {
                this.onComplete();
            }
            // Длинная вибрация при завершении
            this.vibrate([300, 100, 300]);
        } else {
            this.timer = setTimeout(() => this.tick(), 1000);
        }
    }
    
    stop() {
        this.isRunning = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    
    reset() {
        this.stop();
        this.remaining = this.seconds;
        if (this.onTick) {
            this.onTick(this.remaining);
        }
    }
    
    vibrate(pattern) {
        if (navigator.vibrate) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Игнорируем ошибки вибрации
            }
        }
    }
}

// Форматирование времени
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Форматирование даты
export function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Расчет скинтов за тренировку
export function calculateWorkoutSkins(workout) {
    let skins = 10; // Базовая награда
    
    // За количество упражнений
    if (workout.exercises.length > 5) skins += 5;
    if (workout.exercises.length > 10) skins += 10;
    
    // За общий объем (подходы × повторения)
    const totalVolume = workout.exercises.reduce((sum, ex) => {
        return sum + (ex.sets * (parseInt(ex.reps) || 10));
    }, 0);
    
    if (totalVolume > 100) skins += 10;
    if (totalVolume > 200) skins += 15;
    
    return skins;
}

// Уведомления
export function showLocalNotification(title, options = {}) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, options);
            }
        });
    }
}