export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "hesselink.dailyCoach.v1";
export const APP_VERSION = "1.0.0-beta.2";

export const DAYS = [
  { short: "Mo", long: "Montag" },
  { short: "Di", long: "Dienstag" },
  { short: "Mi", long: "Mittwoch" },
  { short: "Do", long: "Donnerstag" },
  { short: "Fr", long: "Freitag" },
  { short: "Sa", long: "Samstag" },
  { short: "So", long: "Sonntag" },
];

export const CATEGORIES = ["Foundation", "Performance", "Discipline"];

export const WORKOUTS = {
  day1: {
    label: "Day 1",
    exercises: [
      "Beinpresse - 10 bis 15 Wiederholungen",
      "Brust Maschine - 8 bis 12 Wiederholungen",
      "Latzug weiter Griff - 8 bis 12 Wiederholungen",
      "Bizeps Curl Maschine - 10 bis 12 Wiederholungen",
      "Trizeps Push am Seilzug - 10 bis 12 Wiederholungen",
    ],
  },
  day2: {
    label: "Day 2",
    exercises: [
      "Squats - 10 bis 15 Wiederholungen",
      "Butterfly - 8 bis 12 Wiederholungen",
      "Rudern am Kabel - 8 bis 12 Wiederholungen",
      "Beinheben für den Bauch",
      "Hyperextensions für den Core",
    ],
  },
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_HABITS = [
  makeHabit(
    "morning-routine",
    "Morning Routine erledigt",
    "Foundation",
    10,
    "Longevity Mix",
  ),
  makeHabit(
    "protein-breakfast",
    "High-Protein-Frühstück",
    "Foundation",
    20,
    "min. 25g",
  ),
  makeHabit(
    "movement",
    "20 Minuten Bewegung oder mindestens 7.000 Schritte",
    "Performance",
    30,
  ),
  makeHabit(
    "supplements",
    "Supplements",
    "Performance",
    40,
    "Magnesium, Kreatin, Omega3, B-Komplex",
  ),
  makeHabit("protein-shake", "Protein Shake", "Performance", 45),
  makeHabit("water", "2-3 Liter Wasser", "Discipline", 50),
  makeHabit(
    "protein-goal",
    "Proteinziel erreicht",
    "Discipline",
    60,
    "1.5g pro kg Körpergewicht",
  ),
  makeHabit(
    "no-bullshit",
    "No Bullshit",
    "Discipline",
    70,
    "Kein Zucker und kein Cheat Meal.",
  ),
  makeHabit(
    "evening-routine",
    "3-2-1-Abendroutine erledigt",
    "Discipline",
    80,
    "3h vor Bett keine Mahlzeit, 1h vor Bett kein Handy",
  ),
];

function makeHabit(id, name, category, order, description = "") {
  return {
    id,
    name,
    description,
    category,
    order,
    active: true,
    activeDays: [...ALL_DAYS],
    scoreRelevant: true,
    createdAt: "2026-07-29T00:00:00.000Z",
  };
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function uid(prefix = "id") {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

export function toDateKey(input) {
  const date = input instanceof Date ? input : parseDateKey(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDays(input, amount) {
  const date = input instanceof Date ? new Date(input) : parseDateKey(input);
  date.setDate(date.getDate() + amount);
  return date;
}

export function startOfWeek(input = new Date()) {
  const date = input instanceof Date ? new Date(input) : parseDateKey(input);
  date.setHours(12, 0, 0, 0);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

export function weekKeyFor(input = new Date()) {
  return toDateKey(startOfWeek(input));
}

export function weekDates(input = new Date()) {
  const monday = startOfWeek(input);
  return DAYS.map((_, index) => toDateKey(addDays(monday, index)));
}

export function weekdayIndex(input) {
  const date = input instanceof Date ? input : parseDateKey(input);
  return (date.getDay() + 6) % 7;
}

export function formatDate(input, options = {}) {
  const date = input instanceof Date ? input : parseDateKey(input);
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: options.year ? "numeric" : undefined,
  }).format(date);
}

export function createDefaultState(now = new Date()) {
  const timestamp = now.toISOString();
  const state = {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: "Hesselink",
    },
    settings: {
      haptics: true,
      preferredTrainingDays: [0, 2, 4],
      defaultTargetPercent: 80,
    },
    habits: deepClone(DEFAULT_HABITS).map((habit) => ({
      ...habit,
      createdAt: timestamp,
    })),
    weeks: {},
    training: {
      manualNextWorkout: null,
    },
    ui: {
      selectedDate: toDateKey(now),
      selectedReviewWeek: null,
      onboardingSeen: false,
    },
    meta: {
      createdAt: timestamp,
      updatedAt: timestamp,
      appVersion: APP_VERSION,
    },
  };
  ensureWeek(state, now);
  return state;
}

export function addMissingDefaultHabits(state, now = new Date()) {
  const existingIds = new Set(state.habits.map((habit) => habit.id));
  const missing = DEFAULT_HABITS.filter((habit) => !existingIds.has(habit.id));
  if (!missing.length) return false;

  state.habits.push(
    ...deepClone(missing).map((habit) => ({
      ...habit,
      createdAt: now.toISOString(),
    })),
  );
  return true;
}

function habitSnapshot(habit) {
  return {
    id: habit.id,
    name: habit.name.trim(),
    description: habit.description?.trim() ?? "",
    category: CATEGORIES.includes(habit.category)
      ? habit.category
      : "Foundation",
    order: Number.isFinite(habit.order) ? habit.order : 0,
    scoreRelevant: Boolean(habit.scoreRelevant),
  };
}

function planForDate(habits, dateKey) {
  const dayIndex = weekdayIndex(dateKey);
  return habits
    .filter(
      (habit) =>
        habit.active &&
        Array.isArray(habit.activeDays) &&
        habit.activeDays.includes(dayIndex),
    )
    .sort((a, b) => a.order - b.order)
    .map(habitSnapshot);
}

export function createWeek(state, referenceDate = new Date()) {
  const dates = weekDates(referenceDate);
  const key = dates[0];
  const plans = {};
  const checkins = {};
  const trainingPlans = {};

  dates.forEach((dateKey, index) => {
    plans[dateKey] = planForDate(state.habits, dateKey);
    checkins[dateKey] = {};
    if (state.settings.preferredTrainingDays.includes(index)) {
      trainingPlans[dateKey] = { status: "planned" };
    }
  });

  const week = {
    key,
    startDate: dates[0],
    endDate: dates[6],
    status: "open",
    setupComplete: false,
    goal: "",
    focusHabitId: "",
    focus: "",
    targetPercent: state.settings.defaultTargetPercent,
    plannedTrainingDays: [...state.settings.preferredTrainingDays],
    dailyPlans: plans,
    checkins,
    training: {
      plans: trainingPlans,
      sessions: [],
      extraSelections: {},
    },
    reflections: {
      wentWell: "",
      difficult: "",
      nextFocus: "",
    },
    createdAt: new Date().toISOString(),
    closedAt: null,
  };
  resequencePlannedWorkouts(state, week);
  return week;
}

export function ensureWeek(state, referenceDate = new Date()) {
  const key = weekKeyFor(referenceDate);
  Object.values(state.weeks).forEach((week) => {
    if (week.status === "open" && week.key < key) {
      week.status = "closed";
      week.closedAt = new Date().toISOString();
    }
  });

  if (!state.weeks[key]) {
    state.weeks[key] = createWeek(state, referenceDate);
  }
  state.weeks[key].focusHabitId ??= "";
  normalizeTrainingShape(state, state.weeks[key]);

  const dates = weekDates(referenceDate);
  const todayKey = toDateKey(referenceDate);
  if (!dates.includes(state.ui.selectedDate)) {
    state.ui.selectedDate = todayKey;
  }

  state.meta.updatedAt = new Date().toISOString();
  return state.weeks[key];
}

export function selectCurrentDay(state, now = new Date()) {
  ensureWeek(state, now);
  const todayKey = toDateKey(now);
  const changed = state.ui.selectedDate !== todayKey;
  state.ui.selectedDate = todayKey;
  state.meta.updatedAt = now.toISOString();
  return changed;
}

export function getWeekForDate(state, dateKey) {
  return state.weeks[weekKeyFor(dateKey)] ?? null;
}

export function setWeekFocus(state, week, habitId) {
  const selectedId = String(habitId ?? "");
  if (!selectedId) {
    week.focusHabitId = "";
    week.focus = "";
    return null;
  }

  const habit = state.habits.find(
    (item) => item.id === selectedId && item.active,
  );
  if (!habit) {
    throw new Error("Der Wochenfokus muss eine aktive Gewohnheit sein.");
  }

  week.focusHabitId = habit.id;
  week.focus = habit.name;
  return habit;
}

export function syncOpenWeekPlans(state, fromDate = new Date()) {
  const fromKey = toDateKey(fromDate);
  const week = ensureWeek(state, fromDate);
  weekDates(fromDate).forEach((dateKey) => {
    if (dateKey >= fromKey) {
      week.dailyPlans[dateKey] = planForDate(state.habits, dateKey);
      week.checkins[dateKey] ??= {};
    }
  });
  state.meta.updatedAt = new Date().toISOString();
  return week;
}

export function updateWeekTrainingDays(state, week, dayIndexes) {
  const completedPlannedDays = (week.training?.sessions ?? [])
    .filter((session) => session.completed && session.planned)
    .map((session) => weekdayIndex(session.date));
  const uniqueDays = [...new Set([...dayIndexes, ...completedPlannedDays])]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);
  const existingSessions = week.training.sessions ?? [];
  const plans = {};
  weekDates(week.startDate).forEach((dateKey, index) => {
    if (uniqueDays.includes(index)) {
      const wasCompleted = existingSessions.some(
        (session) => session.date === dateKey && session.planned,
      );
      const existingPlan = week.training.plans?.[dateKey] ?? {};
      plans[dateKey] = {
        ...existingPlan,
        status: wasCompleted ? "completed" : "planned",
      };
    }
  });
  week.plannedTrainingDays = uniqueDays;
  week.training.plans = plans;
  resequencePlannedWorkouts(state, week);
}

export function toggleHabit(state, dateKey, habitId) {
  const week = getWeekForDate(state, dateKey);
  if (!week || week.status !== "open") {
    throw new Error("Dieser Tag ist nicht mehr bearbeitbar.");
  }
  const planned = week.dailyPlans[dateKey]?.some(
    (habit) => habit.id === habitId,
  );
  if (!planned) {
    throw new Error("Diese Gewohnheit ist an dem Tag nicht aktiv.");
  }
  week.checkins[dateKey] ??= {};
  const nextValue = !week.checkins[dateKey][habitId];
  week.checkins[dateKey][habitId] = nextValue;
  state.meta.updatedAt = new Date().toISOString();
  return nextValue;
}

export function scoreDay(week, dateKey) {
  const plan = week.dailyPlans[dateKey] ?? [];
  const checkins = week.checkins[dateKey] ?? {};
  const scoreHabits = plan.filter((habit) => habit.scoreRelevant);
  const earned = scoreHabits.reduce(
    (total, habit) => total + (checkins[habit.id] ? 1 : 0),
    0,
  );
  const possible = scoreHabits.length;
  return {
    earned,
    possible,
    percent: possible ? Math.round((earned / possible) * 100) : 0,
  };
}

export function scoreWeek(week) {
  const result = Object.keys(week.dailyPlans)
    .sort()
    .reduce(
      (total, dateKey) => {
        const day = scoreDay(week, dateKey);
        total.earned += day.earned;
        total.possible += day.possible;
        return total;
      },
      { earned: 0, possible: 0 },
    );
  result.percent = result.possible
    ? Math.round((result.earned / result.possible) * 100)
    : 0;
  return result;
}

export function completedSessions(state) {
  return Object.values(state.weeks)
    .flatMap((week) => week.training?.sessions ?? [])
    .filter((session) => session.completed && session.workout)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare || a.completedAt.localeCompare(b.completedAt);
    });
}

export function nextWorkout(state) {
  if (state.training.manualNextWorkout) {
    return state.training.manualNextWorkout;
  }
  const sessions = completedSessions(state);
  const latest = sessions.at(-1);
  if (!latest) return "day1";
  return latest.workout === "day1" ? "day2" : "day1";
}

function oppositeWorkout(workout) {
  return workout === "day1" ? "day2" : "day1";
}

function isWorkout(value) {
  return value === "day1" || value === "day2";
}

export function normalizeTrainingShape(state, week) {
  week.training ??= {};
  week.training.plans ??= {};
  week.training.sessions ??= [];
  week.training.extraSelections ??= {};
  week.plannedTrainingDays ??= Object.keys(week.training.plans)
    .map(weekdayIndex)
    .sort((a, b) => a - b);
  resequencePlannedWorkouts(state, week);
  return week;
}

export function resequencePlannedWorkouts(state, week) {
  week.training ??= { plans: {}, sessions: [], extraSelections: {} };
  week.training.plans ??= {};
  week.training.sessions ??= [];
  week.training.extraSelections ??= {};

  const priorSessions = completedSessions(state).filter(
    (session) => session.date < week.startDate,
  );
  const priorLatest = priorSessions.at(-1);
  let sequence = state.training.manualNextWorkout
    ? state.training.manualNextWorkout
    : priorLatest
      ? oppositeWorkout(priorLatest.workout)
      : "day1";

  weekDates(week.startDate).forEach((dateKey) => {
    const plan = week.training.plans[dateKey];
    const completed = week.training.sessions
      .filter(
        (session) =>
          session.date === dateKey &&
          session.completed &&
          isWorkout(session.workout),
      )
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
      .at(-1);

    if (completed) {
      if (plan) {
        plan.workout = completed.workout;
        plan.status = "completed";
      }
      sequence = oppositeWorkout(completed.workout);
      return;
    }

    if (!plan) return;
    if (plan.status === "completed") plan.status = "planned";

    if (plan.status === "skipped") {
      if (!isWorkout(plan.workout)) plan.workout = sequence;
      return;
    }

    const selected =
      plan.manualWorkout && isWorkout(plan.workout)
        ? plan.workout
        : sequence;
    plan.workout = selected;
    sequence = oppositeWorkout(selected);
  });
  return week;
}

export function workoutForDate(state, dateKey) {
  const week = getWeekForDate(state, dateKey);
  const completed = week?.training?.sessions?.find(
    (session) =>
      session.date === dateKey &&
      session.completed &&
      isWorkout(session.workout),
  );
  if (completed) return completed.workout;
  const planned = week?.training?.plans?.[dateKey]?.workout;
  if (isWorkout(planned)) return planned;
  const extra = week?.training?.extraSelections?.[dateKey];
  return isWorkout(extra) ? extra : nextWorkout(state);
}

export function setWorkoutForDate(state, dateKey, workout) {
  if (!isWorkout(workout)) {
    throw new Error("Unbekanntes Workout.");
  }
  const week = getWeekForDate(state, dateKey);
  if (!week || week.status !== "open") {
    throw new Error("Diese Woche ist nicht mehr bearbeitbar.");
  }
  normalizeTrainingShape(state, week);
  const plan = week.training.plans[dateKey];
  if (plan) {
    plan.workout = workout;
    plan.manualWorkout = true;
  } else {
    week.training.extraSelections[dateKey] = workout;
  }
  resequencePlannedWorkouts(state, week);
  state.meta.updatedAt = new Date().toISOString();
  return workout;
}

export function clearWorkoutOverrideForDate(state, dateKey) {
  const week = getWeekForDate(state, dateKey);
  if (!week || week.status !== "open") {
    throw new Error("Diese Woche ist nicht mehr bearbeitbar.");
  }
  normalizeTrainingShape(state, week);
  const plan = week.training.plans[dateKey];
  if (plan) {
    delete plan.manualWorkout;
  } else {
    delete week.training.extraSelections[dateKey];
  }
  resequencePlannedWorkouts(state, week);
  state.meta.updatedAt = new Date().toISOString();
  return workoutForDate(state, dateKey);
}

export function completeWorkout(state, dateKey, planned = false) {
  const week = getWeekForDate(state, dateKey);
  if (!week || week.status !== "open") {
    throw new Error("Diese Woche ist nicht mehr bearbeitbar.");
  }
  normalizeTrainingShape(state, week);
  const existing = week.training.sessions.find(
    (session) =>
      session.date === dateKey && session.completed && session.workout,
  );
  if (existing) return existing;

  const session = {
    id: uid("workout"),
    date: dateKey,
    workout: workoutForDate(state, dateKey),
    planned,
    completed: true,
    completedAt: new Date().toISOString(),
  };
  week.training.sessions.push(session);
  if (week.training.plans[dateKey]) {
    week.training.plans[dateKey].status = "completed";
    session.planned = true;
  }
  delete week.training.extraSelections?.[dateKey];
  state.training.manualNextWorkout = null;
  resequencePlannedWorkouts(state, week);
  state.meta.updatedAt = new Date().toISOString();
  return session;
}

export function undoWorkout(state, dateKey) {
  const week = getWeekForDate(state, dateKey);
  if (!week || week.status !== "open") {
    throw new Error("Diese Woche ist nicht mehr bearbeitbar.");
  }
  const removed = week.training.sessions.find(
    (session) =>
      session.date === dateKey && session.completed && session.workout,
  );
  const before = week.training.sessions.length;
  week.training.sessions = week.training.sessions.filter(
    (session) => session.date !== dateKey || !session.workout,
  );
  if (week.training.plans[dateKey]) {
    week.training.plans[dateKey].status = "planned";
  } else if (removed?.workout) {
    week.training.extraSelections ??= {};
    week.training.extraSelections[dateKey] = removed.workout;
  }
  resequencePlannedWorkouts(state, week);
  state.meta.updatedAt = new Date().toISOString();
  return before !== week.training.sessions.length;
}

export function completeCardio(
  state,
  dateKey,
  activityName,
  durationMinutes = 30,
) {
  const week = getWeekForDate(state, dateKey);
  if (!week || week.status !== "open") {
    throw new Error("Diese Woche ist nicht mehr bearbeitbar.");
  }
  const label = String(activityName ?? "").trim().slice(0, 60);
  if (!label) {
    throw new Error("Bitte gib deinem Cardio-Training einen Namen.");
  }
  const duration = Number(durationMinutes);
  if (!Number.isFinite(duration) || duration < 5 || duration > 300) {
    throw new Error("Die Cardio-Dauer muss zwischen 5 und 300 Minuten liegen.");
  }
  const session = {
    id: uid("cardio"),
    date: dateKey,
    type: "cardio",
    label,
    durationMinutes: Math.round(duration),
    planned: false,
    completed: true,
    completedAt: new Date().toISOString(),
  };
  week.training.sessions.push(session);
  state.meta.updatedAt = new Date().toISOString();
  return session;
}

export function undoCardio(state, dateKey, sessionId) {
  const week = getWeekForDate(state, dateKey);
  if (!week || week.status !== "open") {
    throw new Error("Diese Woche ist nicht mehr bearbeitbar.");
  }
  const before = week.training.sessions.length;
  week.training.sessions = week.training.sessions.filter(
    (session) =>
      !(
        session.id === sessionId &&
        session.date === dateKey &&
        session.type === "cardio"
      ),
  );
  state.meta.updatedAt = new Date().toISOString();
  return before !== week.training.sessions.length;
}

export function skipWorkout(state, dateKey) {
  const week = getWeekForDate(state, dateKey);
  if (!week?.training.plans[dateKey]) return false;
  undoWorkout(state, dateKey);
  week.training.plans[dateKey].status = "skipped";
  resequencePlannedWorkouts(state, week);
  return true;
}

export function moveWorkout(state, fromDateKey, toDateKey) {
  const fromWeek = getWeekForDate(state, fromDateKey);
  const toWeek = getWeekForDate(state, toDateKey);
  if (!fromWeek || fromWeek !== toWeek || fromWeek.status !== "open") {
    throw new Error("Training kann nur innerhalb der aktuellen Woche verschoben werden.");
  }
  if (!fromWeek.training.plans[fromDateKey]) {
    throw new Error("Am Ausgangstag ist kein Training geplant.");
  }
  if (fromWeek.training.sessions.some((session) => session.date === fromDateKey)) {
    throw new Error("Ein abgeschlossenes Training kann nicht verschoben werden.");
  }
  const sourcePlan = fromWeek.training.plans[fromDateKey];
  delete fromWeek.training.plans[fromDateKey];
  fromWeek.training.plans[toDateKey] = {
    ...sourcePlan,
    status: "planned",
  };
  fromWeek.plannedTrainingDays = Object.keys(fromWeek.training.plans)
    .map(weekdayIndex)
    .sort((a, b) => a - b);
  resequencePlannedWorkouts(state, fromWeek);
  state.meta.updatedAt = new Date().toISOString();
}

export function trainingSummary(week) {
  const planned = Object.keys(week.training?.plans ?? {}).length;
  const completedPlanned = (week.training?.sessions ?? []).filter(
    (session) => session.completed && session.planned && session.workout,
  ).length;
  const completedStrength = (week.training?.sessions ?? []).filter(
    (session) => session.completed && session.workout,
  ).length;
  const completedCardio = (week.training?.sessions ?? []).filter(
    (session) => session.completed && session.type === "cardio",
  ).length;
  const cardioMinutes = (week.training?.sessions ?? []).reduce(
    (total, session) =>
      total +
      (session.completed && session.type === "cardio"
        ? Number(session.durationMinutes) || 0
        : 0),
    0,
  );
  const completedTotal = completedStrength + completedCardio;
  return {
    planned,
    completedPlanned,
    completedTotal,
    completedStrength,
    completedCardio,
    cardioMinutes,
    extraStrength: Math.max(0, completedStrength - completedPlanned),
  };
}

function habitOccurrences(state, habitId, throughDateKey) {
  return Object.values(state.weeks)
    .flatMap((week) =>
      Object.keys(week.dailyPlans ?? {})
        .filter((dateKey) => dateKey <= throughDateKey)
        .flatMap((dateKey) => {
          const habit = (week.dailyPlans[dateKey] ?? []).find(
            (item) => item.id === habitId,
          );
          if (!habit) return [];
          return [
            {
              date: dateKey,
              name: habit.name,
              done: Boolean(week.checkins?.[dateKey]?.[habitId]),
            },
          ];
        }),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function habitStreakStats(
  state,
  habitId,
  throughDate = new Date(),
) {
  const throughKey =
    throughDate instanceof Date ? toDateKey(throughDate) : throughDate;
  const occurrences = habitOccurrences(state, habitId, throughKey);
  const todayKey = toDateKey(new Date());

  let best = 0;
  let run = 0;
  occurrences.forEach((occurrence) => {
    if (occurrence.done) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  });

  let current = 0;
  let index = occurrences.length - 1;
  if (
    throughKey === todayKey &&
    occurrences[index]?.date === todayKey &&
    !occurrences[index].done
  ) {
    index -= 1;
  }
  for (; index >= 0; index -= 1) {
    if (!occurrences[index].done) break;
    current += 1;
  }

  return {
    id: habitId,
    name: occurrences.at(-1)?.name ?? habitId,
    current,
    best,
    isPersonalRecord: current >= 3 && current === best,
  };
}

export function progressSummary(state, throughDate = new Date()) {
  const throughKey =
    throughDate instanceof Date ? toDateKey(throughDate) : throughDate;
  const habitIds = new Set();
  Object.values(state.weeks).forEach((week) => {
    Object.entries(week.dailyPlans ?? {}).forEach(([dateKey, habits]) => {
      if (dateKey > throughKey) return;
      habits.forEach((habit) => habitIds.add(habit.id));
    });
  });
  const streaks = [...habitIds]
    .map((habitId) => habitStreakStats(state, habitId, throughKey))
    .sort(
      (a, b) =>
        b.current - a.current ||
        b.best - a.best ||
        a.name.localeCompare(b.name, "de"),
    );
  const records = [...streaks]
    .filter((streak) => streak.best >= 3)
    .sort(
      (a, b) =>
        b.best - a.best ||
        b.current - a.current ||
        a.name.localeCompare(b.name, "de"),
    );
  const strengthSessions = completedSessions(state).filter(
    (session) => session.date <= throughKey,
  );
  const cardioSessions = Object.values(state.weeks)
    .flatMap((week) => week.training?.sessions ?? [])
    .filter(
      (session) =>
        session.completed &&
        session.type === "cardio" &&
        session.date <= throughKey,
    );
  const strengthCount = strengthSessions.length;
  const milestones = [5, 10, 15, 25, 50, 75, 100];
  const nextMilestone =
    milestones.find((milestone) => milestone > strengthCount) ??
    Math.ceil((strengthCount + 1) / 25) * 25;
  const previousMilestone =
    [...milestones].reverse().find((milestone) => milestone <= strengthCount) ??
    0;

  return {
    streaks,
    activeStreaks: streaks.filter((streak) => streak.current >= 3),
    records,
    topCurrentStreak: streaks.find((streak) => streak.current >= 3) ?? null,
    topRecord: records[0] ?? null,
    strengthCount,
    nextTrainingMilestone: nextMilestone,
    previousTrainingMilestone: previousMilestone,
    trainingMilestonePercent: Math.round(
      ((strengthCount - previousMilestone) /
        Math.max(1, nextMilestone - previousMilestone)) *
        100,
    ),
    cardioCount: cardioSessions.length,
    cardioMinutes: cardioSessions.reduce(
      (total, session) => total + (Number(session.durationMinutes) || 0),
      0,
    ),
  };
}

export function habitPerformance(week) {
  const performance = new Map();
  Object.keys(week.dailyPlans)
    .sort()
    .forEach((dateKey) => {
      const checkins = week.checkins[dateKey] ?? {};
      (week.dailyPlans[dateKey] ?? []).forEach((habit) => {
        if (!habit.scoreRelevant) return;
        const current = performance.get(habit.id) ?? {
          id: habit.id,
          name: habit.name,
          completed: 0,
          possible: 0,
          order: habit.order,
        };
        current.name = habit.name;
        current.possible += 1;
        current.completed += checkins[habit.id] ? 1 : 0;
        current.rate = current.possible
          ? current.completed / current.possible
          : 0;
        performance.set(habit.id, current);
      });
    });
  return [...performance.values()];
}

function priorClosedWeek(state, week) {
  return Object.values(state.weeks)
    .filter((candidate) => candidate.status === "closed" && candidate.key < week.key)
    .sort((a, b) => a.key.localeCompare(b.key))
    .at(-1);
}

export function reviewForWeek(state, weekKey) {
  const week = state.weeks[weekKey];
  if (!week) return null;
  const score = scoreWeek(week);
  const training = trainingSummary(week);
  const progress = progressSummary(state, week.endDate);
  const habits = habitPerformance(week);
  const strongest = [...habits].sort(
    (a, b) => b.rate - a.rate || a.order - b.order,
  )[0] ?? null;
  const weakest = [...habits].sort(
    (a, b) => a.rate - b.rate || a.order - b.order,
  )[0] ?? null;
  const previous = priorClosedWeek(state, week);
  const previousScore = previous ? scoreWeek(previous) : null;
  const closedScores = Object.values(state.weeks)
    .filter(
      (candidate) =>
        candidate.status === "closed" && candidate.key <= week.key,
    )
    .map((candidate) => scoreWeek(candidate).percent);
  const isBest = score.percent === Math.max(...closedScores, score.percent);

  let recommendation =
    "Halte dein System stabil. Konstanz schlägt zusätzliche Komplexität.";
  if (weakest && weakest.completed < weakest.possible) {
    const target = Math.min(
      weakest.possible,
      weakest.completed +
        Math.max(1, Math.ceil((weakest.possible - weakest.completed) / 2)),
    );
    recommendation = `${weakest.name} wurde an ${weakest.completed} von ${weakest.possible} Tagen erreicht. Plane dafür nächste Woche einen festen Auslöser und versuche zunächst ${target} von ${weakest.possible} Tagen.`;
  }

  return {
    score,
    training,
    progress,
    strongest,
    weakest,
    comparison: previousScore
      ? score.percent - previousScore.percent
      : null,
    isBest,
    recommendation,
  };
}

export function setHabitOrder(state, habitId, direction, fromDate = new Date()) {
  const ordered = [...state.habits].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((habit) => habit.id === habitId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return false;
  [ordered[index], ordered[targetIndex]] = [ordered[targetIndex], ordered[index]];
  ordered.forEach((habit, orderIndex) => {
    const source = state.habits.find((item) => item.id === habit.id);
    source.order = (orderIndex + 1) * 10;
  });
  syncOpenWeekPlans(state, fromDate);
  return true;
}

export function validateImportedData(candidate) {
  const data = candidate?.data ?? candidate;
  if (!data || typeof data !== "object") {
    throw new Error("Die Datei enthält keinen gültigen Datensatz.");
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `Datenversion ${data.schemaVersion ?? "unbekannt"} wird nicht unterstützt.`,
    );
  }
  if (!Array.isArray(data.habits) || typeof data.weeks !== "object") {
    throw new Error("Gewohnheiten oder Wochen fehlen in der Datei.");
  }
  if (!data.settings || !data.training || !data.meta) {
    throw new Error("Die Datei ist unvollständig.");
  }
  data.habits.forEach((habit) => {
    if (
      typeof habit.id !== "string" ||
      typeof habit.name !== "string" ||
      !Array.isArray(habit.activeDays)
    ) {
      throw new Error("Mindestens eine Gewohnheit ist ungültig.");
    }
  });
  return deepClone(data);
}

export function makeExportPayload(state) {
  return {
    format: "hesselink-daily-coach-backup",
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: deepClone(state),
  };
}
