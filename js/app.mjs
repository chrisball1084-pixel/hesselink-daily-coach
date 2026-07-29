import {
  CATEGORIES,
  DAYS,
  WORKOUTS,
  clearWorkoutOverrideForDate,
  completeCardio,
  completeWorkout,
  createDefaultState,
  ensureWeek,
  formatDate,
  getWeekForDate,
  makeExportPayload,
  moveWorkout,
  nextWorkout,
  progressSummary,
  reviewForWeek,
  scoreDay,
  scoreWeek,
  setHabitOrder,
  setWeekFocus,
  setWorkoutForDate,
  skipWorkout,
  syncOpenWeekPlans,
  toDateKey,
  toggleHabit,
  trainingSummary,
  uid,
  undoCardio,
  undoWorkout,
  updateWeekTrainingDays,
  weekDates,
  weekdayIndex,
  workoutForDate,
} from "./core.mjs";
import {
  clearState,
  loadState,
  replaceState,
  saveState,
} from "./storage.mjs";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const weekDialog = document.querySelector("#week-dialog");
const weekForm = document.querySelector("#week-form");
const habitDialog = document.querySelector("#habit-dialog");
const habitForm = document.querySelector("#habit-form");
const moveDialog = document.querySelector("#move-dialog");
const moveForm = document.querySelector("#move-form");
const cardioDialog = document.querySelector("#cardio-dialog");
const cardioForm = document.querySelector("#cardio-form");
const importFile = document.querySelector("#import-file");

let state = loadState();
let activeView = "today";
let deferredInstallPrompt = null;
let toastTimer = null;
let moveSourceDate = null;
let cardioSourceDate = null;

ensureWeek(state, new Date());
state.ui.selectedDate = toDateKey(new Date());
saveState(state);

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryClass(category) {
  return `category-${category.toLowerCase()}`;
}

function currentWeek() {
  return ensureWeek(state, new Date());
}

function selectedDate() {
  const dates = weekDates(new Date());
  return dates.includes(state.ui.selectedDate)
    ? state.ui.selectedDate
    : toDateKey(new Date());
}

function persist(message) {
  saveState(state);
  render();
  if (message) showToast(message);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function haptic() {
  if (state.settings.haptics && "vibrate" in navigator) {
    navigator.vibrate(18);
  }
}

function progressStyle(percent) {
  return `--progress: ${Math.max(0, Math.min(100, percent))}%`;
}

function render() {
  ensureWeek(state, new Date());
  if (activeView === "week") app.innerHTML = renderWeek();
  else if (activeView === "review") app.innerHTML = renderReview();
  else if (activeView === "settings") app.innerHTML = renderSettings();
  else app.innerHTML = renderToday();

  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === activeView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
}

function renderDayStrip(dateKey) {
  const today = toDateKey(new Date());
  return `
    <div class="day-strip" aria-label="Tag auswählen">
      ${weekDates(new Date())
        .map((key, index) => {
          const selected = key === dateKey;
          return `
            <button
              type="button"
              class="day-chip ${selected ? "is-selected" : ""} ${key === today ? "is-today" : ""}"
              data-select-date="${key}"
              aria-pressed="${selected}"
              aria-label="${DAYS[index].long}, ${formatDate(key)}"
            >
              <strong>${DAYS[index].short}</strong>
              <small>${formatDate(key)}</small>
            </button>`;
        })
        .join("")}
    </div>`;
}

function motivation(score, dateKey) {
  const today = toDateKey(new Date());
  if (!score.possible) return "Heute ist keine score-relevante Gewohnheit geplant.";
  if (score.earned === score.possible) {
    return `Starker Tag - ${score.earned} von ${score.possible} erledigt.`;
  }
  if (dateKey < today) {
    return `An diesem Tag waren es ${score.earned} von ${score.possible}. Der Blick bleibt nach vorn.`;
  }
  if (dateKey > today) {
    return `${score.possible} klare Prioritäten warten auf dich.`;
  }
  if (score.earned >= Math.ceil(score.possible * 0.75)) {
    return `Starker Tag - ${score.earned} von ${score.possible} erledigt.`;
  }
  return `Heute sind ${score.earned} von ${score.possible} erledigt. Der nächste Schritt zählt.`;
}

function renderProgressCard(referenceDate = new Date()) {
  const progress = progressSummary(state, referenceDate);
  const streak = progress.topCurrentStreak;
  const record = progress.topRecord;
  const milestoneReached = [5, 10, 15, 25, 50, 75, 100].includes(
    progress.strengthCount,
  );
  const badge = milestoneReached
    ? `${progress.strengthCount} Workouts`
    : streak?.isPersonalRecord
      ? "Personal Record"
      : record
        ? `Bestwert ${record.best}`
        : "Dein Fortschritt";

  return `
    <article class="progress-card">
      <div class="progress-card-head">
        <div>
          <span class="eyebrow">Progress</span>
          <h2>Dranbleiben wird sichtbar</h2>
        </div>
        <span class="record-badge">${escapeHtml(badge)}</span>
      </div>
      <div class="progress-stat-grid">
        <div class="progress-stat">
          <small>Aktuelle Serie</small>
          <strong>${streak ? `${streak.current} Tage` : "Start"}</strong>
          <span>${escapeHtml(streak?.name ?? "Heute zählt der erste Haken")}</span>
        </div>
        <div class="progress-stat">
          <small>Krafttrainings</small>
          <strong>${progress.strengthCount}/${progress.nextTrainingMilestone}</strong>
          <span>Nächster Meilenstein</span>
        </div>
      </div>
      <div class="linear-progress" style="${progressStyle(progress.trainingMilestonePercent)}; margin-top: 10px" aria-label="${progress.trainingMilestonePercent} Prozent bis zum nächsten Trainingsmeilenstein"><span></span></div>
      ${
        progress.activeStreaks.length
          ? `<div class="streak-list" aria-label="Aktive Serien">
              ${progress.activeStreaks
                .slice(0, 4)
                .map(
                  (item) =>
                    `<span class="streak-chip"><b>${item.current}</b> · ${escapeHtml(item.name)}</span>`,
                )
                .join("")}
            </div>`
          : `<p class="subtle" style="margin: 12px 0 0; font-size: .7rem">Zwei aufeinanderfolgende aktive Tage starten die erste sichtbare Serie.</p>`
      }
    </article>`;
}

function renderToday() {
  const dateKey = selectedDate();
  const week = currentWeek();
  const dayScore = scoreDay(week, dateKey);
  const totalScore = scoreWeek(week);
  const dayIndex = weekdayIndex(dateKey);
  const plan = week.dailyPlans[dateKey] ?? [];
  const checkins = week.checkins[dateKey] ?? {};
  const groups = CATEGORIES.map((category) => ({
    category,
    habits: plan.filter((habit) => habit.category === category),
  })).filter((group) => group.habits.length);
  const today = toDateKey(new Date());
  const editable = dateKey <= today && week.status === "open";

  return `
    <section class="view" data-view-panel="today">
      <header class="page-head">
        <div>
          <span class="eyebrow">${dateKey === today ? "Heute" : "Tageskorrektur"}</span>
          <h1>${DAYS[dayIndex].long}</h1>
        </div>
        <div class="date-copy">
          <strong>Woche ${formatDate(week.startDate)} - ${formatDate(week.endDate)}</strong>
          ${formatDate(dateKey, { year: true })}
        </div>
      </header>

      ${renderDayStrip(dateKey)}

      <article class="score-hero">
        <div class="progress-ring" style="${progressStyle(dayScore.percent)}" aria-label="${dayScore.percent} Prozent erledigt">
          <span>${dayScore.earned}/${dayScore.possible}</span>
        </div>
        <div class="score-copy">
          <div class="kicker">Daily Score · ${dayScore.percent} %</div>
          <h2>${motivation(dayScore, dateKey)}</h2>
          <p>Konstanz schlägt Perfektion.</p>
          <div class="week-mini-score">
            <strong>${totalScore.earned}/${totalScore.possible}</strong>
            <span>Wochenpunkte · ${totalScore.percent} %</span>
          </div>
        </div>
      </article>

      ${renderProgressCard(new Date())}

      ${renderWorkoutCard(week, dateKey)}

      ${
        groups.length
          ? groups
              .map(
                ({ category, habits }) => `
                  <section class="section-block">
                    <div class="section-head">
                      <div>
                        <span class="eyebrow">${category}</span>
                        <h2>${category === "Foundation" ? "Starker Start" : category === "Performance" ? "Leistung im Alltag" : "Konsequent bleiben"}</h2>
                      </div>
                      <span class="section-count">${habits.filter((habit) => checkins[habit.id]).length}/${habits.length}</span>
                    </div>
                    <div class="habit-list">
                      ${habits
                        .map((habit) => {
                          const done = Boolean(checkins[habit.id]);
                          return `
                            <button
                              type="button"
                              class="habit-button ${categoryClass(habit.category)} ${done ? "is-done" : ""}"
                              data-toggle-habit="${habit.id}"
                              aria-pressed="${done}"
                              ${editable ? "" : "disabled"}
                            >
                              <span class="habit-check" aria-hidden="true">✓</span>
                              <span class="habit-copy">
                                <strong>${escapeHtml(habit.name)}</strong>
                                ${habit.description ? `<small>${escapeHtml(habit.description)}</small>` : ""}
                              </span>
                              <span class="score-tag">${habit.scoreRelevant ? "+1" : "Extra"}</span>
                            </button>`;
                        })
                        .join("")}
                    </div>
                  </section>`,
              )
              .join("")
          : `<div class="empty-state"><strong>Heute bleibt frei.</strong>Für diesen Tag sind keine Gewohnheiten aktiv.</div>`
      }
    </section>`;
}

function renderWorkoutCard(week, dateKey) {
  const plan = week.training.plans[dateKey] ?? null;
  const session = week.training.sessions.find(
    (item) => item.date === dateKey && item.completed && item.workout,
  );
  const cardioSessions = week.training.sessions.filter(
    (item) =>
      item.date === dateKey && item.completed && item.type === "cardio",
  );
  const workoutKey = workoutForDate(state, dateKey);
  const workout = WORKOUTS[workoutKey];
  const today = toDateKey(new Date());
  const canAct = dateKey <= today && week.status === "open";
  const canConfigure =
    week.status === "open" && !session && (Boolean(plan) || dateKey <= today);
  const planStatus = plan?.status ?? "extra";
  const statusText = session
    ? "Abgeschlossen"
    : planStatus === "skipped"
      ? "Heute pausiert"
      : plan
        ? "Geplant"
        : "Optional";

  return `
    <article class="workout-card ${plan ? "is-planned" : ""} ${session ? "is-complete" : ""}">
      <div class="workout-main">
        <div class="workout-topline">
          <div>
            <span class="workout-label">${plan ? "Trainingstag" : "Nächstes Workout"}</span>
            <h2>${escapeHtml(workout.label)}</h2>
          </div>
          <span class="workout-status ${session ? "done" : ""}">${statusText}</span>
        </div>
        <p class="subtle">${session ? "Einheit erfasst. Die Rotation ist weitergeschaltet." : plan ? "Das Workout wechselt erst nach einem tatsächlichen Abschluss." : "Zusätzliche Einheiten sind möglich und zählen separat."}</p>
        ${
          canConfigure
            ? `<div class="workout-selector" aria-label="Workout für diesen Tag auswählen">
                <span>Workout für diesen Tag</span>
                ${Object.entries(WORKOUTS)
                  .map(
                    ([key, item]) =>
                      `<button type="button" class="button secondary ${workoutKey === key ? "is-selected" : ""}" data-set-day-workout="${key}" data-workout-date="${dateKey}" aria-pressed="${workoutKey === key}">${item.label}</button>`,
                  )
                  .join("")}
                ${
                  plan
                    ? `<button type="button" class="button ghost auto-workout-button" data-clear-day-workout="${dateKey}" ${plan.manualWorkout ? "" : "disabled"}>${plan.manualWorkout ? "Automatischen Vorschlag verwenden" : "Automatischer Vorschlag aktiv"}</button>`
                    : ""
                }
              </div>`
            : ""
        }
        <div class="workout-actions">
          ${
            session
              ? `<button type="button" class="button secondary" data-undo-workout="${dateKey}" ${canAct ? "" : "disabled"}>Abschluss rückgängig</button>`
              : `<button type="button" class="button primary" data-complete-workout="${dateKey}" ${canAct ? "" : "disabled"}>${plan ? "Workout abgeschlossen" : "Kraft-Zusatztraining"}</button>`
          }
          ${canAct ? `<button type="button" class="button secondary" data-open-cardio="${dateKey}">Cardio-Training</button>` : ""}
          ${
            plan && !session && planStatus !== "skipped"
              ? `
                <button type="button" class="button secondary" data-move-workout="${dateKey}" ${week.status === "open" ? "" : "disabled"}>Training verschieben</button>
                <button type="button" class="button ghost" data-skip-workout="${dateKey}" ${canAct ? "" : "disabled"}>Heute kein Training</button>`
              : ""
          }
        </div>
      </div>
      ${
        cardioSessions.length
          ? `<div class="cardio-sessions" aria-label="Erfasste Cardio-Trainings">
              ${cardioSessions
                .map(
                  (cardio) => `
                    <div class="cardio-entry">
                      <span>
                        <strong>${escapeHtml(cardio.label)}</strong>
                        <small>${cardio.durationMinutes ? `${cardio.durationMinutes} Min. · ` : ""}Cardio abgeschlossen · Rotation unverändert</small>
                      </span>
                      <button type="button" class="mini-button" data-undo-cardio="${cardio.id}" data-cardio-date="${dateKey}" aria-label="${escapeHtml(cardio.label)} entfernen" ${canAct ? "" : "disabled"}>×</button>
                    </div>`,
                )
                .join("")}
            </div>`
          : ""
      }
      <details class="workout-more">
        <summary>Übungen anzeigen</summary>
        <ol class="exercise-list">
          ${workout.exercises.map((exercise) => `<li>${escapeHtml(exercise)}</li>`).join("")}
        </ol>
      </details>
    </article>`;
}

function renderWeek() {
  const week = currentWeek();
  const score = scoreWeek(week);
  const training = trainingSummary(week);
  const today = toDateKey(new Date());

  return `
    <section class="view" data-view-panel="week">
      <header class="page-head">
        <div>
          <span class="eyebrow">Aktuelle Woche</span>
          <h1>Dein System</h1>
        </div>
        <div class="date-copy">
          <strong>${formatDate(week.startDate)} - ${formatDate(week.endDate)}</strong>
          Ziel ${week.targetPercent} %
        </div>
      </header>

      <article class="goal-card">
        <span class="eyebrow">Wochenziel</span>
        <h2>${escapeHtml(week.goal || "Eine klare Woche bauen")}</h2>
        <p>${escapeHtml(week.focus || "Noch kein Wochenfokus festgelegt.")}</p>
        <button type="button" class="button secondary" data-open-week>Wochenziel bearbeiten</button>
      </article>

      <div class="metric-grid">
        <div class="metric"><span>Punkte</span><strong>${score.earned}<small> / ${score.possible}</small></strong></div>
        <div class="metric"><span>Fortschritt</span><strong>${score.percent}<small> %</small></strong></div>
        <div class="metric"><span>Training · ${training.cardioMinutes} Cardio-Min.</span><strong>${training.completedPlanned}<small> / ${training.planned}</small></strong></div>
        <div class="metric"><span>Ziel</span><strong>${week.targetPercent}<small> %</small></strong></div>
      </div>
      <div class="linear-progress" style="${progressStyle(score.percent)}" aria-label="${score.percent} Prozent Wochenfortschritt"><span></span></div>

      <section class="section-block">
        <div class="section-head">
          <div>
            <span class="eyebrow">Montag bis Sonntag</span>
            <h2>Tagesübersicht</h2>
          </div>
          <span class="section-count">${training.completedTotal} Einheiten</span>
        </div>
        <div class="week-day-list">
          ${weekDates(week.startDate)
            .map((dateKey, index) => {
              const dayScore = scoreDay(week, dateKey);
              const plan = week.dailyPlans[dateKey] ?? [];
              const checkins = week.checkins[dateKey] ?? {};
              const workoutPlan = week.training.plans[dateKey];
              const workoutDoneSession = week.training.sessions.find(
                (session) =>
                  session.date === dateKey &&
                  session.completed &&
                  session.workout,
              );
              const workoutDone = Boolean(workoutDoneSession);
              const cardioDone = week.training.sessions.some(
                (session) =>
                  session.date === dateKey &&
                  session.completed &&
                  session.type === "cardio",
              );
              const workoutLabel = WORKOUTS[
                workoutDoneSession?.workout ?? workoutPlan?.workout
              ]?.label;
              const trainingLabel =
                workoutDone && cardioDone
                  ? `${workoutLabel} ✓ + Cardio`
                  : workoutDone
                    ? `${workoutLabel} ✓`
                    : cardioDone && workoutPlan
                      ? `Cardio ✓ · ${workoutLabel} geplant`
                      : cardioDone
                        ? "Cardio ✓"
                        : workoutPlan?.status === "skipped"
                          ? `${workoutLabel} pausiert`
                          : `${workoutLabel} geplant`;
              return `
                <button type="button" class="week-day-card" data-open-day="${dateKey}">
                  <span class="week-day-top">
                    <span class="week-day-name">
                      <time datetime="${dateKey}">${parseInt(dateKey.slice(-2), 10)}</time>
                      <span>
                        <strong>${DAYS[index].long}${dateKey === today ? " · Heute" : ""}</strong>
                        <small>${plan.filter((habit) => checkins[habit.id]).length} von ${plan.length} Gewohnheiten</small>
                      </span>
                    </span>
                    <span class="day-score">
                      <strong>${dayScore.earned}/${dayScore.possible}</strong>
                      <small>${dayScore.percent} %</small>
                    </span>
                  </span>
                  <span class="week-day-details">
                    ${plan
                      .map(
                        (habit) =>
                          `<i class="habit-dot ${checkins[habit.id] ? "done" : ""}" title="${escapeHtml(habit.name)}"></i>`,
                      )
                      .join("")}
                    ${workoutPlan || workoutDone || cardioDone ? `<span class="training-chip">${trainingLabel}</span>` : ""}
                  </span>
                </button>`;
            })
            .join("")}
        </div>
      </section>
    </section>`;
}

function renderReview() {
  const closedWeeks = Object.values(state.weeks)
    .filter((week) => week.status === "closed")
    .sort((a, b) => b.key.localeCompare(a.key));
  if (!closedWeeks.length) {
    return `
      <section class="view" data-view-panel="review">
        <header class="page-head">
          <div><span class="eyebrow">Rückblick</span><h1>Aus Klarheit lernen</h1></div>
        </header>
        <div class="empty-state">
          <strong>Der erste Rückblick entsteht am Montag.</strong>
          Nach Abschluss deiner aktuellen Woche findest du hier Muster, Vergleich und genau einen nächsten Fokus.
        </div>
      </section>`;
  }

  const selectedKey =
    state.ui.selectedReviewWeek &&
    closedWeeks.some((week) => week.key === state.ui.selectedReviewWeek)
      ? state.ui.selectedReviewWeek
      : closedWeeks[0].key;
  state.ui.selectedReviewWeek = selectedKey;
  const week = state.weeks[selectedKey];
  const review = reviewForWeek(state, selectedKey);
  const comparison =
    review.comparison === null
      ? "Erste Vergleichswoche"
      : `${review.comparison > 0 ? "+" : ""}${review.comparison} Prozentpunkte`;

  return `
    <section class="view" data-view-panel="review">
      <header class="page-head">
        <div><span class="eyebrow">Wochenrückblick</span><h1>Muster erkennen</h1></div>
        <div class="date-copy"><strong>${formatDate(week.startDate)} - ${formatDate(week.endDate)}</strong>${review.isBest ? "Bisher beste Woche" : "Abgeschlossen"}</div>
      </header>

      <div class="review-selector" aria-label="Woche auswählen">
        ${closedWeeks
          .map(
            (item) =>
              `<button type="button" class="${item.key === selectedKey ? "is-active" : ""}" data-review-week="${item.key}">${formatDate(item.startDate)} - ${formatDate(item.endDate)}</button>`,
          )
          .join("")}
      </div>

      <div class="metric-grid">
        <div class="metric"><span>Punkte</span><strong>${review.score.earned}<small> / ${review.score.possible}</small></strong></div>
        <div class="metric"><span>Score</span><strong>${review.score.percent}<small> %</small></strong></div>
        <div class="metric"><span>Workouts · ${review.training.cardioMinutes} Cardio-Min.</span><strong>${review.training.completedPlanned}<small> / ${review.training.planned}</small></strong></div>
        <div class="metric"><span>Vorwoche</span><strong>${review.comparison === null ? "—" : `${review.comparison > 0 ? "+" : ""}${review.comparison}`}<small>${review.comparison === null ? "" : " Pp."}</small></strong></div>
      </div>

      <article class="review-card">
        <div class="habit-result">
          <div><small>Stärkste Gewohnheit</small><strong>${escapeHtml(review.strongest?.name ?? "Keine Daten")}</strong></div>
          <span class="habit-rate">${review.strongest ? Math.round(review.strongest.rate * 100) : 0} %</span>
        </div>
        <div class="habit-result">
          <div><small>Schwächste Gewohnheit</small><strong>${escapeHtml(review.weakest?.name ?? "Keine Daten")}</strong></div>
          <span class="habit-rate">${review.weakest ? Math.round(review.weakest.rate * 100) : 0} %</span>
        </div>
      </article>

      ${renderProgressCard(week.endDate)}

      <article class="review-card highlight">
        <span class="eyebrow">Ein Fokus für nächste Woche</span>
        <h2>Konkreter nächster Schritt</h2>
        <p class="subtle">${escapeHtml(review.recommendation)}</p>
        <p class="subtle">${escapeHtml(comparison)}. ${review.isBest ? "Das ist dein bisheriger Bestwert." : ""}</p>
      </article>

      <article class="review-card">
        <span class="eyebrow">Deine Reflexion</span>
        <form class="reflection-form" data-reflection-form="${selectedKey}">
          <label>Was lief gut?<textarea name="wentWell" maxlength="500">${escapeHtml(week.reflections.wentWell)}</textarea></label>
          <label>Was war schwierig?<textarea name="difficult" maxlength="500">${escapeHtml(week.reflections.difficult)}</textarea></label>
          <label>Worauf möchtest du dich nächste Woche konzentrieren?<textarea name="nextFocus" maxlength="500">${escapeHtml(week.reflections.nextFocus)}</textarea></label>
          <button type="submit" class="button secondary">Reflexion speichern</button>
        </form>
      </article>
    </section>`;
}

function renderSettings() {
  const orderedHabits = [...state.habits].sort((a, b) => a.order - b.order);
  const activeCount = orderedHabits.filter((habit) => habit.active).length;
  const pendingWorkout = nextWorkout(state);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone;

  return `
    <section class="view" data-view-panel="settings">
      <header class="page-head">
        <div><span class="eyebrow">Einstellungen</span><h1>Dein System</h1></div>
        <div class="date-copy"><strong>Version 1.0 Beta</strong>v1.0.0-beta.1</div>
      </header>

      <div class="settings-stack">
        <article class="settings-card">
          <h2>Gewohnheiten</h2>
          <p>Änderungen gelten ab heute. Vergangene Tage und abgeschlossene Wochen bleiben unverändert.</p>
          <button type="button" class="button primary" data-new-habit>Neue Gewohnheit</button>
          ${activeCount > 10 ? `<div class="focus-note">Du hast ${activeCount} aktive Gewohnheiten. Weniger klare Prioritäten lassen sich meist leichter konsequent umsetzen.</div>` : ""}
          <div class="habit-manage-list">
            ${orderedHabits
              .map(
                (habit) => `
                  <div class="habit-manage-item ${habit.active ? "" : "is-inactive"}">
                    <div>
                      <strong>${escapeHtml(habit.name)}</strong>
                      <small>${habit.category} · ${habit.activeDays.length} Tage · ${habit.scoreRelevant ? "Score" : "ohne Score"} · ${habit.active ? "aktiv" : "inaktiv"}</small>
                    </div>
                    <div class="manage-actions">
                      <button type="button" class="mini-button" data-move-habit-up="${habit.id}" aria-label="${escapeHtml(habit.name)} nach oben">↑</button>
                      <button type="button" class="mini-button" data-move-habit-down="${habit.id}" aria-label="${escapeHtml(habit.name)} nach unten">↓</button>
                      <button type="button" class="mini-button" data-edit-habit="${habit.id}" aria-label="${escapeHtml(habit.name)} bearbeiten">✎</button>
                      <button type="button" class="mini-button" data-toggle-habit-active="${habit.id}" aria-label="${habit.active ? "Deaktivieren" : "Aktivieren"}">${habit.active ? "−" : "+"}</button>
                    </div>
                  </div>`,
              )
              .join("")}
          </div>
        </article>

        <article class="settings-card">
          <h2>Training</h2>
          <p>Standardtage gelten für neue Wochen. Das nächste Workout kann unabhängig davon manuell korrigiert werden.</p>
          <fieldset>
            <legend>Bevorzugte Trainingstage</legend>
            <div class="day-checkboxes">
              ${DAYS.map(
                (day, index) => `
                  <label>
                    <input type="checkbox" name="preferredTrainingDays" value="${index}" ${state.settings.preferredTrainingDays.includes(index) ? "checked" : ""} />
                    ${day.short}
                  </label>`,
              ).join("")}
            </div>
          </fieldset>
          <div class="section-block">
            <span class="eyebrow">Nächstes Workout</span>
            <div class="rotation-buttons">
              ${Object.entries(WORKOUTS)
                .map(
                  ([key, workout]) =>
                    `<button type="button" class="button secondary ${pendingWorkout === key ? "is-selected" : ""}" data-set-next-workout="${key}">${workout.label}</button>`,
                )
                .join("")}
            </div>
          </div>
        </article>

        <article class="settings-card">
          <h2>App & Feedback</h2>
          <label class="switch-row">
            <span><strong>Dezente Haptik</strong><small>Kurzes Feedback beim Abhaken, falls unterstützt.</small></span>
            <input type="checkbox" name="haptics" ${state.settings.haptics ? "checked" : ""} />
          </label>
          <div class="settings-buttons">
            ${
              isStandalone
                ? `<button type="button" class="button secondary" disabled>App ist installiert</button>`
                : deferredInstallPrompt
                  ? `<button type="button" class="button primary" data-install-app>App installieren</button>`
                  : isIos
                    ? `<div class="focus-note">Auf iPhone: In Safari „Teilen“ öffnen und „Zum Home-Bildschirm“ wählen.</div>`
                    : `<div class="focus-note">Die Installationsoption erscheint, sobald dein Browser sie anbietet.</div>`
            }
          </div>
        </article>

        <article class="settings-card">
          <h2>Daten bleiben bei dir</h2>
          <p>Exportiere regelmäßig ein Backup. Beim Import wird der lokale Stand vollständig ersetzt.</p>
          <div class="settings-buttons">
            <button type="button" class="button secondary" data-export>Backup als JSON exportieren</button>
            <button type="button" class="button secondary" data-import>Backup wiederherstellen</button>
            <button type="button" class="button danger" data-reset>Alle Daten zurücksetzen</button>
          </div>
        </article>
      </div>
    </section>`;
}

function setView(view) {
  activeView = view;
  window.location.hash = view === "today" ? "today" : view;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openWeekDialog() {
  const week = currentWeek();
  weekForm.elements.goal.value = week.goal;
  const activeHabits = state.habits
    .filter((habit) => habit.active)
    .sort((a, b) => a.order - b.order);
  const focusSelect = weekForm.elements.focusHabitId;
  focusSelect.innerHTML = `
    <option value="">Kein einzelner Gewohnheitsfokus</option>
    ${activeHabits
      .map(
        (habit) =>
          `<option value="${escapeHtml(habit.id)}">${escapeHtml(habit.name)}</option>`,
      )
      .join("")}
  `;
  focusSelect.value = activeHabits.some(
    (habit) => habit.id === week.focusHabitId,
  )
    ? week.focusHabitId
    : "";
  weekForm.elements.targetPercent.value = week.targetPercent;
  document.querySelector("#target-output").value = `${week.targetPercent} %`;
  document.querySelector("#week-training-days").innerHTML = DAYS.map(
    (day, index) => `
      <label>
        <input type="checkbox" name="trainingDays" value="${index}" ${week.plannedTrainingDays.includes(index) ? "checked" : ""} />
        ${day.short}
      </label>`,
  ).join("");
  weekDialog.showModal();
}

function openHabitDialog(habitId = null) {
  const habit = state.habits.find((item) => item.id === habitId);
  habitForm.dataset.habitId = habit?.id ?? "";
  document.querySelector("#habit-dialog-title").textContent = habit
    ? "Gewohnheit bearbeiten"
    : "Neue Gewohnheit";
  habitForm.elements.name.value = habit?.name ?? "";
  habitForm.elements.description.value = habit?.description ?? "";
  habitForm.elements.category.value = habit?.category ?? "Foundation";
  habitForm.elements.scoreRelevant.checked = habit?.scoreRelevant ?? true;
  habitForm.elements.active.checked = habit?.active ?? true;
  const activeDays = habit?.activeDays ?? [0, 1, 2, 3, 4, 5, 6];
  document.querySelector("#habit-active-days").innerHTML = DAYS.map(
    (day, index) => `
      <label>
        <input type="checkbox" name="activeDays" value="${index}" ${activeDays.includes(index) ? "checked" : ""} />
        ${day.short}
      </label>`,
  ).join("");
  habitDialog.showModal();
}

function openMoveDialog(sourceDate) {
  const week = currentWeek();
  moveSourceDate = sourceDate;
  const today = toDateKey(new Date());
  document.querySelector("#move-target-date").innerHTML = weekDates(week.startDate)
    .filter((dateKey) => dateKey !== sourceDate && dateKey >= today)
    .map(
      (dateKey) =>
        `<option value="${dateKey}">${DAYS[weekdayIndex(dateKey)].long}, ${formatDate(dateKey)}</option>`,
    )
    .join("");
  if (!document.querySelector("#move-target-date").options.length) {
    showToast("In dieser Woche ist kein späterer Tag verfügbar.");
    return;
  }
  moveDialog.showModal();
}

function openCardioDialog(sourceDate) {
  cardioSourceDate = sourceDate;
  cardioForm.elements.activity.value = "";
  setCardioDuration(30);
  cardioDialog.showModal();
  window.setTimeout(() => cardioForm.elements.activity.focus(), 50);
}

function setCardioDuration(minutes) {
  const value = Number(minutes);
  cardioForm.elements.duration.value = value;
  document.querySelector("#cardio-duration-output").value = `${value} Min.`;
  document.querySelectorAll("[data-cardio-duration]").forEach((button) => {
    const selected = Number(button.dataset.cardioDuration) === value;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected);
  });
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button, [data-view-link]");
  if (!button) return;

  if (button.dataset.view) {
    setView(button.dataset.view);
    return;
  }
  if (button.dataset.viewLink) {
    event.preventDefault();
    setView(button.dataset.viewLink);
    return;
  }
  if (button.hasAttribute("data-close-dialog")) {
    button.closest("dialog")?.close();
    return;
  }
  if (button.dataset.selectDate) {
    state.ui.selectedDate = button.dataset.selectDate;
    persist();
    return;
  }
  if (button.dataset.openDay) {
    state.ui.selectedDate = button.dataset.openDay;
    setView("today");
    saveState(state);
    return;
  }
  if (button.dataset.toggleHabit) {
    try {
      const done = toggleHabit(
        state,
        selectedDate(),
        button.dataset.toggleHabit,
      );
      if (done) haptic();
      persist(done ? "Erledigt. Starker Schritt." : "Haken entfernt.");
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  if (button.dataset.setDayWorkout) {
    try {
      setWorkoutForDate(
        state,
        button.dataset.workoutDate,
        button.dataset.setDayWorkout,
      );
      persist(
        `${WORKOUTS[button.dataset.setDayWorkout].label} für diesen Tag gesetzt.`,
      );
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  if (button.dataset.clearDayWorkout) {
    try {
      const automaticWorkout = clearWorkoutOverrideForDate(
        state,
        button.dataset.clearDayWorkout,
      );
      persist(
        `Automatik aktiv: ${WORKOUTS[automaticWorkout].label} ist vorgeschlagen.`,
      );
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  if (button.dataset.completeWorkout) {
    const week = currentWeek();
    const dateKey = button.dataset.completeWorkout;
    const planned = Boolean(week.training.plans[dateKey]);
    const completedSession = completeWorkout(state, dateKey, planned);
    haptic();
    persist(`${WORKOUTS[completedSession.workout].label} abgeschlossen.`);
    return;
  }
  if (button.dataset.undoWorkout) {
    undoWorkout(state, button.dataset.undoWorkout);
    persist("Trainingsabschluss entfernt. Die Rotation wurde angepasst.");
    return;
  }
  if (button.dataset.openCardio) {
    openCardioDialog(button.dataset.openCardio);
    return;
  }
  if (button.dataset.undoCardio) {
    try {
      undoCardio(
        state,
        button.dataset.cardioDate,
        button.dataset.undoCardio,
      );
      persist("Cardio-Training entfernt.");
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  if (button.dataset.cardioPreset) {
    cardioForm.elements.activity.value = button.dataset.cardioPreset;
    cardioForm.elements.activity.focus();
    return;
  }
  if (button.dataset.cardioDuration) {
    setCardioDuration(button.dataset.cardioDuration);
    return;
  }
  if (button.dataset.skipWorkout) {
    skipWorkout(state, button.dataset.skipWorkout);
    persist("Heute kein Training. Die Rotation bleibt unverändert.");
    return;
  }
  if (button.dataset.moveWorkout) {
    openMoveDialog(button.dataset.moveWorkout);
    return;
  }
  if (button.hasAttribute("data-open-week")) {
    openWeekDialog();
    return;
  }
  if (button.hasAttribute("data-new-habit")) {
    openHabitDialog();
    return;
  }
  if (button.dataset.editHabit) {
    openHabitDialog(button.dataset.editHabit);
    return;
  }
  if (button.dataset.toggleHabitActive) {
    const habit = state.habits.find(
      (item) => item.id === button.dataset.toggleHabitActive,
    );
    habit.active = !habit.active;
    syncOpenWeekPlans(state, new Date());
    persist(habit.active ? "Gewohnheit aktiviert." : "Gewohnheit deaktiviert.");
    return;
  }
  if (button.dataset.moveHabitUp || button.dataset.moveHabitDown) {
    const habitId = button.dataset.moveHabitUp ?? button.dataset.moveHabitDown;
    const direction = button.dataset.moveHabitUp ? "up" : "down";
    setHabitOrder(state, habitId, direction, new Date());
    persist();
    return;
  }
  if (button.dataset.setNextWorkout) {
    state.training.manualNextWorkout = button.dataset.setNextWorkout;
    persist(`${WORKOUTS[button.dataset.setNextWorkout].label} ist als Nächstes gesetzt.`);
    return;
  }
  if (button.dataset.reviewWeek) {
    state.ui.selectedReviewWeek = button.dataset.reviewWeek;
    persist();
    return;
  }
  if (button.hasAttribute("data-export")) {
    const payload = JSON.stringify(makeExportPayload(state), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hesselink-daily-coach-backup-${toDateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Backup wurde exportiert.");
    return;
  }
  if (button.hasAttribute("data-import")) {
    importFile.click();
    return;
  }
  if (button.hasAttribute("data-reset")) {
    const first = window.confirm(
      "Wirklich alle lokalen Gewohnheiten, Check-ins und Rückblicke löschen?",
    );
    if (!first) return;
    const second = window.confirm(
      "Letzte Sicherheitsabfrage: Dieser Schritt kann nur mit einem vorhandenen Backup rückgängig gemacht werden.",
    );
    if (!second) return;
    clearState();
    state = createDefaultState(new Date());
    saveState(state);
    setView("today");
    showToast("Alle Daten wurden zurückgesetzt.");
    window.setTimeout(openWeekDialog, 250);
    return;
  }
  if (button.hasAttribute("data-install-app") && deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    render();
    return;
  }
  if (button.hasAttribute("data-dismiss-week")) {
    const week = currentWeek();
    week.setupComplete = true;
    saveState(state);
    weekDialog.close();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.name === "haptics") {
    state.settings.haptics = event.target.checked;
    persist(event.target.checked ? "Haptik aktiviert." : "Haptik deaktiviert.");
  }
  if (event.target.name === "preferredTrainingDays") {
    state.settings.preferredTrainingDays = [
      ...document.querySelectorAll(
        'input[name="preferredTrainingDays"]:checked',
      ),
    ]
      .map((input) => Number(input.value))
      .sort((a, b) => a - b);
    persist("Bevorzugte Trainingstage gespeichert.");
  }
});

weekForm.elements.targetPercent.addEventListener("input", (event) => {
  document.querySelector("#target-output").value = `${event.target.value} %`;
});

cardioForm.elements.duration.addEventListener("input", (event) => {
  setCardioDuration(event.target.value);
});

weekForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(weekForm);
  const week = currentWeek();
  week.goal = String(formData.get("goal") ?? "").trim();
  setWeekFocus(state, week, formData.get("focusHabitId"));
  week.targetPercent = Number(formData.get("targetPercent"));
  const trainingDays = formData
    .getAll("trainingDays")
    .map(Number)
    .sort((a, b) => a - b);
  updateWeekTrainingDays(state, week, trainingDays);
  week.setupComplete = true;
  weekDialog.close();
  persist("Wochenfokus gespeichert.");
});

habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(habitForm);
  const name = String(formData.get("name") ?? "").trim();
  const activeDays = formData.getAll("activeDays").map(Number);
  if (!name) {
    showToast("Bitte gib der Gewohnheit einen Namen.");
    return;
  }
  if (!activeDays.length) {
    showToast("Wähle mindestens einen aktiven Wochentag.");
    return;
  }

  const existing = state.habits.find(
    (habit) => habit.id === habitForm.dataset.habitId,
  );
  const values = {
    name,
    description: String(formData.get("description") ?? "").trim(),
    category: CATEGORIES.includes(formData.get("category"))
      ? formData.get("category")
      : "Foundation",
    activeDays,
    scoreRelevant: formData.has("scoreRelevant"),
    active: formData.has("active"),
  };
  if (existing) {
    Object.assign(existing, values);
  } else {
    const maxOrder = Math.max(0, ...state.habits.map((habit) => habit.order));
    state.habits.push({
      id: uid("habit"),
      ...values,
      order: maxOrder + 10,
      createdAt: new Date().toISOString(),
    });
  }
  syncOpenWeekPlans(state, new Date());
  habitDialog.close();
  persist(existing ? "Gewohnheit aktualisiert." : "Gewohnheit hinzugefügt.");
});

moveForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const targetDate = new FormData(moveForm).get("targetDate");
  try {
    moveWorkout(state, moveSourceDate, targetDate);
    state.ui.selectedDate = targetDate;
    moveDialog.close();
    persist(`Training auf ${DAYS[weekdayIndex(targetDate)].long} verschoben.`);
  } catch (error) {
    showToast(error.message);
  }
});

cardioForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const formData = new FormData(cardioForm);
    const activity = String(formData.get("activity") ?? "").trim();
    const duration = Number(formData.get("duration"));
    completeCardio(state, cardioSourceDate, activity, duration);
    cardioDialog.close();
    haptic();
    persist(`${activity} · ${duration} Minuten gespeichert.`);
  } catch (error) {
    showToast(error.message);
  }
});

app.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-reflection-form]");
  if (!form) return;
  event.preventDefault();
  const week = state.weeks[form.dataset.reflectionForm];
  const formData = new FormData(form);
  week.reflections.wentWell = String(formData.get("wentWell") ?? "").trim();
  week.reflections.difficult = String(formData.get("difficult") ?? "").trim();
  week.reflections.nextFocus = String(formData.get("nextFocus") ?? "").trim();
  persist("Reflexion gespeichert.");
});

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const confirmed = window.confirm(
      "Das Backup ersetzt den aktuellen lokalen Datenstand vollständig. Fortfahren?",
    );
    if (!confirmed) return;
    state = replaceState(parsed, new Date());
    state.ui.selectedDate = toDateKey(new Date());
    activeView = "today";
    persist("Backup vollständig wiederhergestellt.");
  } catch (error) {
    showToast(`Import nicht möglich: ${error.message}`);
  } finally {
    importFile.value = "";
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (activeView === "settings") render();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  showToast("Daily Coach wurde installiert.");
});

window.addEventListener("online", () => showToast("Wieder online."));
window.addEventListener("offline", () =>
  showToast("Offline-Modus aktiv. Deine Daten bleiben verfügbar."),
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch((error) => {
      console.warn("Service Worker konnte nicht registriert werden.", error);
    });
  });
}

render();

window.setTimeout(() => {
  if (!currentWeek().setupComplete && !weekDialog.open) {
    openWeekDialog();
  }
}, 350);
