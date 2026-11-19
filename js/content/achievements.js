/* =========================================================
   Logros de GlucoAprende: premian aprendizaje y participación,
   nunca valores de glucosa ni resultados clínicos.
   ========================================================= */

export const ACHIEVEMENTS = [
  { id: 'primer-paso', title: 'Primer paso', desc: 'Abriste tu primera lección.', icon: 'star', color: '#FFC94A', test: (p) => Object.keys(p.lessonsOpened || {}).length >= 1 },
  { id: 'explorador', title: 'Explorador de la salud', desc: 'Completaste tu primer tema.', icon: 'medal', color: '#24B6E6', test: (p) => completedCount(p) >= 1 },
  { id: 'alimentacion', title: 'Alimentación saludable', desc: 'Completaste el tema Alimentos y carbohidratos.', icon: 'apple', color: '#4DB560', test: (p) => !!p.topics?.alimentos?.completed },
  { id: 'super-activo', title: 'Súper activo', desc: 'Completaste el tema Actividad física y diabetes.', icon: 'run', color: '#7C6BD6', test: (p) => !!p.topics?.actividad?.completed },
  { id: 'mitad', title: '¡Mitad del camino!', desc: 'Completaste 3 temas.', icon: 'trend', color: '#0077C8', test: (p) => completedCount(p) >= 3 },
  { id: 'super-aprendiz', title: 'Súper aprendiz', desc: 'Completaste los 6 temas.', icon: 'trophy', color: '#F5A400', test: (p) => completedCount(p) >= 6 },
  { id: 'cuentacuentos', title: 'Amigo de los cuentos', desc: 'Terminaste un cuento interactivo.', icon: 'book', color: '#F16C7A', test: (p) => Object.keys(p.stories || {}).length >= 1 },
  { id: 'perseverante', title: 'Sigo intentando', desc: 'Volviste a intentar un cuestionario.', icon: 'refresh', color: '#21864B', test: (p) => Object.values(p.topics || {}).some((t) => (t.attempts || 0) >= 2) },
];

export function completedCount(p) {
  return Object.values(p?.topics || {}).filter((t) => t.completed).length;
}
export const achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id);
