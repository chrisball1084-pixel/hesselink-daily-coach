import assert from "node:assert/strict";
import test from "node:test";

import {
  clearWorkoutOverrideForDate,
  completeCardio,
  completeWorkout,
  createDefaultState,
  ensureWeek,
  habitStreakStats,
  makeExportPayload,
  moveWorkout,
  nextWorkout,
  progressSummary,
  reviewForWeek,
  scoreDay,
  scoreWeek,
  setWeekFocus,
  setWorkoutForDate,
  skipWorkout,
  syncOpenWeekPlans,
  toggleHabit,
  trainingSummary,
  undoCardio,
  undoWorkout,
  validateImportedData,
  weekDates,
  workoutForDate,
} from "../js/core.mjs";

const monday = new Date(2026, 6, 27, 10);
const wednesday = new Date(2026, 6, 29, 10);

test("Wochenfokus wird aus aktiven Gewohnheiten gewählt und historisch eingefroren", () => {
  const state = createDefaultState(monday);
  const week = ensureWeek(state, monday);
  const habit = state.habits.find((item) => item.id === "morning-routine");

  setWeekFocus(state, week, habit.id);
  assert.equal(week.focusHabitId, "morning-routine");
  assert.equal(week.focus, "Morning Routine erledigt");

  habit.name = "Neuer Name";
  assert.equal(week.focus, "Morning Routine erledigt");

  habit.active = false;
  assert.throws(
    () => setWeekFocus(state, week, habit.id),
    /aktive Gewohnheit/,
  );
});

test("Ausgangskonfiguration hat acht Tages- und 56 Wochenpunkte", () => {
  const state = createDefaultState(monday);
  const week = ensureWeek(state, monday);
  assert.deepEqual(scoreDay(week, "2026-07-27"), {
    earned: 0,
    possible: 8,
    percent: 0,
  });
  assert.deepEqual(scoreWeek(week), {
    earned: 0,
    possible: 56,
    percent: 0,
  });
});

test("persönliche Gewohnheitsbeschreibungen sind als Defaults hinterlegt", () => {
  const state = createDefaultState(monday);
  const descriptions = Object.fromEntries(
    state.habits.map((habit) => [habit.id, habit.description]),
  );
  assert.equal(descriptions["morning-routine"], "Longevity Mix");
  assert.equal(descriptions["protein-breakfast"], "min. 25g");
  assert.equal(
    descriptions.supplements,
    "Magnesium, Kreatin, Omega3, B-Komplex",
  );
  assert.equal(
    descriptions["evening-routine"],
    "3h vor Bett keine Mahlzeit, 1h vor Bett kein Handy",
  );
});

test("Gewohnheit lässt sich abhaken und wieder öffnen", () => {
  const state = createDefaultState(monday);
  const week = ensureWeek(state, monday);
  assert.equal(toggleHabit(state, "2026-07-27", "morning-routine"), true);
  assert.equal(scoreDay(week, "2026-07-27").earned, 1);
  assert.equal(toggleHabit(state, "2026-07-27", "morning-routine"), false);
  assert.equal(scoreDay(week, "2026-07-27").earned, 0);
});

test("aktive Wochentage verändern den dynamischen Maximalwert korrekt", () => {
  const state = createDefaultState(monday);
  state.habits.find((habit) => habit.id === "supplements").activeDays = [0];
  syncOpenWeekPlans(state, monday);
  const week = ensureWeek(state, monday);
  assert.equal(scoreWeek(week).possible, 50);
});

test("Änderungen ab heute lassen vergangene Tages-Snapshots unverändert", () => {
  const state = createDefaultState(wednesday);
  const week = ensureWeek(state, wednesday);
  assert.equal(week.dailyPlans["2026-07-27"].length, 8);
  state.habits.find((habit) => habit.id === "supplements").active = false;
  syncOpenWeekPlans(state, wednesday);
  assert.equal(week.dailyPlans["2026-07-27"].length, 8);
  assert.equal(week.dailyPlans["2026-07-29"].length, 7);
  assert.equal(week.dailyPlans["2026-08-02"].length, 7);
});

test("abgeschlossene Wochen behalten Konfiguration und Maximalwert", () => {
  const state = createDefaultState(monday);
  const firstWeek = ensureWeek(state, monday);
  assert.equal(scoreWeek(firstWeek).possible, 56);
  ensureWeek(state, new Date(2026, 7, 3, 10));
  assert.equal(firstWeek.status, "closed");
  state.habits.find((habit) => habit.id === "water").active = false;
  syncOpenWeekPlans(state, new Date(2026, 7, 3, 10));
  assert.equal(scoreWeek(firstWeek).possible, 56);
  assert.equal(scoreWeek(state.weeks["2026-08-03"]).possible, 49);
});

test("Workout-Rotation folgt ausschließlich tatsächlichen Abschlüssen", () => {
  const state = createDefaultState(monday);
  assert.equal(nextWorkout(state), "day1");
  completeWorkout(state, "2026-07-27", true);
  assert.equal(nextWorkout(state), "day2");
  skipWorkout(state, "2026-07-29");
  assert.equal(nextWorkout(state), "day2");
  ensureWeek(state, new Date(2026, 7, 3, 10));
  completeWorkout(state, "2026-08-03", true);
  assert.equal(nextWorkout(state), "day1");
});

test("geplante Trainingstage erhalten automatisch eine alternierende Folge", () => {
  const state = createDefaultState(monday);
  const week = ensureWeek(state, monday);
  assert.equal(week.training.plans["2026-07-27"].workout, "day1");
  assert.equal(week.training.plans["2026-07-29"].workout, "day2");
  assert.equal(week.training.plans["2026-07-31"].workout, "day1");
});

test("ausgelassenes Training hält die tatsächliche Rotation und berechnet Vorschläge neu", () => {
  const state = createDefaultState(monday);
  skipWorkout(state, "2026-07-27");
  const week = ensureWeek(state, monday);
  assert.equal(nextWorkout(state), "day1");
  assert.equal(week.training.plans["2026-07-29"].workout, "day1");
  assert.equal(week.training.plans["2026-07-31"].workout, "day2");
});

test("Workout-Vorschlag eines einzelnen Tages kann manuell angepasst werden", () => {
  const state = createDefaultState(monday);
  setWorkoutForDate(state, "2026-07-29", "day1");
  const week = ensureWeek(state, monday);
  assert.equal(workoutForDate(state, "2026-07-29"), "day1");
  assert.equal(week.training.plans["2026-07-29"].manualWorkout, true);
  assert.equal(week.training.plans["2026-07-31"].workout, "day2");
  clearWorkoutOverrideForDate(state, "2026-07-29");
  assert.equal(week.training.plans["2026-07-29"].manualWorkout, undefined);
  assert.equal(week.training.plans["2026-07-29"].workout, "day2");
  assert.equal(week.training.plans["2026-07-31"].workout, "day1");
});

test("Verschieben eines Trainings schaltet die Rotation nicht weiter", () => {
  const state = createDefaultState(monday);
  moveWorkout(state, "2026-07-27", "2026-07-28");
  const week = ensureWeek(state, monday);
  assert.equal(week.training.plans["2026-07-27"], undefined);
  assert.equal(week.training.plans["2026-07-28"].status, "planned");
  assert.equal(nextWorkout(state), "day1");
});

test("manuelle Rotationskorrektur gilt für das nächste Workout", () => {
  const state = createDefaultState(monday);
  state.training.manualNextWorkout = "day2";
  assert.equal(nextWorkout(state), "day2");
  completeWorkout(state, "2026-07-27", true);
  assert.equal(state.training.manualNextWorkout, null);
  assert.equal(nextWorkout(state), "day1");
});

test("Cardio kann neben Krafttraining bestehen und verändert die Rotation nicht", () => {
  const state = createDefaultState(monday);
  const cardio = completeCardio(
    state,
    "2026-07-27",
    "Fahrradfahren",
    45,
  );
  assert.equal(nextWorkout(state), "day1");
  completeWorkout(state, "2026-07-27", true);
  assert.equal(nextWorkout(state), "day2");
  assert.deepEqual(trainingSummary(state.weeks["2026-07-27"]), {
    planned: 3,
    completedPlanned: 1,
    completedTotal: 2,
    completedStrength: 1,
    completedCardio: 1,
    cardioMinutes: 45,
    extraStrength: 0,
  });

  undoWorkout(state, "2026-07-27");
  assert.equal(
    state.weeks["2026-07-27"].training.sessions[0].label,
    "Fahrradfahren",
  );
  assert.equal(nextWorkout(state), "day1");
  undoCardio(state, "2026-07-27", cardio.id);
  assert.equal(state.weeks["2026-07-27"].training.sessions.length, 0);
});

test("Gewohnheitsserien und persönliche Bestwerte laufen über Wochen weiter", () => {
  const state = createDefaultState(monday);
  const firstWeekDates = weekDates(monday);
  firstWeekDates.slice(0, 5).forEach((dateKey) => {
    toggleHabit(state, dateKey, "no-bullshit");
  });
  const firstStats = habitStreakStats(
    state,
    "no-bullshit",
    "2026-07-31",
  );
  assert.equal(firstStats.current, 5);
  assert.equal(firstStats.best, 5);
  assert.equal(firstStats.isPersonalRecord, true);

  ensureWeek(state, new Date(2026, 7, 3, 10));
  toggleHabit(state, "2026-08-03", "no-bullshit");
  toggleHabit(state, "2026-08-04", "no-bullshit");
  const laterStats = habitStreakStats(
    state,
    "no-bullshit",
    "2026-08-04",
  );
  assert.equal(laterStats.current, 2);
  assert.equal(laterStats.best, 5);
});

test("Trainingsfortschritt zeigt den nächsten Meilenstein", () => {
  const state = createDefaultState(monday);
  ["2026-07-27", "2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31"].forEach(
    (dateKey) => completeWorkout(state, dateKey),
  );
  const progress = progressSummary(state, "2026-07-31");
  assert.equal(progress.strengthCount, 5);
  assert.equal(progress.previousTrainingMilestone, 5);
  assert.equal(progress.nextTrainingMilestone, 10);
});

test("Rückblick erkennt stärkste und schwächste Gewohnheit", () => {
  const state = createDefaultState(monday);
  const week = ensureWeek(state, monday);
  for (const dateKey of weekDates(monday)) {
    toggleHabit(state, dateKey, "morning-routine");
  }
  toggleHabit(state, "2026-07-27", "evening-routine");
  week.status = "closed";
  const review = reviewForWeek(state, week.key);
  assert.equal(review.strongest.id, "morning-routine");
  assert.equal(review.strongest.completed, 7);
  assert.equal(review.weakest.id, "protein-breakfast");
  assert.equal(review.weakest.completed, 0);
  assert.equal(review.progress.topCurrentStreak.id, "morning-routine");
  assert.equal(review.progress.topCurrentStreak.current, 7);
  assert.equal(review.progress.nextTrainingMilestone, 5);
  assert.match(review.recommendation, /High-Protein-Frühstück/);
});

test("Export und Import erhalten den vollständigen Datensatz", () => {
  const state = createDefaultState(monday);
  toggleHabit(state, "2026-07-27", "morning-routine");
  state.weeks["2026-07-27"].goal = "Konsequent bleiben";
  const payload = makeExportPayload(state);
  const restored = validateImportedData(
    JSON.parse(JSON.stringify(payload)),
  );
  assert.deepEqual(restored, state);
});

test("Import weist unbekannte Datenversionen zurück", () => {
  const state = createDefaultState(monday);
  state.schemaVersion = 99;
  assert.throws(
    () => validateImportedData(state),
    /Datenversion 99 wird nicht unterstützt/,
  );
});
