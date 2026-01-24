[file name]: app.js
// Главное приложение HealthFlow
class HealthFlowApp {
    constructor() {
        this.state = {
            currentPage: 'water',
            totalSkins: 0,
            theme: 'cozy'
        };
    }
    
    async init() {
        console.log('🚀 Инициализация HealthFlow...');
        
        // Загружаем состояние
        this.loadState();
        
        // Создаём контейнер для страницы
        this.createPageContainer();
        
        // Загружаем текущую страницу
        await this.loadPage('water');
        
        // Настраиваем навигацию
        this.setupNavigation();
        
        console.log('✅ HealthFlow запущен');
    }
    
    loadState() {
        // Загружаем скинты
        const savedSkins = localStorage.getItem('healthflow_skins');
        this.state.totalSkins = savedSkins ? parseInt(savedSkins) : 0;
        
        // Загружаем тему
        const savedTheme = localStorage.getItem('healthflow_theme');
        this.state.theme = savedTheme || 'cozy';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        // Загружаем последнюю страницу
        const savedPage = localStorage.getItem('healthflow_page');
        if (savedPage && ['water', 'workouts', 'profile'].includes(savedPage)) {
            this.state.currentPage = savedPage;
        }
    }
    
    saveState() {
        localStorage.setItem('healthflow_skins', this.state.totalSkins.toString());
        localStorage.setItem('healthflow_theme', this.state.theme);
        localStorage.setItem('healthflow_page', this.state.currentPage);
    }
    
    createPageContainer() {
        const container = document.getElementById('appContainer');
        container.innerHTML = `
            <div class="page active" id="currentPage">
                <!-- Контент будет загружен динамически -->
            </div>
        `;
    }
    
    async loadPage(pageId) {
        console.log(`📄 Загрузка страницы: ${pageId}`);
        
        // Сохраняем текущую страницу
        this.state.currentPage = pageId;
        this.saveState();
        
        // Обновляем навигацию
        this.updateNavigation(pageId);
        
        // Загружаем контент страницы
        await this.loadPageContent(pageId);
    }
    
    async loadPageContent(pageId) {
        const container = document.getElementById('currentPage');
        
        try {
            if (pageId === 'water') {
                await this.loadWaterPage(container);
            } 
            else if (pageId === 'workouts') {
                await this.loadWorkoutsPage(container);
            } 
            else if (pageId === 'profile') {
                this.loadProfilePage(container);
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки страницы ${pageId}:`, error);
            container.innerHTML = `<div class="error-message" style="padding: 40px; text-align: center;">Ошибка загрузки страницы</div>`;
        }
    }
    
    async loadWaterPage(container) {
        try {
            // Загружаем модуль воды из отдельного файла
            const response = await fetch('water.html');
            const html = await response.text();
            container.innerHTML = html;
            
            // Загружаем и выполняем water.js
            const scriptResponse = await fetch('water.js');
            const scriptText = await scriptResponse.text();
            
            // Создаем глобальную переменную для водного трекера
            const script = document.createElement('script');
            script.textContent = `
                // Создаем и инициализируем WaterTracker
                window.waterTracker = new WaterTracker();
                window.waterTracker.init();
                
                // Экспортируем функции для глобального использования
                window.addWater = function(amount) {
                    if (window.waterTracker) {
                        window.waterTracker.addWater(amount);
                    }
                };
                
                window.removeWater = function(amount) {
                    if (window.waterTracker) {
                        window.waterTracker.removeWater(amount);
                    }
                };
            `;
            
            // Добавляем исходный код water.js
            const originalScript = document.createElement('script');
            originalScript.textContent = scriptText;
            
            document.head.appendChild(originalScript);
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля воды:', error);
            container.innerHTML = this.getWaterFallback();
        }
    }
    
    getWaterFallback() {
        return `
            <header class="page-header">
                <h1 class="page-title">Вода</h1>
                <div class="page-controls">
                    <div class="skin-counter">
                        ✨ <span id="skinCount">${this.state.totalSkins}</span>
                    </div>
                    <button class="theme-toggle" onclick="window.healthFlow.toggleTheme()">
                        <div class="theme-icon">🌙</div>
                    </button>
                </div>
            </header>
            
            <div class="content-container">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">💧</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
                        Модуль воды
                    </h2>
                    <p style="color: var(--text-secondary); line-height: 1.5;">
                        Загрузка модуля воды...
                    </p>
                </div>
            </div>
        `;
    }
    
    async loadWorkoutsPage(container) {
        try {
            // Загружаем модуль тренировок
            const response = await fetch('workouts.html');
            if (!response.ok) throw new Error('Файл не найден');
            const html = await response.text();
            container.innerHTML = html;
            
            // Загружаем workouts.js
            const scriptResponse = await fetch('workouts.js');
            const scriptText = await scriptResponse.text();
            
            // Исполняем workouts.js
            const script = document.createElement('script');
            script.textContent = scriptText;
            
            // Добавляем инициализацию после загрузки DOM
            script.onload = () => {
                if (window.workoutsManager) {
                    window.workoutsManager.init();
                }
            };
            
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля тренировок:', error);
            container.innerHTML = this.getWorkoutsFallback();
        }
    }
    
    getWorkoutsFallback() {
        return `
            <header class="page-header">
                <h1 class="page-title">Тренировки</h1>
                <div class="page-controls">
                    <div class="skin-counter">
                        ✨ <span>${this.state.totalSkins}</span>
                    </div>
                    <button class="theme-toggle" onclick="window.healthFlow.toggleTheme()">
                        <div class="theme-icon">🌙</div>
                    </button>
                </div>
            </header>
            <div class="content-container">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🏋️</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
                        Модуль тренировок
                    </h2>
                    <p style="color: var(--text-secondary); line-height: 1.5;">
                        Скоро здесь появится система тренировок!
                    </p>
                </div>
            </div>
        `;
    }
    
    loadProfilePage(container) {
        container.innerHTML = `
            <header class="page-header">
                <h1 class="page-title">Профиль</h1>
                <div class="page-controls">
                    <div class="skin-counter">
                        ✨ <span>${this.state.totalSkins}</span>
                    </div>
                    <button class="theme-toggle" onclick="window.healthFlow.toggleTheme()">
                        <div class="theme-icon">🌙</div>
                    </button>
                </div>
            </header>
            <div class="content-container">
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">👤</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
                        Профиль
                    </h2>
                    <p style="color: var(--text-secondary); margin-bottom: 30px;">
                        Здесь будет твоя статистика
                    </p>
                    
                    <div style="background: var(--surface); border-radius: var(--radius); padding: 24px; border: 2px solid var(--border-light); margin-bottom: 20px;">
                        <div style="font-size: 3rem; font-weight: 800; color: var(--primary); margin-bottom: 10px;">
                            ${this.state.totalSkins}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            Всего скинтов
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    updateNavigation(pageId) {
        // Обновляем активную кнопку навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            }
        });
        
        // Обновляем URL hash
        window.location.hash = pageId;
    }
    
    setupNavigation() {
        // Обработка кликов по навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = item.dataset.page;
                if (pageId && pageId !== this.state.currentPage) {
                    this.loadPage(pageId);
                }
            });
        });
        
        // Обработка hash в URL
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && hash !== this.state.currentPage && ['water', 'workouts', 'profile'].includes(hash)) {
                this.loadPage(hash);
            }
        });
    }
    
    addSkins(amount, source = 'unknown') {
        const oldSkins = this.state.totalSkins;
        this.state.totalSkins += amount;
        
        console.log(`✨ +${amount} скинтов (${source}). Всего: ${this.state.totalSkins}`);
        
        // Сохраняем
        this.saveState();
        
        // Обновляем отображение
        this.updateSkinDisplay();
        
        // Показываем уведомление если добавили скинты
        if (amount > 0) {
            this.showNotification(`+${amount} скинтов ✨`, 'skins');
        }
        
        return this.state.totalSkins;
    }
    
    updateSkinDisplay() {
        // Обновляем все счётчики скинтов на странице
        document.querySelectorAll('.skin-counter span').forEach(element => {
            element.textContent = this.state.totalSkins;
        });
    }
    
    toggleTheme() {
        this.state.theme = this.state.theme === 'cozy' ? 'light' : 'cozy';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        this.saveState();
        
        // Обновляем иконки темы
        document.querySelectorAll('.theme-icon').forEach(icon => {
            icon.textContent = this.state.theme === 'cozy' ? '🌙' : '☀️';
        });
        
        this.showNotification(`Тема: ${this.state.theme === 'cozy' ? 'Уютная' : 'Светлая'}`, 'success');
    }
    
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Создаём и экспортируем экземпляр приложения
window.healthFlow = new HealthFlowApp();

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.healthFlow.init();
});
