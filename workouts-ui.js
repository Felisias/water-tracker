// workouts-ui.js - UI для модуля тренировок
import { exerciseManager } from './exercises.js';
import { workoutManager } from './workouts.js';

class WorkoutsUI {
    constructor() {
        this.currentCategory = 'all';
    }
    
    async init() {
        console.log('🎨 Инициализация UI тренировок...');
        
        try {
            // Ожидаем инициализации менеджеров
            await exerciseManager.init();
            await workoutManager.init();
            
            // Загружаем данные
            await this.loadData();
            
            // Рендерим UI
            this.render();
            
            // Настраиваем события
            this.setupEventListeners();
            
            console.log('✅ UI тренировок инициализирован');
        } catch (error) {
            console.error('❌ Ошибка инициализации UI тренировок:', error);
        }
    }
    
    async loadData() {
        // Загружаем тренировки и упражнения
        await workoutManager.loadWorkouts();
        await exerciseManager.loadExercises();
    }
    
    render() {
        this.renderHeader();
        this.renderQuickStart();
        this.renderWorkouts();
        this.renderExercises();
        this.renderCategories();
        this.renderStats();
    }
    
    renderHeader() {
        const header = document.querySelector('.page-header');
        if (!header) return;
        
        // Обновляем счётчик скинтов
        const skinCount = document.getElementById('workoutsSkinCount');
        if (skinCount && window.HealthFlow) {
            skinCount.textContent = window.HealthFlow.state.totalSkins;
        }
        
        // Настраиваем кнопку темы
        const themeToggle = document.getElementById('workoutsThemeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                if (window.HealthFlow) {
                    window.HealthFlow.toggleTheme();
                }
            });
        }
    }
    
    renderQuickStart() {
        const quickStartGrid = document.querySelector('.quick-start-grid');
        if (!quickStartGrid) return;
        
        // Убедимся, что кнопки есть
        const startQuickBtn = document.getElementById('startQuickWorkout');
        if (startQuickBtn) {
            startQuickBtn.addEventListener('click', () => {
                this.startQuickWorkout();
            });
        }
    }
    
    renderWorkouts() {
        const workoutsList = document.getElementById('workoutsList');
        if (!workoutsList) {
            console.error('Элемент workoutsList не найден');
            return;
        }
        
        console.log(`Рендерим ${workoutManager.workouts.length} тренировок`);
        
        if (workoutManager.workouts.length === 0) {
            workoutsList.innerHTML = this.getEmptyWorkoutsHTML();
            this.setupCreateFirstWorkoutButton();
        } else {
            let html = '';
            workoutManager.workouts.forEach(workout => {
                html += this.createWorkoutCardHTML(workout);
            });
            workoutsList.innerHTML = html;
            this.setupWorkoutCardsEvents();
        }
    }
    
    getEmptyWorkoutsHTML() {
        return `
            <div class="empty-workouts">
                <div class="empty-icon">🏋️</div>
                <div class="empty-text">Создайте свою первую тренировку!</div>
                <button class="btn-primary" id="createFirstWorkoutBtn">
                    + Создать тренировку
                </button>
            </div>
        `;
    }
    
    setupCreateFirstWorkoutButton() {
        const createBtn = document.getElementById('createFirstWorkoutBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateWorkoutModal();
            });
        }
    }
    
    createWorkoutCardHTML(workout) {
        const exerciseCount = workout.exercises ? workout.exercises.length : 0;
        const duration = workout.estimatedDuration || '--';
        const difficulty = workout.difficulty || 'beginner';
        
        let difficultyText = '';
        let difficultyClass = '';
        
        switch(difficulty) {
            case 'beginner':
                difficultyText = 'Начинающий';
                difficultyClass = 'beginner';
                break;
            case 'intermediate':
                difficultyText = 'Средний';
                difficultyClass = 'intermediate';
                break;
            case 'advanced':
                difficultyText = 'Продвинутый';
                difficultyClass = 'advanced';
                break;
        }
        
        return `
            <div class="workout-card" data-workout-id="${workout.id}">
                <div class="workout-card-header">
                    <div class="workout-card-title">${workout.name || 'Без названия'}</div>
                    ${workout.isFavorite ? '<div class="favorite-star">⭐</div>' : ''}
                </div>
                <div class="workout-card-meta">
                    <span>${exerciseCount} упражнений</span>
                    <span>•</span>
                    <span>${duration} мин</span>
                    <span>•</span>
                    <span class="difficulty-badge ${difficultyClass}">
                        ${difficultyText}
                    </span>
                </div>
                ${workout.description ? `
                    <div class="workout-card-desc">
                        ${workout.description}
                    </div>
                ` : ''}
                <div class="workout-card-actions">
                    <button class="btn-small start" data-action="start" data-workout-id="${workout.id}">
                        Начать
                    </button>
                    <button class="btn-small edit" data-action="edit" data-workout-id="${workout.id}">
                        Редактировать
                    </button>
                </div>
            </div>
        `;
    }
    
    setupWorkoutCardsEvents() {
        // Кнопка "Начать"
        document.querySelectorAll('.workout-card [data-action="start"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const workoutId = parseInt(btn.dataset.workoutId);
                this.startWorkout(workoutId);
            });
        });
        
        // Кнопка "Редактировать"
        document.querySelectorAll('.workout-card [data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const workoutId = parseInt(btn.dataset.workoutId);
                this.editWorkout(workoutId);
            });
        });
        
        // Клик по карточке
        document.querySelectorAll('.workout-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('[data-action]')) {
                    const workoutId = parseInt(card.dataset.workoutId);
                    this.viewWorkoutDetails(workoutId);
                }
            });
        });
    }
    
    renderExercises() {
        const exercisesList = document.getElementById('exercisesList');
        if (!exercisesList) {
            console.error('Элемент exercisesList не найден');
            return;
        }
        
        console.log(`Рендерим ${exerciseManager.exercises.length} упражнений`);
        
        if (exerciseManager.exercises.length === 0) {
            exercisesList.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-secondary);">
                    Упражнения не найдены
                </div>
            `;
            return;
        }
        
        // Показываем первые 6 упражнений
        const exercisesToShow = exerciseManager.exercises.slice(0, 6);
        
        let html = '';
        exercisesToShow.forEach(exercise => {
            const categoryInfo = exerciseManager.getCategoryInfo(exercise.category);
            const color = categoryInfo?.color || '#06B48F';
            
            html += `
                <div class="exercise-card" data-exercise-id="${exercise.id}">
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
        
        exercisesList.innerHTML = html;
    }
    
    renderCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) {
            console.error('Элемент categoryFilter не найден');
            return;
        }
        
        const categories = exerciseManager.getAllCategories();
        
        let html = `
            <button class="category-btn active" data-category="all">
                <span>Все</span>
            </button>
        `;
        
        categories.forEach(category => {
            html += `
                <button class="category-btn" data-category="${category.id}">
                    <span>${category.emoji}</span>
                    <span>${category.name}</span>
                </button>
            `;
        });
        
        categoryFilter.innerHTML = html;
        
        // События для фильтра
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const category = btn.dataset.category;
                this.filterExercises(category);
            });
        });
    }
    
    filterExercises(categoryId) {
        const exercisesList = document.getElementById('exercisesList');
        if (!exercisesList) return;
        
        let filteredExercises;
        if (categoryId === 'all') {
            filteredExercises = exerciseManager.exercises.slice(0, 6);
        } else {
            filteredExercises = exerciseManager.getExercisesByCategory(categoryId).slice(0, 6);
        }
        
        if (filteredExercises.length === 0) {
            exercisesList.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-secondary);">
                    Упражнения не найдены
                </div>
            `;
            return;
        }
        
        let html = '';
        filteredExercises.forEach(exercise => {
            const categoryInfo = exerciseManager.getCategoryInfo(exercise.category);
            const color = categoryInfo?.color || '#06B48F';
            
            html += `
                <div class="exercise-card" data-exercise-id="${exercise.id}">
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
        
        exercisesList.innerHTML = html;
    }
    
    renderStats() {
        // Обновляем статистику
        const streakElement = document.getElementById('workoutStreak');
        const totalWorkoutsElement = document.getElementById('totalWorkouts');
        const skinsEarnedElement = document.getElementById('workoutSkinsEarned');
        
        if (streakElement) {
            // TODO: Реальная логика подсчёта
            streakElement.textContent = '0';
        }
        
        if (totalWorkoutsElement) {
            totalWorkoutsElement.textContent = workoutManager.workouts.length;
        }
        
        if (skinsEarnedElement) {
            // TODO: Реальная логика подсчёта
            skinsEarnedElement.textContent = '0';
        }
    }
    
    setupEventListeners() {
        // Кнопка создания тренировки
        const createWorkoutBtn = document.getElementById('createWorkoutBtn');
        if (createWorkoutBtn) {
            createWorkoutBtn.addEventListener('click', () => {
                this.showCreateWorkoutModal();
            });
        }
        
        // Кнопка быстрого старта
        const startQuickBtn = document.getElementById('startQuickWorkout');
        if (startQuickBtn) {
            startQuickBtn.addEventListener('click', () => {
                this.startQuickWorkout();
            });
        }
        
        // Кнопка "Все упражнения"
        const viewAllBtn = document.getElementById('viewAllExercisesBtn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.showAllExercises();
            });
        }
        
        // Кнопка очистки истории
        const clearHistoryBtn = document.getElementById('clearWorkoutHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearWorkoutHistory();
            });
        }
    }
    
    // Методы работы с тренировками
    startQuickWorkout() {
        if (window.HealthFlow) {
            window.HealthFlow.showNotification('Быстрая тренировка скоро появится!', 'success');
        }
        
        // TODO: Реализовать быструю тренировку
        console.log('Запуск быстрой тренировки...');
    }
    
    startWorkout(workoutId) {
        const workout = workoutManager.getWorkout(workoutId);
        if (!workout) {
            this.showNotification('Тренировка не найдена', 'error');
            return;
        }
        
        console.log('Начинаем тренировку:', workout.name);
        
        // Показываем уведомление
        if (window.HealthFlow) {
            window.HealthFlow.showNotification(`Начинаем "${workout.name}"`, 'success');
        }
        
        // TODO: Реализовать режим выполнения тренировки
    }
    
    editWorkout(workoutId) {
        if (window.HealthFlow) {
            window.HealthFlow.showNotification('Редактирование скоро появится!', 'success');
        }
        console.log('Редактирование тренировки ID:', workoutId);
    }
    
    viewWorkoutDetails(workoutId) {
        if (window.HealthFlow) {
            window.HealthFlow.showNotification('Детали тренировки скоро появятся!', 'success');
        }
        console.log('Просмотр тренировки ID:', workoutId);
    }
    
    showCreateWorkoutModal() {
        if (window.HealthFlow) {
            window.HealthFlow.showNotification('Создание тренировки скоро появится!', 'success');
        }
        console.log('Показываем модалку создания тренировки');
        
        // TODO: Реализовать модальное окно
    }
    
    showAllExercises() {
        if (window.HealthFlow) {
            window.HealthFlow.showNotification('Все упражнения скоро появятся!', 'success');
        }
        console.log('Показываем все упражнения');
    }
    
    clearWorkoutHistory() {
        if (confirm('Очистить всю историю тренировок?')) {
            if (window.HealthFlow) {
                window.HealthFlow.showNotification('История очищена', 'success');
            }
            console.log('Очищаем историю тренировок');
            // TODO: Реализовать очистку истории
        }
    }
    
    showNotification(message, type = 'success') {
        if (window.HealthFlow) {
            window.HealthFlow.showNotification(message, type);
        }
    }
}

// Экспортируем синглтон
export const workoutsUI = new WorkoutsUI();

// Для глобального доступа
window.WorkoutsUI = workoutsUI;