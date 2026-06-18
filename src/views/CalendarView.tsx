import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Dumbbell,
  Play,
  Shuffle,
  Sparkles,
  PlusCircle,
  Route,
  Trash2,
} from "lucide-react";
import { db } from "../db";
import type { WorkoutPlan, WorkoutSession } from "../types";
import { MUSCLE_GROUPS, type MuscleGroup } from "../data/exerciseLibrary";
import {
  createFreeWorkoutSession,
  generateShuffleWorkout,
} from "../workoutGenerator";
import {
  addDays,
  cloneSessionForDate,
  createSessionFromDay,
  dateFromLocal,
  formatLongDate,
  localDate,
  sortedDays,
  startOfWeek,
} from "../utils";
import Modal from "../components/Modal";
import PwaInstallButton from "../components/PwaInstallButton";
import ThemeToggle from "../components/ThemeToggle";

interface CalendarViewProps {
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenSession: (id: string) => void;
  notify: (message: string) => void;
}

const statusLabels: Record<WorkoutSession["status"], string> = {
  scheduled: "Programmato",
  started: "Iniziato",
  completed: "Completato",
  skipped: "Saltato",
  moved: "Spostato",
};

const monthGrid = (selectedDate: string) => {
  const selected = dateFromLocal(selectedDate);
  const first = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  first.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return localDate(date);
  });
};

const moveMonth = (selectedDate: string, amount: number) => {
  const current = dateFromLocal(selectedDate);
  const targetDay = current.getDate();
  const target = new Date(
    current.getFullYear(),
    current.getMonth() + amount,
    1,
    12,
  );
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
    12,
  ).getDate();
  target.setDate(Math.min(targetDay, lastDay));
  return localDate(target);
};

export default function CalendarView({
  plans,
  sessions,
  selectedDate,
  onSelectDate,
  onOpenSession,
  notify,
}: CalendarViewProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [shuffleOpen, setShuffleOpen] = useState(false);
  const [shuffleGroups, setShuffleGroups] = useState<MuscleGroup[]>([]);
  const [shuffleDuration, setShuffleDuration] = useState<30 | 60 | 90 | 120>(
    60,
  );
  const [monthExpanded, setMonthExpanded] = useState(false);
  const [planId, setPlanId] = useState("");
  const [dayId, setDayId] = useState("");

  const selectedPlan = plans.find((plan) => plan.id === planId) ?? plans[0];
  const selectedPlanDays = selectedPlan ? sortedDays(selectedPlan) : [];

  useEffect(() => {
    if (!plans.length) return;
    if (!plans.some((plan) => plan.id === planId)) setPlanId(plans[0].id);
  }, [plans, planId]);

  useEffect(() => {
    if (!selectedPlanDays.length) {
      setDayId("");
      return;
    }
    if (!selectedPlanDays.some((day) => day.id === dayId))
      setDayId(selectedPlanDays[0].id);
  }, [selectedPlanDays, dayId]);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const selectedSessions = sessions
    .filter(
      (session) =>
        session.scheduledDate === selectedDate && session.status !== "moved",
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    sessions
      .filter((session) => session.status !== "moved")
      .forEach((session) => {
        const current = map.get(session.scheduledDate) ?? [];
        current.push(session);
        map.set(session.scheduledDate, current);
      });
    return map;
  }, [sessions]);

  const monthDays = useMemo(() => monthGrid(selectedDate), [selectedDate]);
  const selectedMonth = dateFromLocal(selectedDate).getMonth();
  const monthLabel = dateFromLocal(selectedDate).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  const schedule = async () => {
    const plan = plans.find((item) => item.id === planId);
    const day = plan?.days.find((item) => item.id === dayId);
    if (!plan || !day) return;
    await db.sessions.add(createSessionFromDay(plan, day, selectedDate));
    setAddOpen(false);
    notify("Allenamento aggiunto al calendario.");
  };

  const deleteSession = async (session: WorkoutSession) => {
    const label = `${session.dayNameSnapshot} · ${session.dayFocusSnapshot}`;
    if (
      !window.confirm(
        `Eliminare “${label}” dal ${dateFromLocal(session.scheduledDate).toLocaleDateString("it-IT")}?`,
      )
    )
      return;
    await db.sessions.delete(session.id);
    notify("Allenamento eliminato dal calendario.");
  };

  const addNextDay = async () => {
    if (!plans.length) {
      notify("Crea prima una scheda.");
      return;
    }

    const previous = [...sessions]
      .filter(
        (session) =>
          session.sourcePlanId && session.scheduledDate <= selectedDate,
      )
      .sort(
        (a, b) =>
          b.scheduledDate.localeCompare(a.scheduledDate) ||
          b.createdAt.localeCompare(a.createdAt),
      )[0];
    const plan =
      plans.find((item) => item.id === previous?.sourcePlanId) ?? plans[0];
    const days = sortedDays(plan);
    if (!days.length) {
      notify("La scheda non contiene giornate.");
      return;
    }
    const currentIndex = days.findIndex(
      (day) => day.id === previous?.sourceDayId,
    );
    const nextDay = days[(currentIndex + 1 + days.length) % days.length];
    await db.sessions.add(createSessionFromDay(plan, nextDay, selectedDate));
    notify(
      `${nextDay.name} assegnato al ${dateFromLocal(selectedDate).toLocaleDateString("it-IT")}.`,
    );
  };

  const createFreeWorkout = async () => {
    const session = createFreeWorkoutSession(selectedDate);
    await db.sessions.add(session);
    setAddOpen(false);
    notify("Allenamento libero creato.");
    onOpenSession(session.id);
  };

  const toggleShuffleGroup = (group: MuscleGroup) => {
    setShuffleGroups((current) => {
      if (current.includes(group))
        return current.filter((item) => item !== group);
      if (current.length >= 3) {
        notify("Puoi selezionare al massimo 3 gruppi muscolari.");
        return current;
      }
      return [...current, group];
    });
  };

  const createShuffleWorkout = async () => {
    if (!shuffleGroups.length) {
      notify("Seleziona almeno un gruppo muscolare.");
      return;
    }
    const session = generateShuffleWorkout(
      shuffleGroups,
      shuffleDuration,
      selectedDate,
    );
    await db.sessions.add(session);
    setShuffleOpen(false);
    notify("Workout Shuffle creato.");
    onOpenSession(session.id);
  };

  const copyPreviousWeek = async () => {
    const currentWeekStart = startOfWeek(selectedDate);
    const previousStart = addDays(currentWeekStart, -7);
    const previousEnd = addDays(previousStart, 6);
    const sourceSessions = sessions.filter(
      (session) =>
        session.scheduledDate >= previousStart &&
        session.scheduledDate <= previousEnd &&
        session.status !== "moved",
    );
    if (!sourceSessions.length) {
      notify("La settimana precedente non contiene allenamenti.");
      return;
    }
    await db.sessions.bulkAdd(
      sourceSessions.map((session) =>
        cloneSessionForDate(session, addDays(session.scheduledDate, 7)),
      ),
    );
    notify(
      `${sourceSessions.length} allenamenti copiati nella settimana corrente.`,
    );
  };

  return (
    <div className="view-shell">
      <section className="hero-row">
        <div>
          <span className="eyebrow">Il tuo programma</span>
          <h1>Pronto ad allenarti?</h1>
          <p>{formatLongDate(selectedDate)}</p>
        </div>
        <div className="hero-tools">
          <PwaInstallButton />
          <ThemeToggle />
        </div>
      </section>

      <section
        className={`calendar-picker ${monthExpanded ? "expanded" : ""}`}
        aria-label="Selezione del calendario"
      >
        <div className="calendar-picker-heading">
          <button
            className="week-arrow"
            onClick={() =>
              onSelectDate(
                monthExpanded
                  ? moveMonth(selectedDate, -1)
                  : addDays(selectedDate, -7),
              )
            }
            aria-label={
              monthExpanded ? "Mese precedente" : "Settimana precedente"
            }
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="calendar-expand-button"
            onClick={() => setMonthExpanded((current) => !current)}
          >
            <span>
              <CalendarDays size={16} />{" "}
              {monthExpanded ? monthLabel : "Espandi al mese"}
            </span>
            {monthExpanded ? (
              <ChevronUp size={17} />
            ) : (
              <ChevronDown size={17} />
            )}
          </button>
          <button
            className="week-arrow"
            onClick={() =>
              onSelectDate(
                monthExpanded
                  ? moveMonth(selectedDate, 1)
                  : addDays(selectedDate, 7),
              )
            }
            aria-label={
              monthExpanded ? "Mese successivo" : "Settimana successiva"
            }
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {monthExpanded ? (
          <div className="month-calendar">
            <div className="month-weekdays" aria-hidden="true">
              {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="month-days">
              {monthDays.map((date) => {
                const parsed = dateFromLocal(date);
                const dateSessions = sessionsByDate.get(date) ?? [];
                const active = date === selectedDate;
                const outside = parsed.getMonth() !== selectedMonth;
                return (
                  <button
                    key={date}
                    className={`month-day ${active ? "active" : ""} ${outside ? "outside" : ""}`}
                    onClick={() => onSelectDate(date)}
                    aria-label={`${parsed.toLocaleDateString("it-IT")}, ${dateSessions.length} allenamenti`}
                  >
                    <b>{parsed.getDate()}</b>
                    {dateSessions.length > 0 && (
                      <span className="month-session-markers">
                        {dateSessions.slice(0, 3).map((session) => (
                          <i
                            key={session.id}
                            className={`status-${session.status}`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="week-days">
            {weekDays.map((date) => {
              const parsed = dateFromLocal(date);
              const active = date === selectedDate;
              return (
                <button
                  key={date}
                  className={`week-day ${active ? "active" : ""}`}
                  onClick={() => onSelectDate(date)}
                >
                  <span>
                    {parsed
                      .toLocaleDateString("it-IT", { weekday: "short" })
                      .replace(".", "")}
                  </span>
                  <b>{parsed.getDate()}</b>
                  {sessionsByDate.has(date) && <i />}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="section-title-row">
        <h2>
          {selectedDate === localDate() ? "Allenamento di oggi" : "Allenamenti"}
        </h2>
        <button className="text-button" onClick={() => setAddOpen(true)}>
          Aggiungi
        </button>
      </div>

      {selectedSessions.length ? (
        <div className="session-list">
          {selectedSessions.map((session, index) => {
            const totalSets = session.exercises.reduce(
              (total, exercise) => total + exercise.plannedSets,
              0,
            );
            return (
              <article
                key={session.id}
                className={index === 0 ? "featured-session" : "compact-session"}
              >
                <div className="session-topline">
                  <span className={`status-badge status-${session.status}`}>
                    {statusLabels[session.status]}
                  </span>
                  <span className="session-card-meta">
                    <span>{session.planNameSnapshot}</span>
                    <button
                      className="session-delete-button"
                      onClick={() => void deleteSession(session)}
                      aria-label="Elimina allenamento dal calendario"
                      title="Elimina dal calendario"
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
                <h2>
                  {session.dayNameSnapshot} · {session.dayFocusSnapshot}
                </h2>
                <p>{session.exercises.length} esercizi previsti</p>
                <div className="session-metrics">
                  <div>
                    <b>{session.exercises.length}</b>
                    <span>Esercizi</span>
                  </div>
                  <div>
                    <b>{totalSets}</b>
                    <span>Serie</span>
                  </div>
                  <div>
                    <b>
                      ~
                      {session.estimatedDurationMinutes ??
                        Math.max(25, session.exercises.length * 9)}{" "}
                      min
                    </b>
                    <span>Durata</span>
                  </div>
                </div>
                <button
                  className="featured-button"
                  onClick={() => onOpenSession(session.id)}
                >
                  {session.status === "scheduled" ? (
                    <Play size={17} fill="currentColor" />
                  ) : (
                    <Dumbbell size={17} />
                  )}
                  {session.status === "scheduled"
                    ? "Inizia allenamento"
                    : session.status === "started"
                      ? "Continua allenamento"
                      : "Apri allenamento"}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <button className="empty-state" onClick={() => setAddOpen(true)}>
          <span className="empty-icon">
            <CalendarPlus size={24} />
          </span>
          <b>Nessun allenamento programmato</b>
          <span>
            Premi qui per assegnare una giornata alla data selezionata.
          </span>
        </button>
      )}

      <div className="section-title-row">
        <h2>Azioni rapide</h2>
      </div>
      <section className="quick-grid">
        <button onClick={() => setAddOpen(true)}>
          <span className="quick-icon">
            <CalendarPlus size={19} />
          </span>
          <b>Aggiungi allenamento</b>
          <span>Assegna una giornata a questa data</span>
        </button>
        <button onClick={addNextDay}>
          <span className="quick-icon">
            <Route size={19} />
          </span>
          <b>Prossima giornata</b>
          <span>Continua la rotazione della scheda</span>
        </button>
        <button
          className="shuffle-quick-action"
          onClick={() => setShuffleOpen(true)}
        >
          <span className="quick-icon">
            <Shuffle size={19} />
          </span>
          <b>Workout Shuffle</b>
          <span>Genera una sessione per muscoli e durata</span>
        </button>
        <button onClick={copyPreviousWeek}>
          <span className="quick-icon">
            <Copy size={19} />
          </span>
          <b>Copia settimana</b>
          <span>Replica la pianificazione precedente</span>
        </button>
      </section>

      <button
        className="floating-action"
        onClick={() => setAddOpen(true)}
        aria-label="Aggiungi allenamento"
      >
        <CalendarPlus size={23} />
      </button>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Aggiungi allenamento"
        description="Assegna una giornata della scheda al calendario. Verrà creata una copia indipendente e modificabile."
      >
        <div className="form-stack">
          <label>
            <span>Data</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onSelectDate(event.target.value)}
            />
          </label>

          {plans.length ? (
            <section className="add-workout-primary">
              <span className="eyebrow">Opzione consigliata</span>
              <label>
                <span>Scheda</span>
                <select
                  value={selectedPlan?.id ?? ""}
                  onChange={(event) => setPlanId(event.target.value)}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Giornata</span>
                <select
                  value={dayId}
                  onChange={(event) => setDayId(event.target.value)}
                >
                  {selectedPlanDays.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.name} · {day.focus}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="primary-button full-width"
                disabled={!dayId}
                onClick={schedule}
              >
                Aggiungi dalla scheda
              </button>
            </section>
          ) : (
            <div className="modal-empty compact-empty">
              <p>
                Non hai ancora una scheda: puoi iniziare con una sessione libera
                o generata.
              </p>
            </div>
          )}

          <div className="add-workout-alternatives">
            <button onClick={createFreeWorkout}>
              <span className="scope-icon">
                <PlusCircle size={19} />
              </span>
              <span>
                <b>Allenamento libero</b>
                <small>
                  Parti da una sessione vuota e aggiungi esercizi mentre ti
                  alleni.
                </small>
              </span>
            </button>
            <button
              className="shuffle-choice"
              onClick={() => {
                setAddOpen(false);
                setShuffleOpen(true);
              }}
            >
              <span className="scope-icon">
                <Sparkles size={19} />
              </span>
              <span>
                <b>Workout Shuffle</b>
                <small>
                  Genera una sessione usando gruppo muscolare e tempo
                  disponibile.
                </small>
              </span>
            </button>
          </div>

          <button
            className="secondary-button full-width"
            onClick={() => setAddOpen(false)}
          >
            Annulla
          </button>
        </div>
      </Modal>

      <Modal
        open={shuffleOpen}
        onClose={() => setShuffleOpen(false)}
        title="Workout Shuffle"
        description="Scegli fino a 3 gruppi muscolari e il tempo disponibile. La sessione sarà modificabile prima e durante l’allenamento."
        wide
      >
        <div className="form-stack shuffle-builder">
          <div>
            <div className="field-heading">
              <b>Gruppi muscolari</b>
              <span>{shuffleGroups.length}/3 selezionati</span>
            </div>
            <div className="muscle-chip-grid">
              {MUSCLE_GROUPS.map((group) => (
                <button
                  key={group}
                  type="button"
                  className={shuffleGroups.includes(group) ? "selected" : ""}
                  onClick={() => toggleShuffleGroup(group)}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="field-heading">
              <b>Tempo disponibile</b>
            </div>
            <div className="duration-options">
              {([30, 60, 90, 120] as const).map((duration) => (
                <button
                  key={duration}
                  type="button"
                  className={shuffleDuration === duration ? "selected" : ""}
                  onClick={() => setShuffleDuration(duration)}
                >
                  {duration === 60
                    ? "1 ora"
                    : duration === 120
                      ? "2 ore"
                      : `${duration} min`}
                </button>
              ))}
            </div>
          </div>

          <p className="shuffle-disclaimer">
            La generazione usa una libreria locale di esercizi semplici e
            comuni. Controlla sempre che gli esercizi siano adatti alle tue
            capacità.
          </p>
          <div className="modal-actions">
            <button
              className="shuffle-primary-button"
              disabled={!shuffleGroups.length}
              onClick={createShuffleWorkout}
            >
              <Sparkles size={17} /> Genera allenamento
            </button>
            <button
              className="secondary-button"
              onClick={() => setShuffleOpen(false)}
            >
              Annulla
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
