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
    
    // ПРОСТАЯ СТРАНИЦА ТРЕНИРОВОК
    // ОБНОВЛЕННАЯ СТРАНИЦА ТРЕНИРОВОК С РАЗДЕЛАМИ
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

                // Обновляем стили
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

                // Обновляем стили
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
    showExercisesSection() {
        const contentContainer = document.getElementById('workoutsContent');
        if (!contentContainer) return;

        contentContainer.innerHTML = `
            <!-- Кнопка создания упражнения -->
            <button id="createExerciseBtn" style="
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                border: none;
                border-radius: 12px;
                padding: 16px;
                color: white;
                font-weight: 700;
                font-size: 16px;
                cursor: pointer;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                width: 100%;
                transition: all 0.2s ease;
            ">
                <span style="font-size: 20px;">+</span>
                Новое упражнение
            </button>
            
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
                this.createExercise();
            });
        }

        // Загружаем упражнения
        this.loadExercises();
    }




    // Показываем раздел тренировок
    showWorkoutsSection() {
        const contentContainer = document.getElementById('workoutsContent');
        if (!contentContainer) return;

        contentContainer.innerHTML = `
            <!-- Кнопка создания тренировки -->
            <button id="createWorkoutBtn" style="
                background: linear-gradient(135deg, #FF9A76, #E86A50);
                border: none;
                border-radius: 12px;
                padding: 16px;
                color: white;
                font-weight: 700;
                font-size: 16px;
                cursor: pointer;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                width: 100%;
                transition: all 0.2s ease;
            ">
                <span style="font-size: 20px;">🔥</span>
                Новая тренировка
            </button>
            
            <!-- Список тренировок -->
            <div id="workoutsList" style="
                background: var(--surface);
                border-radius: 12px;
                border: 2px solid var(--border-light);
                min-height: 200px;
                padding: 20px;
            ">
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 32px; opacity: 0.3; margin-bottom: 10px;">🏋️</div>
                    <div style="color: var(--text-secondary); font-size: 16px;">Тренировок пока нет</div>
                    <div style="color: var(--text-light); font-size: 14px; margin-top: 5px;">Создайте первую тренировку!</div>
                </div>
            </div>
        `;

        // Инициализируем кнопку создания тренировки
        const createBtn = document.getElementById('createWorkoutBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.createWorkout();
            });
        }

        // Загружаем тренировки
        this.loadWorkouts();
    }




    
    initializeWorkouts() {
        console.log('Инициализируем тренировки...');
        
        const createBtn = document.getElementById('createExerciseBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.createExercise();
            });
        }
        
        this.loadExercises();
    }
    
    createExercise() {
        const name = prompt('Введите название упражнения:');
        if (!name || !name.trim()) return;
        
        const category = prompt('Выберите категорию (Кардио, Силовые, Растяжка, Йога, Другое):', 'Кардио');
        const description = prompt('Описание (необязательно):', '');
        
        // Сохраняем упражнение
        let exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
        exercises.push({
            id: Date.now(),
            name: name.trim(),
            category: category || 'Кардио',
            description: description || '',
            difficulty: 'Средний',
            createdAt: new Date().toISOString()
        });
        
        localStorage.setItem('healthflow_exercises', JSON.stringify(exercises));
        
        this.showNotification(`Упражнение "${name}" создано!`, 'success');
        this.loadExercises();
    }
    
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
        
        let html = '<div style="margin-bottom: 15px; font-weight: 700; color: var(--text-primary);">Мои упражнения:</div>';
        
        exercises.forEach((exercise, index) => {
            html += `
                <div style="
                    background: var(--surface);
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 10px;
                    opacity: 0;
                    animation: fadeIn 0.3s ease-out ${index * 0.1}s forwards;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 17px;">
                            ${exercise.name}
                        </div>
                        <button onclick="window.healthFlow.deleteExercise(${exercise.id})" style="
                            background: rgba(255, 107, 107, 0.1);
                            border: none;
                            color: var(--remove);
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 14px;
                            cursor: pointer;
                        ">
                            Удалить
                        </button>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 8px;">
                        <span style="
                            background: rgba(6, 180, 143, 0.1);
                            color: var(--primary);
                            padding: 3px 8px;
                            border-radius: 10px;
                            font-size: 12px;
                            font-weight: 600;
                        ">
                            ${exercise.category}
                        </span>
                        
                        <span style="
                            background: rgba(255, 154, 118, 0.1);
                            color: var(--accent);
                            padding: 3px 8px;
                            border-radius: 10px;
                            font-size: 12px;
                            font-weight: 600;
                        ">
                            Средний
                        </span>
                    </div>
                    
                    ${exercise.description ? `
                        <div style="
                            color: var(--text-secondary);
                            font-size: 14px;
                            line-height: 1.4;
                            padding: 8px;
                            background: rgba(0, 0, 0, 0.02);
                            border-radius: 8px;
                            margin-top: 5px;
                        ">
                            ${exercise.description}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    deleteExercise(id) {
        if (!confirm('Удалить это упражнение?')) return;
        
        let exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
        exercises = exercises.filter(ex => ex.id !== id);
        localStorage.setItem('healthflow_exercises', JSON.stringify(exercises));
        
        this.showNotification('Упражнение удалено', 'success');
        this.loadExercises();
    }


    // Создание тренировки
    createWorkout() {
        const name = prompt('Введите название тренировки:');
        if (!name || !name.trim()) return;

        const description = prompt('Описание тренировки (необязательно):', '');

        // Загружаем упражнения для выбора
        const exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');

        if (exercises.length === 0) {
            alert('Сначала создайте хотя бы одно упражнение!');
            return;
        }

        // Простой выбор упражнений через prompt
        let exercisesText = 'Выберите упражнения (введите номера через запятую):\\n';
        exercises.forEach((ex, index) => {
            exercisesText += `${index + 1}. ${ex.name} (${ex.category})\\n`;
        });

        const selected = prompt(exercisesText, '1');

        // Сохраняем тренировку
        let workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        const workout = {
            id: Date.now(),
            name: name.trim(),
            description: description || '',
            exercises: this.parseSelectedExercises(selected, exercises),
            duration: 30, // минут по умолчанию
            difficulty: 'Средний',
            createdAt: new Date().toISOString(),
            lastCompleted: null
        };

        workouts.push(workout);
        localStorage.setItem('healthflow_workouts', JSON.stringify(workouts));

        this.showNotification(`Тренировка "${name}" создана!`, 'success');
        this.loadWorkouts();
    }

    // Парсинг выбранных упражнений
    parseSelectedExercises(selected, exercises) {
        if (!selected) return [];

        const indices = selected.split(',').map(num => parseInt(num.trim()) - 1).filter(num => !isNaN(num) && num >= 0 && num < exercises.length);

        return indices.map(i => ({
            id: exercises[i].id,
            name: exercises[i].name,
            category: exercises[i].category
        }));
    }




    // Загрузка списка тренировок
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

        let html = '<div style="margin-bottom: 15px; font-weight: 700; color: var(--text-primary);">Мои тренировки:</div>';

        workouts.forEach((workout, index) => {
            const completed = workout.lastCompleted ? new Date(workout.lastCompleted).toLocaleDateString() : 'Никогда';

            html += `
                <div style="
                    background: var(--surface);
                    border: 2px solid ${workout.lastCompleted ? 'var(--primary-light)' : 'var(--border-light)'};
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 12px;
                    opacity: 0;
                    animation: fadeIn 0.3s ease-out ${index * 0.1}s forwards;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 17px;">
                            ${workout.name}
                        </div>
                        <button onclick="window.healthFlow.startWorkout(${workout.id})" style="
                            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                            border: none;
                            color: white;
                            padding: 6px 14px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                        ">
                            Начать
                        </button>
                    </div>
                    
                    ${workout.description ? `
                        <div style="
                            color: var(--text-secondary);
                            font-size: 14px;
                            line-height: 1.4;
                            margin-bottom: 10px;
                            padding: 8px;
                            background: rgba(0, 0, 0, 0.02);
                            border-radius: 6px;
                        ">
                            ${workout.description}
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                        <span style="
                            background: rgba(255, 154, 118, 0.1);
                            color: var(--accent);
                            padding: 3px 8px;
                            border-radius: 10px;
                            font-size: 12px;
                            font-weight: 600;
                        ">
                            ${workout.difficulty}
                        </span>
                        
                        <span style="
                            background: rgba(6, 180, 143, 0.1);
                            color: var(--primary);
                            padding: 3px 8px;
                            border-radius: 10px;
                            font-size: 12px;
                            font-weight: 600;
                        ">
                            ${workout.duration} мин
                        </span>
                        
                        <span style="
                            background: rgba(108, 92, 231, 0.1);
                            color: #6C5CE7;
                            padding: 3px 8px;
                            border-radius: 10px;
                            font-size: 12px;
                            font-weight: 600;
                        ">
                            ${workout.exercises.length} упр.
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border-light);">
                        <div style="font-size: 12px; color: var(--text-light);">
                            Последнее: ${completed}
                        </div>
                        <button onclick="window.healthFlow.deleteWorkout(${workout.id})" style="
                            background: transparent;
                            border: none;
                            color: var(--text-secondary);
                            font-size: 13px;
                            cursor: pointer;
                            padding: 4px 8px;
                            border-radius: 6px;
                        ">
                            Удалить
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }






    // Начать тренировку
    startWorkout(workoutId) {
        const workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        const workout = workouts.find(w => w.id === workoutId);

        if (!workout) {
            alert('Тренировка не найдена!');
            return;
        }

        if (confirm(`Начать тренировку "${workout.name}"?`)) {
            // Обновляем дату последнего выполнения
            workout.lastCompleted = new Date().toISOString();
            localStorage.setItem('healthflow_workouts', JSON.stringify(workouts));

            // Добавляем в историю
            this.addToHistory(workout);

            // Добавляем скинты
            const skinsEarned = workout.exercises.length * 2; // 2 скинта за каждое упражнение
            this.addSkins(skinsEarned, 'workout');

            this.showNotification(`Тренировка "${workout.name}" завершена! +${skinsEarned}✨`, 'skins');

            // Обновляем отображение
            this.loadWorkouts();
            this.loadWorkoutsHistory();
        }
    }

    // Добавить в историю
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

        // Ограничиваем историю 50 записями
        if (history.length > 50) {
            history = history.slice(0, 50);
        }

        localStorage.setItem('healthflow_workout_history', JSON.stringify(history));
    }

    // Загрузить историю тренировок
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

    // Удалить тренировку
    deleteWorkout(workoutId) {
        if (!confirm('Удалить эту тренировку?')) return;

        let workouts = JSON.parse(localStorage.getItem('healthflow_workouts') || '[]');
        workouts = workouts.filter(w => w.id !== workoutId);
        localStorage.setItem('healthflow_workouts', JSON.stringify(workouts));

        this.showNotification('Тренировка удалена', 'success');
        this.loadWorkouts();
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

// Добавляем анимацию
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
