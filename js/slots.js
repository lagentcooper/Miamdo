// Créneaux de repas du planning. Les deux du milieu sont actifs par défaut ;
// petit-déjeuner et goûter s'activent dans les Réglages.

import { getState } from './store.js';

export const ALL_SLOTS = [
  { id: 'petitdej', label: 'Petit-déj', short: 'Matin' },
  { id: 'midi', label: 'Midi', short: 'Midi' },
  { id: 'gouter', label: 'Goûter', short: 'Goûter' },
  { id: 'diner', label: 'Dîner', short: 'Soir' },
];

export const DEFAULT_SLOTS = ['midi', 'diner'];

/** Créneaux retenus par l'utilisateur, dans l'ordre de la journée. */
export function activeSlots() {
  const chosen = getState().settings.slots;
  const ids = Array.isArray(chosen) && chosen.length ? chosen : DEFAULT_SLOTS;
  return ALL_SLOTS.filter((s) => ids.includes(s.id));
}

export const slotLabel = (id) => ALL_SLOTS.find((s) => s.id === id)?.label || '';

/** Créneau proposé par défaut à l'ajout d'un repas. */
export const defaultSlot = () => {
  const actifs = activeSlots();
  return (actifs.find((s) => s.id === 'diner') || actifs[actifs.length - 1] || { id: 'diner' }).id;
};
