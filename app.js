class WaterTracker {
    constructor() {
        this.waterAmount = 0;
        this.targetAmount = 2000;
        this.totalSkins = 0;
        this.todaySkins = 0;
        this.history = [];
        this.startTime = new Date();
        this.isAnimating = false;
        this.skinCounter = 0;
        this.holdTimer = null;
        this.isHolding = false;
        this.holdAmount = 0;
        this.currentHoldAmount = 0;
        
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
        
        const waterData = {
            date: today,
            amount: this.waterAmount,
            history: this.history,
            skinCounter: this.skinCounter
        };
        localStorage.setItem('waterData', JSON.stringify(waterData));
        
        const skinsData = {
            date: today,
            total: this.totalSkins,
            today: this.todaySkins
        };
        localStorage.setItem('waterSkins', JSON.stringify(skinsData));
        
        localStorage.setItem('waterTarget', this.targetAmount.toString());
    }

    addWater(amount) {
        if (this.isAnimating) return;
        if (amount <= 0) return;
        
        this.isAnimating = true;
        const oldWaterAmount = this.waterAmount;
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Добавляем воду
        this.waterAmount += amount;
        
        // Обработка скинтов
        const skinsEarned = this.calculateSkins(amount, true);
        if (skinsEarned > 0) {
            this.totalSkins += skinsEarned;
            this.todaySkins += skinsEarned;
            this.createSparks(skinsEarned, false);
        }
        
        // Добавляем в историю
        this.history.unshift({
            amount,
            time,
            skins: skinsEarned,
            timestamp: Date.now(),
            type: 'add'
        });
        
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        this.saveData();
        this.animateWaterChange(oldWaterAmount, this.waterAmount, true);
        this.updateDisplay();
        
        // Уведомление
        let message = `+${amount} мл добавлено`;
        if (skinsEarned > 0) {
            message += ` +${skinsEarned}✨`;
            this.showNotification(message, 'skins');
        } else {
            this.showNotification(message, 'success');
        }
        
        this.playSound(true);
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1000);
    }

    removeWater(amount) {
        if (this.isAnimating) return;
        if (this.waterAmount <= 0) {
            this.showNotification('Нечего удалять 😊', 'success');
            return;
        }
        
        this.isAnimating = true;
        const oldWaterAmount = this.waterAmount;
        
        // Не позволяем уйти в минус
        const actualRemove = Math.min(amount, this.waterAmount);
        if (actualRemove <= 0) {
            this.isAnimating = false;
            return;
        }
        
        const time = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Удаляем воду
        this.waterAmount -= actualRemove;
        
        // Обработка скинтов (отнимаем если нужно)
        const skinsLost = this.calculateSkins(actualRemove, false);
        if (skinsLost > 0) {
            this.totalSkins = Math.max(0, this.totalSkins - skinsLost);
            this.todaySkins = Math.max(0, this.todaySkins - skinsLost);
            this.createSparks(skinsLost, true);
        }
        
        // Добавляем в историю
        this.history.unshift({
            amount: actualRemove,
            time,
            skins: skinsLost,
            timestamp: Date.now(),
            type: 'remove'
        });
        
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        this.saveData();
        this.animateWaterChange(oldWaterAmount, this.waterAmount, false);
        this.updateDisplay();
        
        this.showNotification(`−${actualRemove} мл удалено`, 'remove');
        this.playSound(false);
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 1000);
    }

    calculateSkins(amount, isAdding) {
        if (isAdding) {
            const oldCounter = this.skinCounter;
            this.skinCounter = (oldCounter + amount) % 250;
            return Math.floor((oldCounter + amount) / 250);
        } else {
            // При удалении рассчитываем потерянные скинты
            let tempCounter = this.skinCounter;
            let skinsLost = 0;
            let remaining = amount;
            
            // Сначала проверяем текущий скинт-счетчик
            if (tempCounter > 0) {
                const fromCounter = Math.min(tempCounter, remaining);
                tempCounter -= fromCounter;
                remaining -= fromCounter;
                
                // Если перешли через границу 250
                if (tempCounter < 0) {
                    tempCounter += 250;
                    skinsLost++;
                    remaining += 250;
                }
            }
            
            // Затем считаем полные скинты
            skinsLost += Math.floor(remaining / 250);
            remaining = remaining % 250;
            
            // Обновляем счетчик
            this.skinCounter = tempCounter;
            
            return skinsLost;
        }
    }

    createSparks(count, isNegative) {
        const container = document.getElementById('sparksContainer');
        
        for (let i = 0; i < count * 3; i++) {
            const spark = document.createElement('div');
            spark.className = `spark ${isNegative ? 'negative' : ''}`;
            
            const x = 100 + Math.random() * 200;
            const y = window.innerHeight - 150 + Math.random() * 100;
            
            spark.style.left = `${x}px`;
            spark.style.top = `${y}px`;
            spark.style.animationDelay = `${Math.random() * 0.5}s`;
            
            container.appendChild(spark);
            
            setTimeout(() => {
                if (spark.parentNode) spark.remove();
            }, 2000);
        }
    }

    animateWaterChange(oldAmount, newAmount, isAdding) {
        const fillElement = document.getElementById('waterFill');
        const oldPercent = Math.min(oldAmount / this.targetAmount * 100, 100);
        const newPercent = Math.min(newAmount / this.targetAmount * 100, 100);
        
        fillElement.style.height = `${oldPercent}%`;
        
        // Создаем эффект ряби
        this.createRippleEffect(isAdding);
        
        setTimeout(() => {
            fillElement.style.height = `${newPercent}%`;
            
            // Анимация текста
            this.animateNumberChange('currentAmount', oldAmount, newAmount);
        }, 50);
    }

    animateNumberChange(elementId, oldValue, newValue) {
        const element = document.getElementById(elementId);
        const duration = 1000;
        const startTime = Date.now();
        const difference = newValue - oldValue;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Кубическая easing функция
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(oldValue + difference * easeProgress);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    createRippleEffect(isAdding) {
        const circle = document.querySelector('.water-circle');
        const ripple = document.createElement('div');
        
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            border: 3px solid ${isAdding ? 'rgba(6, 180, 143, 0.4)' : 'rgba(255, 107, 107, 0.4)'};
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: rippleExpand 1s ease-out;
            pointer-events: none;
            z-index: 2;
        `;
        
        circle.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    }

    startHold(amount) {
        if (this.isHolding) return;
        
        this.isHolding = true;
        this.holdAmount = amount;
        this.currentHoldAmount = 0;
        
        // Показываем индикатор
        const indicator = document.getElementById('holdIndicator');
        document.getElementById('holdAmount').textContent = `0 мл`;
        indicator.classList.add('show');
        
        // Добавляем класс на кнопку
        const buttons = document.querySelectorAll(`[data-amount="${amount}"]`);
        buttons.forEach(btn => btn.classList.add('removing'));
        
        // Таймер для постепенного удаления
        this.holdTimer = setInterval(() => {
            if (this.waterAmount <= 0) {
                this.stopHold();
                return;
            }
            
            this.currentHoldAmount += amount;
            document.getElementById('holdAmount').textContent = `-${this.currentHoldAmount} мл`;
            
            // Вибрация (если поддерживается)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
        }, 300); // Удаляем каждые 300ms
    }

    stopHold() {
        if (!this.isHolding) return;
        
        clearInterval(this.holdTimer);
        this.isHolding = false;
        
        // Скрываем индикатор
        const indicator = document.getElementById('holdIndicator');
        indicator.classList.remove('show');
        
        // Убираем класс с кнопки
        const buttons = document.querySelectorAll('.action-btn.removing');
        buttons.forEach(btn => btn.classList.remove('removing'));
        
        // Если что-то удалили
        if (this.currentHoldAmount > 0) {
            this.removeWater(this.currentHoldAmount);
        }
        
        this.holdAmount = 0;
        this.currentHoldAmount = 0;
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
            const minutesRemaining = Math.round((remaining / avgPerHour) * 60);
            const hours = Math.floor(minutesRemaining / 60);
            const minutes = minutesRemaining % 60;
            document.getElementById('timeRemaining').textContent = 
                `${hours}:${minutes.toString().padStart(2, '0')}`;
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
                    <div class="empty-text">Начните отслеживать воду!</div>
                    <div class="empty-subtext">Каждые 250 мл = 1 скинт ✨</div>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <div class="history-item">
                <span class="history-time">${item.time}</span>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="history-amount ${item.type === 'remove' ? 'negative' : ''}">
                        ${item.type === 'remove' ? '−' : '+'}${item.amount} мл
                    </span>
                    ${item.skins > 0 ? `<span class="history-skins">${item.type === 'remove' ? '−' : '+'}${item.skins}✨</span>` : ''}
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

    playSound(isAdding) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = isAdding ? 800 : 400;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Игнорируем ошибки аудио
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
            this.showNotification('Максимум 5000 мл за раз', 'success');
        } else {
            this.showNotification('Введите количество от 1 до 5000 мл', 'success');
        }
    }

    removeCustomWater() {
        const input = document.getElementById('customAmount');
        const amount = parseInt(input.value);
        
        if (amount && amount > 0 && amount <= 5000) {
            this.removeWater(amount);
            input.value = '';
            input.blur();
        } else if (amount > 5000) {
            this.showNotification('Максимум 5000 мл за раз', 'success');
        } else {
            this.showNotification('Введите количество от 1 до 5000 мл', 'success');
        }
    }
}

// Глобальные функции для обработки кнопок
let isTouchDevice = 'ontouchstart' in window;
let activeHoldButton = null;

function handleButtonPress(event, amount) {
    event.preventDefault();
    
    // Для тач-устройств: долгое нажатие = удаление
    // Для ПК: правая кнопка мыши = удаление
    const isRemove = isTouchDevice ? 
        (event.type === 'touchstart') : 
        (event.button === 2 || event.ctrlKey);
    
    if (isRemove) {
        // Начинаем удаление при зажатии
        if (window.waterTracker && !window.waterTracker.isHolding) {
            window.waterTracker.startHold(amount);
            activeHoldButton = event.currentTarget;
        }
    } else {
        // Нормальное добавление при клике
        if (window.waterTracker) {
            window.waterTracker.addWater(amount);
        }
    }
}

function handleButtonRelease(event, amount) {
    event.preventDefault();
    
    // Останавливаем удаление если оно активно
    if (window.waterTracker && window.waterTracker.isHolding) {
        window.waterTracker.stopHold();
        activeHoldButton = null;
    }
}

// Запрещаем контекстное меню на кнопках
document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('.action-btn')) {
        e.preventDefault();
    }
});

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.waterTracker = new WaterTracker();
});

// Глобальные функции
function addCustomWater() {
    if (window.waterTracker) window.waterTracker.addCustomWater();
}

function removeCustomWater() {
    if (window.waterTracker) window.waterTracker.removeCustomWater();
}

function resetWater() {
    if (window.waterTracker) window.waterTracker.resetWater();
}
