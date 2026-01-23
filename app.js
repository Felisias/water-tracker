import { getExercises, addExercise, deleteExercise } from './db.js';

class HealthFlowApp {
    constructor() {
        this.state = {
            currentPage: 'water',
            theme: 'cozy'
        };
    }

    async init() {
        this.loadState();
        this.createPageContainer();
        await this.loadPage(this.state.currentPage);
        this.setupNavigation();
    }

    loadState() {
        const theme = localStorage.getItem('healthflow_theme');
        this.state.theme = theme || 'cozy';
        document.documentElement.setAttribute('data-theme', this.state.theme);
    }

    createPageContainer() {
        document.getElementById('appContainer').innerHTML = `
            <div class="page active" id="currentPage"></div>
        `;
    }

    async loadPage(pageId) {
        this.state.currentPage = pageId;
        localStorage.setItem('healthflow_page', pageId);
        this.updateNavigation(pageId);

        const container = document.getElementById('currentPage');
        const response = await fetch(`${pageId}.html`);
        container.innerHTML = await response.text();

        if (pageId === 'workouts') {
            renderExercises();
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.onclick = () => this.loadPage(btn.dataset.page);
        });
    }

    updateNavigation(pageId) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageId);
        });
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'cozy' ? 'light' : 'cozy';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        localStorage.setItem('healthflow_theme', this.state.theme);
    }
}

window.healthFlow = new HealthFlowApp();
document.addEventListener('DOMContentLoaded', () => healthFlow.init());

/* ===== УПРАЖНЕНИЯ ===== */

window.openExerciseForm = function () {
    document.getElementById('exerciseModal').classList.remove('hidden');
};

window.closeExerciseForm = function () {
    document.getElementById('exerciseModal').classList.add('hidden');
};

window.saveExercise = function () {
    const name = exName.value.trim();
    if (!name) return alert('Введите название');

    const reader = new FileReader();
    reader.onload = () => {
        addExercise({
            id: Date.now(),
            name,
            muscle: exMuscle.value,
            description: exDesc.value,
            image: reader.result
        });

        closeExerciseForm();
        renderExercises();
    };

    reader.readAsDataURL(exImage.files[0]);
};

window.renderExercises = function () {
    const list = document.getElementById('exerciseList');
    if (!list) return;

    const exercises = getExercises();
    list.innerHTML = '';

    if (exercises.length === 0) {
        list.innerHTML = '<p>Упражнений пока нет</p>';
        return;
    }

    exercises.forEach(e => {
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <img src="${e.image}">
            <h4>${e.name}</h4>
            <small>${e.muscle}</small>
            <p>${e.description}</p>
            <button onclick="removeExercise(${e.id})">🗑</button>
        `;
        list.appendChild(card);
    });
};

window.removeExercise = function (id) {
    deleteExercise(id);
    renderExercises();
};
