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
            if (pageId === 'water') {
                await this.loadWaterPage(container);
            } else if (pageId === 'workouts') {
                // Вставляем HTML тренировок напрямую
                container.innerHTML = this.getWorkoutsPage();
                this.initializeWorkouts();
            } else if (pageId === 'profile') {
                container.innerHTML = this.getProfilePage();
            } else {
                container.innerHTML = `<div>Страница не найдена</div>`;
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
    
    // Метод для получения HTML тренировок
    getWorkoutsPage() {
        return `
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
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🏋️</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
                        Тренировки
                    </h2>
                    <p style="color: var(--text-secondary); margin-bottom: 30px; line-height: 1.5;">
                        Здесь ты сможешь создавать и отслеживать свои тренировки
                    </p>
                    
                    <!-- Кнопка создания упражнения -->
                    <button id="createExerciseBtn" style="
                        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                        border: none;
                        border-radius: var(--radius);
                        padding: 16px 32px;
                        color: white;
                        font-weight: 700;
                        font-size: 1rem;
                        cursor: pointer;
                        margin-bottom: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        width: 100%;
                        transition: var(--transition);
                    ">
                        <span style="font-size: 1.2rem;">+</span>
                        Создать упражнение
                    </button>
                    
                    <!-- Список упражнений -->
                    <div id="exercisesList" style="
                        background: var(--surface);
                        border-radius: var(--radius);
                        border: 2px solid var(--border-light);
                        min-height: 200px;
                        padding: 20px;
                        margin-top: 20px;
                    ">
                        <div style="text-align: center; padding: 40px 20px;">
                            <div style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px;">📝</div>
                            <div style="color: var(--text-secondary);">Упражнения появятся здесь</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Метод для получения HTML профиля
    getProfilePage() {
        return `
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
    
    // Метод для инициализации функционала тренировок
    initializeWorkouts() {
        console.log('Инициализация тренировок...');
        
        const createBtn = document.getElementById('createExerciseBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.createExercise();
            });
        }
        
        this.loadExercises();
    }
    
    // Метод создания упражнения
    createExercise() {
        const name = prompt('Введите название упражнения:');
        if (!name || !name.trim()) return;
        
        const category = prompt('Выберите категорию (Кардио, Силовые, Растяжка, Йога, Другое):', 'Кардио');
        const description = prompt('Описание (необязательно):', '');
        
        this.saveExercise({
            name: name.trim(),
            category: category || 'Кардио',
            description: description || '',
            difficulty: 'Средний',
            createdAt: new Date().toISOString()
        });
        
        this.showNotification(`Упражнение "${name}" создано!`, 'success');
        this.loadExercises();
    }
    
    // Метод сохранения упражнения
    saveExercise(exercise) {
        let exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
        exercise.id = Date.now();
        exercises.push(exercise);
        localStorage.setItem('healthflow_exercises', JSON.stringify(exercises));
    }
    
    // Метод загрузки упражнений
    loadExercises() {
        const container = document.getElementById('exercisesList');
        if (!container) return;
        
        const exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
        
        if (exercises.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px;">📝</div>
                    <div style="color: var(--text-secondary);">Упражнений пока нет</div>
                    <div style="color: var(--text-light); font-size: 0.9rem; margin-top: 5px;">Создайте первое упражнение!</div>
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
                    border-radius: var(--radius-sm);
                    padding: 15px;
                    margin-bottom: 10px;
                    animation: fadeIn 0.3s ease-out ${index * 0.1}s both;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 1.1rem;">
                            ${exercise.name}
                        </div>
                        <button onclick="window.healthFlow.deleteExercise(${exercise.id})" style="
                            background: rgba(255, 107, 107, 0.1);
                            border: none;
                            color: var(--remove);
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 0.85rem;
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
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">
                            ${exercise.category}
                        </span>
                        
                        <span style="
                            background: rgba(255, 154, 118, 0.1);
                            color: var(--accent);
                            padding: 3px 8px;
                            border-radius: 10px;
                            font-size: 0.8rem;
                            font-weight: 600;
                        ">
                            ${exercise.difficulty}
                        </span>
                    </div>
                    
                    ${exercise.description ? `
                        <div style="
                            color: var(--text-secondary);
                            font-size: 0.9rem;
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
    
    // Метод удаления упражнения
    deleteExercise(id) {
        if (!confirm('Удалить это упражнение?')) return;
        
        let exercises = JSON.parse(localStorage.getItem('healthflow_exercises') || '[]');
        exercises = exercises.filter(ex => ex.id !== id);
        localStorage.setItem('healthflow_exercises', JSON.stringify(exercises));
        
        this.showNotification('Упражнение удалено', 'success');
        this.loadExercises();
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

console.log('✅ App.js обновлен с тренировками');
