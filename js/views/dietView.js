// Réglage des préférences alimentaires : régime, allergènes, ingrédients bannis.

import * as store from '../store.js';
import { icon, openSheet, toast, haptic } from '../ui.js';
import { escapeHtml } from '../utils.js';
import { DIETS, ALLERGENS, dietConfig, dietActive } from '../diet.js';

/** Résumé d'une ligne pour les Réglages. */
export function dietSummary() {
  const conf = dietConfig();
  if (!dietActive()) return 'Aucune préférence — tout est proposé';
  const bouts = [];
  const regime = DIETS.find((d) => d.id === conf.regime);
  if (regime && regime.id !== 'omnivore') bouts.push(regime.label);
  if (conf.exclusions.length) {
    bouts.push(`sans ${conf.exclusions
      .map((id) => (ALLERGENS.find((a) => a.id === id)?.label || id).toLowerCase())
      .join(', ')}`);
  }
  if (conf.banned.length) bouts.push(`${conf.banned.length} ingrédient${conf.banned.length > 1 ? 's' : ''} banni${conf.banned.length > 1 ? 's' : ''}`);
  return bouts.join(' · ');
}

export function openDietSheet() {
  openSheet({
    title: 'Préférences alimentaires',
    leftLabel: 'Fermer',
    render: (api) => {
      const draw = () => {
        const conf = dietConfig();
        api.body.innerHTML = `
          <div class="note" style="margin-bottom:16px">
            Miamdo <b>signale</b> les recettes qui ne collent pas, il ne les invente pas
            autrement. L’étiquetage des ingrédients est forcément incomplet : en cas
            d’allergie sérieuse, l’emballage reste la seule source fiable.
          </div>

          <div class="field">
            <label>Régime</label>
            <div class="chips" style="flex-wrap:wrap;overflow:visible">
              ${DIETS.map((d) => `<button type="button" class="chip ${conf.regime === d.id ? 'active' : ''}"
                style="--chip-color:var(--green)" data-regime="${d.id}">${d.emoji} ${escapeHtml(d.label)}</button>`).join('')}
            </div>
          </div>

          <div class="field">
            <label>Je ne veux pas de…</label>
            <div class="chips" style="flex-wrap:wrap;overflow:visible">
              ${ALLERGENS.map((a) => `<button type="button" class="chip ${conf.exclusions.includes(a.id) ? 'active' : ''}"
                style="--chip-color:var(--red)" data-allergen="${a.id}">${escapeHtml(a.label)}</button>`).join('')}
            </div>
          </div>

          <div class="field">
            <label>Ingrédients bannis</label>
            <div class="hstack" style="gap:8px;margin-bottom:8px">
              <input class="input" placeholder="Ex. coriandre" data-ban>
              <button type="button" class="btn btn-soft" data-add-ban>${icon('plus')}</button>
            </div>
            ${conf.banned.length ? `
              <div class="chips" style="flex-wrap:wrap;overflow:visible">
                ${conf.banned.map((b) => `<button type="button" class="chip active" style="--chip-color:var(--red)"
                  data-unban="${escapeHtml(b)}">${escapeHtml(b)} ✕</button>`).join('')}
              </div>`
              : '<p class="muted" style="font-size:13px;margin:0">Rien de banni pour l’instant.</p>'}
          </div>

          <div class="rows" style="margin-top:18px">
            <div class="row">
              <span class="grow">
                <span class="primary">Masquer les recettes non conformes</span>
                <span class="secondary">Sinon elles restent visibles, simplement signalées</span>
              </span>
              <span class="switch ${conf.hide ? 'on' : ''}" data-hide role="switch"
                aria-checked="${conf.hide}" tabindex="0"></span>
            </div>
          </div>

          ${dietActive() ? `
            <button type="button" class="btn btn-block btn-danger" style="margin-top:16px" data-reset>
              ${icon('refresh')} Tout remettre à zéro
            </button>` : ''}`;

        const patch = (changes) => {
          store.updateSettings({ diet: { ...dietConfig(), ...changes } });
          haptic();
          draw();
        };

        api.body.querySelectorAll('[data-regime]').forEach((b) =>
          b.addEventListener('click', () => patch({ regime: b.dataset.regime })));
        api.body.querySelectorAll('[data-allergen]').forEach((b) =>
          b.addEventListener('click', () => {
            const id = b.dataset.allergen;
            const list = conf.exclusions.includes(id)
              ? conf.exclusions.filter((x) => x !== id)
              : [...conf.exclusions, id];
            patch({ exclusions: list });
          }));
        api.body.querySelectorAll('[data-unban]').forEach((b) =>
          b.addEventListener('click', () =>
            patch({ banned: conf.banned.filter((x) => x !== b.dataset.unban) })));

        const field = api.body.querySelector('[data-ban]');
        const addBan = () => {
          const value = field.value.trim();
          if (!value) return;
          if (conf.banned.some((b) => b.toLowerCase() === value.toLowerCase())) {
            toast('Déjà banni');
            return;
          }
          field.value = '';
          patch({ banned: [...conf.banned, value] });
        };
        api.body.querySelector('[data-add-ban]').addEventListener('click', addBan);
        field.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addBan(); } });

        api.body.querySelector('[data-hide]').addEventListener('click', () => patch({ hide: !conf.hide }));
        api.body.querySelector('[data-reset]')?.addEventListener('click', () => {
          patch({ regime: 'omnivore', exclusions: [], banned: [], hide: false });
          toast('Préférences remises à zéro');
        });
      };
      draw();
    },
  });
}
