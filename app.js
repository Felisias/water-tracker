[file name]: app.js
[file content begin]
// Главное приложение HealthFlow
class HealthFlowApp {
    constructor() {
        this.state = {
            currentPage: 'water',
            totalSkins: 0,
            theme: 'cozy'
        };
        
        this.pages = {
            water: null,
            workouts: null,
            profile: null
        };
        
        this.db = null;
        this.exerciseManager = null;
        this.workoutTracker = null;
    }
    
    async init() {
        console.log('🚀 Инициализация HealthFlow...');
        
        // Загружаем состояние
        this.loadState();
        
        // Инициализируем базу данных
        await this.initDatabase();
        
        // Создаём контейнер для страницы
        this.createPageContainer();
        
        // Загружаем текущую страницу
        await this.loadPage('water');
        
        // Настраиваем навигацию
        this.setupNavigation();
        
        // Настраиваем Service Worker
        this.setupServiceWorker();
        
        console.log('✅ HealthFlow запущен');
    }
    
    async initDatabase() {
        try {
            const { db } = await import('./db.js');
            await db.init();
            this.db = db;
            console.log('✅ База данных инициализирована');
        } catch (error) {
            console.error('❌ Ошибка инициализации базы данных:', error);
        }
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
        if (savedPage && this.pages[savedPage]) {
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
            switch(pageId) {
                case 'water':
                    await this.loadWaterPage(container);
                    break;
                    
                case 'workouts':
                    await this.loadWorkoutsPage(container);
                    break;
                    
                case 'profile':
                    container.innerHTML = this.getPageStub(pageId);
                    break;
                    
                default:
                    container.innerHTML = `<div class="error-message">Страница не найдена</div>`;
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки страницы ${pageId}:`, error);
            container.innerHTML = `
                <div class="error-message">
                    <div style="font-size: 3rem; margin-bottom: 20px;">😕</div>
                    <div style="font-size: 1.2rem; margin-bottom: 10px;">Ошибка загрузки страницы</div>
                    <div style="color: var(--text-secondary);">${error.message}</div>
                </div>
            `;
        }
    }
    
    async loadWaterPage(container) {
        // Загружаем HTML модуля воды
        const response = await fetch('water.html');
        const html = await response.text();
        
        // Вставляем HTML
        container.innerHTML = html;
        
        // Загружаем и инициализируем JS модуля воды
        await this.loadWaterModule();
    }
    
    async loadWaterModule() {
        try {
            // Загружаем модуль воды
            const module = await import('./water.js');
            
            // Инициализируем модуль
            if (module && module.init) {
                await module.init(this);
                console.log('✅ Модуль воды загружен');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля воды:', error);
            this.showNotification('Ошибка загрузки модуля воды', 'error');
        }
    }
    
    async loadWorkoutsPage(container) {
        // Загружаем HTML шаблон тренировок
        const response = await fetch('workouts.html');
        const html = await response.text();
        
        // Вставляем HTML
        container.innerHTML = html;
        
        // Загружаем и инициализируем модуль тренировок
        await this.loadWorkoutsModule();
    }
    
    async loadWorkoutsModule() {
        try {
            // Загружаем менеджер упражнений
            const { initExerciseManager } = await import('./exercises.js');
            this.exerciseManager = await initExerciseManager(this.db);
            
            // Загружаем трекер тренировок
            const { initWorkoutTracker } = await import('./workouts.js');
            this.workoutTracker = await initWorkoutTracker(this.db, this.exerciseManager);
            
            // Инициализируем UI тренировок
            await this.initWorkoutsUI();
            
            console.log('✅ Модуль тренировок загружен');
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля тренировок:', error);
            this.showNotification('Ошибка загрузки модуля тренировок', 'error');
        }
    }
    
    async initWorkoutsUI() {
        // Эта функция будет реализована в workouts-ui.js
        console.log('Инициализация UI тренировок...');
        
        // Временная заглушка
        const skinCount = document.getElementById('workoutSkinCount');
        if (skinCount) {
            skinCount.textContent = this.state.totalSkins;
        }
        
        // Кнопка темы
        const themeToggle = document.getElementById('workoutThemeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
    
    getPageStub(pageId) {
        const stubs = {
            profile: `
                <header class="page-header">
                    <h1 class="page-title">Профиль</h1>
                    <div class="page-controls">
                        <div class="skin-counter">
                            ✨ <span>${this.state.totalSkins}</span>
                        </div>
                        <button class="theme-toggle" onclick="window.healthFlow.toggleTheme()">
                            <div class="theme-icon">${this.state.theme === 'cozy' ? '🌙' : '☀️'}</div>
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
            `
        };
        
        return stubs[pageId] || `<div>Страница не найдена</div>`;
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
            if (hash && hash !== this.state.currentPage && this.pages[hash]) {
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
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('✅ ServiceWorker зарегистрирован:', registration.scope);
                })
                .catch(error => {
                    console.log('❌ ServiceWorker ошибка:', error);
                });
        }
    }
    
    // Геттеры для доступа к модулям извне
    getExerciseManager() {
        return this.exerciseManager;
    }
    
    getWorkoutTracker() {
        return this.workoutTracker;
    }
}

// Создаём и экспортируем экземпляр приложения
window.HealthFlow = new HealthFlowApp();

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.HealthFlow.init();
});
[file content end]
