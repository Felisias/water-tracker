// Глобальный объект приложения
window.HealthFlow = {
    // Настройки приложения
    config: {
        appName: 'HealthFlow',
        version: '1.0.0',
        skinRate: {
            water: 250, // 250 мл = 1 скинт
            workout: 10, // 1 тренировка = 10 скинтов
            achievement: 50 // Достижение = 50 скинтов
        }
    },
    
    // Текущее состояние
    state: {
        currentPage: 'water',
        totalSkins: 0,
        theme: 'cozy',
        isLoading: true
    },
    
    // Инициализация приложения
    init() {
        console.log('Инициализация HealthFlow...');
        
        // Загружаем состояние из localStorage
        this.loadState();
        
        // Настраиваем Service Worker
        this.setupServiceWorker();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Загружаем текущую страницу
        this.loadPage(this.state.currentPage);
        
        // Прячем экран загрузки
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
            this.state.isLoading = false;
            this.saveState();
        }, 1000);
        
        console.log('Приложение инициализировано');
    },
    
    // Загрузка состояния из localStorage
    loadState() {
        const savedState = localStorage.getItem('healthflow_state');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.state = { ...this.state, ...state };
            } catch (e) {
                console.error('Ошибка загрузки состояния:', e);
            }
        }
        
        // Загружаем общие скинты
        const savedSkins = localStorage.getItem('healthflow_skins');
        if (savedSkins) {
            this.state.totalSkins = parseInt(savedSkins) || 0;
        }
        
        // Устанавливаем тему
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        // Обновляем отображение скинтов
        this.updateSkinDisplay();
    },
    
    // Сохранение состояния в localStorage
    saveState() {
        localStorage.setItem('healthflow_state', JSON.stringify(this.state));
        localStorage.setItem('healthflow_skins', this.state.totalSkins.toString());
    },
    
    // Добавление скинтов
    addSkins(amount, source = 'unknown') {
        const oldSkins = this.state.totalSkins;
        this.state.totalSkins += amount;
        
        console.log(`+${amount} скинтов (${source}). Всего: ${this.state.totalSkins}`);
        
        // Сохраняем
        this.saveState();
        
        // Обновляем отображение
        this.updateSkinDisplay();
        
        // Показываем уведомление если добавили больше 0
        if (amount > 0) {
            this.showNotification(`+${amount} скинтов ✨`, 'skins');
        }
        
        // Возвращаем новое количество для возможной обработки
        return this.state.totalSkins;
    },
    
    // Обновление отображения скинтов
    updateSkinDisplay() {
        const skinElements = document.querySelectorAll('.skin-counter span');
        skinElements.forEach(element => {
            element.textContent = this.state.totalSkins;
        });
    },
    
    // Переключение темы
    toggleTheme() {
        this.state.theme = this.state.theme === 'cozy' ? 'light' : 'cozy';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        const icon = document.querySelector('.theme-icon');
        icon.textContent = this.state.theme === 'cozy' ? '🌙' : '☀️';
        
        this.saveState();
    },
    
    // Загрузка страницы
    loadPage(pageId) {
        console.log(`Загрузка страницы: ${pageId}`);
        
        // Обновляем текущую страницу
        this.state.currentPage = pageId;
        
        // Обновляем навигацию
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            }
        });
        
        // Загружаем контент страницы
        this.loadPageContent(pageId);
        
        // Обновляем URL hash
        window.location.hash = pageId;
    },
    
    // Загрузка контента страницы
    async loadPageContent(pageId) {
        const container = document.getElementById('appContainer');
        
        // Показываем загрузку если это не вода (у неё своя структура)
        if (pageId !== 'water') {
            container.innerHTML = `
                <div class="page active" id="${pageId}Page">
                    <header class="page-header">
                        <h1 class="page-title">${this.getPageTitle(pageId)}</h1>
                        <div class="page-controls">
                            <div class="skin-counter">
                                ✨ <span>${this.state.totalSkins}</span>
                            </div>
                            <button class="theme-toggle" id="themeToggle">
                                <div class="theme-icon">${this.state.theme === 'cozy' ? '🌙' : '☀️'}</div>
                            </button>
                        </div>
                    </header>
                    <div class="content-container" id="${pageId}Content">
                        ${this.getPagePlaceholder(pageId)}
                    </div>
                </div>
            `;
            
            // Добавляем обработчик темы для новой страницы
            document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
            
            // Загружаем модуль если он есть
            await this.loadPageModule(pageId);
        }
    },
    
    // Получение заголовка страницы
    getPageTitle(pageId) {
        const titles = {
            water: 'Вода',
            workouts: 'Тренировки',
            profile: 'Профиль'
        };
        return titles[pageId] || pageId;
    },
    
    // Заглушки для страниц
    getPagePlaceholder(pageId) {
        const placeholders = {
            workouts: `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">🏋️</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
                        Модуль тренировок
                    </h2>
                    <p style="color: var(--text-secondary); line-height: 1.5;">
                        Скоро здесь появится система тренировок!<br>
                        Ты сможешь создавать упражнения, программы и отслеживать прогресс.
                    </p>
                    <div style="margin-top: 30px; padding: 20px; background: var(--surface); border-radius: var(--radius); border: 2px solid var(--border-light);">
                        <h3 style="font-size: 1.2rem; margin-bottom: 15px; color: var(--primary);">
                            Что будет в этом модуле:
                        </h3>
                        <ul style="text-align: left; color: var(--text-secondary); line-height: 1.8;">
                            <li>📝 Создание упражнений с фото и описанием</li>
                            <li>🏗️ Составление программ тренировок</li>
                            <li>⏱️ Пошаговый гид по выполнению</li>
                            <li>📊 Отслеживание прогресса и рекордов</li>
                            <li>✨ Общие скинты с модулем воды</li>
                        </ul>
                    </div>
                </div>
            `,
            profile: `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">👤</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
                        Профиль
                    </h2>
                    <p style="color: var(--text-secondary); margin-bottom: 30px;">
                        Здесь будет твоя статистика и достижения
                    </p>
                    
                    <div style="background: var(--surface); border-radius: var(--radius); padding: 24px; border: 2px solid var(--border-light); margin-bottom: 20px;">
                        <div style="font-size: 3rem; font-weight: 800; color: var(--primary); margin-bottom: 10px;">
                            ${this.state.totalSkins}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            Всего скинтов
                        </div>
                    </div>
                    
                    <div style="background: var(--surface); border-radius: var(--radius); padding: 20px; border: 2px solid var(--border-light); text-align: left;">
                        <h3 style="font-size: 1.1rem; margin-bottom: 15px; color: var(--primary);">
                            Статистика
                        </h3>
                        <div style="color: var(--text-secondary); line-height: 1.8;">
                            <div>🌿 HealthFlow v${this.config.version}</div>
                            <div>📱 PWA приложение</div>
                            <div>💾 Работает офлайн</div>
                            <div>🎨 Тема: ${this.state.theme === 'cozy' ? 'Уютная' : 'Светлая'}</div>
                        </div>
                    </div>
                </div>
            `
        };
        
        return placeholders[pageId] || `<div>Страница "${pageId}" в разработке</div>`;
    },
    
    // Загрузка модуля страницы
    async loadPageModule(pageId) {
        try {
            const modulePath = `${pageId}.js`;
            
            // Динамически загружаем модуль
            const module = await import(modulePath);
            
            // Инициализируем модуль если есть функция init
            if (module && typeof module.init === 'function') {
                await module.init(this);
                console.log(`Модуль ${pageId} загружен`);
            }
        } catch (error) {
            console.log(`Модуль ${pageId} не найден или не требуется:`, error.message);
        }
    },
    
    // Показ уведомления
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    },
    
    // Настройка Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/healthflow/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker зарегистрирован:', registration.scope);
                    })
                    .catch(error => {
                        console.log('ServiceWorker ошибка:', error);
                    });
            });
        }
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Навигация
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
        
        // Инициализация темы на главной
        document.addEventListener('DOMContentLoaded', () => {
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => this.toggleTheme());
            }
        });
    }
};

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.HealthFlow.init();























        // Добавьте этот код в конец app.js (перед последней строку)
    
    // Загрузка модуля воды при переходе на страницу
    async function loadWaterPage() {
        try {
            // Динамически импортируем модуль воды
            const waterModule = await import('./water.js');
            
            // Инициализируем модуль
            const waterTracker = await waterModule.init(window.HealthFlow);
            
            // Сохраняем ссылку на трекер воды
            window.HealthFlow.waterTracker = waterTracker;
            
            console.log('Модуль воды загружен');
        } catch (error) {
            console.error('Ошибка загрузки модуля воды:', error);
            
            // Показываем заглушку если модуль не загрузился
            const container = document.getElementById('waterPage');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px;">
                        <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">💧</div>
                        <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">
                            Модуль воды
                        </h2>
                        <p style="color: var(--text-secondary); margin-bottom: 30px;">
                            Ошибка загрузки модуля. Пожалуйста, обновите страницу.
                        </p>
                        <button onclick="location.reload()" style="background: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: var(--radius); font-weight: 600; cursor: pointer;">
                            Обновить страницу
                        </button>
                    </div>
                `;
                container.classList.add('active');
            }
        }
    }
    
    // Обновите метод loadPageContent в классе HealthFlow:
    // В методе loadPageContent добавьте после строки с await this.loadPageModule(pageId):
    
    if (pageId === 'water') {
        await loadWaterPage();
    }
});

