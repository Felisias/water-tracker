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
        
        // Данные для графика: накапливаемая сумма по часам
        this.hourlyData = this.initHourlyData();
        
        // Простые переменные для зажатия
        this.isHolding = false;
        this.holdStartTime = 0;
        this.holdAmount = 0;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateWaveChart();
        this.updateCurrentTime();
        this.startClock();
    }

    initHourlyData() {
        const data = [];
        for (let i = 0; i < 24; i++) {
            data.push({
                hour: i,
                cumulative: 0, // Накопленная сумма к этому часу
                addedThisHour: 0 // Добавлено в этот час
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
                
                // Пересчитываем накопленную сумму
                this.recalculateCumulative();
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
            document.getElementById('targetAmountDisplay').textContent = `${this.targetAmount} мл`;
        }
    }

    recalculateCumulative() {
        let cumulative = 0;
        for (let i = 0; i < 24; i++) {
            cumulative += this.hourlyData[i].addedThisHour;
            this.hourlyData[i].cumulative = cumulative;
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
        
        console.log(`Добавляем воду: ${amount} мл`);
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
        this.hourlyData[hour].addedThisHour += amount;
        this.recalculateCumulative();
        
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
        this.updateWaveChart();
        
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
        
        console.log(`Удаляем воду: ${amount} мл`);
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
        
        // Обновляем данные для графика (не позволяем уйти в минус)
        const hourData = this.hourlyData[hour];
        const oldAdded = hourData.addedThisHour;
        hourData.addedThisHour = Math.max(0, oldAdded - actualRemove);
        this.recalculateCumulative();
        
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
        this.updateWaveChart();
        
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
            let tempCounter = this.skinCounter;
            let skinsLost = 0;
            let remaining = amount;
            
            if (tempCounter > 0) {
                const fromCounter = Math.min(tempCounter, remaining);
                tempCounter -= fromCounter;
                remaining -= fromCounter;
                
                if (tempCounter < 0) {
                    tempCounter += 250;
                    skinsLost++;
                }
            }
            
            skinsLost += Math.floor(remaining / 250);
            remaining = remaining % 250;
            
            this.skinCounter = tempCounter;
            return skinsLost;
        }
    }

    createSparks(count, isNegative) {
        const container = document.getElementById('sparksContainer');
        
        for (let i = 0; i < count * 2; i++) {
            const spark = document.createElement('div');
            spark.className = `spark ${isNegative ? 'negative' : ''}`;
            
            const x = 100 + Math.random() * 200;
            const y = window.innerHeight / 2 - 50 + Math.random() * 100;
            
            spark.style.left = `${x}px`;
            spark.style.top = `${y}px`;
            spark.style.animationDelay = `${Math.random() * 0.3}s`;
            
            container.appendChild(spark);
            
            setTimeout(() => spark.remove(), 2000);
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
        const bottle = document.querySelector('.bottle-large');
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
            document.getElementById('targetAmountDisplay').textContent = `${newTarget} мл`;
            
            // Обновляем активную пресет-кнопку
            document.querySelectorAll('.target-preset').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.target) === newTarget) {
                    btn.classList.add('active');
                }
            });
            
            this.saveData();
            this.updateDisplay();
            this.updateWaveChart();
            this.showNotification(`Цель обновлена: ${newTarget} мл`, 'success');
        } else {
            this.showNotification('Цель должна быть от 500 до 5000 мл', 'success');
            input.value = this.targetAmount;
        }
    }

    setTargetFromPreset(target) {
        document.getElementById('targetInput').value = target;
        this.updateTarget();
    }

    updateWaveChart() {
        const chartElement = document.getElementById('waveChart');
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour + currentMinute / 60;
        
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
        
        // Создаем SVG для графика-волны
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');
        
        // Находим максимальное значение для масштабирования
        let maxCumulative = this.targetAmount;
        for (let i = 0; i <= currentHour; i++) {
            maxCumulative = Math.max(maxCumulative, this.hourlyData[i].cumulative);
        }
        
        // Создаем данные для волны
        const points = [];
        const areaPoints = [];
        
        // Начинаем с точки (0, 100) - нижний левый угол
        areaPoints.push('M 0,100 ');
        
        // Добавляем точку для каждого часа (до текущего времени)
        for (let i = 0; i <= currentTime; i += 0.5) {
            const hour = Math.floor(i);
            const nextHour = Math.min(hour + 1, 23);
            const progress = i - hour;
            
            // Интерполируем значение между часами
            let value;
            if (hour < this.hourlyData.length - 1) {
                const currentVal = this.hourlyData[Math.min(hour, 23)].cumulative;
                const nextVal = this.hourlyData[Math.min(nextHour, 23)].cumulative;
                value = currentVal + (nextVal - currentVal) * progress;
            } else {
                value = this.hourlyData[23].cumulative;
            }
            
            const x = (i / 24) * 100;
            const y = 100 - (value / maxCumulative) * 100;
            
            points.push({x, y, hour: Math.floor(i), value: Math.round(value)});
            areaPoints.push(`L ${x},${y} `);
        }
        
        // Завершаем область
        areaPoints.push('L 100,100 Z');
        
        // Рисуем область под волной
        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        areaPath.setAttribute('d', areaPoints.join(''));
        areaPath.setAttribute('class', 'wave-area');
        svg.appendChild(areaPath);
        
        // Рисуем линию волны
        if (points.length > 1) {
            const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            path.setAttribute('points', linePoints);
            path.setAttribute('class', 'wave-path');
            svg.appendChild(path);
        }
        
        // Добавляем точки на каждый час
        points.forEach(point => {
            if (point.hour === Math.floor(point.hour)) { // Только целые часы
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', point.x);
                circle.setAttribute('cy', point.y);
                circle.setAttribute('r', '3');
                circle.setAttribute('class', 'wave-point');
                circle.setAttribute('data-hour', point.hour);
                circle.setAttribute('data-value', point.value);
                
                // Подсказка при наведении
                circle.addEventListener('mouseover', (e) => {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'wave-point-label';
                    tooltip.textContent = `${point.hour}:00 - ${point.value} мл`;
                    tooltip.style.left = `${e.clientX}px`;
                    tooltip.style.top = `${e.clientY - 40}px`;
                    document.body.appendChild(tooltip);
                    circle._tooltip = tooltip;
                });
                
                circle.addEventListener('mouseout', () => {
                    if (circle._tooltip) {
                        circle._tooltip.remove();
                        delete circle._tooltip;
                    }
                });
                
                svg.appendChild(circle);
            }
        });
        
        // Добавляем текущее время
        const currentX = (currentTime / 24) * 100;
        const currentLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        currentLine.setAttribute('x1', currentX);
        currentLine.setAttribute('y1', '0');
        currentLine.setAttribute('x2', currentX);
        currentLine.setAttribute('y2', '100');
        currentLine.setAttribute('stroke', 'var(--accent)');
        currentLine.setAttribute('stroke-width', '2');
        currentLine.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(currentLine);
        
        chartElement.appendChild(svg);
        
        // Обновляем информацию под графиком
        document.getElementById('chartTotal').textContent = `Всего: ${this.waterAmount} мл`;
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('currentTime').textContent = `Сейчас: ${timeString}`;
    }

    // ПРОСТЫЕ ФУНКЦИИ ДЛЯ КНОПОК
    handleButtonAction(amount, isHold) {
        if (isHold) {
            this.removeWater(amount);
        } else {
            this.addWater(amount);
        }
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
            this.updateWaveChart();
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
        
        // Обновление расчета скинтов для кастомного ввода
        const inputValue = document.getElementById('customAmount').value;
        this.updateSkinCalculation(inputValue);
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
            this.updateWaveChart();
            this.updateCurrentTime();
        }, 60000);
        
        // Обновляем время сразу
        this.updateCurrentTime();
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
        
        // Обработка кнопок действий
        this.setupButtonListeners();
        
        // Обработка кастомного ввода
        document.getElementById('customAmount').addEventListener('input', (e) => {
            this.updateSkinCalculation(e.target.value);
        });
        
        document.getElementById('customAmount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const amount = parseInt(document.getElementById('customAmount').value);
                if (amount > 0) {
                    this.addWater(amount);
                    document.getElementById('customAmount').value = '';
                }
            }
        });
        
        // Кнопки добавления/удаления кастомного количества
        document.querySelector('.custom-btn.add').addEventListener('click', () => {
            const input = document.getElementById('customAmount');
            const amount = parseInt(input.value);
            if (amount && amount > 0) {
                this.addWater(amount);
                input.value = '';
            }
        });
        
        document.querySelector('.custom-btn.remove').addEventListener('click', () => {
            const input = document.getElementById('customAmount');
            const amount = parseInt(input.value);
            if (amount && amount > 0) {
                this.removeWater(amount);
                input.value = '';
            }
        });
        
        // Кнопка сохранения цели
        document.getElementById('saveTargetBtn').addEventListener('click', () => {
            this.updateTarget();
        });
        
        // Пресеты цели
        document.querySelectorAll('.target-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = parseInt(btn.dataset.target);
                this.setTargetFromPreset(target);
            });
        });
        
        // Кнопка сброса
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetWater();
        });
    }
    
    setupButtonListeners() {
        const actionButtons = document.querySelectorAll('.action-btn');
        
        actionButtons.forEach(button => {
            let holdTimeout;
            let isLongPress = false;
            
            const startHold = () => {
                const amount = parseInt(button.dataset.amount);
                console.log('Начало нажатия:', amount);
                
                button.classList.add('hold-active');
                
                holdTimeout = setTimeout(() => {
                    console.log('Долгое нажатие - удаление:', amount);
                    isLongPress = true;
                    this.removeWater(amount);
                }, 500);
            };
            
            const endHold = () => {
                clearTimeout(holdTimeout);
                button.classList.remove('hold-active');
                
                if (!isLongPress) {
                    const amount = parseInt(button.dataset.amount);
                    console.log('Короткое нажатие - добавление:', amount);
                    this.addWater(amount);
                }
                
                isLongPress = false;
            };
            
            // Для мыши
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                startHold();
            });
            
            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                endHold();
            });
            
            button.addEventListener('mouseleave', () => {
                clearTimeout(holdTimeout);
                button.classList.remove('hold-active');
                isLongPress = false;
            });
            
            // Для тач-устройств
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startHold();
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                endHold();
            });
            
            button.addEventListener('touchcancel', () => {
                clearTimeout(holdTimeout);
                button.classList.remove('hold-active');
                isLongPress = false;
            });
        });
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
    console.log('Инициализация WaterTracker...');
    window.waterTracker = new WaterTracker();
});
