// Semaine actuellement affichée, partagée entre le planning et les sélecteurs.
import { startOfWeek } from './utils.js';
import { getState } from './store.js';

/** Premier jour de la semaine selon les réglages. */
export const currentWeekStart = (date = new Date()) =>
  startOfWeek(date, getState().settings.weekStart ?? 1);

export const weekState = { monday: currentWeekStart() };
