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
            const y = window.innerHeight - 200 + Math.random() * 
