[file name]: workouts.js
[file content begin]
// Класс для управления тренировками
class WorkoutsManager {
    constructor() {
        this.exercises = [];
        this.workouts = [];
        this.selectedExercises = new Set();
        this.currentWorkout = null;
        
        console.log('WorkoutsManager инициализирован');
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderExercises();
        
        console.log('WorkoutsManager готов к работе');
    }

    loadData() {
        // Загрузка упражнений из localStorage
        const savedExercises = localStorage.getItem('workouts_exercises');
        if (savedExercises) {
            this.exercises = JSON.parse(savedExercises);
        } else {
            // Стандартный набор упражнений
            this.exercises = [
                { id: 1, name: 'Отжимания', category: 'Сила', description: 'Тренировка груди и рук' },
                { id: 2, name: 'Приседания', category: 'Ноги', description: 'Укрепление ног и ягодиц' },
                { id: 3, name: 'Планка', category: 'Кор', description: 'Укрепление мышц кора' },
                { id: 4, name: 'Бег', category: 'Кардио', description: 'Бег на свежем воздухе или дорожке' },
                { id: 5, name: 'Подтягивания', category: 'Сила', description: 'Тренировка спины и рук' },
                { id: 6, name: 'Скручивания', category: 'Пресс', description: 'Упражнение на пресс' }
            ];
        }

        // Загрузка тренировок
        const savedWorkouts = localStorage.getItem('workouts_sessions');
        if (savedWorkouts) {
            this.workouts = JSON.parse(savedWorkouts);
        }
    }

    saveData() {
        localStorage.setItem('workouts_exercises', JSON.stringify(this.exercises));
        localStorage.setItem('workouts_sessions', JSON.stringify(this.workouts));
    }

    setupEventListeners() {
        // Кнопка создания упражнения
        const createExerciseBtn = document.getElementById('createExerciseBtn');
        if (createExerciseBtn) {
            createExerciseBtn.addEventListener('click', () => {
                this.showCreateExerciseModal();
            });
        }

        // Кнопка создания тренировки
        const createWorkoutBtn = document.getElementById('createWorkoutBtn');
        if (createWorkoutBtn) {
            createWorkoutBtn.addEventListener('click', () => {
                this.createWorkout();
            });
        }

        // Кнопка сброса выбора
        const resetSelectionBtn = document.getElementById('resetSelectionBtn');
        if (resetSelectionBtn) {
            resetSelectionBtn.addEventListener('click', () => {
                this.selectedExercises.clear();
                this.updateExerciseSelection();
                this.updateWorkoutPreview();
            });
        }
    }

    showCreateExerciseModal() {
        const modalHTML = `
            <div class="modal-overlay" id="exerciseModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Создать новое упражнение</h3>
                        <button class="modal-close" onclick="workoutsManager.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="exerciseName">Название упражнения</label>
                            <input type="text" id="exerciseName" placeholder="Например: Берпи" class="modal-input">
                        </div>
                        <div class="form-group">
                            <label for="exerciseCategory">Категория</label>
                            <select id="exerciseCategory" class="modal-input">
                                <option value="Сила">Сила</option>
                                <option value="Кардио">Кардио</option>
                                <option value="Ноги">Ноги</option>
                                <option value="Руки">Руки</option>
                                <option value="Спина">Спина</option>
                                <option value="Пресс">Пресс</option>
                                <option value="Кор">Кор</option>
                                <option value="Растяжка">Растяжка</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="exerciseDescription">Описание (необязательно)</label>
                            <textarea id="exerciseDescription" placeholder="Опишите технику выполнения..." class="modal-input" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn cancel" onclick="workoutsManager.closeModal()">Отмена</button>
                        <button class="modal-btn submit" onclick="workoutsManager.addExercise()">Создать</button>
                    </div>
                </div>
            </div>
        `;

        // Удаляем существующий модальный окно
        const existingModal = document.getElementById('exerciseModal');
        if (existingModal) existingModal.remove();

        // Добавляем новое модальное окно
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeModal() {
        const modal = document.getElementById('exerciseModal');
        if (modal) modal.remove();
    }

    addExercise() {
        const nameInput = document.getElementById('exerciseName');
        const categoryInput = document.getElementById('exerciseCategory');
        const descriptionInput = document.getElementById('exerciseDescription');

        const name = nameInput.value.trim();
        const category = categoryInput.value;
        const description = descriptionInput.value.trim();

        if (!name) {
            this.showNotification('Введите название упражнения', 'error');
            return;
        }

        // Проверяем, нет ли уже такого упражнения
        const exists = this.exercises.some(ex => 
            ex.name.toLowerCase() === name.toLowerCase()
        );

        if (exists) {
            this.showNotification('Упражнение с таким названием уже существует', 'error');
            return;
        }

        // Создаем новое упражнение
        const newExercise = {
            id: Date.now(),
            name: name,
            category: category,
            description: description || 'Без описания',
            createdAt: new Date().toISOString()
        };

        this.exercises.push(newExercise);
        this.saveData();
        this.renderExercises();
        this.closeModal();

        this.showNotification(`Упражнение "${name}" создано!`, 'success');
    }

    renderExercises() {
        const exercisesGrid = document.getElementById('exercisesGrid');
        if (!exercisesGrid) return;

        if (this.exercises.length === 0) {
            exercisesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🏋️</div>
                    <div class="empty-text">Нет упражнений</div>
                    <div class="empty-subtext">Создайте первое упражнение</div>
                </div>
            `;
            return;
        }

        // Группируем упражнения по категориям
        const exercisesByCategory = {};
        this.exercises.forEach(exercise => {
            if (!exercisesByCategory[exercise.category]) {
                exercisesByCategory[exercise.category] = [];
            }
            exercisesByCategory[exercise.category].push(exercise);
        });

        let html = '';

        Object.entries(exercisesByCategory).forEach(([category, exercises]) => {
            html += `
                <div class="category-section">
                    <h3 class="category-title">${category}</h3>
                    <div class="exercises-list">
                        ${exercises.map(exercise => `
                            <div class="exercise-card ${this.selectedExercises.has(exercise.id) ? 'selected' : ''}" 
                                 onclick="workoutsManager.toggleExercise(${exercise.id})">
                                <div class="exercise-header">
                                    <div class="exercise-name">${exercise.name}</div>
                                    <div class="exercise-checkbox">
                                        ${this.selectedExercises.has(exercise.id) ? '✓' : '+'}
                                    </div>
                                </div>
                                <div class="exercise-description">${exercise.description}</div>
                                <div class="exercise-actions">
                                    <button class="exercise-delete" onclick="event.stopPropagation(); workoutsManager.deleteExercise(${exercise.id})">
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        exercisesGrid.innerHTML = html;
        this.updateWorkoutPreview();
    }

    toggleExercise(exerciseId) {
        if (this.selectedExercises.has(exerciseId)) {
            this.selectedExercises.delete(exerciseId);
        } else {
            this.selectedExercises.add(exerciseId);
        }
        
        this.updateExerciseSelection();
        this.updateWorkoutPreview();
    }

    updateExerciseSelection() {
        // Обновляем визуальное состояние всех карточек
        document.querySelectorAll('.exercise-card').forEach(card => {
            const exerciseId = parseInt(card.getAttribute('onclick').match(/\d+/)[0]);
            if (this.selectedExercises.has(exerciseId)) {
                card.classList.add('selected');
                card.querySelector('.exercise-checkbox').textContent = '✓';
            } else {
                card.classList.remove('selected');
                card.querySelector('.exercise-checkbox').textContent = '+';
            }
        });

        // Обновляем счетчик выбранных
        const selectedCount = document.getElementById('selectedCount');
        if (selectedCount) {
            selectedCount.textContent = this.selectedExercises.size;
        }
    }

    updateWorkoutPreview() {
        const workoutPreview = document.getElementById('workoutPreview');
        if (!workoutPreview) return;

        if (this.selectedExercises.size === 0) {
            workoutPreview.innerHTML = `
                <div class="preview-empty">
                    <div class="preview-icon">📋</div>
                    <div class="preview-text">Выберите упражнения для тренировки</div>
                </div>
            `;
            return;
        }

        const selectedExercisesList = Array.from(this.selectedExercises)
            .map(id => this.exercises.find(ex => ex.id === id))
            .filter(Boolean);

        let html = `
            <div class="preview-header">
                <h4>Тренировка на сегодня</h4>
                <div class="preview-count">${selectedExercisesList.length} упражнений</div>
            </div>
            <div class="preview-exercises">
        `;

        selectedExercisesList.forEach(exercise => {
            html += `
                <div class="preview-exercise">
                    <div class="preview-exercise-name">${exercise.name}</div>
                    <div class="preview-exercise-category">${exercise.category}</div>
                </div>
            `;
        });

        html += '</div>';
        workoutPreview.innerHTML = html;
    }

    createWorkout() {
        if (this.selectedExercises.size === 0) {
            this.showNotification('Выберите хотя бы одно упражнение', 'error');
            return;
        }

        const selectedExercises = Array.from(this.selectedExercises)
            .map(id => this.exercises.find(ex => ex.id === id))
            .filter(Boolean);

        const newWorkout = {
            id: Date.now(),
            date: new Date().toISOString(),
            exercises: selectedExercises,
            completed: false,
            duration: 0,
            notes: ''
        };

        this.workouts.push(newWorkout);
        this.saveData();

        // Сбрасываем выбор
        this.selectedExercises.clear();
        this.updateExerciseSelection();
        this.updateWorkoutPreview();

        // Добавляем скинты за создание тренировки
        if (window.healthFlow) {
            const skinsEarned = Math.min(selectedExercises.length, 5); // Макс 5 скинтов
            window.healthFlow.addSkins(skinsEarned, 'workout_created');
        }

        this.showNotification(`Тренировка создана! +${selectedExercises.length} упражнений`, 'success');
    }

    deleteExercise(exerciseId) {
        if (!confirm('Удалить это упражнение? Это действие нельзя отменить.')) {
            return;
        }

        // Удаляем из выбранных
        this.selectedExercises.delete(exerciseId);

        // Удаляем из списка упражнений
        this.exercises = this.exercises.filter(ex => ex.id !== exerciseId);
        
        // Удаляем из тренировок
        this.workouts.forEach(workout => {
            workout.exercises = workout.exercises.filter(ex => ex.id !== exerciseId);
        });
        this.workouts = this.workouts.filter(workout => workout.exercises.length > 0);

        this.saveData();
        this.renderExercises();
        this.updateWorkoutPreview();

        this.showNotification('Упражнение удалено', 'success');
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

// Экспортируем инициализацию модуля
let workoutsManagerInstance = null;

export async function init(app) {
    console.log('Инициализация модуля тренировок...');
    
    // Загружаем модуль тренировок
    await loadWorkoutsModule();
    
    // Инициализируем менеджер тренировок
    workoutsManagerInstance = new WorkoutsManager();
    workoutsManagerInstance.init();
    
    console.log('Модуль тренировок готов');
    return workoutsManagerInstance;
}

async function loadWorkoutsModule() {
    const container = document.getElementById('currentPage');
    if (!container) {
        console.error('Контейнер currentPage не найден');
        return;
    }
    
    // HTML для страницы тренировок
    const workoutsHTML = `
        <header class="page-header">
            <h1 class="page-title">Тренировки</h1>
            <div class="page-controls">
                <div class="skin-counter">
                    ✨ <span id="skinCount">${window.healthFlow ? window.healthFlow.state.totalSkins : 0}</span>
                </div>
                <button class="theme-toggle" onclick="window.healthFlow.toggleTheme()">
                    <div class="theme-icon">🌙</div>
                </button>
            </div>
        </header>
        
        <div class="content-container">
            <!-- Основной контент тренировок -->
            <div class="workouts-content">
                <!-- Заголовок и кнопка создания -->
                <div class="workouts-header">
                    <h2>Упражнения</h2>
                    <button class="create-exercise-btn" id="createExerciseBtn">
                        <span class="btn-icon">+</span>
                        Новое упражнение
                    </button>
                </div>

                <!-- Сетка упражнений -->
                <div class="exercises-grid" id="exercisesGrid">
                    <!-- Упражнения будут загружены через JS -->
                </div>

                <!-- Панель создания тренировки -->
                <div class="workout-creator">
                    <div class="creator-header">
                        <h3>Создать тренировку</h3>
                        <div class="selection-info">
                            Выбрано: <span id="selectedCount">0</span>
                            <button class="reset-btn" id="resetSelectionBtn">Сбросить</button>
                        </div>
                    </div>
                    
                    <div class="workout-preview" id="workoutPreview">
                        <!-- Предпросмотр тренировки -->
                    </div>
                    
                    <button class="create-workout-btn" id="createWorkoutBtn">
                        Создать тренировку
                    </button>
                </div>
            </div>
        </div>

        <!-- Стили для модуля тренировок -->
        <style>
            .workouts-content {
                animation: fadeIn 0.5s ease-out;
            }

            .workouts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }

            .workouts-header h2 {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-primary);
            }

            .create-exercise-btn {
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                color: white;
                border: none;
                border-radius: var(--radius-sm);
                padding: 12px 20px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: var(--transition);
            }

            .create-exercise-btn:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow);
            }

            .btn-icon {
                font-weight: 800;
                font-size: 1.1rem;
            }

            /* Сетка упражнений */
            .exercises-grid {
                margin-bottom: 30px;
            }

            .category-section {
                margin-bottom: 30px;
            }

            .category-title {
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--primary-dark);
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 2px solid var(--primary-light);
            }

            .exercises-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 16px;
            }

            .exercise-card {
                background: var(--surface);
                border: 2px solid var(--border-light);
                border-radius: var(--radius);
                padding: 20px;
                cursor: pointer;
                transition: var(--transition);
                position: relative;
            }

            .exercise-card:hover {
                transform: translateY(-4px);
                border-color: var(--primary-light);
                box-shadow: var(--shadow);
            }

            .exercise-card.selected {
                border-color: var(--primary);
                background: linear-gradient(135deg, var(--surface), rgba(6, 180, 143, 0.05));
            }

            .exercise-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .exercise-name {
                font-size: 1.1rem;
                font-weight: 700;
                color: var(--text-primary);
            }

            .exercise-checkbox {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: var(--primary-light);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 1rem;
            }

            .exercise-card.selected .exercise-checkbox {
                background: var(--primary);
            }

            .exercise-description {
                font-size: 0.9rem;
                color: var(--text-secondary);
                line-height: 1.5;
                margin-bottom: 16px;
                min-height: 40px;
            }

            .exercise-actions {
                display: flex;
                justify-content: flex-end;
            }

            .exercise-delete {
                background: transparent;
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 6px 12px;
                font-size: 0.8rem;
                color: var(--text-secondary);
                cursor: pointer;
                transition: var(--transition);
            }

            .exercise-delete:hover {
                background: rgba(255, 107, 107, 0.1);
                border-color: var(--remove);
                color: var(--remove);
            }

            /* Создание тренировки */
            .workout-creator {
                background: var(--surface);
                border: 2px solid var(--border-light);
                border-radius: var(--radius);
                padding: 24px;
                margin-top: 30px;
                box-shadow: var(--shadow-light);
            }

            .creator-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .creator-header h3 {
                font-size: 1.2rem;
                font-weight: 700;
                color: var(--text-primary);
            }

            .selection-info {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.95rem;
                color: var(--text-secondary);
            }

            .selection-info span {
                font-weight: 800;
                color: var(--primary);
                font-size: 1.1rem;
            }

            .reset-btn {
                background: transparent;
                border: 1px solid var(--border);
                border-radius: var(--radius-sm);
                padding: 6px 12px;
                font-size: 0.85rem;
                color: var(--text-secondary);
                cursor: pointer;
                transition: var(--transition);
            }

            .reset-btn:hover {
                background: rgba(6, 180, 143, 0.1);
                border-color: var(--primary);
                color: var(--primary);
            }

            .workout-preview {
                background: rgba(6, 180, 143, 0.05);
                border: 1px dashed var(--primary-light);
                border-radius: var(--radius-sm);
                padding: 20px;
                margin-bottom: 20px;
                min-height: 120px;
            }

            .preview-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--text-light);
            }

            .preview-icon {
                font-size: 2rem;
                margin-bottom: 12px;
                opacity: 0.3;
            }

            .preview-text {
                font-size: 0.95rem;
                text-align: center;
            }

            .preview-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--border-light);
            }

            .preview-header h4 {
                font-size: 1rem;
                font-weight: 700;
                color: var(--text-primary);
            }

            .preview-count {
                background: var(--primary-light);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
            }

            .preview-exercises {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .preview-exercise {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: var(--surface);
                border-radius: var(--radius-sm);
                border: 1px solid var(--border-light);
            }

            .preview-exercise-name {
                font-weight: 600;
                color: var(--text-primary);
            }

            .preview-exercise-category {
                font-size: 0.8rem;
                color: var(--text-secondary);
                background: rgba(6, 180, 143, 0.1);
                padding: 4px 10px;
                border-radius: 12px;
            }

            .create-workout-btn {
                width: 100%;
                background: linear-gradient(135deg, var(--accent), var(--accent-dark));
                color: white;
                border: none;
                border-radius: var(--radius-sm);
                padding: 16px;
                font-size: 1rem;
                font-weight: 700;
                cursor: pointer;
                transition: var(--transition);
            }

            .create-workout-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(255, 154, 118, 0.3);
            }

            /* Модальное окно */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease-out;
            }

            .modal-content {
                background: var(--surface);
                border-radius: var(--radius-lg);
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease-out;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px 24px 16px;
                border-bottom: 1px solid var(--border-light);
            }

            .modal-header h3 {
                font-size: 1.3rem;
                font-weight: 700;
                color: var(--text-primary);
            }

            .modal-close {
                background: transparent;
                border: none;
                font-size: 2rem;
                color: var(--text-secondary);
                cursor: pointer;
                line-height: 1;
                padding: 0;
                width: 32px;
                height: 32px;
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

            .modal-input {
                width: 100%;
                background: var(--surface);
                border: 2px solid var(--border-light);
                border-radius: var(--radius-sm);
                padding: 14px 16px;
                font-size: 1rem;
                color: var(--text-primary);
                outline: none;
                font-family: inherit;
                transition: var(--transition);
            }

            .modal-input:focus {
                border-color: var(--primary);
                box-shadow: 0 0 0 3px rgba(6, 180, 143, 0.1);
            }

            textarea.modal-input {
                resize: vertical;
                min-height: 80px;
            }

            .modal-footer {
                display: flex;
                gap: 12px;
                padding: 16px 24px 24px;
                border-top: 1px solid var(--border-light);
            }

            .modal-btn {
                flex: 1;
                border: none;
                border-radius: var(--radius-sm);
                padding: 14px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: var(--transition);
            }

            .modal-btn.cancel {
                background: var(--surface);
                border: 2px solid var(--border);
                color: var(--text-secondary);
            }

            .modal-btn.cancel:hover {
                background: var(--border-light);
            }

            .modal-btn.submit {
                background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                color: white;
            }

            .modal-btn.submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(6, 180, 143, 0.3);
            }

            /* Состояние пустоты */
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: var(--text-light);
            }

            .empty-icon {
                font-size: 3rem;
                margin-bottom: 16px;
                opacity: 0.3;
            }

            .empty-text {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--text-secondary);
            }

            .empty-subtext {
                font-size: 0.9rem;
            }

            /* Анимации */
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Адаптивность */
            @media (max-width: 500px) {
                .exercises-list {
                    grid-template-columns: 1fr;
                }

                .workouts-header {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 16px;
                }

                .create-exercise-btn {
                    width: 100%;
                    justify-content: center;
                }

                .creator-header {
                    flex-direction: column;
                    align-items: stretch;
                    gap: 12px;
                }

                .selection-info {
                    justify-content: space-between;
                }

                .modal-content {
                    width: 95%;
                }

                .modal-footer {
                    flex-direction: column;
                }
            }
        </style>
    `;

    // Очищаем и добавляем контент
    container.innerHTML = workoutsHTML;
    
    // Обновляем счетчик скинтов
    const skinCountElement = document.getElementById('skinCount');
    if (skinCountElement && window.healthFlow) {
        skinCountElement.textContent = window.healthFlow.state.totalSkins;
    }
    
    console.log('Модуль тренировок загружен');
}

// Экспортируем функции для глобального использования
export function getWorkoutsManager() {
    return workoutsManagerInstance;
}

// Делаем экземпляр глобально доступным
window.workoutsManager = workoutsManagerInstance;
[file content end]