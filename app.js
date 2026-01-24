// Главное приложение HealthFlow
class HealthFlowApp {
    constructor() {
        this.state = {
            currentPage: 'water',
            totalSkins: 0,
            theme: 'cozy'
        };
        this.creatingExercise = false;
        this.creatingWorkout = false;
        this.editingWorkoutId = null; // Для редактирования существующей тренировки
        this.draggedExercise = null;
        this.draggedSet = null;
        this.currentWorkoutData = null; // Добавляем это
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
        if (savedPage) {
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
            } else if (pageId === 'workouts') {
                this.showWorkoutsPage(container);
            } else if (pageId === 'profile') {
                this.showProfilePage(container);
            }
        } catch (error) {
            console.error(`❌ Ошибка загрузки страницы ${pageId}:`, error);
            container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Ошибка загрузки страницы</div>`;
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

    // СТРАНИЦА ТРЕНИРОВОК С РАЗДЕЛАМИ
    // СТРАНИЦА ТРЕНИРОВОК С РАЗДЕЛАМИ
    showWorkoutsPage(container) {
        console.log('Показываем страницу тренировок...');

        container.innerHTML = `
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
                <div style="padding: 16px;">
                    <!-- Переключатель разделов -->
                    <div style="display: flex; gap: 10px; margin-bottom: 20px; background: var(--surface); border-radius: 12px; padding: 4px; border: 2px solid var(--border-light);">
                        <button id="exercisesTab" class="workouts-tab active" style="flex: 1; padding: 14px; border: none; border-radius: 8px; background: var(--primary); color: white; font-weight: 700; font-size: 15px; cursor: pointer;">
                            Упражнения
                        </button>
                        <button id="workoutsTab" class="workouts-tab" style="flex: 1; padding: 14px; border: none; border-radius: 8px; background: transparent; color: var(--text-secondary); font-weight: 700; font-size: 15px; cursor: pointer;">
                            Тренировки
                        </button>
                    </div>
                    
                    <!-- Контейнер для контента -->
                    <div id="workoutsContent">
                        <!-- Здесь будет меняться контент -->
                    </div>
                    
                    <!-- История тренировок будет добавляться только в разделе тренировок -->
                </div>
            </div>
        `;

        // Инициализируем тренировки после отрисовки
        setTimeout(() => this.initializeWorkoutsPage(), 100);
    }

    // Инициализация страницы тренировок
    initializeWorkoutsPage() {
        console.log('Инициализируем страницу тренировок...');

        // Загружаем начальный контент (упражнения)
        this.showExercisesSection();

        // Настраиваем переключатели
        const exercisesTab = document.getElementById('exercisesTab');
        const workoutsTab = document.getElementById('workoutsTab');

        if (exercisesTab) {
            exercisesTab.addEventListener('click', () => {
                this.showExercisesSection();
                exercisesTab.classList.add('active');
                workoutsTab.classList.remove('active');

                exercisesTab.style.background = 'var(--primary)';
                exercisesTab.style.color = 'white';
                workoutsTab.style.background = 'transparent';
                workoutsTab.style.color = 'var(--text-secondary)';
            });
        }

        if (workoutsTab) {
            workoutsTab.addEventListener('click', () => {
                this.showWorkoutsSection();
                workoutsTab.classList.add('active');
                exercisesTab.classList.remove('active');

                workoutsTab.style.background = 'var(--primary)';
                workoutsTab.style.color = 'white';
                exercisesTab.style.background = 'transparent';
                exercisesTab.style.color = 'var(--text-secondary)';
            });
        }

        // Загружаем историю тренировок
        this.loadWorkoutsHistory();
    }

    // Показываем раздел упражнений
    // Показываем раздел упражнений
    showExercisesSection() {
        const contentContainer = document.getElementById('workoutsContent');
        if (!contentContainer) return;

        contentContainer.innerHTML = `
            <!-- Заголовок и кнопка -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="font-size: 20px; font-weight: 700; color: var(--text-primary);">
                    Мои упражнения
                </div>
                <button id="createExerciseBtn" style="
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    border: none;
                    border-radius: 10px;
                    padding: 10px 20px;
                    color: white;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <span style="font-size: 18px;">+</span>
                    Новое упражнение
                </button>
            </div>
            
            <!-- Поиск упражнений -->
            <div style="margin-bottom: 20px;">
                <input type="text" 
                       id="exercisesSearch" 
                       placeholder="🔍 Поиск по названию..." 
                       style="
                            width: 100%;
                            padding: 14px;
                            border: 2px solid var(--border-light);
                            border-radius: 10px;
                            font-size: 15px;
                            font-family: inherit;
                            background: var(--surface);
                            color: var(--text-primary);
                            outline: none;
                            margin-bottom: 12px;
                       ">
                
                <!-- Фильтры по группам мышц -->
                <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px;">
                    <button class="exercises-muscle-filter" data-group="Все" style="
                        padding: 8px 14px;
                        border: 2px solid var(--primary);
                        border-radius: 20px;
                        background: rgba(6, 180, 143, 0.1);
                        color: var(--primary);
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        white-space: nowrap;
                    ">
                        Все
                    </button>
                    ${['Грудь', 'Спина', 'Ноги', 'Плечи', 'Бицепс', 'Трицепс', 'Пресс', 'Ягодицы', 'Кардио', 'Все тело'].map(group => `
                        <button class="exercises-muscle-filter" data-group="${group}" style="
                            padding: 8px 14px;
                            border: 2px solid var(--border-light);
                            border-radius: 20px;
                            background: var(--surface);
                            color: var(--text-primary);
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            white-space: nowrap;
                        ">
                            ${group}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <!-- Список упражнений -->
            <div id="exercisesList" style="
                background: var(--surface);
                border-radius: 12px;
                border: 2px solid var(--border-light);
                min-height: 200px;
                padding: 20px;
            ">
                <!-- Упражнения загружаются через JS -->
            </div>
        `;

        // Инициализируем кнопку создания
        const createBtn = document.getElementById('createExerciseBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateExerciseForm();
            });
        }

        // Инициализируем поиск и фильтры
        this.initializeExercisesSearch();

        // Загружаем упражнения
        this.loadExercises();
    }

    // Показываем раздел тренировок
    // Показываем раздел тренировок
    showWorkoutsSection() {
        const contentContainer = document.getElementById('workoutsContent');
        if (!contentContainer) return;

        contentContainer.innerHTML = `
            <!-- Заголовок и кнопка -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div style="font-size: 20px; font-weight: 700; color: var(--text-primary);">
                    Мои тренировки
                </div>
                <button id="createWorkoutBtn" style="
                    background: linear-gradient(135deg, #FF9A76, #E86A50);
                    border: none;
                    border-radius: 10px;
                    padding: 10px 20px;
                    color: white;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                ">
                    <span style="font-size: 18px;">🔥</span>
                    Новая тренировка
                </button>
            </div>
            
            <!-- Список тренировок -->
            <div id="workoutsList" style="
                background: var(--surface);
                border-radius: 12px;
                border: 2px solid var(--border-light);
                min-height: 200px;
                padding: 20px;
                margin-bottom: 30px;
            ">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;">🏋️</div>
                    <div style="color: var(--text-secondary); font-size: 16px;">Тренировок пока нет</div>
                    <div style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Создайте первую тренировку!</div>
                </div>
            </div>
            
            <!-- История тренировок -->
            <div style="margin-top: 30px;">
                <div style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--border-light);">
                    История тренировок
                </div>
                <div id="workoutsHistory" style="
                    background: var(--surface);
                    border-radius: 12px;
                    border: 2px solid var(--border-light);
                    min-height: 100px;
                    padding: 20px;
                ">
                    <div style="text-align: center; padding: 30px 20px;">
                        <div style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;">📅</div>
                        <div style="color: var(--text-secondary); font-size: 16px;">Тренировок пока нет</div>
                        <div style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Начните первую тренировку!</div>
                    </div>
                </div>
            </div>
        `;

        // Инициализируем кнопку создания тренировки
        const createBtn = document.getElementById('createWorkoutBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateWorkoutForm();
            });
        }

        // Загружаем тренировки
        this.loadWorkouts();

        // Загружаем историю тренировок
        this.loadWorkoutsHistory();
    }

    // === ФОРМА СОЗДАНИЯ УПРАЖНЕНИЯ ===
    showCreateExerciseForm() {
        const contentContainer = document.getElementById('workoutsContent');
        if (!contentContainer) return;

        this.creatingExercise = true;

        const muscleGroups = [
            'Грудь', 'Спина', 'Ноги', 'Плечи', 'Бицепс', 'Трицепс',
            'Пресс', 'Ягодицы', 'Икры', 'Предплечья', 'Кардио', 'Все тело'
        ];

        contentContainer.innerHTML = `
            <!-- Заголовок с кнопкой назад -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <button id="backToExercisesBtn" style="
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                ">
                    ←
                </button>
                <div style="font-size: 22px; font-weight: 700; color: var(--text-primary);">
                    Создание упражнения
                </div>
            </div>
            
            <!-- Форма создания упражнения -->
            <div style="
                background: var(--surface);
                border-radius: 16px;
                border: 2px solid var(--border-light);
                padding: 24px;
                margin-bottom: 20px;
            ">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Название упражнения *
                    </label>
                    <input type="text" id="exerciseName" placeholder="Например: Приседания со штангой" style="
                        width: 100%;
                        padding: 14px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        font-size: 16px;
                        font-family: inherit;
                        background: var(--surface);
                        color: var(--text-primary);
                        outline: none;
                        transition: all 0.2s ease;
                    ">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Категория *
                    </label>
                    <select id="exerciseCategory" style="
                        width: 100%;
                        padding: 14px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        font-size: 16px;
                        font-family: inherit;
                        background: var(--surface);
                        color: var(--text-primary);
                        outline: none;
                    ">
                        <option value="Кардио">Кардио</option>
                        <option value="Силовая">Силовая</option>
                        <option value="Растяжка">Растяжка</option>
                        <option value="Йога">Йога</option>
                        <option value="Функциональная">Функциональная</option>
                        <option value="Калистеника">Калистеника</option>
                        <option value="Другое">Другое</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Группы мышц *
                    </label>
                    <div id="muscleGroupsContainer" style="
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                        margin-top: 10px;
                    ">
                        ${muscleGroups.map(group => `
                            <label style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                padding: 12px;
                                border: 2px solid var(--border-light);
                                border-radius: 8px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                background: var(--surface);
                            ">
                                <input type="checkbox" name="muscleGroup" value="${group}" style="display: none;">
                                <div style="width: 20px; height: 20px; border: 2px solid var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
                                    <div style="width: 12px; height: 12px; background: var(--primary); border-radius: 2px; display: none;"></div>
                                </div>
                                <span style="font-size: 14px; font-weight: 500; color: var(--text-primary);">${group}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Сложность
                    </label>
                    <div style="display: flex; gap: 10px;">
                        <label style="flex: 1; text-align: center;">
                            <input type="radio" name="difficulty" value="Низкий" checked style="display: none;">
                            <div class="difficulty-option" data-value="Низкий" style="padding: 12px; border: 2px solid var(--primary); border-radius: 8px; background: rgba(6, 180, 143, 0.1); cursor: pointer; color: var(--primary); font-weight: 600;">
                                Низкий
                            </div>
                        </label>
                        <label style="flex: 1; text-align: center;">
                            <input type="radio" name="difficulty" value="Средний" style="display: none;">
                            <div class="difficulty-option" data-value="Средний" style="padding: 12px; border: 2px solid var(--border-light); border-radius: 8px; background: var(--surface); cursor: pointer; color: var(--text-primary); font-weight: 600;">
                                Средний
                            </div>
                        </label>
                        <label style="flex: 1; text-align: center;">
                            <input type="radio" name="difficulty" value="Высокий" style="display: none;">
                            <div class="difficulty-option" data-value="Высокий" style="padding: 12px; border: 2px solid var(--border-light); border-radius: 8px; background: var(--surface); cursor: pointer; color: var(--text-primary); font-weight: 600;">
                                Высокий
                            </div>
                        </label>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Описание
                    </label>
                    <textarea id="exerciseDescription" placeholder="Опишите технику выполнения упражнения..." rows="4" style="
                        width: 100%;
                        padding: 14px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        font-size: 15px;
                        font-family: inherit;
                        background: var(--surface);
                        color: var(--text-primary);
                        outline: none;
                        resize: vertical;
                    "></textarea>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Фото (опционально)
                    </label>
                    <div id="imageUploadContainer" style="
                        border: 2px dashed var(--border-light);
                        border-radius: 10px;
                        padding: 30px;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        <div style="font-size: 40px; margin-bottom: 10px;">📷</div>
                        <div style="font-size: 15px; color: var(--text-primary); font-weight: 600; margin-bottom: 5px;">
                            Нажмите для загрузки фото
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            JPG, PNG до 5MB
                        </div>
                        <input type="file" id="exerciseImage" accept="image/*" style="display: none;">
                    </div>
                    <div id="imagePreview" style="margin-top: 10px; display: none;">
                        <!-- Превью загруженного изображения -->
                    </div>
                </div>
                
                <!-- Кнопки -->
                <div style="display: flex; gap: 12px;">
                    <button id="cancelExerciseBtn" style="
                        flex: 1;
                        padding: 16px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        background: transparent;
                        color: var(--text-secondary);
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        Отмена
                    </button>
                    <button id="saveExerciseBtn" style="
                        flex: 1;
                        padding: 16px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                        color: white;
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        Сохранить упражнение
                    </button>
                </div>
            </div>
        `;

        // Инициализируем интерактивные элементы
        this.initializeExerciseForm();
    }

    initializeExerciseForm() {
        // Кнопка назад
        const backBtn = document.getElementById('backToExercisesBtn');
        const cancelBtn = document.getElementById('cancelExerciseBtn');

        const goBack = () => {
            this.creatingExercise = false;
            this.showExercisesSection();
        };

        if (backBtn) backBtn.addEventListener('click', goBack);
        if (cancelBtn) cancelBtn.addEventListener('click', goBack);

        // Выбор групп мышц
        const muscleGroupLabels = document.querySelectorAll('#muscleGroupsContainer label');
        muscleGroupLabels.forEach(label => {
            const checkbox = label.querySelector('input[type="checkbox"]');
            const checkmark = label.querySelector('div > div');

            label.addEventListener('click', () => {
                const isChecked = checkbox.checked;
                checkbox.checked = !isChecked;

                if (!isChecked) {
                    label.style.borderColor = 'var(--primary)';
                    label.style.background = 'rgba(6, 180, 143, 0.1)';
                    checkmark.style.display = 'block';
                } else {
                    label.style.borderColor = 'var(--border-light)';
                    label.style.background = 'var(--surface)';
                    checkmark.style.display = 'none';
                }
            });
        });

        // Выбор сложности
        const difficultyOptions = document.querySelectorAll('.difficulty-option');
        difficultyOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Сбрасываем все опции
                difficultyOptions.forEach(opt => {
                    opt.style.borderColor = 'var(--border-light)';
                    opt.style.background = 'var(--surface)';
                    opt.style.color = 'var(--text-primary)';
                });

                // Выделяем выбранную
                option.style.borderColor = 'var(--primary)';
                option.style.background = 'rgba(6, 180, 143, 0.1)';
                option.style.color = 'var(--primary)';

                // Активируем соответствующий radio input
                const value = option.dataset.value;
                document.querySelector(`input[name="difficulty"][value="${value}"]`).checked = true;
            });
        });

        // Загрузка изображения
        const uploadContainer = document.getElementById('imageUploadContainer');
        const fileInput = document.getElementById('exerciseImage');
        const imagePreview = document.getElementById('imagePreview');

        uploadContainer.addEventListener('click', () => fileInput.click());

        uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadContainer.style.borderColor = 'var(--primary)';
            uploadContainer.style.background = 'rgba(6, 180, 143, 0.05)';
        });

        uploadContainer.addEventListener('dragleave', () => {
            uploadContainer.style.borderColor = 'var(--border-light)';
            uploadContainer.style.background = 'transparent';
        });

        uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadContainer.style.borderColor = 'var(--border-light)';
            uploadContainer.style.background = 'transparent';

            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                this.handleImageUpload(file, imagePreview);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                this.handleImageUpload(file, imagePreview);
            }
        });

        // Сохранение упражнения
        const saveBtn = document.getElementById('saveExerciseBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveExerciseFromForm();
            });
        }
    }

    handleImageUpload(file, previewContainer) {
        if (!file.type.match('image.*')) {
            alert('Пожалуйста, выберите изображение!');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Изображение должно быть меньше 5MB!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: var(--surface);
                    border: 2px solid var(--border-light);
                    border-radius: 8px;
                    padding: 12px;
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${e.target.result}" alt="Preview" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 14px;">${file.name}</div>
                            <div style="color: var(--text-secondary); font-size: 12px;">${(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                    </div>
                    <button id="removeImageBtn" style="
                        background: rgba(255, 107, 107, 0.1);
                        border: none;
                        color: var(--remove);
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 13px;
                        cursor: pointer;
                    ">
                        Удалить
                    </button>
                </div>
            `;
            previewContainer.style.display = 'block';

            document.getElementById('removeImageBtn').addEventListener('click', () => {
                previewContainer.innerHTML = '';
                previewContainer.style.display = 'none';
                document.getElementById('exerciseImage').value = '';
            });
        };
        reader.readAsDataURL(file);
    }

    saveExerciseFromForm() {
        const name = document.getElementById('exerciseName').value.trim();
        const category = document.getElementById('exerciseCategory').value;
        const description = document.getElementById('exerciseDescription').value.trim();

        if (!name) {
            this.showNotification('Введите название упражнения!', 'error');
            return;
        }

        // Получаем выбранные группы мышц
        const selectedGroups = [];
        document.querySelectorAll('input[name="muscleGroup"]:checked').forEach(checkbox => {
            selectedGroups.push(checkbox.value);
        });

        if (selectedGroups.length === 0) {
            this.showNotification('Выберите хотя бы одну группу мышц!', 'error');
            return;
        }

        // Получаем сложность
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;

        // Получаем изображение
        const imageInput = document.getElementById('exerciseImage');
        let imageData = null;

        if (imageInput.files.length > 0) {
            const file = imageInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                imageData = e.target.result;
                this.finalizeExerciseSave(name, category, description, selectedGroups, difficulty, imageData);
            };
            reader.readAsDataURL(file);
        } else {
            this.finalizeExerciseSave(name, category, description, selectedGroups, difficulty, null);
        }
    }

    finalizeExerciseSave(name, category, description, muscleGroups, difficulty, imageData) {
        // Сохраняем упражнение
        let exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
        exercises.push({
            id: Date.now(),
            name: name,
            category: category,
            description: description,
            muscleGroups: muscleGroups,
            difficulty: difficulty,
            image: imageData,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('healthflow_exercises', JSON.stringify(exercises));

        this.showNotification(`Упражнение "${name}" создано!`, 'success');
        this.creatingExercise = false;
        this.showExercisesSection();
    }

    // === ФОРМА СОЗДАНИЯ ТРЕНИРОВКИ ===
    // === ФОРМА СОЗДАНИЯ ТРЕНИРОВКИ (СТАДИЯ 1) ===
    showCreateWorkoutForm() {
        const contentContainer = document.getElementById('workoutsContent');
        if (!contentContainer) return;

        this.creatingWorkout = true;
        this.currentWorkoutData = {
            name: '',
            color: '#06B48F',
            duration: 30,
            description: '',
            exercises: [] // Массив для упражнений с подходами
        };

        const colors = [
            { name: 'Зеленый', value: '#06B48F' },
            { name: 'Синий', value: '#3498DB' },
            { name: 'Оранжевый', value: '#FF9A76' },
            { name: 'Фиолетовый', value: '#9B59B6' },
            { name: 'Красный', value: '#E74C3C' },
            { name: 'Желтый', value: '#F1C40F' }
        ];

        contentContainer.innerHTML = `
            <!-- Заголовок с кнопкой назад -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <button id="backToWorkoutsBtn" style="
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                ">
                    ←
                </button>
                <div style="font-size: 22px; font-weight: 700; color: var(--text-primary);">
                    Создание тренировки
                </div>
            </div>
            
            <!-- Прогресс создания -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
                <div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                ">1</div>
                <div style="height: 3px; flex: 1; background: var(--primary);"></div>
                <div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--border-light);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                ">2</div>
                <div style="font-size: 14px; color: var(--text-secondary); margin-left: 8px;">
                    Стадия 1 из 2
                </div>
            </div>
            
            <!-- Форма создания тренировки (стадия 1) -->
            <div style="
                background: var(--surface);
                border-radius: 16px;
                border: 2px solid var(--border-light);
                padding: 24px;
                margin-bottom: 20px;
            ">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Название тренировки *
                    </label>
                    <input type="text" id="workoutName" placeholder="Например: Утренняя разминка" style="
                        width: 100%;
                        padding: 14px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        font-size: 16px;
                        font-family: inherit;
                        background: var(--surface);
                        color: var(--text-primary);
                        outline: none;
                        transition: all 0.2s ease;
                    ">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Цвет тренировки
                    </label>
                    <div id="colorSelector" style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${colors.map(color => `
                            <div class="color-option" data-color="${color.value}" title="${color.name}" style="
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                                background: ${color.value};
                                cursor: pointer;
                                border: 3px solid transparent;
                                transition: all 0.2s ease;
                            "></div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="selectedColor" value="${colors[0].value}">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Длительность (минут)
                    </label>
                    <input type="number" id="workoutDuration" min="5" max="180" value="30" style="
                        width: 100%;
                        padding: 14px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        font-size: 16px;
                        font-family: inherit;
                        background: var(--surface);
                        color: var(--text-primary);
                        outline: none;
                    ">
                </div>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; font-size: 15px;">
                        Описание
                    </label>
                    <textarea id="workoutDescription" placeholder="Опишите цель и особенности тренировки..." rows="3" style="
                        width: 100%;
                        padding: 14px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        font-size: 15px;
                        font-family: inherit;
                        background: var(--surface);
                        color: var(--text-primary);
                        outline: none;
                        resize: vertical;
                    "></textarea>
                </div>
                
                <!-- Кнопки -->
                <div style="display: flex; gap: 12px;">
                    <button id="cancelWorkoutBtn" style="
                        flex: 1;
                        padding: 16px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        background: transparent;
                        color: var(--text-secondary);
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        Отмена
                    </button>
                    <button id="nextStageBtn" style="
                        flex: 1;
                        padding: 16px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #FF9A76, #E86A50);
                        color: white;
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        Далее →
                    </button>
                </div>
            </div>
        `;

        // Инициализируем интерактивные элементы
        this.initializeWorkoutFormStage1();
    }


    initializeWorkoutFormStage1() {
        // Кнопка назад
        const backBtn = document.getElementById('backToWorkoutsBtn');
        const cancelBtn = document.getElementById('cancelWorkoutBtn');

        const goBack = () => {
            this.creatingWorkout = false;
            this.showWorkoutsSection();
        };

        if (backBtn) backBtn.addEventListener('click', goBack);
        if (cancelBtn) cancelBtn.addEventListener('click', goBack);

        // Выбор цвета
        const colorOptions = document.querySelectorAll('.color-option');
        const selectedColorInput = document.getElementById('selectedColor');

        // Выделяем первый цвет по умолчанию
        if (colorOptions.length > 0) {
            colorOptions[0].style.borderColor = 'var(--text-primary)';
        }

        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Сбрасываем границы у всех
                colorOptions.forEach(opt => {
                    opt.style.borderColor = 'transparent';
                });

                // Выделяем выбранный
                option.style.borderColor = 'var(--text-primary)';
                selectedColorInput.value = option.dataset.color;
            });
        });

        // Кнопка "Далее" для перехода ко второй стадии
        const nextBtn = document.getElementById('nextStageBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const name = document.getElementById('workoutName').value.trim();
                const color = document.getElementById('selectedColor').value;
                const duration = parseInt(document.getElementById('workoutDuration').value) || 30;
                const description = document.getElementById('workoutDescription').value.trim();

                if (!name) {
                    this.showNotification('Введите название тренировки!', 'error');
                    return;
                }

                // Сохраняем данные первой стадии
                this.currentWorkoutData.name = name;
                this.currentWorkoutData.color = color;
                this.currentWorkoutData.duration = duration;
                this.currentWorkoutData.description = description;

                // Переходим ко второй стадии
                this.showWorkoutFormStage2();
            });
        }
    }





    // === ФОРМА СОЗДАНИЯ ТРЕНИРОВКИ (СТАДИЯ 2) ===
    // === ФОРМА СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ТРЕНИРОВКИ (СТАДИЯ 2) ===
    showWorkoutFormStage2() {
        const contentContainer = document.getElementById('workoutsContent');
        if (!contentContainer) return;

        const isEditing = this.editingWorkoutId !== null;
        const title = isEditing ? 'Редактирование тренировки' : 'Настройка упражнений';

        contentContainer.innerHTML = `
            <!-- Заголовок с кнопкой назад -->
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <button id="backBtn" style="
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                ">
                    ←
                </button>
                <div style="font-size: 22px; font-weight: 700; color: var(--text-primary);">
                    ${title}
                </div>
            </div>
            
            ${!isEditing ? `
                <!-- Прогресс создания -->
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: var(--primary);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 14px;
                    ">1</div>
                    <div style="height: 3px; flex: 1; background: var(--primary);"></div>
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: var(--primary);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 14px;
                    ">2</div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-left: 8px;">
                        Стадия 2 из 2
                    </div>
                </div>
            ` : ''}
            
            <!-- Информация о тренировке -->
            <div style="
                background: var(--surface);
                border-radius: 12px;
                border: 2px solid ${this.currentWorkoutData.color};
                padding: 16px;
                margin-bottom: 20px;
                border-left: 6px solid ${this.currentWorkoutData.color};
            ">
                <div style="font-weight: 700; color: var(--text-primary); font-size: 18px; margin-bottom: 6px;">
                    ${this.currentWorkoutData.name}
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <span style="
                        background: rgba(6, 180, 143, 0.1);
                        color: var(--primary);
                        padding: 4px 10px;
                        border-radius: 10px;
                        font-size: 12px;
                        font-weight: 600;
                    ">
                        ${this.currentWorkoutData.duration} мин
                    </span>
                    <span style="
                        background: ${this.hexToRgba(this.currentWorkoutData.color, 0.1)};
                        color: ${this.currentWorkoutData.color};
                        padding: 4px 10px;
                        border-radius: 10px;
                        font-size: 12px;
                        font-weight: 600;
                    ">
                        ${this.currentWorkoutData.exercises.length} упражн.
                    </span>
                    ${isEditing ? `
                        <span style="
                            background: rgba(52, 152, 219, 0.1);
                            color: #3498DB;
                            padding: 4px 10px;
                            border-radius: 10px;
                            font-size: 12px;
                            font-weight: 600;
                        ">
                            ✏️ Редактирование
                        </span>
                    ` : ''}
                </div>
                ${this.currentWorkoutData.description ? `
                    <div style="color: var(--text-secondary); font-size: 14px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-light);">
                        ${this.currentWorkoutData.description}
                    </div>
                ` : ''}
            </div>
            
            <!-- Список добавленных упражнений (с drag & drop) -->
            <div id="addedExercisesList" style="margin-bottom: 24px; min-height: 100px;"
                 ondragover="event.preventDefault();"
                 ondrop="window.healthFlow.handleExerciseDrop(event)">
                ${this.currentWorkoutData.exercises.length > 0 ?
                this.currentWorkoutData.exercises.map((exercise, index) => this.renderExerciseWithSets(exercise, index)).join('')
                : `
                    <div style="text-align: center; padding: 40px 20px; background: var(--surface); border-radius: 12px; border: 2px dashed var(--border-light);">
                        <div style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;">🏋️</div>
                        <div style="font-size: 16px; color: var(--text-primary); font-weight: 600; margin-bottom: 8px;">
                            Нет добавленных упражнений
                        </div>
                        <div style="font-size: 14px; color: var(--text-secondary);">
                            Начните с добавления первого упражнения
                        </div>
                    </div>
                `}
            </div>
            
            <!-- Кнопка добавления упражнения -->
            <button id="addExerciseBtn" style="
                width: 100%;
                padding: 16px;
                border: 2px solid var(--border-light);
                border-radius: 12px;
                background: var(--surface);
                color: var(--text-primary);
                font-weight: 700;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 20px;
                transition: all 0.2s ease;
            ">
                <span style="font-size: 20px;">+</span>
                Добавить упражнение
            </button>
            
            <!-- Кнопки -->
            <div style="display: flex; gap: 12px;">
                ${!isEditing ? `
                    <button id="backToStage1Btn" style="
                        flex: 1;
                        padding: 16px;
                        border: 2px solid var(--border-light);
                        border-radius: 10px;
                        background: transparent;
                        color: var(--text-secondary);
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        ← Назад
                    </button>
                ` : ''}
                <button id="saveWorkoutBtn" style="
                    flex: ${isEditing ? 1 : 1};
                    padding: 16px;
                    border: none;
                    border-radius: 10px;
                    background: linear-gradient(135deg, ${isEditing ? '#3498DB' : '#FF9A76'}, ${isEditing ? '#2980B9' : '#E86A50'});
                    color: white;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    ${this.currentWorkoutData.exercises.length === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                " ${this.currentWorkoutData.exercises.length === 0 ? 'disabled' : ''}>
                    ${isEditing ? 'Сохранить изменения' : 'Сохранить тренировку'}
                </button>
            </div>
        `;

        // Инициализируем интерактивные элементы
        this.initializeWorkoutFormStage2();
    }




    // Отрисовка упражнения с подходами
    // Отрисовка упражнения с подходами
    // Отрисовка упражнения с подходами
    renderExerciseWithSets(exercise, exerciseIndex) {
        return `
            <div class="exercise-with-sets" 
                 data-exercise-index="${exerciseIndex}"
                 draggable="true"
                 ondragstart="window.healthFlow.handleExerciseDragStart(event, ${exerciseIndex})"
                 ondragend="window.healthFlow.handleExerciseDragEnd(event)"
                 style="
                    background: var(--surface);
                    border-radius: 12px;
                    border: 2px solid var(--border-light);
                    padding: 16px;
                    margin-bottom: 16px;
                    animation: fadeIn 0.3s ease-out;
                    cursor: grab;
                    transition: all 0.2s ease;
                    position: relative;
                 ">
                 
                <!-- Drag handle -->
                <div style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    color: var(--text-light);
                    font-size: 20px;
                    opacity: 0.5;
                    cursor: grab;
                ">⋮⋮</div>
                
                <!-- Заголовок упражнения с отдыхом -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 16px; margin-bottom: 6px;">
                            ${exercise.name}
                        </div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
                            <span style="
                                background: rgba(6, 180, 143, 0.1);
                                color: var(--primary);
                                padding: 3px 8px;
                                border-radius: 8px;
                                font-size: 11px;
                                font-weight: 600;
                            ">
                                ${exercise.category}
                            </span>
                            ${exercise.muscleGroups && exercise.muscleGroups.slice(0, 2).map(group => `
                                <span style="
                                    background: rgba(108, 92, 231, 0.1);
                                    color: #6C5CE7;
                                    padding: 3px 8px;
                                    border-radius: 8px;
                                    font-size: 11px;
                                    font-weight: 600;
                                ">
                                    ${group}
                                </span>
                            `).join('')}
                        </div>
                        
                        <!-- Отдых между подходами -->
                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                            <div style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">
                                Отдых между подходами:
                            </div>
                            <input type="number" 
                                   class="exercise-rest-input" 
                                   data-exercise-index="${exerciseIndex}"
                                   value="${exercise.restBetweenSets || 60}" 
                                   min="0" 
                                   max="300"
                                   style="
                                        width: 80px;
                                        padding: 6px 8px;
                                        border: 2px solid var(--border-light);
                                        border-radius: 6px;
                                        font-size: 13px;
                                        text-align: center;
                                        background: var(--surface);
                                        color: var(--text-primary);
                                        outline: none;
                                   ">
                            <div style="font-size: 12px; color: var(--text-secondary);">
                                сек
                            </div>
                        </div>
                    </div>
                    <button class="remove-exercise-btn" data-exercise-index="${exerciseIndex}" style="
                        background: rgba(255, 107, 107, 0.1);
                        border: none;
                        color: var(--remove);
                        padding: 6px 12px;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        Удалить
                    </button>
                </div>
                
                <!-- Подходы упражнения -->
                <div class="sets-container" style="margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="font-size: 14px; color: var(--text-secondary); font-weight: 600;">
                            Подходы (${exercise.sets.length})
                        </div>
                    </div>
                    
                    <!-- Список подходов -->
                    <div id="sets-list-${exerciseIndex}" style="margin-bottom: 12px;">
                        ${exercise.sets.map((set, setIndex) => this.renderSetItem(exerciseIndex, setIndex, set)).join('')}
                    </div>
                    
                    <!-- Кнопка добавления подхода (ПОД подходами) -->
                    <div style="text-align: center;">
                        <button class="add-set-btn" data-exercise-index="${exerciseIndex}" style="
                            background: rgba(6, 180, 143, 0.1);
                            border: 2px dashed var(--primary);
                            color: var(--primary);
                            padding: 12px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            width: 100%;
                        ">
                            + Добавить подход
                        </button>
                    </div>
                </div>
            </div>
        `;
    }


    // Отрисовка отдельного подхода
    // Отрисовка отдельного подхода
    renderSetItem(exerciseIndex, setIndex, set) {
        return `
            <div class="set-item" 
                 draggable="true"
                 ondragstart="window.healthFlow.handleSetDragStart(event, ${exerciseIndex}, ${setIndex})"
                 ondragend="window.healthFlow.handleSetDragEnd(event)"
                 ondragover="event.preventDefault();"
                 ondrop="window.healthFlow.handleSetDrop(event, ${exerciseIndex}, ${setIndex})"
                 style="
                    background: rgba(0, 0, 0, 0.02);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: grab;
                    transition: all 0.2s ease;
                    position: relative;
                 ">
                 
                <!-- Drag handle для подхода -->
                <div style="
                    position: absolute;
                    left: 8px;
                    color: var(--text-light);
                    font-size: 16px;
                    opacity: 0.5;
                    cursor: grab;
                ">⋮⋮</div>
                
                <div style="
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 700;
                    margin-left: 20px;
                ">
                    ${setIndex + 1}
                </div>
                
                <div style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                    <!-- Повторения -->
                    <div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">
                            Повторения
                        </div>
                        <input type="number" 
                               class="set-reps-input" 
                               data-exercise-index="${exerciseIndex}"
                               data-set-index="${setIndex}"
                               value="${set.reps || 12}" 
                               min="1" 
                               max="100"
                               style="
                                    width: 100%;
                                    padding: 8px;
                                    border: 2px solid var(--border-light);
                                    border-radius: 6px;
                                    font-size: 14px;
                                    text-align: center;
                                    background: var(--surface);
                                    color: var(--text-primary);
                                    outline: none;
                               ">
                    </div>
                    
                    <!-- Вес -->
                    <div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">
                            Вес (кг)
                        </div>
                        <input type="number" 
                               class="set-weight-input" 
                               data-exercise-index="${exerciseIndex}"
                               data-set-index="${setIndex}"
                               value="${set.weight || 0}" 
                               min="0" 
                               max="500" 
                               step="0.5"
                               style="
                                    width: 100%;
                                    padding: 8px;
                                    border: 2px solid var(--border-light);
                                    border-radius: 6px;
                                    font-size: 14px;
                                    text-align: center;
                                    background: var(--surface);
                                    color: var(--text-primary);
                                    outline: none;
                               ">
                    </div>
                    
                    <!-- Примечания (опционально) -->
                    <div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600;">
                            Примечания
                        </div>
                        <input type="text" 
                               class="set-notes-input" 
                               data-exercise-index="${exerciseIndex}"
                               data-set-index="${setIndex}"
                               value="${set.notes || ''}" 
                               placeholder="Легко/Тяжело"
                               maxlength="20"
                               style="
                                    width: 100%;
                                    padding: 8px;
                                    border: 2px solid var(--border-light);
                                    border-radius: 6px;
                                    font-size: 14px;
                                    text-align: center;
                                    background: var(--surface);
                                    color: var(--text-primary);
                                    outline: none;
                               ">
                    </div>
                </div>
                
                <!-- Кнопка удаления подхода -->
                <div style="display: flex; align-items: center;">
                    <button class="remove-set-btn" 
                            data-exercise-index="${exerciseIndex}"
                            data-set-index="${setIndex}"
                            style="
                                background: transparent;
                                border: none;
                                color: var(--text-secondary);
                                padding: 8px;
                                cursor: pointer;
                                font-size: 20px;
                                opacity: 0.6;
                                transition: all 0.2s ease;
                            ">
                        ×
                    </button>
                </div>
            </div>
        `;
    }


    // Drag & Drop для упражнений
    handleExerciseDragStart(event, exerciseIndex) {
        event.dataTransfer.setData('text/plain', exerciseIndex);
        event.dataTransfer.effectAllowed = 'move';
        this.draggedExercise = exerciseIndex;

        event.currentTarget.classList.add('dragging');
        event.currentTarget.style.opacity = '0.4';
        event.currentTarget.style.transform = 'scale(0.98)';
        event.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
    }

    handleExerciseDragEnd(event) {
        event.currentTarget.classList.remove('dragging');
        event.currentTarget.style.opacity = '1';
        event.currentTarget.style.transform = 'scale(1)';
        event.currentTarget.style.boxShadow = 'none';
        this.draggedExercise = null;
    }

    handleExerciseDrop(event) {
        event.preventDefault();

        if (this.draggedExercise === null) return;

        const targetExercise = this.getExerciseElementFromPoint(event.clientX, event.clientY);
        if (!targetExercise) return;

        const targetIndex = parseInt(targetExercise.dataset.exerciseIndex);
        if (this.draggedExercise === targetIndex) return;

        // Перемещаем упражнение
        const exercise = this.currentWorkoutData.exercises[this.draggedExercise];
        this.currentWorkoutData.exercises.splice(this.draggedExercise, 1);
        this.currentWorkoutData.exercises.splice(targetIndex, 0, exercise);

        // Перерисовываем
        this.showWorkoutFormStage2();
        this.showNotification('Порядок упражнений изменен', 'success');
    }


    // Drag & Drop для подходов
    handleSetDragStart(event, exerciseIndex, setIndex) {
        event.dataTransfer.setData('text/plain', JSON.stringify({ exerciseIndex, setIndex }));
        event.dataTransfer.effectAllowed = 'move';
        this.draggedSet = { exerciseIndex, setIndex };

        event.currentTarget.classList.add('dragging');
        event.currentTarget.style.opacity = '0.4';
        event.currentTarget.style.transform = 'scale(0.98)';
        event.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
    }

    handleSetDragEnd(event) {
        event.currentTarget.classList.remove('dragging');
        event.currentTarget.style.opacity = '1';
        event.currentTarget.style.transform = 'scale(1)';
        event.currentTarget.style.boxShadow = 'none';
        this.draggedSet = null;
    }


    // Обработчики для визуальных эффектов при перетаскивании
    setupDragAndDropListeners() {
        // Для упражнений
        document.addEventListener('dragover', (e) => {
            if (this.draggedExercise !== null) {
                const element = this.getExerciseElementFromPoint(e.clientX, e.clientY);
                if (element) {
                    this.addDragOverEffect(element);
                }
            }
        });

        document.addEventListener('dragleave', (e) => {
            document.querySelectorAll('.exercise-with-sets').forEach(el => {
                this.removeDragOverEffect(el);
            });
        });
    }



    handleSetDrop(event, targetExerciseIndex, targetSetIndex) {
        event.preventDefault();

        if (!this.draggedSet) return;

        const { exerciseIndex: sourceExerciseIndex, setIndex: sourceSetIndex } = this.draggedSet;

        // Если перетаскиваем в том же упражнении
        if (sourceExerciseIndex === targetExerciseIndex) {
            if (sourceSetIndex === targetSetIndex) return;

            // Перемещаем подход внутри упражнения
            const sets = this.currentWorkoutData.exercises[sourceExerciseIndex].sets;
            const set = sets[sourceSetIndex];
            sets.splice(sourceSetIndex, 1);
            sets.splice(targetSetIndex, 0, set);
        } else {
            // Перетаскиваем в другое упражнение
            const sourceSets = this.currentWorkoutData.exercises[sourceExerciseIndex].sets;
            const targetSets = this.currentWorkoutData.exercises[targetExerciseIndex].sets;
            const set = sourceSets[sourceSetIndex];

            sourceSets.splice(sourceSetIndex, 1);
            targetSets.splice(targetSetIndex, 0, set);
        }

        // Перерисовываем
        this.showWorkoutFormStage2();
        this.showNotification('Порядок подходов изменен', 'success');
    }


    // Вспомогательные методы для улучшения UX при drag & drop
    addDragOverEffect(element) {
        element.classList.add('drag-over');
    }

    removeDragOverEffect(element) {
        element.classList.remove('drag-over');
    }

    // Обновляем handleExerciseDrop для добавления эффектов
    handleExerciseDrop(event) {
        event.preventDefault();
        this.removeDragOverEffect(event.currentTarget);

        if (this.draggedExercise === null) return;

        const targetExercise = this.getExerciseElementFromPoint(event.clientX, event.clientY);
        if (!targetExercise) return;

        const targetIndex = parseInt(targetExercise.dataset.exerciseIndex);
        if (this.draggedExercise === targetIndex) return;

        const exercise = this.currentWorkoutData.exercises[this.draggedExercise];
        this.currentWorkoutData.exercises.splice(this.draggedExercise, 1);
        this.currentWorkoutData.exercises.splice(targetIndex, 0, exercise);

        this.showWorkoutFormStage2();
        this.showNotification('Порядок упражнений изменен', 'success');
    }

    // Обновляем handleSetDrop для добавления эффектов
    handleSetDrop(event, targetExerciseIndex, targetSetIndex) {
        event.preventDefault();
        this.removeDragOverEffect(event.currentTarget);

        if (!this.draggedSet) return;

        const { exerciseIndex: sourceExerciseIndex, setIndex: sourceSetIndex } = this.draggedSet;

        if (sourceExerciseIndex === targetExerciseIndex) {
            if (sourceSetIndex === targetSetIndex) return;

            const sets = this.currentWorkoutData.exercises[sourceExerciseIndex].sets;
            const set = sets[sourceSetIndex];
            sets.splice(sourceSetIndex, 1);
            sets.splice(targetSetIndex, 0, set);
        } else {
            const sourceSets = this.currentWorkoutData.exercises[sourceExerciseIndex].sets;
            const targetSets = this.currentWorkoutData.exercises[targetExerciseIndex].sets;
            const set = sourceSets[sourceSetIndex];

            sourceSets.splice(sourceSetIndex, 1);
            targetSets.splice(targetSetIndex, 0, set);
        }

        this.showWorkoutFormStage2();
        this.showNotification('Порядок подходов изменен', 'success');
    }

    getExerciseElementFromPoint(x, y) {
        const elements = document.elementsFromPoint(x, y);
        for (const element of elements) {
            if (element.classList.contains('exercise-with-sets')) {
                return element;
            }
        }
        return null;
    }




    initializeWorkoutFormStage2() {
        // Кнопка назад
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.editingWorkoutId) {
                    // При редактировании возвращаемся к списку тренировок
                    this.editingWorkoutId = null;
                    this.currentWorkoutData = null;
                    this.showWorkoutsSection();
                } else {
                    // При создании возвращаемся к первой стадии
                    this.showCreateWorkoutForm();
                }
            });
        }

        // Кнопка "Назад" к первой стадии
        const backToStage1Btn = document.getElementById('backToStage1Btn');
        if (backToStage1Btn) {
            backToStage1Btn.addEventListener('click', () => {
                this.showCreateWorkoutForm();
            });
        }

        // Кнопка добавления упражнения
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', () => {
                this.showExerciseSelectionModal();
            });
        }

        // Кнопка сохранения тренировки
        const saveBtn = document.getElementById('saveWorkoutBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.editingWorkoutId) {
                    this.updateWorkout();
                } else {
                    this.finalizeWorkoutCreation();
                }
            });
        }

        // Инициализируем обработчики для уже добавленных упражнений
        this.initializeExerciseControls();

        // Настраиваем слушатели для drag & drop
        this.setupDragAndDropListeners();
    }




    // Модальное окно выбора упражнений
    showExerciseSelectionModal() {
        const exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');

        const modal = document.createElement('div');
        modal.className = 'exercise-selection-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: var(--surface);
                border-radius: 16px;
                width: 100%;
                max-width: 500px;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <!-- Заголовок модального окна -->
                <div style="
                    padding: 20px;
                    border-bottom: 2px solid var(--border-light);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">
                        Выбор упражнений
                    </div>
                    <button id="closeExerciseModal" style="
                        background: transparent;
                        border: none;
                        color: var(--text-secondary);
                        font-size: 24px;
                        cursor: pointer;
                        padding: 4px;
                        width: 36px;
                        height: 36px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: all 0.2s ease;
                    ">
                        ×
                    </button>
                </div>
                
                <!-- Поиск и фильтры -->
                <div style="padding: 16px; border-bottom: 2px solid var(--border-light);">
                    <input type="text" 
                           id="modalExerciseSearch" 
                           placeholder="Поиск по названию..." 
                           style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid var(--border-light);
                                border-radius: 8px;
                                font-size: 14px;
                                font-family: inherit;
                                background: var(--surface);
                                color: var(--text-primary);
                                outline: none;
                                margin-bottom: 12px;
                           ">
                    
                    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px;">
                        <button class="modal-muscle-filter" data-group="Все" style="
                            padding: 8px 14px;
                            border: 2px solid var(--primary);
                            border-radius: 20px;
                            background: rgba(6, 180, 143, 0.1);
                            color: var(--primary);
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            white-space: nowrap;
                        ">
                            Все
                        </button>
                        ${['Грудь', 'Спина', 'Ноги', 'Плечи', 'Бицепс', 'Трицепс', 'Пресс', 'Ягодицы', 'Кардио'].map(group => `
                            <button class="modal-muscle-filter" data-group="${group}" style="
                                padding: 8px 14px;
                                border: 2px solid var(--border-light);
                                border-radius: 20px;
                                background: var(--surface);
                                color: var(--text-primary);
                                font-size: 13px;
                                font-weight: 600;
                                cursor: pointer;
                                white-space: nowrap;
                            ">
                                ${group}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Список упражнений -->
                <div id="modalExerciseList" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                ">
                    ${exercises.length > 0 ? exercises.map(exercise => `
                        <div class="modal-exercise-item" 
                             data-id="${exercise.id}"
                             data-groups="${exercise.muscleGroups ? exercise.muscleGroups.join(',') : ''}"
                             style="
                                padding: 14px;
                                border: 2px solid var(--border-light);
                                border-radius: 8px;
                                margin-bottom: 10px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                background: var(--surface);
                             ">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="
                                    width: 24px;
                                    height: 24px;
                                    border: 2px solid var(--border);
                                    border-radius: 6px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    transition: all 0.2s ease;
                                ">
                                    <div style="width: 14px; height: 14px; background: var(--primary); border-radius: 3px; display: none;"></div>
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: var(--text-primary); font-size: 15px;">
                                        ${exercise.name}
                                    </div>
                                    <div style="display: flex; gap: 8px; margin-top: 4px;">
                                        <span style="
                                            background: rgba(6, 180, 143, 0.1);
                                            color: var(--primary);
                                            padding: 2px 8px;
                                            border-radius: 10px;
                                            font-size: 11px;
                                            font-weight: 600;
                                        ">
                                            ${exercise.category}
                                        </span>
                                        ${exercise.muscleGroups && exercise.muscleGroups.slice(0, 2).map(group => `
                                            <span style="
                                                background: rgba(108, 92, 231, 0.1);
                                                color: #6C5CE7;
                                                padding: 2px 8px;
                                                border-radius: 10px;
                                                font-size: 11px;
                                                font-weight: 600;
                                            ">
                                                ${group}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('') : `
                        <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                            <div style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;">🏋️</div>
                            <div>Нет доступных упражнений</div>
                            <div style="font-size: 13px; margin-top: 5px;">Сначала создайте упражнения</div>
                        </div>
                    `}
                </div>
                
                <!-- Кнопки в модальном окне -->
                <div style="padding: 16px; border-top: 2px solid var(--border-light);">
                    <button id="addSelectedExercisesBtn" style="
                        width: 100%;
                        padding: 16px;
                        border: none;
                        border-radius: 10px;
                        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                        color: white;
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        Добавить выбранные упражнения
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Инициализируем модальное окно
        this.initializeExerciseSelectionModal(modal);
    }



    initializeExerciseSelectionModal(modal) {
        const closeBtn = modal.querySelector('#closeExerciseModal');
        const addBtn = modal.querySelector('#addSelectedExercisesBtn');
        const searchInput = modal.querySelector('#modalExerciseSearch');
        const exerciseItems = modal.querySelectorAll('.modal-exercise-item');
        const muscleFilters = modal.querySelectorAll('.modal-muscle-filter');

        const selectedExercises = new Set();

        // Закрытие модального окна
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);

        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Выбор упражнений в модальном окне
        exerciseItems.forEach(item => {
            item.addEventListener('click', () => {
                const exerciseId = parseInt(item.dataset.id);
                const checkbox = item.querySelector('div > div');
                const checkmark = checkbox.querySelector('div');

                if (selectedExercises.has(exerciseId)) {
                    selectedExercises.delete(exerciseId);
                    item.style.borderColor = 'var(--border-light)';
                    item.style.background = 'var(--surface)';
                    checkmark.style.display = 'none';
                } else {
                    selectedExercises.add(exerciseId);
                    item.style.borderColor = 'var(--primary)';
                    item.style.background = 'rgba(6, 180, 143, 0.1)';
                    checkmark.style.display = 'block';
                }
            });
        });

        // Поиск упражнений
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                this.filterModalExercises(searchTerm, null, modal);
            });
        }

        // Фильтрация по группам мышц
        muscleFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                // Сбрасываем стили у всех фильтров
                muscleFilters.forEach(f => {
                    f.style.borderColor = 'var(--border-light)';
                    f.style.background = 'var(--surface)';
                    f.style.color = 'var(--text-primary)';
                });

                // Выделяем выбранный фильтр
                filter.style.borderColor = 'var(--primary)';
                filter.style.background = 'rgba(6, 180, 143, 0.1)';
                filter.style.color = 'var(--primary)';

                const group = filter.dataset.group;
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                this.filterModalExercises(searchTerm, group === 'Все' ? null : group, modal);
            });
        });

        // Добавление выбранных упражнений
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (selectedExercises.size === 0) {
                    this.showNotification('Выберите хотя бы одно упражнение!', 'error');
                    return;
                }

                const allExercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
                selectedExercises.forEach(exerciseId => {
                    const exercise = allExercises.find(ex => ex.id === exerciseId);
                    if (exercise) {
                        // Проверяем, не добавлено ли уже это упражнение
                        const alreadyAdded = this.currentWorkoutData.exercises.some(
                            ex => ex.id === exerciseId
                        );

                        this.currentWorkoutData.exercises.push({
                            id: exercise.id,
                            name: exercise.name,
                            category: exercise.category,
                            muscleGroups: exercise.muscleGroups || [],
                            restBetweenSets: 60, // Отдых по умолчанию
                            sets: [
                                { reps: 12, weight: 0, notes: '' }
                            ]
                        });
                    }
                });

                closeModal();
                this.showWorkoutFormStage2(); // Обновляем отображение
                this.showNotification('Упражнения добавлены!', 'success');
            });
        }
    }


    filterModalExercises(searchTerm, muscleGroup, modal) {
        const exerciseItems = modal.querySelectorAll('.modal-exercise-item');

        exerciseItems.forEach(item => {
            const exerciseName = item.querySelector('div > div').textContent.toLowerCase();
            const exerciseGroups = item.dataset.groups ? item.dataset.groups.toLowerCase().split(',') : [];
            const matchesSearch = searchTerm === '' || exerciseName.includes(searchTerm);
            const matchesGroup = muscleGroup === null ||
                exerciseGroups.some(group => group.includes(muscleGroup.toLowerCase()));

            if (matchesSearch && matchesGroup) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Вспомогательная функция для преобразования hex в rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Инициализация контролов для упражнений (удаление, добавление подходов и т.д.)
    // Инициализация контролов для упражнений
    // Инициализация контролов для упражнений
    initializeExerciseControls() {
        // Удаление упражнения
        document.querySelectorAll('.remove-exercise-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseIndex = parseInt(e.target.dataset.exerciseIndex);
                if (confirm('Удалить это упражнение из тренировки?')) {
                    this.currentWorkoutData.exercises.splice(exerciseIndex, 1);
                    this.showWorkoutFormStage2();
                }
            });
        });

        // Добавление подхода
        document.querySelectorAll('.add-set-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseIndex = parseInt(e.target.dataset.exerciseIndex);
                this.currentWorkoutData.exercises[exerciseIndex].sets.push({
                    reps: 12,
                    weight: 0,
                    notes: ''
                });
                this.showWorkoutFormStage2();
            });
        });

        // Удаление подхода
        document.querySelectorAll('.remove-set-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const exerciseIndex = parseInt(e.target.dataset.exerciseIndex);
                const setIndex = parseInt(e.target.dataset.setIndex);
                const exercise = this.currentWorkoutData.exercises[exerciseIndex];

                if (exercise.sets.length > 1) {
                    exercise.sets.splice(setIndex, 1);
                    this.showWorkoutFormStage2();
                } else {
                    this.showNotification('Должен быть хотя бы один подход!', 'error');
                }
            });
        });

        // Обработка отдыха между подходами
        document.querySelectorAll('.exercise-rest-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const exerciseIndex = parseInt(e.target.dataset.exerciseIndex);
                const value = parseInt(e.target.value) || 60;
                this.currentWorkoutData.exercises[exerciseIndex].restBetweenSets = value;
            });
        });

        // Обработка изменений в подходах
        document.querySelectorAll('.set-reps-input, .set-weight-input, .set-notes-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const exerciseIndex = parseInt(e.target.dataset.exerciseIndex);
                const setIndex = parseInt(e.target.dataset.setIndex);
                let field;

                if (e.target.classList.contains('set-reps-input')) field = 'reps';
                else if (e.target.classList.contains('set-weight-input')) field = 'weight';
                else if (e.target.classList.contains('set-notes-input')) field = 'notes';
                else return;

                const value = field === 'notes' ? e.target.value : parseFloat(e.target.value) || 0;
                this.currentWorkoutData.exercises[exerciseIndex].sets[setIndex][field] = value;
            });
        });
    }


    // Финализация создания тренировки
    finalizeWorkoutCreation() {
        const { name, color, duration, description, exercises } = this.currentWorkoutData;

        if (exercises.length === 0) {
            this.showNotification('Добавьте хотя бы одно упражнение!', 'error');
            return;
        }

        // Сохраняем тренировку
        let workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        workouts.push({
            id: Date.now(),
            name: name,
            color: color,
            description: description,
            duration: duration,
            difficulty: this.calculateWorkoutDifficulty(exercises),
            exercises: exercises.map(ex => ({
                id: ex.id,
                name: ex.name,
                category: ex.category,
                muscleGroups: ex.muscleGroups,
                restBetweenSets: ex.restBetweenSets || 60, // Добавляем отдых
                sets: ex.sets // Сохраняем подходы с весом и повторениями
            })),
            createdAt: new Date().toISOString(),
            lastCompleted: null
        });

        localStorage.setItem('healthflow_workouts', JSON.stringify(workouts));

        this.showNotification(`Тренировка "${name}" создана!`, 'success');
        this.creatingWorkout = false;
        this.currentWorkoutData = null;
        this.showWorkoutsSection();
    }


    // Обновление существующей тренировки
    updateWorkout() {
        const { name, color, duration, description, exercises } = this.currentWorkoutData;

        if (exercises.length === 0) {
            this.showNotification('Добавьте хотя бы одно упражнение!', 'error');
            return;
        }

        let workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        const workoutIndex = workouts.findIndex(w => w.id === this.editingWorkoutId);

        if (workoutIndex === -1) {
            this.showNotification('Тренировка не найдена!', 'error');
            return;
        }

        // Обновляем тренировку
        workouts[workoutIndex] = {
            ...workouts[workoutIndex],
            name: name,
            color: color,
            description: description,
            duration: duration,
            difficulty: this.calculateWorkoutDifficulty(exercises),
            exercises: exercises.map(ex => ({
                id: ex.id,
                name: ex.name,
                category: ex.category,
                muscleGroups: ex.muscleGroups,
                restBetweenSets: ex.restBetweenSets || 60, // Добавляем отдых
                sets: ex.sets
            }))
        };

        localStorage.setItem('healthflow_workouts', JSON.stringify(workouts));

        this.showNotification(`Тренировка "${name}" обновлена!`, 'success');
        this.editingWorkoutId = null;
        this.currentWorkoutData = null;
        this.showWorkoutsSection();
    }









    initializeWorkoutForm() {
        // Кнопка назад
        const backBtn = document.getElementById('backToWorkoutsBtn');
        const cancelBtn = document.getElementById('cancelWorkoutBtn');

        const goBack = () => {
            this.creatingWorkout = false;
            this.showWorkoutsSection();
        };

        if (backBtn) backBtn.addEventListener('click', goBack);
        if (cancelBtn) cancelBtn.addEventListener('click', goBack);

        // Выбор цвета
        const colorOptions = document.querySelectorAll('.color-option');
        const selectedColorInput = document.getElementById('selectedColor');

        // Выделяем первый цвет по умолчанию
        if (colorOptions.length > 0) {
            colorOptions[0].style.borderColor = 'var(--text-primary)';
        }

        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Сбрасываем границы у всех
                colorOptions.forEach(opt => {
                    opt.style.borderColor = 'transparent';
                });

                // Выделяем выбранный
                option.style.borderColor = 'var(--text-primary)';
                selectedColorInput.value = option.dataset.color;
            });
        });

        // Выбор упражнений
        const exerciseItems = document.querySelectorAll('.exercise-selection-item');
        const selectedCountSpan = document.getElementById('selectedCount');
        const selectedExercises = new Set();

        exerciseItems.forEach(item => {
            item.addEventListener('click', () => {
                const exerciseId = parseInt(item.dataset.id);
                const checkbox = item.querySelector('div > div');
                const checkmark = checkbox.querySelector('div');

                if (selectedExercises.has(exerciseId)) {
                    selectedExercises.delete(exerciseId);
                    item.style.borderColor = 'var(--border-light)';
                    item.style.background = 'var(--surface)';
                    checkmark.style.display = 'none';
                } else {
                    selectedExercises.add(exerciseId);
                    item.style.borderColor = 'var(--primary)';
                    item.style.background = 'rgba(6, 180, 143, 0.1)';
                    checkmark.style.display = 'block';
                }

                selectedCountSpan.textContent = selectedExercises.size;
            });
        });

        // Поиск упражнений
        const searchInput = document.getElementById('exerciseSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase();
                this.filterExercises(searchTerm, null);
            });
        }

        // Фильтрация по группам мышц
        const muscleFilters = document.querySelectorAll('.muscle-filter');
        muscleFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                // Сбрасываем стили у всех фильтров
                muscleFilters.forEach(f => {
                    f.style.borderColor = 'var(--border-light)';
                    f.style.background = 'var(--surface)';
                    f.style.color = 'var(--text-primary)';
                });

                // Выделяем выбранный фильтр
                filter.style.borderColor = 'var(--primary)';
                filter.style.background = 'rgba(6, 180, 143, 0.1)';
                filter.style.color = 'var(--primary)';

                const group = filter.dataset.group;
                const searchTerm = document.getElementById('exerciseSearch').value.toLowerCase();
                this.filterExercises(searchTerm, group === 'Все' ? null : group);
            });
        });

        // Сохранение тренировки
        const saveBtn = document.getElementById('saveWorkoutBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveWorkoutFromForm(selectedExercises);
            });
        }
    }

    filterExercises(searchTerm, muscleGroup) {
        const exerciseItems = document.querySelectorAll('.exercise-selection-item');

        exerciseItems.forEach(item => {
            const exerciseName = item.querySelector('div > div').textContent.toLowerCase();
            const exerciseGroups = item.dataset.groups ? item.dataset.groups.toLowerCase().split(',') : [];
            const matchesSearch = searchTerm === '' || exerciseName.includes(searchTerm);
            const matchesGroup = muscleGroup === null ||
                exerciseGroups.some(group => group.includes(muscleGroup.toLowerCase()));

            if (matchesSearch && matchesGroup) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    saveWorkoutFromForm(selectedExercises) {
        const name = document.getElementById('workoutName').value.trim();
        const color = document.getElementById('selectedColor').value;
        const duration = parseInt(document.getElementById('workoutDuration').value) || 30;
        const description = document.getElementById('workoutDescription').value.trim();

        if (!name) {
            this.showNotification('Введите название тренировки!', 'error');
            return;
        }

        if (selectedExercises.size === 0) {
            this.showNotification('Выберите хотя бы одно упражнение!', 'error');
            return;
        }

        // Получаем информацию о выбранных упражнениях
        const allExercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
        const selectedExercisesData = allExercises.filter(ex => selectedExercises.has(ex.id)).map(ex => ({
            id: ex.id,
            name: ex.name,
            category: ex.category,
            muscleGroups: ex.muscleGroups || []
        }));

        // Сохраняем тренировку
        let workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        workouts.push({
            id: Date.now(),
            name: name,
            color: color,
            description: description,
            duration: duration,
            difficulty: this.calculateWorkoutDifficulty(selectedExercisesData),
            exercises: selectedExercisesData,
            createdAt: new Date().toISOString(),
            lastCompleted: null
        });

        localStorage.setItem('healthflow_workouts', JSON.stringify(workouts));

        this.showNotification(`Тренировка "${name}" создана!`, 'success');
        this.creatingWorkout = false;
        this.showWorkoutsSection();
    }

    calculateWorkoutDifficulty(exercises) {
        const difficulties = { 'Низкий': 1, 'Средний': 2, 'Высокий': 3 };
        const allExercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');

        let totalDifficulty = 0;
        let count = 0;

        exercises.forEach(ex => {
            const fullExercise = allExercises.find(e => e.id === ex.id);
            if (fullExercise && fullExercise.difficulty) {
                totalDifficulty += difficulties[fullExercise.difficulty] || 2;
                count++;
            }
        });

        const avg = count > 0 ? totalDifficulty / count : 2;

        if (avg < 1.5) return 'Низкий';
        if (avg < 2.5) return 'Средний';
        return 'Высокий';
    }

    // Загрузка списка упражнений (без изменений)
    // Загрузка списка упражнений
    loadExercises() {
        const container = document.getElementById('exercisesList');
        if (!container) return;

        const exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');

        if (exercises.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;">🏋️</div>
                    <div style="color: var(--text-secondary); font-size: 16px;">Упражнений пока нет</div>
                    <div style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Создайте первое упражнение!</div>
                </div>
            `;
            return;
        }

        this.filterExercisesList();
    }




    // Отрисовка упражнения в списке упражнений
    renderExerciseItem(exercise, index) {
        return `
            <div style="
                background: var(--surface);
                border: 2px solid var(--border-light);
                border-radius: 12px;
                padding: 16px;
                opacity: 0;
                animation: fadeIn 0.3s ease-out ${index * 0.1}s forwards;
                transition: all 0.2s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 17px; margin-bottom: 4px;">
                            ${exercise.name}
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <span style="
                                background: rgba(6, 180, 143, 0.1);
                                color: var(--primary);
                                padding: 4px 10px;
                                border-radius: 10px;
                                font-size: 12px;
                                font-weight: 600;
                            ">
                                ${exercise.category}
                            </span>
                            ${exercise.muscleGroups && exercise.muscleGroups.map(group => `
                                <span style="
                                    background: rgba(108, 92, 231, 0.1);
                                    color: #6C5CE7;
                                    padding: 4px 10px;
                                    border-radius: 10px;
                                    font-size: 12px;
                                    font-weight: 600;
                                ">
                                    ${group}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    <button onclick="window.healthFlow.deleteExercise(${exercise.id})" style="
                        background: rgba(255, 107, 107, 0.1);
                        border: none;
                        color: var(--remove);
                        padding: 6px 12px;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        Удалить
                    </button>
                </div>
                
                ${exercise.description ? `
                    <div style="
                        color: var(--text-secondary);
                        font-size: 14px;
                        line-height: 1.5;
                        padding: 12px;
                        background: rgba(0, 0, 0, 0.02);
                        border-radius: 8px;
                        margin-top: 10px;
                    ">
                        ${exercise.description}
                    </div>
                ` : ''}
                
                ${exercise.image ? `
                    <div style="margin-top: 12px;">
                        <img src="${exercise.image}" alt="${exercise.name}" style="
                            width: 100%;
                            max-height: 200px;
                            object-fit: cover;
                            border-radius: 8px;
                        ">
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Остальные методы без изменений
    deleteExercise(id) {
        if (!confirm('Удалить это упражнение?')) return;

        let exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
        exercises = exercises.filter(ex => ex.id !== id);
        localStorage.setItem('healthflow_exercises', JSON.stringify(exercises));

        this.showNotification('Упражнение удалено', 'success');
        this.loadExercises();

        // Обновляем тренировки, если нужно
        this.loadWorkouts();
    }

    // Загрузка списка тренировок (с небольшими изменениями для цвета)
    // Загрузка списка тренировок (с небольшими изменениями для цвета)
    loadWorkouts() {
        const container = document.getElementById('workoutsList');
        if (!container) return;

        const workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');

        if (workouts.length === 0) {
            container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;">🏋️</div>
                <div style="color: var(--text-secondary); font-size: 16px;">Тренировок пока нет</div>
                <div style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Создайте первую тренировку!</div>
            </div>
        `;
            return;
        }

        let html = '<div style="display: grid; gap: 12px;">';

        workouts.forEach((workout, index) => {
            const completed = workout.lastCompleted ? new Date(workout.lastCompleted).toLocaleDateString() : 'Никогда';

            html += `
            <div style="
                background: var(--surface);
                border: 2px solid ${workout.lastCompleted ? workout.color : 'var(--border-light)'};
                border-left: 6px solid ${workout.color};
                border-radius: 12px;
                padding: 18px;
                opacity: 0;
                animation: fadeIn 0.3s ease-out ${index * 0.1}s forwards;
                transition: all 0.2s ease;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 18px; margin-bottom: 4px;">
                            ${workout.name}
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <span style="
                                background: rgba(255, 154, 118, 0.1);
                                color: var(--accent);
                                padding: 4px 10px;
                                border-radius: 10px;
                                font-size: 12px;
                                font-weight: 600;
                            ">
                                ${workout.difficulty}
                            </span>
                            
                            <span style="
                                background: rgba(6, 180, 143, 0.1);
                                color: var(--primary);
                                padding: 4px 10px;
                                border-radius: 10px;
                                font-size: 12px;
                                font-weight: 600;
                            ">
                                ${workout.duration} мин
                            </span>
                            
                            <span style="
                                background: rgba(108, 92, 231, 0.1);
                                color: #6C5CE7;
                                padding: 4px 10px;
                                border-radius: 10px;
                                font-size: 12px;
                                font-weight: 600;
                            ">
                                ${workout.exercises.length} упр.
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.healthFlow.editWorkout(${workout.id})" style="
                            background: rgba(6, 180, 143, 0.1);
                            border: 2px solid var(--primary);
                            color: var(--primary);
                            padding: 8px 16px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                            ✏️ Редактировать
                        </button>
                        <button onclick="window.healthFlow.startWorkout(${workout.id})" style="
                            background: linear-gradient(135deg, ${workout.color}, ${this.darkenColor(workout.color)});
                            border: none;
                            color: white;
                            padding: 8px 16px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                            Начать
                        </button>
                    </div>
                </div>
                
                ${workout.description ? `
                    <div style="
                        color: var(--text-secondary);
                        font-size: 14px;
                        line-height: 1.5;
                        padding: 12px;
                        background: rgba(0, 0, 0, 0.02);
                        border-radius: 8px;
                        margin-bottom: 12px;
                    ">
                        ${workout.description}
                    </div>
                ` : ''}
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-light);">
                    <div style="font-size: 13px; color: var(--text-light);">
                        📅 Последнее: ${completed}
                    </div>
                    <button onclick="window.healthFlow.deleteWorkout(${workout.id})" style="
                        background: transparent;
                        border: none;
                        color: var(--text-secondary);
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        padding: 6px 12px;
                        border-radius: 6px;
                        transition: all 0.2s ease;
                    ">
                        Удалить
                    </button>
                </div>
            </div>
        `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // Вспомогательная функция для затемнения цвета
    darkenColor(color) {
        // Простое затемнение цвета на 20%
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const darken = (value) => Math.max(0, Math.floor(value * 0.8));

        const dr = darken(r).toString(16).padStart(2, '0');
        const dg = darken(g).toString(16).padStart(2, '0');
        const db = darken(b).toString(16).padStart(2, '0');

        return `#${dr}${dg}${db}`;
    }

    // Остальные методы без изменений
    startWorkout(workoutId) {
        const workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        const workout = workouts.find(w => w.id === workoutId);

        if (!workout) {
            alert('Тренировка не найдена!');
            return;
        }

        if (confirm(`Начать тренировку "${workout.name}"?`)) {
            workout.lastCompleted = new Date().toISOString();
            localStorage.setItem('healthflow_workouts', JSON.stringify(workouts));
            this.addToHistory(workout);
            const skinsEarned = workout.exercises.length * 2;
            this.addSkins(skinsEarned, 'workout');
            this.showNotification(`Тренировка "${workout.name}" завершена! +${skinsEarned}✨`, 'skins');
            this.loadWorkouts();
            this.loadWorkoutsHistory();
        }
    }

    addToHistory(workout) {
        let history = JSON.parse(localStorage.getItem('healthflow_workout_history') || '[]');
        history.unshift({
            workoutId: workout.id,
            workoutName: workout.name,
            date: new Date().toISOString(),
            duration: workout.duration,
            exercisesCount: workout.exercises.length,
            skinsEarned: workout.exercises.length * 2
        });
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem('healthflow_workout_history', JSON.stringify(history));
    }

    loadWorkoutsHistory() {
        const container = document.getElementById('workoutsHistory');
        if (!container) return;

        const history = JSON.parse(localStorage.getItem('healthflow_workout_history') || '[]');

        if (history.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px 20px;">
                    <div style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;">📅</div>
                    <div style="color: var(--text-secondary); font-size: 16px;">Тренировок пока нет</div>
                    <div style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Начните первую тренировку!</div>
                </div>
            `;
            return;
        }

        let html = '';
        history.forEach((item, index) => {
            const date = new Date(item.date);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString();

            html += `
                <div style="
                    padding: 12px 0;
                    border-bottom: ${index < history.length - 1 ? '1px solid var(--border-light)' : 'none'};
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <div style="font-weight: 600; color: var(--text-primary); font-size: 15px;">
                            ${item.workoutName}
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 3px;">
                            ${dateString} в ${timeString}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--primary); font-size: 16px;">
                            +${item.skinsEarned}✨
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                            ${item.duration} мин
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    deleteWorkout(workoutId) {
        if (!confirm('Удалить эту тренировку?')) return;

        let workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        workouts = workouts.filter(w => w.id !== workoutId);
        localStorage.setItem('healthflow_workouts', JSON.stringify(workouts));

        this.showNotification('Тренировка удалена', 'success');
        this.loadWorkouts();
    }

    // Редактирование тренировки
    // Редактирование тренировки
    editWorkout(workoutId) {
        const workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        const workout = workouts.find(w => w.id === workoutId);

        if (!workout) {
            this.showNotification('Тренировка не найдена!', 'error');
            return;
        }

        this.editingWorkoutId = workoutId;
        this.currentWorkoutData = {
            name: workout.name,
            color: workout.color,
            duration: workout.duration,
            description: workout.description || '',
            exercises: workout.exercises.map(ex => ({
                id: ex.id,
                name: ex.name,
                category: ex.category,
                muscleGroups: ex.muscleGroups || [],
                restBetweenSets: ex.restBetweenSets || 60, // Загружаем отдых
                sets: ex.sets || [{ reps: 12, weight: 0, notes: '' }]
            }))
        };

        this.showWorkoutFormStage2();
    }

    showProfilePage(container) {
        container.innerHTML = `
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
        `;
    }

    updateNavigation(pageId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            }
        });
        window.location.hash = pageId;
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = item.dataset.page;
                if (pageId && pageId !== this.state.currentPage) {
                    this.loadPage(pageId);
                }
            });
        });

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
        this.saveState();
        this.updateSkinDisplay();
        if (amount > 0) {
            this.showNotification(`+${amount} скинтов ✨`, 'skins');
        }
        return this.state.totalSkins;
    }

    updateSkinDisplay() {
        document.querySelectorAll('.skin-counter span').forEach(element => {
            element.textContent = this.state.totalSkins;
        });
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'cozy' ? 'light' : 'cozy';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        this.saveState();
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

// Добавляем анимацию
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes dragAnimation {
        0% { transform: scale(1); }
        50% { transform: scale(0.98); }
        100% { transform: scale(1); }
    }
    
    /* Стили для скроллбара */
    #exerciseSelectionContainer::-webkit-scrollbar,
    #modalExerciseList::-webkit-scrollbar {
        width: 6px;
    }
    
    #exerciseSelectionContainer::-webkit-scrollbar-track,
    #modalExerciseList::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 3px;
    }
    
    #exerciseSelectionContainer::-webkit-scrollbar-thumb,
    #modalExerciseList::-webkit-scrollbar-thumb {
        background: var(--primary-light);
        border-radius: 3px;
    }
    
    /* Стили при наведении */
    button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    /* Плавные переходы */
    * {
        transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
    }
    
    /* Drag & Drop стили */
    .exercise-with-sets.dragging {
        animation: dragAnimation 0.3s ease infinite;
        opacity: 0.7;
    }
    
    .set-item.dragging {
        animation: dragAnimation 0.3s ease infinite;
        opacity: 0.7;
    }
    
    .drag-over {
        border: 2px dashed var(--primary) !important;
        background: rgba(6, 180, 143, 0.05) !important;
    }
    
    /* Стили для инпутов */
    input:focus, textarea:focus, select:focus {
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 3px rgba(6, 180, 143, 0.1) !important;
    }
    
    /* Стили для модального окна */
    .exercise-selection-modal {
        backdrop-filter: blur(5px);
    }
`;
document.head.appendChild(style);

