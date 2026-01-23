class WaterTracker {
    constructor() {
        this.waterAmount = 0;
        this.targetAmount = 2000;
        this.totalSkins = 0;
        this.todaySkins = 0;
        this.history = [];
        this.startTime = new Date();
        this.isAnimating = false;
        this.skinCounter = 0; // Счетчик для накопления 250 мл
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.startClock();
        
        // Автообновление расчетов скинтов
        document.getElementById('customAmount').addEventListener('input', (e) => {
            this.updateSkinCalculation(e.target.value);
        });
    }

    loadData() {
        const today = new Date().toDateString();
        
        // Загрузка данных воды
        const savedWater = localStorage.getItem('waterData');
        if (savedWater) {
            const data = JSON.parse(savedWater);
            if (data.date === today) {
                this.waterAmount = data.amount || 0;
                this.history = data.history || [];
                this.skinCounter = data.skinCounter || (this.waterAmount % 250);
                this.todaySkins = Math.floor(this.waterAmount / 250);
            }
        }
        
        // Загрузка скинтов
        const savedSkins = localStorage.getItem('waterSkins');
        if (savedSkins) {
            const skinsData = JSON.parse(savedSkins);
            this.totalSkins = skinsData.total || 0;
            
            // Если сегодняшняя дата не совпадает, обнуляем todaySkins
            if (skinsData.date !== today) {
                this.todaySkins = 0;
            }
        }
        
        // Загрузка цели
        const savedTarget = localStorage.getItem('waterTarget');
        if (savedTarget) {
            this.targetAmount = parseInt(savedTarget);
        }
    }

    saveData() {
        const today = new Date().toDateString();
        
        // Сохранение данных воды
        const waterData = {
            date: today,
            amount: this.waterAmount,
            history: this.history,
            skinCounter: this.skinCounter
        };
        localStorage.setItem('waterData', JSON.stringify(waterData));
        
        // Сохранение скинтов
        const skinsData = {
            date: today,
            total: this.totalSkins,
            today: this.todaySkins
        };
        localStorage.setItem('waterSkins', JSON.stringify(skinsData));
        
        // Сохранение цели
        localStorage.setItem('waterTarget', this.targetAmount.toString());
    }

    addWater(amount) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Добавляем воду
        const oldWaterAmount = this.waterAmount;
        this.waterAmount += amount;
        
        // Обработка скинтов
        const skinsEarned = this.calculateSkins(amount);
        if (skinsEarned > 0) {
            this.totalSkins += skinsEarned;
            this.todaySkins += skinsEarned;
            this.createSparks(skinsEarned);
        }
        
        // Добавляем в историю
        this.history.unshift({
            amount,
            time,
            skins: skinsEarned,
            timestamp: Date.now()
        });
        
        // Ограничиваем историю 15 записями
        if (this.history.length > 15) {
            this.history = this.history.slice(0, 15);
        }
        
        this.saveData();
        this.animateWaterAddition(oldWaterAmount, this.waterAmount);
        this.updateDisplay();
        
        // Показываем уведомление
        let message = `+${amount} мл добавлено!`;
        if (skinsEarned > 0) {
            message += ` +${skinsEarned} ✨`;
            this.showNotification(message, 'skins');
        } else {
            this.showNotification(message, 'success');
        }
        
        // Звуковой эффект (опционально)
        this.playWaterSound();
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1200);
    }

    calculateSkins(amount) {
        // Каждые 250 мл = 1 скинт
        const oldCounter = this.skinCounter;
        this.skinCounter = (oldCounter + amount) % 250;
        
        return Math.floor((oldCounter + amount) / 250);
    }

    createSparks(count) {
        const container = document.getElementById('sparksContainer');
        
        for (let i = 0; i < count * 3; i++) { // 3 искры за каждый скинт
            const spark = document.createElement('div');
            spark.className = 'spark';
            
            // Случайная позиция в области кнопок
            const x = 50 + Math.random() * 300;
            const y = window.innerHeight - 200 + Math.random() * 100;
            
            spark.style.left = `${x}px`;
            spark.style.top = `${y}px`;
            
            // Случайная задержка
            spark.style.animationDelay = `${Math.random() * 0.5}s`;
            
            container.appendChild(spark);
            
            // Удаляем после анимации
            setTimeout(() => {
                if (spark.parentNode) {
                    spark.remove();
                }
            }, 2000);
        }
    }

    animateWaterAddition(oldAmount, newAmount) {
        const fillElement = document.getElementById('waterFill');
        const oldPercent = Math.min(oldAmount / this.targetAmount * 100, 100);
        const newPercent = Math.min(newAmount / this.targetAmount * 100, 100);
        
        fillElement.style.height = `${oldPercent}%`;
        
        // Используем CSS анимацию
        fillElement.style.transition = 'height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        // Ждем немного перед началом анимации
        setTimeout(() => {
            fillElement.style.height = `${newPercent}%`;
        }, 50);
        
        // Эффект ряби
        this.createRippleEffect();
    }

    createRippleEffect() {
        const circle = document.querySelector('.water-circle');
        const ripple = document.createElement('div');
        
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            border: 2px solid rgba(6, 180, 143, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: rippleExpand 1s ease-out;
            pointer-events: none;
            z-index: 2;
        `;
        
        circle.appendChild(ripple);
        
        // Добавляем стиль для анимации
        if (!document.getElementById('ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes rippleExpand {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1.1);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => ripple.remove(), 1000);
    }

    resetWater() {
        if (this.waterAmount === 0) {
            this.showNotification('Нет данных для сброса 😊', 'success');
            return;
        }
        
        if (confirm('Сбросить данные за сегодня? Вы потеряете скинты за сегодня.')) {
            this.waterAmount = 0;
            this.skinCounter = 0;
            this.todaySkins = 0;
            this.history = [];
            this.saveData();
            this.updateDisplay();
            this.showNotification('День сброшен! Начните заново 🌱', 'success');
        }
    }

    updateDisplay() {
        const percentage = Math.min(Math.round((this.waterAmount / this.targetAmount) * 100), 100);
        
        // Обновление основных элементов
        document.getElementById('currentAmount').textContent = this.waterAmount;
        document.getElementById('targetAmount').textContent = `${this.targetAmount} мл`;
        document.getElementById('progressPercentage').textContent = `${percentage}%`;
        document.getElementById('skinCount').textContent = this.totalSkins;
        document.getElementById('todaySkins').textContent = this.todaySkins;
        
        // Обновление информации о следующем скинте
        const mlToNextSkin = 250 - this.skinCounter;
        document.getElementById('nextSkinInfo').textContent = 
            mlToNextSkin > 0 ? `+1 ✨ через ${mlToNextSkin} мл` : '+1 ✨ в следующем стакане!';
        
        // Обновление статистики
        this.updateStats();
        
        // Обновление истории
        this.updateHistory();
        
        // Обновление кнопки сброса
        document.getElementById('resetBtn').style.opacity = this.waterAmount > 0 ? '1' : '0.5';
    }

    updateSkinCalculation(value) {
        const amount = parseInt(value) || 0;
        const skins = Math.floor((this.skinCounter + amount) / 250);
        document.getElementById('calculatedSkins').textContent = skins;
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
        } else {
            document.getElementById('timeRemaining').textContent = '--:--';
        }
    }

    updateHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">💧</div>
                    <div class="empty-text">Начните свой путь к здоровью!</div>
                    <div class="empty-subtext">Каждые 250 мл = 1 скинт ✨</div>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <span class="history-time">${item.time}</span>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="history-amount">+${item.amount} мл</span>
                    ${item.skins > 0 ? `<span class="history-skins">+${item.skins} ✨</span>` : ''}
                </div>
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

    playWaterSound() {
        // Простой звуковой эффект через Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Если Web Audio API не доступен, просто игнорируем
        }
    }

    startClock() {
        setInterval(() => {
            this.updateStats();
        }, 60000);
    }

    setupEventListeners() {
        // Переключение темы
        document.getElementById('themeToggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'cozy' ? 'light' : 'cozy';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            const icon = document.querySelector('.theme-icon');
            icon.textContent = newTheme === 'cozy' ? '🌙' : '☀️';
            
            // Обновляем цвет темы для PWA
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            metaThemeColor.setAttribute('content', newTheme === 'cozy' ? '#F5F1E6' : '#FFFFFF');
        });
        
        // Загрузка сохраненной темы
        const savedTheme = localStorage.getItem('theme') || 'cozy';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = savedTheme === 'cozy' ? '🌙' : '☀️';
        
        // Обработка кастомного ввода
        document.getElementById('customAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomWater();
            }
        });
    }

    addCustomWater() {
        const input = document.getElementById('customAmount');
        const amount = parseInt(input.value);
        
        if (amount && amount > 0 && amount <= 5000) {
            this.addWater(amount);
            input.value = '';
            input.blur();
        } else if (amount > 5000) {
            this.showNotification('Слишком большое количество! Максимум 5000 мл.', 'success');
        } else {
            this.showNotification('Введите корректное количество (1-5000 мл)', 'success');
        }
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.waterTracker = new WaterTracker();
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
