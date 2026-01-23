// Инициализация
let waterAmount = 0;
let targetAmount = 2000;
let history = [];

// Загрузка данных из localStorage
function loadData() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('waterData');
    
    if (saved) {
        const data = JSON.parse(saved);
        if (data.date === today) {
            waterAmount = data.amount;
            history = data.history || [];
        }
    }
    
    const savedTarget = localStorage.getItem('waterTarget');
    if (savedTarget) {
        targetAmount = parseInt(savedTarget);
        document.getElementById('targetInput').value = targetAmount;
    }
    
    updateDisplay();
}

// Сохранение данных
function saveData() {
    const today = new Date().toDateString();
    const data = {
        date: today,
        amount: waterAmount,
        history: history
    };
    localStorage.setItem('waterData', JSON.stringify(data));
    localStorage.setItem('waterTarget', targetAmount.toString());
}

// Добавление воды
function addWater(amount) {
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    waterAmount += amount;
    history.unshift({amount, time});
    
    if (history.length > 10) history = history.slice(0, 10);
    
    updateDisplay();
    saveData();
    showNotification(`+${amount} мл добавлено!`);
}

// Добавление произвольного количества
function addCustomWater() {
    const input = document.getElementById('customAmount');
    const amount = parseInt(input.value);
    
    if (amount && amount > 0) {
        addWater(amount);
        input.value = '';
    } else {
        alert('Введите корректное количество!');
    }
}

// Обновление цели
function updateTarget() {
    const input = document.getElementById('targetInput');
    const newTarget = parseInt(input.value);
    
    if (newTarget && newTarget >= 500) {
        targetAmount = newTarget;
        updateDisplay();
        saveData();
        showNotification(`Цель обновлена: ${newTarget} мл`);
    }
}

// Сброс данных за день
function resetWater() {
    if (confirm('Сбросить данные за сегодня?')) {
        waterAmount = 0;
        history = [];
        updateDisplay();
        saveData();
        showNotification('Данные сброшены!');
    }
}

// Обновление интерфейса
function updateDisplay() {
    const percentage = Math.min(Math.round((waterAmount / targetAmount) * 100), 100);
    
    document.getElementById('currentAmount').textContent = waterAmount;
    document.getElementById('targetAmount').textContent = targetAmount;
    document.getElementById('percentage').textContent = percentage + '%';
    document.getElementById('progressBar').style.width = percentage + '%';
    
    // Обновление цвета прогресса
    const progressBar = document.getElementById('progressBar');
    if (percentage >= 100) {
        progressBar.style.background = 'linear-gradient(90deg, #66bb6a, #388e3c)';
    } else if (percentage >= 75) {
        progressBar.style.background = 'linear-gradient(90deg, #4fc3f7, #0288d1)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #81d4fa, #0288d1)';
    }
    
    // Обновление истории
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    history.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.time}</span>
            <span>+${item.amount} мл</span>
        `;
        historyList.appendChild(li);
    });
}

// Уведомление
function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('💧 Трекер воды', {
            body: message,
            icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💧</text></svg>'
        });
    }
    
    // Простой алерт на телефоне
    const alert = document.createElement('div');
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #0288d1;
        color: white;
        padding: 10px 20px;
        border-radius: 10px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Запрос разрешения на уведомления
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Добавление service worker для PWA (опционально)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
});