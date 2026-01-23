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
            } 
            // Для тренировок загружаем тренировки
            else if (pageId === 'workouts') {
                await this.loadWorkoutsPage(container);
            } 
            else {
                // Для других страниц показываем заглушки
                container.innerHTML = this.getPageStub(pageId);
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки страницы ${pageId}:`, error);
            container.innerHTML = `<div class="error-message">Ошибка загрузки страницы</div>`;
        }
    }
    
    // Добавить новую функцию для загрузки страницы тренировок
    async loadWorkoutsPage(container) {
        // Загружаем HTML тренировок
        const response = await fetch('workouts.html');
        const html = await response.text();
        
        // Вставляем HTML
        container.innerHTML = html;
        
        // Инициализируем модуль тренировок
        await this.initWorkoutsModule();
    }
    
    // Добавить функцию инициализации тренировок
    async initWorkoutsModule() {
        console.log('🏋️ Инициализация модуля тренировок...');
        
        // Инициализируем базу данных
        await this.initDatabase();
        
        // Настраиваем обработчики событий
        this.setupWorkoutsEventListeners();
        
        // Загружаем упражнения
        await this.loadExercises();
        
        console.log('✅ Модуль тренировок готов');
    }
    
    // Добавить функцию инициализации базы данных
    async initDatabase() {
        try {
            const { db } = await import('./db.js');
            await db.init();
            this.db = db;
            console.log('✅ База данных инициализирована');
        } catch (error) {
            console.error('❌ Ошибка базы данных:', error);
        }
    }
    
    // Добавить функцию загрузки упражнений
    async loadExercises() {
        if (!this.db) return;
        
        try {
            const exercises = await this.db.getAll('exercises');
            this.renderExercises(exercises);
        } catch (error) {
            console.error('❌ Ошибка загрузки упражнений:', error);
        }
    }
    
    // Добавить функцию отрисовки упражнений
    renderExercises(exercises) {
        const exercisesList = document.getElementById('exercisesList');
        if (!exercisesList) return;
        
        if (!exercises || exercises.length === 0) {
            exercisesList.innerHTML = `
                <div class="empty-exercises">
                    <div class="empty-icon">🏋️</div>
                    <div class="empty-text">Нет упражнений</div>
                    <div class="empty-subtext">Создайте первое упражнение!</div>
                </div>
            `;
            return;
        }
        
        exercisesList.innerHTML = exercises.map(exercise => `
            <div class="exercise-card" data-id="${exercise.id}">
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-category ${exercise.category}">${this.getCategoryName(exercise.category)}</div>
                </div>
                <div class="exercise-description">${exercise.description || 'Без описания'}</div>
                <button class="exercise-delete" onclick="window.healthFlow.deleteExercise(${exercise.id})">×</button>
            </div>
        `).join('');
    }
    
    // Добавить вспомогательную функцию для названий категорий
    getCategoryName(category) {
        const categories = {
            'strength': 'Силовые',
            'cardio': 'Кардио',
            'flexibility': 'Растяжка',
            'core': 'Пресс',
            'upper': 'Верх тела',
            'lower': 'Низ тела',
            'full': 'Все тело'
        };
        return categories[category] || category;
    }
    
    // Добавить функцию удаления упражнения
    async deleteExercise(id) {
        if (confirm('Удалить это упражнение?')) {
            try {
                await this.db.delete('exercises', id);
                await this.loadExercises();
                this.showNotification('Упражнение удалено', 'success');
            } catch (error) {
                console.error('❌ Ошибка удаления:', error);
                this.showNotification('Ошибка удаления', 'error');
            }
        }
    }
    
    // Добавить функцию настройки обработчиков для тренировок
    setupWorkoutsEventListeners() {
        // Кнопка создания упражнения
        const createBtn = document.getElementById('createExerciseBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showExerciseModal());
        }
        
        // Закрытие модального окна
        const modal = document.getElementById('exerciseModal');
        const modalClose = document.getElementById('modalClose');
        const cancelBtn = document.getElementById('cancelBtn');
        
        if (modalClose) modalClose.addEventListener('click', () => this.hideExerciseModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideExerciseModal());
        if (modal) modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideExerciseModal();
        });
        
        // Форма создания упражнения
        const form = document.getElementById('exerciseForm');
        if (form) {
            form.addEventListener('submit', (e) => this.createExercise(e));
        }
        
        // Кнопка темы
        const themeToggle = document.getElementById('workoutsThemeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Обновление счётчика скинтов
        const skinCount = document.getElementById('skinCountWorkouts');
        if (skinCount) {
            skinCount.textContent = this.state.totalSkins;
        }
    }
    
    // Добавить функции для модального окна
    showExerciseModal() {
        const modal = document.getElementById('exerciseModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('exerciseName').focus();
        }
    }
    
    hideExerciseModal() {
        const modal = document.getElementById('exerciseModal');
        const form = document.getElementById('exerciseForm');
        if (modal) modal.style.display = 'none';
        if (form) form.reset();
    }
    
    // Добавить функцию создания упражнения
    async createExercise(e) {
        e.preventDefault();
        
        if (!this.db) {
            this.showNotification('База данных не загружена', 'error');
            return;
        }
        
        const name = document.getElementById('exerciseName').value.trim();
        const category = document.getElementById('exerciseCategory').value;
        const description = document.getElementById('exerciseDescription').value.trim();
        
        if (!name) {
            this.showNotification('Введите название упражнения', 'error');
            return;
        }
        
        if (!category) {
            this.showNotification('Выберите категорию', 'error');
            return;
        }
        
        try {
            const exercise = {
                name,
                category,
                description,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await this.db.add('exercises', exercise);
            
            this.showNotification(`Упражнение "${name}" создано!`, 'success');
            this.hideExerciseModal();
            await this.loadExercises();
            
            // Добавляем скинты за создание упражнения
            this.addSkins(5, 'exercise_created');
            
        } catch (error) {
            console.error('❌ Ошибка создания упражнения:', error);
            if (error.name === 'ConstraintError') {
                this.showNotification('Упражнение с таким названием уже существует', 'error');
            } else {
                this.showNotification('Ошибка создания упражнения', 'error');
            }
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
}

// Создаём и экспортируем экземпляр приложения
window.healthFlow = new HealthFlowApp();

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.healthFlow.init();
});

