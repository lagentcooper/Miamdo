// Onglet « Semaine » : planning des repas, source de la liste de courses.

import * as store from '../store.js';
import { icon, openSheet, confirmSheet, toast, haptic, delegate } from '../ui.js';
import {
  escapeHtml, dayName, isoDate, weekDates, weekLabel, isToday, isPast, addDays, formatTime,
} from '../utils.js';
import { weekState, currentWeekStart } from '../weekstate.js';
import { activeSlots, slotLabel, defaultSlot } from '../slots.js';
import { openRecipePicker } from './pickers.js';
import { openRecipeDetail } from './recipes.js';
import { planCost, recipeCost, formatEuro } from '../prices.js';
import { checkRecipe, dietActive, problemSummary } from '../diet.js';
import { dayNutrition, formatKcal } from '../nutrition.js';

export function render({ topbar, view }) {
  // l'ancre est recalée sur le premier jour réglé : changer lundi ↔ dimanche
  // dans les Réglages doit décaler la semaine affichée.
  weekState.monday = currentWeekStart(weekState.monday);
  const monday = weekState.monday;
  const days = weekDates(monday);
  const isoList = days.map(isoDate);
  const planned = store.countPlanned(isoList);
  const thisWeek = isoDate(currentWeekStart()) === isoDate(monday);
  const withPrices = store.getState().settings.showPrices !== false;
  const budget = withPrices ? planCost(isoList, store.getRecipe) : null;
  const withNutrition = store.getState().settings.showNutrition !== false;
  // la liste couvre tout le planning à venir, pas seulement la semaine affichée :
  // une semaine à cheval ne doit pas obliger à générer deux fois.
  const aVenir = store.plannedDays({ from: store.todayIso() });
  const couverts = aVenir.length ? aVenir : isoList;
  const repasCouverts = store.countPlanned(couverts);

  topbar.innerHTML = `
    <div class="topbar-row">
      <h1 class="title">Semaine<small>${planned ? `${planned} repas planifié${planned > 1 ? 's' : ''}` : 'Aucun repas planifié'}</small></h1>
      ${thisWeek ? '' : `<button type="button" class="btn btn-sm btn-soft" data-today>Aujourd’hui</button>`}
    </div>
    <div class="week-nav" style="margin-bottom:6px">
      <button type="button" class="icon-btn" data-week="-1" aria-label="Semaine précédente">${icon('left')}</button>
      <span class="label">${weekLabel(monday)}</span>
      <button type="button" class="icon-btn" data-week="1" aria-label="Semaine suivante">${icon('right')}</button>
    </div>`;

  const dayCard = (date) => {
    const iso = isoDate(date);
    const meals = store.getState().plan[iso] || [];
    return `
      <section class="day ${isToday(date) ? 'today' : ''}${isPast(date) ? ' past' : ''}">
        <header class="day-head">
          <div>
            <div class="dname">${dayName(date)}</div>
            <div class="dnum">${date.getDate()} ${date.toLocaleDateString('fr-FR', { month: 'long' })}</div>
          </div>
          ${isToday(date) ? '<span class="today-pill">aujourd’hui</span>' : ''}
          ${(() => {
            if (!withNutrition || !meals.length) return '';
            const n = dayNutrition(meals, store.getRecipe);
            return n && n.kcal ? `<span class="kcal">${formatKcal(n.kcal)}/pers</span>` : '';
          })()}
          <button type="button" class="icon-btn plain add" data-add-day="${iso}" aria-label="Ajouter un repas">${icon('plus')}</button>
        </header>
        ${meals.length
          ? meals.map((m) => {
              const r = store.getRecipe(m.recipeId);
              if (!r) return '';
              return `
                <div class="meal" data-meal="${m.id}" data-day="${iso}">
                  <span class="emoji">${r.emoji}</span>
                  <span class="grow">
                    <div class="mname">${escapeHtml(r.name)}</div>
                    <div class="mmeta">${m.servings} portions${r.time ? ` · ${formatTime(r.time)}` : ''}${
                      withPrices ? ` · <span class="price muted-price">≈ ${formatEuro(recipeCost(r, m.servings).total)}</span>` : ''}</div>
                  </span>
                  <span class="slot">${slotLabel(m.slot)}</span>
                </div>`;
            }).join('')
          : `<div class="empty-day">Rien de prévu — <a href="#" data-add-day="${iso}" style="color:var(--accent);font-weight:600;text-decoration:none">ajouter un repas</a></div>`}
      </section>`;
  };

  view.innerHTML = `
    ${planned ? `
      <div class="hero">
        <h2>${planned} repas cette semaine</h2>
        <p>${budget && budget.total ? `Budget de la semaine <b>≈ ${formatEuro(budget.total)}</b>. ` : ''}La liste
          couvre <b>tout ton planning à venir</b> — ${repasCouverts} repas — ingrédients additionnés
          et rangés par rayon.</p>
        <button type="button" class="btn" data-generate>${icon('sparkles')} Générer la liste</button>
      </div>` : `
      <div class="hero">
        <h2>Compose ta semaine</h2>
        <p>Ajoute des recettes aux jours qui t’arrangent, puis génère la liste en un tap.</p>
        <button type="button" class="btn" data-add-day="${isoList[0]}">${icon('plus')} Planifier un repas</button>
      </div>`}
    <div class="day-grid" style="margin-top:16px">${days.map(dayCard).join('')}</div>
    ${planned ? `<button type="button" class="btn btn-block btn-danger" style="margin-top:6px" data-clear-week>${icon('trash')} Vider la semaine</button>` : ''}
    <div data-spacer aria-hidden="true"></div>`;

  /* interactions */
  delegate(topbar, '[data-week]', 'click', (e, el) => {
    weekState.monday = addDays(weekState.monday, 7 * Number(el.dataset.week));
    haptic();
    rerender();
  });
  delegate(topbar, '[data-today]', 'click', () => {
    weekState.monday = currentWeekStart();
    scrollToToday = true;
    rerender();
  });
  delegate(view, '[data-add-day]', 'click', (e, el) => {
    e.preventDefault();
    const iso = el.dataset.addDay;
    openRecipePicker((recipe) => {
      openSlotSheet(iso, recipe);
    });
  });
  delegate(view, '[data-meal]', 'click', (e, el) => openMealActions(el.dataset.day, el.dataset.meal));
  delegate(view, '[data-generate]', 'click', () => {
    const n = store.generateFromPlan(couverts, { replace: true });
    haptic(15);
    toast(`Liste générée · ${repasCouverts} repas, ${n} ingrédient${n > 1 ? 's' : ''}`, {
      action: 'Annuler', onAction: () => store.undo(),
    });
    window.dispatchEvent(new CustomEvent('miamdo:navigate', { detail: 'shopping' }));
  });
  // après le rendu, on se place sur aujourd'hui si c'est demandé
  if (scrollToToday) {
    scrollToToday = false;
    revealToday(view);
  }

  delegate(view, '[data-clear-week]', 'click', async () => {
    const ok = await confirmSheet({
      title: 'Vider la semaine ?',
      message: 'Tous les repas planifiés de cette semaine seront retirés.',
      confirmLabel: 'Vider',
    });
    if (!ok) return;
    store.planClearWeek(isoList);
    toast('Semaine vidée', { action: 'Annuler', onAction: () => store.undo() });
  });
}

let rerender = () => {};
export function setRerender(fn) { rerender = fn; }

// Le planning s'ouvre sur le jour courant ; les jours déjà passés restent
// au-dessus, il suffit de remonter pour les revoir.
let scrollToToday = true;
export function onEnter() { scrollToToday = true; }

/**
 * Amène la carte du jour juste sous l'en-tête.
 * En deux passes : la première positionne, la seconde rattrape le décalage
 * laissé par la mise en page qui finit de se stabiliser (hauteur du bandeau,
 * retours à la ligne).
 */
function revealToday(container) {
  // position dans le document, insensible aux transformations : l'animation
  // d'entrée translate la vue, ce qui fausserait getBoundingClientRect().
  const docTop = (el) => {
    let y = 0;
    for (let node = el; node; node = node.offsetParent) y += node.offsetTop;
    return y;
  };

  const place = () => {
    const card = container.querySelector('.day.today');
    if (!card) return;
    const marge = (document.getElementById('topbar')?.offsetHeight || 0) + 8;
    const cible = docTop(card) - marge;

    // en fin de semaine il n'y a plus assez de contenu en dessous pour que le
    // jour courant atteigne le haut : on ajoute exactement ce qui manque.
    const spacer = container.querySelector('[data-spacer]');
    if (spacer) {
      // calcul hors spacer, sinon la seconde passe le remettrait à zéro ;
      // quelques pixels de marge car l'animation d'entrée gonfle brièvement
      // la hauteur défilable du document.
      const sansSpacer = document.documentElement.scrollHeight - spacer.offsetHeight;
      const manque = cible + window.innerHeight - sansSpacer;
      spacer.style.height = `${Math.max(0, Math.ceil(manque) + 16)}px`;
    }

    window.scrollTo({ top: Math.max(0, cible), behavior: 'auto' });
  };
  requestAnimationFrame(() => {
    place();
    requestAnimationFrame(place);
  });
}

/* ------------------------------------------------ choix midi/dîner + portions */

function openSlotSheet(dayIso, recipe) {
  let slot = defaultSlot();
  let portions = recipe.servings;
  openSheet({
    title: 'Ajouter au planning',
    leftLabel: 'Annuler',
    rightLabel: 'Ajouter',
    onRight: (api) => {
      store.planAdd(dayIso, recipe.id, { servings: portions, slot });
      haptic(12);
      api.close();
      const { ok, problems } = dietActive() ? checkRecipe(recipe) : { ok: true };
      toast(ok
        ? `${recipe.name} ajouté`
        : `${recipe.name} ajouté — ⚠︎ ${problemSummary(problems)}`,
      { action: 'Annuler', onAction: () => store.undo() });
    },
    render: (api) => {
      const draw = () => {
        api.body.innerHTML = `
          <div class="hstack" style="margin-bottom:16px">
            <span style="font-size:30px">${recipe.emoji}</span>
            <div class="grow">
              <div style="font-weight:700;font-size:16px">${escapeHtml(recipe.name)}</div>
              <div class="muted" style="font-size:13px">${new Date(dayIso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
          </div>
          <div class="segmented" style="margin-bottom:16px">
            ${activeSlots().map((s) => `<button type="button" class="${slot === s.id ? 'active' : ''}" data-slot="${s.id}">${s.label}</button>`).join('')}
          </div>
          <div class="hstack">
            <div class="grow"><b>Portions</b><div class="muted" style="font-size:13px">Ajuste selon le nombre de convives</div></div>
            <div class="stepper">
              <button type="button" data-p="-1">−</button><span class="val">${portions}</span><button type="button" data-p="1">+</button>
            </div>
          </div>`;
        api.body.querySelectorAll('[data-slot]').forEach((b) =>
          b.addEventListener('click', () => { slot = b.dataset.slot; haptic(); draw(); }));
        api.body.querySelectorAll('[data-p]').forEach((b) =>
          b.addEventListener('click', () => { portions = Math.max(1, portions + Number(b.dataset.p)); haptic(); draw(); }));
      };
      draw();
    },
  });
}

/* -------------------------------------------------------- actions d'un repas */

function openMealActions(dayIso, entryId) {
  const entry = (store.getState().plan[dayIso] || []).find((e) => e.id === entryId);
  const recipe = entry && store.getRecipe(entry.recipeId);
  if (!recipe) return;

  openSheet({
    title: recipe.name,
    leftLabel: 'Fermer',
    render: (api) => {
      const draw = () => {
        api.body.innerHTML = `
          <div class="hstack" style="margin-bottom:16px">
            <div class="grow"><b>Portions</b></div>
            <div class="stepper">
              <button type="button" data-p="-1">−</button><span class="val">${entry.servings}</span><button type="button" data-p="1">+</button>
            </div>
          </div>
          <div class="segmented" style="margin-bottom:16px">
            ${activeSlots().map((s) => `<button type="button" class="${entry.slot === s.id ? 'active' : ''}" data-slot="${s.id}">${s.label}</button>`).join('')}
          </div>
          <div class="field">
            <label>Déplacer vers</label>
            <select class="select" data-move>
              ${weekDates(weekState.monday).map((d, i) => {
                const iso = isoDate(d);
                return `<option value="${iso}" ${iso === dayIso ? 'selected' : ''}>${dayName(d)} ${d.getDate()}</option>`;
              }).join('')}
            </select>
          </div>
          <button type="button" class="btn btn-block" data-open>${icon('book')} Voir la recette</button>
          <button type="button" class="btn btn-block" style="margin-top:10px" data-add-list>${icon('cart')} Ajouter aux courses</button>
          <button type="button" class="btn btn-block btn-danger" style="margin-top:10px" data-remove>${icon('trash')} Retirer du planning</button>`;

        api.body.querySelectorAll('[data-p]').forEach((b) =>
          b.addEventListener('click', () => {
            entry.servings = Math.max(1, entry.servings + Number(b.dataset.p));
            store.planUpdate(dayIso, entryId, { servings: entry.servings });
            haptic();
            draw();
          }));
        api.body.querySelectorAll('[data-slot]').forEach((b) =>
          b.addEventListener('click', () => {
            entry.slot = b.dataset.slot;
            store.planUpdate(dayIso, entryId, { slot: entry.slot });
            haptic();
            draw();
          }));
        api.body.querySelector('[data-move]').addEventListener('change', (e) => {
          store.planMove(dayIso, entryId, e.target.value);
          api.close();
          toast('Repas déplacé');
        });
        api.body.querySelector('[data-open]').addEventListener('click', () => {
          api.close();
          setTimeout(() => openRecipeDetail(recipe.id), 320);
        });
        api.body.querySelector('[data-add-list]').addEventListener('click', () => {
          const n = store.addRecipeToList(recipe.id, entry.servings);
          api.close();
          toast(`${n} ingrédients ajoutés`, { action: 'Annuler', onAction: () => store.undo() });
        });
        api.body.querySelector('[data-remove]').addEventListener('click', () => {
          store.planRemove(dayIso, entryId);
          api.close();
          toast('Repas retiré', { action: 'Annuler', onAction: () => store.undo() });
        });
      };
      draw();
    },
  });
}
