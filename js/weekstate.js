// Semaine actuellement affichée, partagée entre le planning et les sélecteurs.
import { startOfWeek } from './utils.js';

export const weekState = { monday: startOfWeek(new Date()) };
