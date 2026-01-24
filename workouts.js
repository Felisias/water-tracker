[file name]: workouts.js
// Класс для управления тренировками
class WorkoutsManager {
    constructor() {
        this.exercises = [];
        this.selectedExercises = new Set();
        
        console.log('WorkoutsManager инициализирован');
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderExercises();
        this.updateSkinCount();
        
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
            this.saveExercises();
        }
    }

    saveExercises() {
        localStorage.setItem('workouts_exercises', JSON.stringify(this.exercises));
    }

    updateSkinCount() {
        const skinCount = document.getElementById('workoutSkinCount');
        if (skinCount && window.healthFlow) {
            skinCount.textContent = window.healthFlow.state.totalSkins;
        }
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
                        <button class="modal-close" id="modalCloseBtn">×</button>
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
                        <button class="modal-btn cancel" id="modalCancelBtn">Отмена</button>
                        <button class="modal-btn submit" id="modalSubmitBtn">Создать</button>
                    </div>
                </div>
            </div>
        `;

        // Удаляем существующий модальный окно
        const existingModal = document.getElementById('exerciseModal');
        if (existingModal) existingModal.remove();

        // Добавляем новое модальное окно
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Настраиваем обработчики событий
        document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('modalCancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('modalSubmitBtn').addEventListener('click', () => this.addExercise());
        
        // Закрытие по клику на overlay
        document.getElementById('exerciseModal').addEventListener('click', (e) => {
            if (e.target.id === 'exerciseModal') this.closeModal();
        });
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
        this.saveExercises();
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
                            <div class="exercise-card" data-id="${exercise.id}">
                                <div class="exercise-header">
                                    <div class="exercise-name">${exercise.name}</div>
                                    <div class="exercise-checkbox">
                                        ${this.selectedExercises.has(exercise.id) ? '✓' : '+'}
                                    </div>
                                </div>
                                <div class="exercise-description">${exercise.description}</div>
                                <div class="exercise-actions">
                                    <button class="exercise-delete" data-id="${exercise.id}">
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
        
        // Добавляем обработчики событий для новых элементов
        this.addExerciseEventListeners();
        this.updateWorkoutPreview();
    }

    addExerciseEventListeners() {
        // Обработчики для карточек упражнений
        document.querySelectorAll('.exercise-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Не срабатывает при клике на кнопку удаления
                if (!e.target.classList.contains('exercise-delete')) {
                    const exerciseId = parseInt(card.getAttribute('data-id'));
                    this.toggleExercise(exerciseId);
                }
            });
        });

        // Обработчики для кнопок удаления
        document.querySelectorAll('.exercise-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const exerciseId = parseInt(button.getAttribute('data-id'));
                this.deleteExercise(exerciseId);
            });
        });
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
            const exerciseId = parseInt(card.getAttribute('data-id'));
            const checkbox = card.querySelector('.exercise-checkbox');
            
            if (this.selectedExercises.has(exerciseId)) {
                card.classList.add('selected');
                if (checkbox) checkbox.textContent = '✓';
            } else {
                card.classList.remove('selected');
                if (checkbox) checkbox.textContent = '+';
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

        // Добавляем скинты за создание тренировки
        if (window.healthFlow) {
            const skinsEarned = Math.min(selectedExercises.length, 5); // Макс 5 скинтов
            window.healthFlow.addSkins(skinsEarned, 'workout_created');
            this.updateSkinCount();
        }

        // Сбрасываем выбор
        this.selectedExercises.clear();
        this.updateExerciseSelection();
        this.updateWorkoutPreview();

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
        
        this.saveExercises();
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

// Создаем глобальный экземпляр
window.workoutsManager = new WorkoutsManager();

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (window.workoutsManager) {
        window.workoutsManager.init();
    }
});
