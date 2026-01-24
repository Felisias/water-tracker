// Модуль упражнений для тренировок
class ExercisesManager {
    constructor() {
        this.exercises = [];
        this.categories = [
            'Кардио',
            'Силовые',
            'Растяжка',
            'Йога',
            'Другое'
        ];
        this.loadExercises();
    }
    
    loadExercises() {
        const saved = localStorage.getItem('healthflow_exercises');
        if (saved) {
            this.exercises = JSON.parse(saved);
        }
    }
    
    saveExercises() {
        localStorage.setItem('healthflow_exercises', JSON.stringify(this.exercises));
    }
    
    createExercise(name, category, description = '', difficulty = 'Средний') {
        if (!name.trim()) {
            this.showNotification('Введите название упражнения', 'error');
            return null;
        }
        
        const exercise = {
            id: Date.now(),
            name: name.trim(),
            category: category || this.categories[0],
            description: description.trim(),
            difficulty: difficulty,
            createdAt: new Date().toISOString(),
            isFavorite: false
        };
        
        this.exercises.push(exercise);
        this.saveExercises();
        this.showNotification(`Упражнение "${name}" создано!`, 'success');
        
        return exercise;
    }
    
    getExercisesByCategory(category) {
        if (category === 'Все') {
            return this.exercises;
        }
        return this.exercises.filter(ex => ex.category === category);
    }
    
    deleteExercise(id) {
        const index = this.exercises.findIndex(ex => ex.id === id);
        if (index !== -1) {
            this.exercises.splice(index, 1);
            this.saveExercises();
            return true;
        }
        return false;
    }
    
    toggleFavorite(id) {
        const exercise = this.exercises.find(ex => ex.id === id);
        if (exercise) {
            exercise.isFavorite = !exercise.isFavorite;
            this.saveExercises();
            return exercise.isFavorite;
        }
        return false;
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
    
    // Инициализация UI
    initUI() {
        this.renderExercises();
        this.setupEventListeners();
    }
    
    renderExercises() {
        const container = document.getElementById('exercisesContainer');
        if (!container) return;
        
        if (this.exercises.length === 0) {
            container.innerHTML = `
                <div class="empty-exercises">
                    <div class="empty-icon">🏋️</div>
                    <div class="empty-text">Упражнений пока нет</div>
                    <div class="empty-subtext">Создайте первое упражнение!</div>
                </div>
            `;
            return;
        }
        
        const grouped = {};
        this.exercises.forEach(exercise => {
            if (!grouped[exercise.category]) {
                grouped[exercise.category] = [];
            }
            grouped[exercise.category].push(exercise);
        });
        
        let html = '';
        
        Object.keys(grouped).forEach(category => {
            html += `
                <div class="category-section">
                    <h3 class="category-title">${category}</h3>
                    <div class="exercises-list">
                        ${grouped[category].map(exercise => `
                            <div class="exercise-card" data-id="${exercise.id}">
                                <div class="exercise-header">
                                    <div class="exercise-name">${exercise.name}</div>
                                    <button class="favorite-btn ${exercise.isFavorite ? 'active' : ''}" 
                                            data-id="${exercise.id}" title="Добавить в избранное">
                                        ${exercise.isFavorite ? '★' : '☆'}
                                    </button>
                                </div>
                                ${exercise.description ? `
                                    <div class="exercise-description">${exercise.description}</div>
                                ` : ''}
                                <div class="exercise-footer">
                                    <span class="difficulty-badge ${exercise.difficulty.toLowerCase()}">
                                        ${exercise.difficulty}
                                    </span>
                                    <button class="delete-exercise" data-id="${exercise.id}">Удалить</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    setupEventListeners() {
        // Кнопка создания упражнения
        const createBtn = document.getElementById('createExerciseBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateModal();
            });
        }
        
        // Обработчики для динамически созданных элементов
        document.addEventListener('click', (e) => {
            // Удаление упражнения
            if (e.target.classList.contains('delete-exercise')) {
                const id = parseInt(e.target.dataset.id);
                if (confirm('Удалить это упражнение?')) {
                    if (this.deleteExercise(id)) {
                        this.showNotification('Упражнение удалено', 'success');
                        this.renderExercises();
                    }
                }
            }
            
            // Добавление в избранное
            if (e.target.classList.contains('favorite-btn')) {
                const id = parseInt(e.target.dataset.id);
                const isFavorite = this.toggleFavorite(id);
                e.target.textContent = isFavorite ? '★' : '☆';
                e.target.classList.toggle('active', isFavorite);
                this.showNotification(isFavorite ? 'Добавлено в избранное' : 'Убрано из избранного', 'success');
            }
        });
    }
    
    showCreateModal() {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'exercise-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Создать упражнение</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="exerciseName">Название</label>
                        <input type="text" id="exerciseName" placeholder="Например: Приседания" class="modal-input">
                    </div>
                    <div class="form-group">
                        <label for="exerciseCategory">Категория</label>
                        <select id="exerciseCategory" class="modal-select">
                            ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="exerciseDifficulty">Сложность</label>
                        <select id="exerciseDifficulty" class="modal-select">
                            <option value="Низкий">Низкий</option>
                            <option value="Средний" selected>Средний</option>
                            <option value="Высокий">Высокий</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="exerciseDescription">Описание (необязательно)</label>
                        <textarea id="exerciseDescription" 
                                  placeholder="Описание техники выполнения..." 
                                  class="modal-textarea" 
                                  rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel">Отмена</button>
                    <button class="modal-btn create">Создать</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики модального окна
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('.cancel');
        const createBtn = modal.querySelector('.create');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        createBtn.addEventListener('click', () => {
            const name = document.getElementById('exerciseName').value;
            const category = document.getElementById('exerciseCategory').value;
            const difficulty = document.getElementById('exerciseDifficulty').value;
            const description = document.getElementById('exerciseDescription').value;
            
            const exercise = this.createExercise(name, category, description, difficulty);
            if (exercise) {
                closeModal();
                this.renderExercises();
            }
        });
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Фокус на поле ввода
        setTimeout(() => {
            document.getElementById('exerciseName').focus();
        }, 100);
    }
}

// Экспортируем модуль
let exercisesManager = null;

export async function initExercises() {
    console.log('Инициализация модуля упражнений...');
    
    exercisesManager = new ExercisesManager();
    
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    
    exercisesManager.initUI();
    
    console.log('Модуль упражнений готов');
    return exercisesManager;
}