class WaterTracker {
    constructor() {
        this.waterAmount = 0;
        this.targetAmount = 2000;
        this.history = [];
        this.startTime = new Date();
        this.isAnimating = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.startClock();
        
        // Регистрация Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/water-tracker/sw.js')
                    .then(reg => console.log('SW registered:', reg))
                    .catch(err => console.log('SW registration failed:', err));
            });
        }
    }

    loadData() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('waterData');
        
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === today) {
                this.waterAmount = data.amount;
                this.history = data.history || [];
            }
        }
        
        const savedTarget = localStorage.getItem('waterTarget');
        if (savedTarget) {
            this.targetAmount = parseInt(savedTarget);
        }
    }

    saveData() {
        const today = new Date().toDateString();
        const data = {
            date: today,
            amount: this.waterAmount,
            history: this.history
        };
        localStorage.setItem('waterData', JSON.stringify(data));
        localStorage.setItem('waterTarget', this.targetAmount.toString());
    }

    addWater(amount) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        this.waterAmount += amount;
        this.history.unshift({
            amount,
            time,
            timestamp: Date.now()
        });
        
        // Ограничиваем историю 20 записями
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        this.saveData();
        this.updateDisplay();
        this.showNotification(`+${amount} мл добавлено! 💧`, 'success');
        this.createRippleEffect(amount);
        
        // Анимация добавления
        this.animateWaterAddition(amount, () => {
            this.isAnimating = false;
        });
    }

    animateWaterAddition(amount, callback) {
        const fillElement = document.getElementById('waterFill');
        const currentPercent = Math.min((this.waterAmount - amount) / this.targetAmount * 100, 100);
        const newPercent = Math.min(this.waterAmount / this.targetAmount * 100, 100);
        
        let start = null;
        const duration = 1500;
        
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const easeProgress = this.easeOutCubic(progress);
            const currentHeight = currentPercent + (newPercent - currentPercent) * easeProgress;
            
            fillElement.style.height = `${currentHeight}%`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback();
            }
        };
        
        requestAnimationFrame(animate);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    createRippleEffect(amount) {
        const buttons = document.querySelectorAll(`[data-amount="${amount}"]`);
        buttons.forEach(btn => {
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(0, 212, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${rect.left + window.scrollX}px`;
            ripple.style.top = `${rect.top + window.scrollY}px`;
            
            document.body.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }

    resetWater() {
        if (this.waterAmount === 0) {
            this.showNotification('Нет данных для сброса 😊', 'warning');
            return;
        }
        
        this.waterAmount = 0;
        this.history = [];
        this.saveData();
        this.updateDisplay();
        this.showNotification('Данные сброшены! 🔄', 'success');
    }

    updateDisplay() {
        const percentage = Math.min(Math.round((this.waterAmount / this.targetAmount) * 100), 100);
        
        // Обновление основных элементов
        document.getElementById('currentAmount').textContent = this.waterAmount;
        document.getElementById('targetAmount').textContent = `${this.targetAmount} мл`;
        document.getElementById('progressPercentage').textContent = `${percentage}%`;
        
        // Обновление даты
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = 
            now.toLocaleDateString('ru-RU', options);
        
        // Обновление статистики
        this.updateStats();
        
        // Обновление истории
        this.updateHistory();
        
        // Обновление кнопки сброса
        document.getElementById('resetBtn').style.opacity = this.waterAmount > 0 ? '1' : '0.5';
    }

    updateStats() {
        const now = new Date();
        const hoursPassed = (now - this.startTime) / (1000 * 60 * 60);
        const remaining = Math.max(0, this.targetAmount - this.waterAmount);
        
        // Средний темп
        const avgPerHour = hoursPassed > 0 
            ? Math.round(this.waterAmount / hoursPassed)
            : 0;
        document.getElementById('avgPerHour').textContent = `${avgPerHour} мл/ч`;
        
        // Время до цели
        if (avgPerHour > 0 && remaining > 0) {
            const hoursRemaining = remaining / avgPerHour;
            const minutesRemaining = Math.round(hoursRemaining * 60);
            const hours = Math.floor(minutesRemaining / 60);
            const minutes = minutesRemaining % 60;
            document.getElementById('timeRemaining').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            // Прогноз завершения
            const completionTime = new Date(now.getTime() + minutesRemaining * 60000);
            document.getElementById('completionTime').textContent = 
                completionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            document.getElementById('timeRemaining').textContent = '--:--';
            document.getElementById('completionTime').textContent = '--:--';
        }
    }

    updateHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    Пока что история пуста. Выпейте первый стакан воды! 💧
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <span class="history-time">${item.time}</span>
                <span class="history-amount">${item.amount} мл</span>
            </div>
        `).join('');
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    startClock() {
        setInterval(() => {
            this.updateStats();
        }, 60000); // Обновляем каждую минуту
    }

    setupEventListeners() {
        // Переключение темы
        document.getElementById('themeToggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            const icon = document.querySelector('.theme-icon');
            icon.style.transform = currentTheme === 'dark' ? 'rotate(180deg)' : 'rotate(0)';
        });
        
        // Загрузка сохраненной темы
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Быстрый ввод через FAB
        document.getElementById('fabBtn').addEventListener('click', () => {
            this.showQuickAdd();
        });
        
        // Обработка кастомного ввода
        document.getElementById('customAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomWater();
            }
        });
    }

    showQuickAdd() {
        const amount = prompt('Сколько мл воды вы выпили?', '250');
        if (amount && !isNaN(amount) && amount > 0) {
            this.addWater(parseInt(amount));
        }
    }

    addCustomWater() {
        const input = document.getElementById('customAmount');
        const amount = parseInt(input.value);
        
        if (amount && amount > 0 && amount <= 5000) {
            this.addWater(amount);
            input.value = '';
            input.blur();
        } else if (amount > 5000) {
            this.showNotification('Слишком большое количество! Максимум 5000 мл.', 'error');
        } else {
            this.showNotification('Введите корректное количество (1-5000 мл)', 'error');
        }
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.waterTracker = new WaterTracker();
    
    // Добавляем стиль для ripple анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});

// Глобальные функции для вызова из HTML
function addWater(amount) {
    if (window.waterTracker) {
        window.waterTracker.addWater(amount);
    }
}

function resetWater() {
    if (window.waterTracker) {
        window.waterTracker.resetWater();
    }
}

function addCustomWater() {
    if (window.waterTracker) {
        window.waterTracker.addCustomWater();
    }
}

function showQuickAdd() {
    if (window.waterTracker) {
        window.waterTracker.showQuickAdd();
    }
}
