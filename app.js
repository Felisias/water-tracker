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
        
        // Данные для графика
        this.hourlyData = this.initHourlyData();
        
        // Переменные для зажатия кнопок
        this.holdTimer = null;
        this.holdAmount = 0;
        this.isHolding = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateChart();
        this.startClock();
        
        // Автообновление расчетов скинтов
        document.getElementById('customAmount').addEventListener('input', (e) => {
            this.updateSkinCalculation(e.target.value);
        });
        
        // Автосохранение цели
        document.getElementById('targetInput').addEventListener('change', () => {
            this.updateTarget();
        });
    }

    initHourlyData() {
        const data = [];
        for (let i = 0; i < 24; i++) {
            data.push({
                hour: i,
                amount: 0,
                projected: 0
            });
        }
        return data;
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
                this.hourlyData = data.hourlyData || this.initHourlyData();
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
            document.getElementById('targetInput').value = this.targetAmount;
        }
    }

    saveData() {
        const today = new Date().toDateString();
        
        const waterData = {
            date: today,
            amount: this.waterAmount,
            history: this.history,
            skinCounter: this.skinCounter,
            hourlyData: this.hourlyData
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
        
        const time = new Date();
        const hour = time.getHours();
        const timeString = time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Добавляем воду
        this.waterAmount += amount;
        
        // Обновляем данные для графика
        this.hourlyData[hour].amount += amount;
        
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
            time: timeString,
            skins: skinsEarned,
            timestamp: Date.now(),
            type: 'add'
        });
        
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        this.saveData();
        this.animateBottleChange(oldWaterAmount, this.waterAmount, true);
        this.updateDisplay();
        this.updateChart();
        
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
        }, 800);
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
        
        const time = new Date();
        const hour = time.getHours();
        const timeString = time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Удаляем воду
        this.waterAmount -= actualRemove;
        
        // Обновляем данные для графика
        this.hourlyData[hour].amount = Math.max(0, this.hourlyData[hour].amount - actualRemove);
        
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
            time: timeString,
            skins: skinsLost,
            timestamp: Date.now(),
            type: 'remove'
        });
        
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        this.saveData();
        this.animateBottleChange(oldWaterAmount, this.waterAmount, false);
        this.updateDisplay();
        this.updateChart();
        
        this.showNotification(`−${actualRemove} мл удалено`, 'remove');
        this.playSound(false);
        
        setTimeout(() => {
            this.isAnimating = false;
        }, 800);
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
                
                if (tempCounter < 0) {
                    tempCounter += 250;
                    skinsLost++;
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
        
        for (let i = 0; i < count * 2; i++) {
            const spark = document.createElement('div');
            spark.className = `spark ${isNegative ? 'negative' : ''}`;
            
            // Создаем искры вокруг бутылки
            const x = 100 + Math.random() * 200;
            const y = window.innerHeight / 2 - 50 + Math.random() * 100;
            
            spark.style.left = `${x}px`;
            spark.style.top = `${y}px`;
            spark.style.animationDelay = `${Math.random() * 0.3}s`;
            
            container.appendChild(spark);
            
            setTimeout(() => {
                if (spark.parentNode) spark.remove();
            }, 2000);
        }
    }

    animateBottleChange(oldAmount, newAmount, isAdding) {
        const fillElement = document.getElementById('bottleFill');
        const oldPercent = Math.min(oldAmount / this.targetAmount * 100, 100);
        const newPercent = Math.min(newAmount / this.targetAmount * 100, 100);
        
        fillElement.style.height = `${oldPercent}%`;
        
        // Создаем эффект ряби
        this.createRippleEffect(isAdding);
        
        setTimeout(() => {
            fillElement.style.height = `${newPercent}%`;
            
            // Анимация числа
            this.animateNumberChange('currentAmount', oldAmount, newAmount);
        }, 50);
    }

    animateNumberChange(elementId, oldValue, newValue) {
        const element = document.getElementById(elementId);
        const duration = 800;
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
        const bottle = document.querySelector('.bottle');
        const ripple = document.createElement('div');
        
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: calc(100% - 40px);
            height: 20px;
            background: ${isAdding ? 'rgba(6, 180, 143, 0.3)' : 'rgba(255, 107, 107, 0.3)'};
            border-radius: 10px;
            transform: translate(-50%, -50%) scale(0);
            animation: bottleRipple 0.8s ease-out;
            pointer-events: none;
            z-index: 2;
        `;
        
        bottle.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 800);
    }

    updateTarget() {
        const input = document.getElementById('targetInput');
        const newTarget = parseInt(input.value);
        
        if (newTarget && newTarget >= 500 && newTarget <= 5000) {
            this.targetAmount = newTarget;
            this.saveData();
            this.updateDisplay();
            this.updateChart();
            this.showNotification(`Цель обновлена: ${newTarget} мл`, 'success');
        } else {
            this.showNotification('Цель должна быть от 500 до 5000 мл', 'success');
            input.value = this.targetAmount;
        }
    }

    updateChart() {
        const chartElement = document.getElementById('waterChart');
        const now = new Date();
        const currentHour = now.getHours();
        
        // Очищаем график
        chartElement.innerHTML = '';
        
        // Если нет данных, показываем сообщение
        if (this.waterAmount === 0) {
            chartElement.innerHTML = `
                <div class="chart-empty">
                    <div class="chart-empty-icon">📊</div>
                    <div class="chart-empty-text">Данные появятся здесь</div>
                    <div class="chart-empty-subtext">После добавления воды</div>
                </div>
            `;
            return;
        }
        
        // Рассчитываем прогноз
        this.calculateProjection();
        
        // Находим максимальное значение для масштабирования
        let maxValue = this.targetAmount;
        for (let i = 0; i <= currentHour; i++) {
            maxValue = Math.max(maxValue, this.hourlyData[i].amount, this.hourlyData[i].projected);
        }
        
        // Создаем оси
        const axisY = document.createElement('div');
        axisY.className = 'chart-axis chart-axis-y';
        
        // Добавляем значения на ось Y
        const yValues = [0, Math.round(maxValue/2), maxValue];
        yValues.forEach(value => {
            const yLabel = document.createElement('div');
            yLabel.textContent = value + ' мл';
            axisY.appendChild(yLabel);
        });
        
        const axisX = document.createElement('div');
        axisX.className = 'chart-axis chart-axis-x';
        
        // Добавляем столбцы и метки на ось X
        for (let i = 0; i < 24; i++) {
            const hourData = this.hourlyData[i];
            
            // Создаем столбец для реальных данных
            if (hourData.amount > 0 || hourData.projected > 0) {
                const bar = document.createElement('div');
                bar.className = `chart-bar ${i > currentHour ? 'chart-bar-projected' : ''}`;
                
                // Высота столбца в зависимости от максимального значения
                const barHeight = (Math.max(hourData.amount, hourData.projected) / maxValue) * 100;
                bar.style.height = `${barHeight}%`;
                bar.style.left = `${(i / 24) * 100}%`;
                bar.style.transform = `translateX(-50%)`;
                
                // Подсказка при наведении
                const label = document.createElement('div');
                label.className = 'chart-bar-label';
                let labelText = `${i}:00 - ${i+1}:00`;
                if (hourData.amount > 0) {
                    labelText += `\nВыпито: ${hourData.amount} мл`;
                }
                if (hourData.projected > 0 && i > currentHour) {
                    labelText += `\nПрогноз: ${Math.round(hourData.projected)} мл`;
                }
                label.textContent = labelText;
                bar.appendChild(label);
                
                chartElement.appendChild(bar);
            }
            
            // Добавляем метку на ось X каждые 3 часа
            if (i % 3 === 0) {
                const xLabel = document.createElement('div');
                xLabel.textContent = `${i}:00`;
                axisX.appendChild(xLabel);
            }
        }
        
        chartElement.appendChild(axisY);
        chartElement.appendChild(axisX);
    }

    calculateProjection() {
        const now = new Date();
        const currentHour = now.getHours();
        const remainingHours = 24 - currentHour - 1;
        
        if (remainingHours <= 0 || this.waterAmount >= this.targetAmount) return;
        
        const remainingAmount = this.targetAmount - this.waterAmount;
        const amountPerHour = remainingAmount / remainingHours;
        
        // Заполняем прогноз для оставшихся часов
        for (let i = currentHour + 1; i < 24; i++) {
            this.hourlyData[i].projected = amountPerHour;
        }
    }

    // Функции для зажатия кнопок
    startHold(amount) {
        if (this.isHolding) return;
        
        this.isHolding = true;
        this.holdAmount = amount;
        
        // Добавляем класс на кнопку (визуальная обратная связь)
        const buttons = document.querySelectorAll(`[data-amount="${amount}"]`);
        buttons.forEach(btn => btn.classList.add('hold-active'));
        
        // Вибрация (если поддерживается)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    endHold() {
        if (!this.isHolding) return;
        
        // Убираем класс с кнопки
        const buttons = document.querySelectorAll('.action-btn.hold-active');
        buttons.forEach(btn => btn.classList.remove('hold-active'));
        
        // Удаляем воду (так как это было зажатие)
        this.removeWater(this.holdAmount);
        
        this.isHolding = false;
        this.holdAmount = 0;
    }

    cancelHold() {
        if (!this.isHolding) return;
        
        // Убираем класс с кнопки
        const buttons = document.querySelectorAll('.action-btn.hold-active');
        buttons.forEach(btn => btn.classList.remove('hold-active'));
        
        // Добавляем воду (так как это было короткое нажатие)
        this.addWater(this.holdAmount);
        
        this.isHolding = false;
        this.holdAmount = 0;
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
            this.hourlyData = this.initHourlyData();
            this.saveData();
            this.updateDisplay();
            this.updateChart();
            this.showNotification('День сброшен! Начните заново 🌱', 'success');
        }
    }

    updateDisplay() {
        const percentage = Math.min(Math.round((this.waterAmount / this.targetAmount) * 100), 100);
        
        // Обновление основных элементов
        document.getElementById('currentAmount').textContent = this.waterAmount;
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
            
            oscillator.frequency.value = isAdding ? 600 : 300;
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
        // Обновляем каждую минуту
        setInterval(() => {
            this.updateStats();
            this.updateChart();
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

// Глобальные переменные для обработки кнопок
let activeButton = null;
let holdTimer = null;

// Функция начала нажатия
function startButtonPress(event, amount) {
    event.preventDefault();
    
    // Запоминаем активную кнопку
    activeButton = event.currentTarget;
    
    // Начинаем зажатие
    if (window.waterTracker) {
        window.waterTracker.startHold(amount);
    }
    
    return false;
}

// Функция окончания нажатия
function endButtonPress(event, amount) {
    event.preventDefault();
    
    // Если это не та же кнопка - игнорируем
    if (event.currentTarget !== activeButton) return;
    
    // Проверяем время нажатия
    const pressTime = parseInt(event.currentTarget.dataset.pressTime || '0');
    const holdTime = Date.now() - pressTime;
    
    // Если было зажатие - удаляем, иначе добавляем
    if (window.waterTracker) {
        if (holdTime > 500) { // Больше 500ms = удаление
            window.waterTracker.endHold();
        } else { // Меньше 500ms = добавление
            window.waterTracker.cancelHold();
        }
    }
    
    activeButton = null;
    return false;
}

// Функция отмены нажатия
function cancelButtonPress(event, amount) {
    event.preventDefault();
    
    // Если мышь ушла с активной кнопки - отменяем
    if (activeButton === event.currentTarget) {
        if (window.waterTracker) {
            // Если ушли с кнопки - считаем это коротким нажатием (добавление)
            window.waterTracker.cancelHold();
        }
        activeButton = null;
    }
    
    return false;
}

// Сохраняем время нажатия
document.addEventListener('mousedown', function(e) {
    if (e.target.closest('.action-btn')) {
        e.target.closest('.action-btn').dataset.pressTime = Date.now();
    }
});

document.addEventListener('touchstart', function(e) {
    if (e.target.closest('.action-btn')) {
        e.target.closest('.action-btn').dataset.pressTime = Date.now();
    }
});

// Запрещаем контекстное меню на кнопках
document.addEventListener('contextmenu', function(e) {
    if (e.target.closest('.action-btn')) {
        e.preventDefault();
    }
});

// Глобальная функция для обновления цели
function updateTarget() {
    if (window.waterTracker) {
        window.waterTracker.updateTarget();
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.waterTracker = new WaterTracker();
});

// Глобальные функции для кнопок
function addCustomWater() {
    if (window.waterTracker) window.waterTracker.addCustomWater();
}

function removeCustomWater() {
    if (window.waterTracker) window.waterTracker.removeCustomWater();
}

function resetWater() {
    if (window.waterTracker) window.waterTracker.resetWater();
}
