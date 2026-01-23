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
            container.innerHTML = this.getPageStub(pageId);
            // Инициализируем модуль тренировок после загрузки HTML
            setTimeout(() => this.initWorkoutsModule(), 100);
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
            <!-- Вставляем весь HTML из workouts.html -->
            <div class="page" id="workoutsPage">
                <header class="page-header">
                    <h1 class="page-title">Тренировки</h1>
                    <div class="page-controls">
                        <div class="skin-counter">
                            ✨ <span id="skinCountWorkouts">${this.state.totalSkins}</span>
                        </div>
                        <button class="theme-toggle" onclick="window.healthFlow.toggleTheme()">
                            <div class="theme-icon">${this.state.theme === 'cozy' ? '🌙' : '☀️'}</div>
                        </button>
                    </div>
                </header>
                
                <div class="content-container">
                    <!-- Кнопка создания упражнения -->
                    <div class="create-exercise-section">
                        <button class="create-exercise-btn" id="createExerciseBtn">
                            <span class="btn-icon">+</span>
                            Создать упражнение
                        </button>
                    </div>

                    <!-- Список упражнений -->
                    <section class="exercises-section" id="exercisesSection">
                        <h2 class="section-title">Мои упражнения</h2>
                        <div class="exercises-list" id="exercisesList">
                            <div class="empty-exercises">
                                <div class="empty-icon">🏋️</div>
                                <div class="empty-text">Нет упражнений</div>
                                <div class="empty-subtext">Создайте первое упражнение!</div>
                            </div>
                        </div>
                    </section>

                    <!-- Модальное окно создания упражнения -->
                    <div class="modal" id="exerciseModal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h2 class="modal-title">Создать упражнение</h2>
                                <button class="modal-close" id="modalClose">&times;</button>
                            </div>
                            <div class="modal-body">
                                <form id="exerciseForm">
                                    <div class="form-group">
                                        <label for="exerciseName">Название упражнения</label>
                                        <input type="text" id="exerciseName" placeholder="Например: Приседания" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="exerciseCategory">Категория</label>
                                        <select id="exerciseCategory" required>
                                            <option value="">Выберите категорию</option>
                                            <option value="strength">Силовые</option>
                                            <option value="cardio">Кардио</option>
                                            <option value="flexibility">Растяжка</option>
                                            <option value="core">Пресс</option>
                                            <option value="upper">Верх тела</option>
                                            <option value="lower">Низ тела</option>
                                            <option value="full">Все тело</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="exerciseDescription">Описание (необязательно)</label>
                                        <textarea id="exerciseDescription" placeholder="Опишите технику выполнения..." rows="3"></textarea>
                                    </div>
                                    
                                    <div class="modal-buttons">
                                        <button type="button" class="btn-secondary" id="cancelBtn">Отмена</button>
                                        <button type="submit" class="btn-primary">Создать</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
            /* Стили для страницы тренировок */
            .create-exercise-section {
                margin-bottom: 24px;
                animation: fadeIn 0.8s ease-out 0.2s both;
            }

            .create-exercise-btn {
                width: 100%;
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                border: none;
                border-radius: var(--radius);
                padding: 18px 24px;
                font-size: 1.1rem;
                font-weight: 700;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: var(--transition);
                box-shadow: var(--shadow);
            }

            .create-exercise-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(6, 180, 143, 0.4);
            }

            .create-exercise-btn:active {
                transform: translateY(0);
            }

            .btn-icon {
                font-size: 1.3rem;
                font-weight: 800;
            }

            .exercises-section {
                animation: fadeIn 0.8s ease-out 0.4s both;
            }

            .exercises-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .exercise-card {
                background: var(--surface);
                border: 2px solid var(--border-light);
                border-radius: var(--radius);
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                transition: var(--transition);
                position: relative;
                animation: slideIn 0.5s ease-out;
            }

            .exercise-card:hover {
                transform: translateY(-2px);
                border-color: var(--primary-light);
                box-shadow: var(--shadow);
            }

            .exercise-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .exercise-name {
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--text-primary);
                flex: 1;
            }

            .exercise-category {
                font-size: 0.75rem;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .exercise-category.strength {
                background: rgba(231, 76, 60, 0.1);
                color: #E74C3C;
                border: 1px solid rgba(231, 76, 60, 0.2);
            }

            .exercise-category.cardio {
                background: rgba(52, 152, 219, 0.1);
                color: #3498DB;
                border: 1px solid rgba(52, 152, 219, 0.2);
            }

            .exercise-category.flexibility {
                background: rgba(155, 89, 182, 0.1);
                color: #9B59B6;
                border: 1px solid rgba(155, 89, 182, 0.2);
            }

            .exercise-category.core,
            .exercise-category.upper,
            .exercise-category.lower,
            .exercise-category.full {
                background: rgba(6, 180, 143, 0.1);
                color: var(--primary);
                border: 1px solid rgba(6, 180, 143, 0.2);
            }

            .exercise-description {
                font-size: 0.9rem;
                color: var(--text-secondary);
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .exercise-delete {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: rgba(255, 107, 107, 0.1);
                border: 1px solid rgba(255, 107, 107, 0.2);
                color: var(--remove);
                font-size: 1.2rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: var(--transition);
                opacity: 0;
            }

            .exercise-card:hover .exercise-delete {
                opacity: 1;
            }

            .exercise-delete:hover {
                background: var(--remove);
                color: white;
                transform: scale(1.1);
            }

            .empty-exercises {
                text-align: center;
                padding: 40px 16px;
                background: var(--surface);
                border: 2px solid var(--border-light);
                border-radius: var(--radius);
            }

            .empty-icon {
                font-size: 3rem;
                margin-bottom: 16px;
                opacity: 0.3;
            }

            .empty-text {
                font-size: 1.1rem;
                color: var(--text-primary);
                font-weight: 600;
                margin-bottom: 8px;
            }

            .empty-subtext {
                font-size: 0.9rem;
                color: var(--text-secondary);
                line-height: 1.5;
            }

            /* Модальное окно */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                align-items: center;
                justify-content: center;
                padding: 16px;
                animation: fadeIn 0.3s ease-out;
            }

            .modal-content {
                background: var(--surface);
                border-radius: var(--radius-lg);
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                border: 1px solid var(--border-light);
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-light);
            }

            .modal-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-primary);
                margin: 0;
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 2rem;
                color: var(--text-secondary);
                cursor: pointer;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: var(--transition);
            }

            .modal-close:hover {
                background: rgba(0, 0, 0, 0.05);
                color: var(--text-primary);
            }

            .modal-body {
                padding: 24px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: var(--text-primary);
                font-size: 0.95rem;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
                width: 100%;
                padding: 14px 16px;
                border: 2px solid var(--border);
                border-radius: var(--radius-sm);
                font-size: 1rem;
                font-family: inherit;
                background: var(--surface);
                color: var(--text-primary);
                transition: var(--transition);
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(6, 180, 143, 0.1);
            }

            .form-group textarea {
                resize: vertical;
                min-height: 80px;
            }

            .modal-buttons {
                display: flex;
                gap: 12px;
                margin-top: 30px;
            }

            .btn-primary,
            .btn-secondary {
                flex: 1;
                padding: 16px;
                border-radius: var(--radius-sm);
                font-size: 1rem;
                font-weight: 700;
                cursor: pointer;
                transition: var(--transition);
                border: none;
            }

            .btn-primary {
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(6, 180, 143, 0.3);
            }

            .btn-secondary {
                background: var(--surface);
                border: 2px solid var(--border);
                color: var(--text-secondary);
            }

            .btn-secondary:hover {
                background: rgba(0, 0, 0, 0.05);
                transform: translateY(-2px);
            }
            </style>
        `,
        profile: `
            <!-- ... оставляем профиль без изменений ... -->
        `
    };
    
    return stubs[pageId] || `<div>Страница не найдена</div>`;
}









    
        // Инициализация модуля тренировок
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
    
    // Инициализация базы данных
    async initDatabase() {
        try {
            if (!this.db) {
                const { db } = await import('./db.js');
                await db.init();
                this.db = db;
                console.log('✅ База данных инициализирована');
            }
        } catch (error) {
            console.error('❌ Ошибка базы данных:', error);
        }
    }
    
    // Настройка обработчиков для тренировок
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
    }
    
    // Показать модальное окно
    showExerciseModal() {
        const modal = document.getElementById('exerciseModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('exerciseName').focus();
        }
    }
    
    // Скрыть модальное окно
    hideExerciseModal() {
        const modal = document.getElementById('exerciseModal');
        const form = document.getElementById('exerciseForm');
        if (modal) modal.style.display = 'none';
        if (form) form.reset();
    }
    
    // Загрузка упражнений
    async loadExercises() {
        if (!this.db) return;
        
        try {
            const exercises = await this.db.getAll('exercises');
            this.renderExercises(exercises);
        } catch (error) {
            console.error('❌ Ошибка загрузки упражнений:', error);
        }
    }
    
    // Отрисовка упражнений
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
    
    // Получить название категории
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
    
    // Создание упражнения
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

// Удаление упражнения
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


