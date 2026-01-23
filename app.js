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
        
        this.modules = {
            water: null,
            workouts: null
        };
    }
    
    async init() {
        console.log('🚀 Инициализация HealthFlow...');
        
        // Загружаем состояние
        this.loadState();
        
        // Обновляем тему
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        // Создаём контейнер для страницы
        this.createPageContainer();
        
        // Настраиваем навигацию
        this.setupNavigation();
        
        // Настраиваем Service Worker
        this.setupServiceWorker();
        
        // Загружаем текущую страницу из hash
        const hash = window.location.hash.substring(1) || this.state.currentPage;
        await this.loadPage(hash);
        
        console.log('✅ HealthFlow запущен');
        return this;
    }
    
    createPageContainer() {
        const appContainer = document.getElementById('appContainer');
        if (!appContainer) {
            console.error('appContainer не найден');
            return;
        }
        
        // Проверяем, есть ли уже контейнер страницы
        let pageContainer = document.getElementById('currentPage');
        if (!pageContainer) {
            appContainer.innerHTML = `
                <div class="page active" id="currentPage">
                    <!-- Контент будет загружен динамически -->
                </div>
            `;
        }
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
        if (!container) {
            console.error('Контейнер страницы не найден');
            return;
        }
        
        try {
            if (pageId === 'water') {
                await this.loadWaterPage(container);
            } else if (pageId === 'workouts') {
                await this.loadWorkoutsPage(container);
            } else if (pageId === 'profile') {
                await this.loadProfilePage(container);
            } else {
                container.innerHTML = `<div class="error-message">Страница "${pageId}" не найдена</div>`;
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки страницы ${pageId}:`, error);
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px; color: var(--error);">⚠️</div>
                    <h2 style="font-size: 1.2rem; margin-bottom: 10px; color: var(--text-primary);">
                        Ошибка загрузки
                    </h2>
                    <p style="color: var(--text-secondary);">
                        ${error.message}
                    </p>
                    <button onclick="location.reload()" style="
                        background: var(--primary);
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        margin-top: 20px;
                        cursor: pointer;
                    ">
                        Перезагрузить
                    </button>
                </div>
            `;
        }
    }
    
    async loadWaterPage(container) {
        console.log('💧 Загрузка модуля воды...');
        
        // Проверяем, есть ли уже загруженный модуль
        if (this.modules.water) {
            container.innerHTML = this.modules.water;
            await this.initializeWaterModule();
            return;
        }
        
        // Загружаем модуль воды
        try {
            const response = await fetch('water.html');
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Сохраняем HTML для повторного использования
            this.modules.water = html;
            container.innerHTML = html;
            
            // Инициализируем модуль воды
            await this.initializeWaterModule();
            
        } catch (error) {
            console.error('Ошибка загрузки модуля воды:', error);
            throw error;
        }
    }
    
    async initializeWaterModule() {
        try {
            // Динамически импортируем модуль воды
            const module = await import('./water.js');
            
            if (module && module.init) {
                await module.init(this);
                console.log('✅ Модуль воды инициализирован');
            } else {
                throw new Error('Модуль воды не экспортирует функцию init');
            }
        } catch (error) {
            console.error('Ошибка инициализации модуля воды:', error);
            throw error;
        }
    }
    
    async loadWorkoutsPage(container) {
        console.log('🏋️ Загрузка модуля тренировок...');
        
        // Проверяем, есть ли уже загруженный модуль
        if (this.modules.workouts) {
            container.innerHTML = this.modules.workouts;
            await this.initializeWorkoutsModule();
            return;
        }
        
        // Загружаем модуль тренировок
        try {
            const response = await fetch('workouts.html');
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Сохраняем HTML для повторного использования
            this.modules.workouts = html;
            container.innerHTML = html;
            
            // Инициализируем модуль тренировок
            await this.initializeWorkoutsModule();
            
        } catch (error) {
            console.error('Ошибка загрузки модуля тренировок:', error);
            
            // Если не удалось загрузить workouts.html, покажем простую версию
            container.innerHTML = this.getSimpleWorkoutsHTML();
            await this.initializeSimpleWorkouts();
        }
    }
    
    async initializeWorkoutsModule() {
        try {
            // Проверяем, есть ли элементы UI
            const hasUI = document.getElementById('workoutsList') && 
                         document.getElementById('exercisesList') &&
                         document.getElementById('categoryFilter');
            
            if (!hasUI) {
                console.warn('Элементы UI тренировок не найдены, инициализируем простую версию');
                await this.initializeSimpleWorkouts();
                return;
            }
            
            // Пытаемся загрузить полноценный UI
            try {
                const { workoutsUI } = await import('./workouts-ui.js');
                if (workoutsUI && typeof workoutsUI.init === 'function') {
                    await workoutsUI.init();
                    console.log('✅ UI тренировок инициализирован');
                    return;
                }
            } catch (uiError) {
                console.warn('Не удалось загрузить workouts-ui.js:', uiError.message);
            }
            
            // Если UI не загрузился, пробуем инициализировать базовый функционал
            await this.initializeBasicWorkouts();
            
        } catch (error) {
            console.error('Ошибка инициализации модуля тренировок:', error);
            await this.initializeSimpleWorkouts();
        }
    }
    
    async initializeBasicWorkouts() {
        console.log('🔄 Инициализация базового функционала тренировок...');
        
        try {
            // Загружаем менеджеры
            const { exerciseManager } = await import('./exercises.js');
            const { workoutManager } = await import('./workouts.js');
            
            // Инициализируем менеджеры
            await exerciseManager.init();
            await workoutManager.init();
            
            console.log(`✅ Загружено: ${exerciseManager.exercises.length} упражнений, ${workoutManager.workouts.length} тренировок`);
            
            // Сохраняем для глобального доступа
            window.exerciseManager = exerciseManager;
            window.workoutManager = workoutManager;
            
            // Обновляем UI
            this.updateWorkoutsUI();
            
            // Настраиваем события
            this.setupWorkoutsEvents();
            
        } catch (error) {
            console.error('Ошибка инициализации базового функционала:', error);
            throw error;
        }
    }
    
    updateWorkoutsUI() {
        // Обновляем счётчик скинтов
        this.updateSkinCount();
        
        // Обновляем список тренировок
        this.renderWorkoutsList();
        
        // Обновляем список упражнений
        this.renderExercisesList();
        
        // Обновляем статистику
        this.updateWorkoutsStats();
    }
    
    renderWorkoutsList() {
        const container = document.getElementById('workoutsList');
        if (!container) return;
        
        if (!window.workoutManager || !window.workoutManager.workouts) {
            container.innerHTML = `
                <div class="empty-workouts">
                    <div class="empty-icon">🏋️</div>
                    <div class="empty-text">Загрузка тренировок...</div>
                </div>
            `;
            return;
        }
        
        const workouts = window.workoutManager.workouts;
        
        if (workouts.length === 0) {
            container.innerHTML = `
                <div class="empty-workouts">
                    <div class="empty-icon">🏋️</div>
                    <div class="empty-text">Создайте свою первую тренировку!</div>
                    <button class="btn-primary" id="createFirstWorkoutBtn">
                        + Создать тренировку
                    </button>
                </div>
            `;
            
            // Назначаем обработчик для кнопки создания
            const createBtn = document.getElementById('createFirstWorkoutBtn');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    this.showCreateWorkoutModal();
                });
            }
        } else {
            let html = '';
            workouts.forEach(workout => {
                const exerciseCount = workout.exercises ? workout.exercises.length : 0;
                const duration = workout.estimatedDuration || '--';
                
                html += `
                    <div class="workout-card" data-workout-id="${workout.id}">
                        <div class="workout-card-header">
                            <div class="workout-card-title">${workout.name || 'Без названия'}</div>
                            ${workout.isFavorite ? '<div class="favorite-star">⭐</div>' : ''}
                        </div>
                        <div class="workout-card-meta">
                            <span>${exerciseCount} упражнений</span>
                            <span>•</span>
                            <span>${duration} мин</span>
                        </div>
                        ${workout.description ? `
                            <div class="workout-card-desc">
                                ${workout.description}
                            </div>
                        ` : ''}
                        <div class="workout-card-actions">
                            <button class="btn-small start" onclick="healthFlow.startWorkout(${workout.id})">
                                Начать
                            </button>
                            <button class="btn-small edit" onclick="healthFlow.editWorkout(${workout.id})">
                                Редактировать
                            </button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    }
    
    renderExercisesList() {
        const container = document.getElementById('exercisesList');
        if (!container) return;
        
        if (!window.exerciseManager || !window.exerciseManager.exercises) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-secondary);">
                    Загрузка упражнений...
                </div>
            `;
            return;
        }
        
        const exercises = window.exerciseManager.exercises;
        const exercisesToShow = exercises.slice(0, 6);
        
        if (exercisesToShow.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-secondary);">
                    Упражнения не найдены
                </div>
            `;
            return;
        }
        
        let html = '';
        exercisesToShow.forEach(exercise => {
            const categoryInfo = window.exerciseManager.getCategoryInfo(exercise.category);
            const color = categoryInfo?.color || '#06B48F';
            
            html += `
                <div class="exercise-card">
                    <div class="exercise-card-header">
                        <div class="exercise-emoji" style="background: ${color}20;">
                            ${exercise.emoji || '💪'}
                        </div>
                        <div class="exercise-card-title">${exercise.name || 'Без названия'}</div>
                    </div>
                    <div class="exercise-card-desc">
                        ${exercise.description || 'Без описания'}
                    </div>
                    <div class="exercise-card-category">
                        ${categoryInfo?.name || 'Без категории'}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    updateWorkoutsStats() {
        const streakElement = document.getElementById('workoutStreak');
        const totalWorkoutsElement = document.getElementById('totalWorkouts');
        const skinsEarnedElement = document.getElementById('workoutSkinsEarned');
        
        if (streakElement) {
            streakElement.textContent = '0';
        }
        
        if (totalWorkoutsElement && window.workoutManager) {
            totalWorkoutsElement.textContent = window.workoutManager.workouts.length;
        }
        
        if (skinsEarnedElement) {
            // Показываем скинты заработанные за тренировки (в будущем можно считать)
            skinsEarnedElement.textContent = '0';
        }
    }
    
    setupWorkoutsEvents() {
        // Кнопка создания тренировки
        const createBtn = document.getElementById('createWorkoutBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateWorkoutModal();
            });
        }
        
        // Кнопка быстрой тренировки
        const quickBtn = document.getElementById('startQuickWorkout');
        if (quickBtn) {
            quickBtn.addEventListener('click', () => {
                this.startQuickWorkout();
            });
        }
        
        // Кнопка темы
        const themeBtn = document.getElementById('workoutsThemeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Обновляем счётчик скинтов
        this.updateSkinCount();
    }
    
    getSimpleWorkoutsHTML() {
        return `
            <header class="page-header">
                <h1 class="page-title">Тренировки</h1>
                <div class="page-controls">
                    <div class="skin-counter">
                        ✨ <span id="workoutsSkinCount">${this.state.totalSkins}</span>
                    </div>
                    <button class="theme-toggle" onclick="healthFlow.toggleTheme()">
                        <div class="theme-icon">${this.state.theme === 'cozy' ? '🌙' : '☀️'}</div>
                    </button>
                </div>
            </header>
            
            <div class="content-container">
                <section style="margin-bottom: 24px; animation: fadeIn 0.5s;">
                    <h2 style="margin-bottom: 16px; color: var(--text-primary);">Быстрый старт</h2>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                        <button class="simple-action-btn" onclick="healthFlow.startQuickWorkout()">
                            <div style="font-size: 2rem;">⚡</div>
                            <div style="font-weight: 700; margin-top: 8px;">Быстрая</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">15 мин</div>
                        </button>
                        <button class="simple-action-btn" onclick="healthFlow.showAllExercises()">
                            <div style="font-size: 2rem;">💪</div>
                            <div style="font-weight: 700; margin-top: 8px;">Упражнения</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">База</div>
                        </button>
                        <button class="simple-action-btn" onclick="healthFlow.createWorkout()">
                            <div style="font-size: 2rem;">➕</div>
                            <div style="font-weight: 700; margin-top: 8px;">Создать</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);">Новая</div>
                        </button>
                    </div>
                </section>

                <section style="margin-bottom: 24px; animation: fadeIn 0.5s 0.1s both;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h2 style="color: var(--text-primary);">Мои тренировки</h2>
                        <button onclick="healthFlow.createWorkout()" class="simple-create-btn">
                            + Создать
                        </button>
                    </div>
                    
                    <div id="simpleWorkoutsList" style="
                        background: var(--surface);
                        border: 2px solid var(--border-light);
                        border-radius: var(--radius);
                        padding: 20px;
                        min-height: 150px;
                    ">
                        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                            <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;">🏋️</div>
                            <div style="font-weight: 600; margin-bottom: 8px;">Загрузка тренировок...</div>
                        </div>
                    </div>
                </section>

                <section style="margin-bottom: 24px; animation: fadeIn 0.5s 0.2s both;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h2 style="color: var(--text-primary);">Упражнения</h2>
                        <button onclick="healthFlow.showAllExercises()" class="simple-view-btn">
                            Все →
                        </button>
                    </div>
                    
                    <div id="simpleExercisesList" style="
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    ">
                        <!-- Упражнения будут загружены через JS -->
                    </div>
                </section>

                <section style="margin-bottom: 80px; animation: fadeIn 0.5s 0.3s both;">
                    <h2 style="margin-bottom: 16px; color: var(--text-primary);">Статистика</h2>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                        <div class="simple-stat-card">
                            <div style="font-size: 1.5rem;">🔥</div>
                            <div style="font-size: 1.2rem; font-weight: 800; margin: 8px 0;" id="simpleStatStreak">0</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Дней подряд</div>
                        </div>
                        <div class="simple-stat-card">
                            <div style="font-size: 1.5rem;">📊</div>
                            <div style="font-size: 1.2rem; font-weight: 800; margin: 8px 0;" id="simpleStatTotal">0</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Тренировок</div>
                        </div>
                        <div class="simple-stat-card" style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 154, 118, 0.1));">
                            <div style="font-size: 1.5rem;">✨</div>
                            <div style="font-size: 1.2rem; font-weight: 800; margin: 8px 0;" id="simpleStatSkins">${this.state.totalSkins}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Скинтов</div>
                        </div>
                    </div>
                </section>
            </div>

            <style>
                .simple-action-btn {
                    background: var(--surface);
                    border: 2px solid var(--border-light);
                    border-radius: var(--radius);
                    padding: 20px 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }
                
                .simple-action-btn:hover {
                    transform: translateY(-2px);
                    border-color: var(--primary-light);
                    box-shadow: var(--shadow);
                }
                
                .simple-create-btn {
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                }
                
                .simple-view-btn {
                    background: transparent;
                    border: 2px solid var(--border-light);
                    color: var(--text-secondary);
                    padding: 8px 14px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                
                .simple-stat-card {
                    background: var(--surface);
                    border: 2px solid var(--border-light);
                    border-radius: var(--radius);
                    padding: 16px 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    transition: all 0.3s ease;
                }
                
                .simple-stat-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--primary-light);
                    box-shadow: var(--shadow);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        `;
    }
    
    async initializeSimpleWorkouts() {
        console.log('🔄 Инициализация простого интерфейса тренировок...');
        
        try {
            // Загружаем менеджеры
            const { exerciseManager } = await import('./exercises.js');
            const { workoutManager } = await import('./workouts.js');
            
            // Инициализируем менеджеры
            await exerciseManager.init();
            await workoutManager.init();
            
            console.log(`✅ Загружено: ${exerciseManager.exercises.length} упражнений, ${workoutManager.workouts.length} тренировок`);
            
            // Сохраняем для глобального доступа
            window.exerciseManager = exerciseManager;
            window.workoutManager = workoutManager;
            
            // Обновляем UI
            this.updateSimpleWorkoutsUI();
            
        } catch (error) {
            console.error('Ошибка инициализации простого интерфейса:', error);
            this.showNotification('Ошибка загрузки тренировок', 'error');
        }
    }
    
    updateSimpleWorkoutsUI() {
        // Обновляем список тренировок
        this.updateSimpleWorkoutsList();
        
        // Обновляем список упражнений
        this.updateSimpleExercisesList();
        
        // Обновляем статистику
        this.updateSimpleStats();
    }
    
    updateSimpleWorkoutsList() {
        const container = document.getElementById('simpleWorkoutsList');
        if (!container || !window.workoutManager) return;
        
        const workouts = window.workoutManager.workouts;
        
        if (workouts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;">🏋️</div>
                    <div style="font-weight: 600; margin-bottom: 8px;">Нет тренировок</div>
                    <div style="font-size: 0.9rem;">Создайте свою первую тренировку</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        workouts.forEach(workout => {
            const exerciseCount = workout.exercises ? workout.exercises.length : 0;
            
            html += `
                <div style="
                    padding: 16px;
                    background: var(--surface);
                    border: 2px solid var(--border-light);
                    border-radius: var(--radius);
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="healthFlow.startWorkout(${workout.id})" onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='var(--primary-light)';" 
                   onmouseout="this.style.transform='translateY(0)';this.style.borderColor='var(--border-light)';">
                    <div style="font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">
                        ${workout.name || 'Без названия'}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">
                            ${exerciseCount} упражнений • ${workout.estimatedDuration || '--'} мин
                        </div>
                        <button style="
                            background: var(--primary);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-weight: 600;
                            cursor: pointer;
                        " onclick="event.stopPropagation(); healthFlow.startWorkout(${workout.id})">
                            Начать
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    updateSimpleExercisesList() {
        const container = document.getElementById('simpleExercisesList');
        if (!container || !window.exerciseManager) return;
        
        const exercises = window.exerciseManager.exercises;
        const exercisesToShow = exercises.slice(0, 4);
        
        if (exercisesToShow.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-secondary);">
                    Упражнения не найдены
                </div>
            `;
            return;
        }
        
        let html = '';
        exercisesToShow.forEach(exercise => {
            html += `
                <div style="
                    background: var(--surface);
                    border: 2px solid var(--border-light);
                    border-radius: var(--radius);
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='var(--primary-light)';" 
                   onmouseout="this.style.transform='translateY(0)';this.style.borderColor='var(--border-light)';">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="font-size: 1.5rem;">${exercise.emoji || '💪'}</div>
                        <div style="font-weight: 700; color: var(--text-primary);">
                            ${exercise.name || 'Без названия'}
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                        ${exercise.description || 'Без описания'}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    updateSimpleStats() {
        // Простая статистика
        const totalElement = document.getElementById('simpleStatTotal');
        const streakElement = document.getElementById('simpleStatStreak');
        const skinsElement = document.getElementById('simpleStatSkins');
        
        if (totalElement && window.workoutManager) {
            totalElement.textContent = window.workoutManager.workouts.length;
        }
        
        if (streakElement) {
            streakElement.textContent = '0';
        }
        
        if (skinsElement) {
            skinsElement.textContent = this.state.totalSkins;
        }
    }
    
    async loadProfilePage(container) {
        container.innerHTML = `
            <header class="page-header">
                <h1 class="page-title">Профиль</h1>
                <div class="page-controls">
                    <div class="skin-counter">
                        ✨ <span>${this.state.totalSkins}</span>
                    </div>
                    <button class="theme-toggle" onclick="healthFlow.toggleTheme()">
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
        `;
    }
    
    // Методы для тренировок (публичные)
    startQuickWorkout() {
        this.showNotification('Быстрая тренировка скоро появится!', 'success');
        console.log('Запуск быстрой тренировки...');
    }
    
    startWorkout(workoutId) {
        const workout = window.workoutManager?.getWorkout(workoutId);
        if (!workout) {
            this.showNotification('Тренировка не найдена', 'error');
            return;
        }
        
        this.showNotification(`Начинаем "${workout.name}"`, 'success');
        console.log('Начинаем тренировку:', workout.name);
        // TODO: Реализовать режим выполнения
    }
    
    editWorkout(workoutId) {
        this.showNotification('Редактирование скоро появится!', 'success');
        console.log('Редактирование тренировки ID:', workoutId);
    }
    
    showAllExercises() {
        this.showNotification('Все упражнения скоро появятся!', 'success');
        console.log('Показываем все упражнения');
    }
    
    createWorkout() {
        this.showNotification('Создание тренировки скоро появится!', 'success');
        console.log('Создание тренировки');
    }
    
    showCreateWorkoutModal() {
        this.showNotification('Создание тренировки скоро появится!', 'success');
        console.log('Показываем модалку создания тренировки');
    }
    
    // Общие методы
    loadState() {
        const savedSkins = localStorage.getItem('healthflow_skins');
        this.state.totalSkins = savedSkins ? parseInt(savedSkins) : 0;
        
        const savedTheme = localStorage.getItem('healthflow_theme');
        this.state.theme = savedTheme || 'cozy';
        
        const savedPage = localStorage.getItem('healthflow_page');
        if (savedPage) {
            this.state.currentPage = savedPage;
        }
    }
    
    saveState() {
        localStorage.setItem('healthflow_skins', this.state.totalSkins.toString());
        localStorage.setItem('healthflow_theme', this.state.theme);
        localStorage.setItem('healthflow_page', this.state.currentPage);
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
            if (hash && hash !== this.state.currentPage) {
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
    
    updateSkinCount() {
        // Обновляем счётчик скинтов на странице тренировок
        const skinCountElement = document.getElementById('workoutsSkinCount');
        if (skinCountElement) {
            skinCountElement.textContent = this.state.totalSkins;
        }
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
window.HealthFlow = new HealthFlowApp();
window.healthFlow = window.HealthFlow; // Алиас для обратной совместимости

// Запускаем приложение при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.HealthFlow.init();
});
