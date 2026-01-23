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
        
        // Настраиваем Service Worker
        this.setupServiceWorker();
        
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
            // Для модуля воды загружаем отдельно
            if (pageId === 'water') {
                await this.loadWaterPage(container);
            } else {
                // Для других страниц показываем заглушки
                container.innerHTML = this.getPageStub(pageId);
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки страницы ${pageId}:`, error);
            container.innerHTML = `<div class="error-message">Ошибка загрузки страницы</div>`;
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
        }
    }












    // В app.js добавляем загрузку модуля тренировок:
    
    async loadPageContent(pageId) {
        const container = document.getElementById('currentPage');
        
        try {
            if (pageId === 'water') {
                await this.loadWaterPage(container);
            } else if (pageId === 'workouts') {
                await this.loadWorkoutsPage(container);
            } else {
                container.innerHTML = this.getPageStub(pageId);
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки страницы ${pageId}:`, error);
            container.innerHTML = `<div class="error-message">Ошибка загрузки страницы</div>`;
        }
    }
    
    async loadWorkoutsPage(container) {
        // Загружаем HTML
        const response = await fetch('workouts.html');
        const html = await response.text();
        container.innerHTML = html;
        
        // Загружаем и инициализируем модуль тренировок
        await this.loadWorkoutsModule();
    }
    
    async loadWorkoutsModule() {
        try {
            // Загружаем зависимости
            const { db } = await import('./db.js');
            const ExerciseManager = (await import('./exercises.js')).default;
            const utils = await import('./utils.js');
            
            // Инициализируем менеджер упражнений
            const exerciseManager = new ExerciseManager(db);
            await db.init();
            await exerciseManager.init();
            await exerciseManager.seedDefaultExercises();
            
            // Создаем и экспортируем глобально
            window.WorkoutManager = {
                exercises: exerciseManager,
                utils: utils,
                db: db
            };
            
            console.log('✅ Модуль тренировок загружен');
            
            // Инициализируем интерфейс
            this.initWorkoutUI();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки модуля тренировок:', error);
        }
    }
    
    initWorkoutUI() {
        // Инициализация табов, модальных окон и т.д.
        // Это временная заглушка - основную логику напишем в workouts.js
        console.log('Инициализация интерфейса тренировок...');
    }

















    
    
    getPageStub(pageId) {
        const stubs = {
            workouts: `
                <header class="page-header">
                    <h1 class="page-title">Тренировки</h1>
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
                        <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🏋️</div>
                        <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
                            Модуль тренировок
                        </h2>
                        <p style="color: var(--text-secondary); line-height: 1.5;">
                            Скоро здесь появится система тренировок!
                        </p>
                    </div>
                </div>
            `,
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
    
        // В app.js расширяем addSkins:
    addSkins(amount, source = 'unknown') {
        const oldSkins = this.state.totalSkins;
        this.state.totalSkins += amount;
        
        // Уведомление для тренировок
        const workoutMessages = {
            'workout_complete': '🏋️ Тренировка завершена!',
            'new_record': '🏆 Новый рекорд!',
            'streak': '🔥 Серия тренировок!'
        };
        
        if (workoutMessages[source]) {
            this.showNotification(`${workoutMessages[source]} +${amount}✨`, 'skins');
        }
        
        this.saveState();
        this.updateSkinDisplay();
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
}

// Создаём и экспортируем экземпляр приложения
window.healthFlow = new HealthFlowApp();

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.healthFlow.init();
});


