// Простая БД для HealthFlow (упражнения)
const EXERCISES_KEY = 'healthflow_exercises';

export function getExercises() {
    return JSON.parse(localStorage.getItem(EXERCISES_KEY)) || [];
}

export function saveExercises(exercises) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
}

export function addExercise(exercise) {
    const exercises = getExercises();
    exercises.push(exercise);
    saveExercises(exercises);
}

export function deleteExercise(id) {
    const exercises = getExercises().filter(e => e.id !== id);
    saveExercises(exercises);
}
