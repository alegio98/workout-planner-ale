import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Check,
  Circle,
  CopyCheck,
  Dumbbell,
  Edit3,
  Plus,
  RotateCcw,
  SkipForward,
  Timer,
  Trash2,
} from 'lucide-react'
import Modal from '../components/Modal'
import NumericInput from '../components/NumericInput'
import { db } from '../db'
import type {
  PlannedSetTarget,
  SessionExercise,
  SessionSet,
  SetMode,
  WorkoutPlan,
  WorkoutSession,
} from '../types'
import { formatLongDate, localDate, normalizeOrders, sortedExercises, uid } from '../utils'

interface WorkoutViewProps {
  plans: WorkoutPlan[]
  sessions: WorkoutSession[]
  activeSessionId: string | null
  onSelectSession: (id: string | null) => void
  onBack: () => void
  onOpenTimer: () => void
  notify: (message: string) => void
}

interface SetTargetDraft {
  id: string
  setNumber: number
  reps?: number
  weight?: number
}

interface SessionExerciseDraft {
  name: string
  muscleGroup: string
  plannedSets?: number
  plannedReps?: number
  plannedWeight?: number
  setMode: SetMode
  setTargets: SetTargetDraft[]
  recoverySeconds?: number
  technique: string
  trainerNotes: string
}

interface NormalizedSessionExerciseDraft extends Omit<SessionExerciseDraft, 'plannedSets' | 'plannedReps' | 'plannedWeight' | 'recoverySeconds' | 'setTargets'> {
  plannedSets: number
  plannedReps: number
  plannedWeight: number
  recoverySeconds: number
  setTargets: Array<{ id: string; setNumber: number; reps: number; weight: number }>
}

const standardTargets = (count: number, reps: number, weight: number): Array<{ id: string; setNumber: number; reps: number; weight: number }> =>
  Array.from({ length: Math.max(1, count) }, (_, index) => ({
    id: uid(),
    setNumber: index + 1,
    reps,
    weight,
  }))

const emptyDraft = (): SessionExerciseDraft => ({
  name: '',
  muscleGroup: '',
  plannedSets: 3,
  plannedReps: 10,
  plannedWeight: 0,
  setMode: 'standard',
  setTargets: standardTargets(3, 10, 0),
  recoverySeconds: 60,
  technique: '',
  trainerNotes: '',
})

const normalizeDraft = (draft: SessionExerciseDraft): NormalizedSessionExerciseDraft => {
  const plannedSets = Math.max(1, draft.plannedSets ?? draft.setTargets.length ?? 1)
  const plannedReps = Math.max(1, draft.plannedReps ?? 1)
  const plannedWeight = Math.max(0, draft.plannedWeight ?? 0)
  const recoverySeconds = Math.max(0, draft.recoverySeconds ?? 0)
  const targets = draft.setMode === 'custom' && draft.setTargets.length
    ? draft.setTargets.map((target, index) => ({
        id: target.id || uid(),
        setNumber: index + 1,
        reps: Math.max(1, target.reps ?? plannedReps),
        weight: Math.max(0, target.weight ?? plannedWeight),
      }))
    : standardTargets(plannedSets, plannedReps, plannedWeight)

  return {
    ...draft,
    plannedSets: targets.length,
    plannedReps: targets[0]?.reps ?? plannedReps,
    plannedWeight: targets[0]?.weight ?? plannedWeight,
    recoverySeconds,
    setTargets: targets,
  }
}

const createSet = (setNumber: number, reps: number, weight: number): SessionSet => ({
  id: uid(),
  setNumber,
  targetReps: reps,
  targetWeight: weight,
  status: 'pending',
  notes: '',
})

const setsFromDraft = (draft: NormalizedSessionExerciseDraft, current?: SessionExercise): SessionSet[] =>
  draft.setTargets.map((target, index) => {
    const existing = current?.sets[index]
    return existing
      ? {
          ...existing,
          setNumber: index + 1,
          targetReps: target.reps,
          targetWeight: target.weight,
        }
      : createSet(index + 1, target.reps, target.weight)
  })

export default function WorkoutView({
  plans,
  sessions,
  activeSessionId,
  onSelectSession,
  onBack,
  onOpenTimer,
  notify,
}: WorkoutViewProps) {
  const fallbackSession = useMemo(() => {
    const today = localDate()
    return [...sessions]
      .filter((session) => session.status !== 'moved')
      .sort((a, b) => {
        const aPriority = a.status === 'started' ? 0 : a.scheduledDate === today ? 1 : 2
        const bPriority = b.status === 'started' ? 0 : b.scheduledDate === today ? 1 : 2
        return aPriority - bPriority || a.scheduledDate.localeCompare(b.scheduledDate)
      })[0]
  }, [sessions])

  const session = sessions.find((item) => item.id === activeSessionId) ?? fallbackSession
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false)
  const [scopeModalOpen, setScopeModalOpen] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [exerciseDraft, setExerciseDraft] = useState<SessionExerciseDraft>(emptyDraft())
  const [pendingEdit, setPendingEdit] = useState<{ exerciseId: string; draft: SessionExerciseDraft } | null>(null)

  useEffect(() => {
    if (!activeSessionId && fallbackSession) onSelectSession(fallbackSession.id)
  }, [activeSessionId, fallbackSession, onSelectSession])

  const orderedExercises = session ? sortedExercises(session.exercises) : []
  const totalSets = orderedExercises.reduce((total, exercise) => total + exercise.sets.length, 0)
  const completedSets = orderedExercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.status === 'completed').length,
    0,
  )
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0
  const readOnly = session?.status === 'completed' || session?.status === 'skipped'

  const persistSession = async (updated: WorkoutSession) => {
    await db.sessions.put({ ...updated, updatedAt: new Date().toISOString() })
  }

  const startWorkout = async () => {
    if (!session || session.status !== 'scheduled') return
    await persistSession({ ...session, status: 'started', startedAt: new Date().toISOString() })
    notify('Allenamento iniziato.')
  }

  const completeWorkout = async () => {
    if (!session || !window.confirm('Completare e bloccare questo allenamento?')) return
    await persistSession({ ...session, status: 'completed', completedAt: new Date().toISOString() })
    notify('Allenamento completato e salvato.')
  }

  const skipWorkout = async () => {
    if (!session || !window.confirm('Segnare questo allenamento come saltato?')) return
    await persistSession({ ...session, status: 'skipped' })
    notify('Allenamento segnato come saltato.')
  }

  const reopenWorkout = async () => {
    if (!session || session.status !== 'skipped') return
    await persistSession({ ...session, status: 'scheduled' })
    notify('Allenamento ripristinato come programmato.')
  }

  const updateExercise = async (exerciseId: string, updater: (exercise: SessionExercise) => SessionExercise) => {
    if (!session || readOnly) return
    const exercises = session.exercises.map((exercise) => (exercise.id === exerciseId ? updater(exercise) : exercise))
    await persistSession({ ...session, exercises, hasLocalChanges: true })
  }

  const updateSet = async (
    exerciseId: string,
    setId: string,
    field: 'actualWeight' | 'actualReps',
    value: number | undefined,
  ) => {
    await updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.id === setId ? { ...set, [field]: value } : set)),
    }))
  }

  const toggleSet = async (exerciseId: string, setId: string) => {
    await updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => {
        if (set.id !== setId) return set
        const nextStatus = set.status === 'completed' ? 'pending' : 'completed'
        return {
          ...set,
          status: nextStatus,
          actualWeight: set.actualWeight ?? set.targetWeight,
          actualReps: set.actualReps ?? set.targetReps,
        }
      }),
    }))
  }

  const skipSet = async (exerciseId: string, setId: string) => {
    await updateExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) =>
        set.id === setId ? { ...set, status: set.status === 'skipped' ? 'pending' : 'skipped' } : set,
      ),
    }))
  }

  const openNewExercise = () => {
    setEditingExerciseId(null)
    setExerciseDraft(emptyDraft())
    setExerciseModalOpen(true)
  }

  const openEditExercise = (exercise: SessionExercise) => {
    setEditingExerciseId(exercise.id)
    setExerciseDraft({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      plannedSets: exercise.sets.length,
      plannedReps: exercise.sets[0]?.targetReps ?? exercise.plannedReps,
      plannedWeight: exercise.sets[0]?.targetWeight ?? exercise.plannedWeight,
      setMode: exercise.setMode ?? 'standard',
      setTargets: exercise.sets.map((set, index) => ({
        id: set.id,
        setNumber: index + 1,
        reps: set.targetReps,
        weight: set.targetWeight,
      })),
      recoverySeconds: exercise.recoverySeconds,
      technique: exercise.technique,
      trainerNotes: exercise.trainerNotes,
    })
    setExerciseModalOpen(true)
  }

  const saveExerciseDraft = async () => {
    if (!session || !exerciseDraft.name.trim()) return
    const normalized = normalizeDraft({ ...exerciseDraft, name: exerciseDraft.name.trim() })

    if (!editingExerciseId) {
      const exercise: SessionExercise = {
        id: uid(),
        name: normalized.name,
        muscleGroup: normalized.muscleGroup,
        plannedSets: normalized.plannedSets,
        plannedReps: normalized.plannedReps,
        plannedWeight: normalized.plannedWeight,
        setMode: normalized.setMode,
        recoverySeconds: normalized.recoverySeconds,
        technique: normalized.technique,
        trainerNotes: normalized.trainerNotes,
        order: session.exercises.length,
        origin: 'custom',
        isCustomized: true,
        sets: setsFromDraft(normalized),
      }
      await persistSession({ ...session, exercises: [...session.exercises, exercise], hasLocalChanges: true })
      setExerciseModalOpen(false)
      notify('Esercizio aggiunto solo a questo allenamento.')
      return
    }

    const current = session.exercises.find((exercise) => exercise.id === editingExerciseId)
    if (!current) return
    setExerciseModalOpen(false)
    if (current.sourceExerciseId && session.sourcePlanId) {
      setPendingEdit({ exerciseId: current.id, draft: normalized })
      setScopeModalOpen(true)
    } else {
      await applyEdit(current.id, normalized, false)
    }
  }

  const applyEdit = async (exerciseId: string, draft: SessionExerciseDraft, updateTemplate: boolean) => {
    if (!session) return
    const current = session.exercises.find((exercise) => exercise.id === exerciseId)
    if (!current) return
    const normalized = normalizeDraft(draft)
    const edited: SessionExercise = {
      ...current,
      name: normalized.name,
      muscleGroup: normalized.muscleGroup,
      plannedSets: normalized.plannedSets,
      plannedReps: normalized.plannedReps,
      plannedWeight: normalized.plannedWeight,
      setMode: normalized.setMode,
      recoverySeconds: normalized.recoverySeconds,
      technique: normalized.technique,
      trainerNotes: normalized.trainerNotes,
      isCustomized: true,
      sets: setsFromDraft(normalized, current),
    }
    await persistSession({
      ...session,
      exercises: session.exercises.map((exercise) => (exercise.id === exerciseId ? edited : exercise)),
      hasLocalChanges: true,
    })

    if (updateTemplate && session.sourcePlanId && current.sourceExerciseId) {
      const plan = plans.find((item) => item.id === session.sourcePlanId)
      if (plan) {
        const setTargets: PlannedSetTarget[] = normalized.setTargets.map((target, index) => ({
          id: uid(),
          setNumber: index + 1,
          reps: target.reps ?? normalized.plannedReps,
          weight: target.weight ?? normalized.plannedWeight,
        }))
        const days = plan.days.map((day) => ({
          ...day,
          exercises: day.exercises.map((exercise) =>
            exercise.id === current.sourceExerciseId
              ? {
                  ...exercise,
                  name: normalized.name,
                  muscleGroup: normalized.muscleGroup,
                  sets: normalized.plannedSets,
                  reps: normalized.plannedReps,
                  suggestedWeight: normalized.plannedWeight,
                  setMode: normalized.setMode,
                  setTargets,
                  recoverySeconds: normalized.recoverySeconds,
                  technique: normalized.technique,
                  trainerNotes: normalized.trainerNotes,
                }
              : exercise,
          ),
        }))
        await db.plans.put({ ...plan, days, revision: plan.revision + 1, updatedAt: new Date().toISOString() })
      }
    }

    setScopeModalOpen(false)
    setPendingEdit(null)
    notify(updateTemplate ? 'Sessione e scheda originale aggiornate.' : 'Modifica applicata solo a questo allenamento.')
  }

  const deleteExercise = async (exercise: SessionExercise) => {
    if (!session || readOnly || !window.confirm(`Eliminare “${exercise.name}” solo da questo allenamento?`)) return
    const exercises = normalizeOrders(sortedExercises(session.exercises).filter((item) => item.id !== exercise.id))
    await persistSession({ ...session, exercises, hasLocalChanges: true })
    notify('Esercizio rimosso dalla sessione.')
  }

  const moveExercise = async (exercise: SessionExercise, direction: -1 | 1) => {
    if (!session || readOnly) return
    const exercises = sortedExercises(session.exercises)
    const index = exercises.findIndex((item) => item.id === exercise.id)
    const target = index + direction
    if (target < 0 || target >= exercises.length) return
    ;[exercises[index], exercises[target]] = [exercises[target], exercises[index]]
    await persistSession({ ...session, exercises: normalizeOrders(exercises), hasLocalChanges: true })
  }

  const updateTemplateWeight = async (exercise: SessionExercise) => {
    if (!session?.sourcePlanId || !exercise.sourceExerciseId) return
    const completed = exercise.sets.filter((set) => set.status === 'completed' && set.actualWeight !== undefined)
    if (!completed.length) {
      notify('Registra almeno una serie completata.')
      return
    }
    const plan = plans.find((item) => item.id === session.sourcePlanId)
    if (!plan) return
    const lastWeight = completed.at(-1)?.actualWeight ?? completed[0].actualWeight ?? 0
    const days = plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((item) => {
        if (item.id !== exercise.sourceExerciseId) return item
        if (item.setMode === 'custom') {
          return {
            ...item,
            suggestedWeight: lastWeight,
            setTargets: (item.setTargets ?? []).map((target, index) => ({
              ...target,
              weight: exercise.sets[index]?.actualWeight ?? target.weight,
            })),
          }
        }
        return {
          ...item,
          suggestedWeight: lastWeight,
          setTargets: (item.setTargets ?? []).map((target) => ({ ...target, weight: lastWeight })),
        }
      }),
    }))
    await db.plans.put({ ...plan, days, revision: plan.revision + 1, updatedAt: new Date().toISOString() })
    notify(`Peso consigliato aggiornato nella scheda.`)
  }

  if (!session) {
    return (
      <div className="view-shell">
        <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Torna al calendario</button>
        <section className="page-heading"><div><span className="eyebrow">Allenamento</span><h1>Nessuna sessione</h1></div></section>
        <div className="empty-state large static">
          <span className="empty-icon"><Dumbbell size={24} /></span>
          <b>Programma un allenamento</b>
          <span>Apri il calendario e assegna una giornata della tua scheda.</span>
        </div>
      </div>
    )
  }

  const otherSessions = sessions
    .filter((item) => item.id !== session.id && item.status !== 'moved')
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
    .slice(0, 5)

  return (
    <div className="view-shell workout-view">
      <button className="back-link sticky-back-link" onClick={onBack}><ArrowLeft size={16} /> Torna al calendario</button>
      <section className="workout-header-card">
        <div className="session-topline">
          <span className={`status-badge status-${session.status}`}>
            {session.status === 'scheduled' ? 'PROGRAMMATO' : session.status === 'started' ? 'IN CORSO' : session.status === 'completed' ? 'COMPLETATO' : 'SALTATO'}
          </span>
          <span>{formatLongDate(session.scheduledDate)}</span>
        </div>
        <h1>{session.dayNameSnapshot} · {session.dayFocusSnapshot}</h1>
        <p>{completedSets} di {totalSets} serie completate · {session.planNameSnapshot}</p>
        <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
        {session.hasLocalChanges && <span className="local-change-label">Contiene modifiche specifiche della sessione</span>}
        {session.status === 'scheduled' && <button className="light-button" onClick={startWorkout}><Dumbbell size={18} /> Inizia allenamento</button>}
        {session.status === 'skipped' && <button className="light-button" onClick={reopenWorkout}><RotateCcw size={18} /> Ripristina allenamento</button>}
      </section>

      {orderedExercises.map((exercise, exerciseIndex) => (
        <article className="run-exercise-card" key={exercise.id}>
          <div className="run-exercise-heading">
            <div>
              <span className="eyebrow">Esercizio {exerciseIndex + 1} di {orderedExercises.length}</span>
              <h2>{exercise.name}</h2>
              {exercise.muscleGroup && <p>{exercise.muscleGroup}</p>}
            </div>
            {!readOnly && (
              <div className="mini-actions">
                <button disabled={exerciseIndex === 0} onClick={() => moveExercise(exercise, -1)} aria-label="Sposta su"><ArrowUp size={16} /></button>
                <button disabled={exerciseIndex === orderedExercises.length - 1} onClick={() => moveExercise(exercise, 1)} aria-label="Sposta giù"><ArrowDown size={16} /></button>
                <button onClick={() => openEditExercise(exercise)} aria-label="Modifica"><Edit3 size={16} /></button>
                <button className="danger" onClick={() => deleteExercise(exercise)} aria-label="Elimina"><Trash2 size={16} /></button>
              </div>
            )}
          </div>

          <div className="exercise-guidance">
            {exercise.recoverySeconds > 0 && <span><Timer size={15} /> Recupero: <b>{exercise.recoverySeconds} secondi</b></span>}
            {exercise.technique && <p><b>Tecnica:</b> {exercise.technique}</p>}
            {exercise.trainerNotes && <p><b>Note:</b> {exercise.trainerNotes}</p>}
          </div>

          <div className="set-list">
            <div className="set-label-row"><span>Serie</span><span>Peso reale</span><span>Ripetizioni</span><span>Stato</span></div>
            {exercise.sets.map((set) => (
              <div className={`set-row ${set.status}`} key={set.id}>
                <span className="set-number"><b>{set.setNumber}</b><small>{set.targetReps}×{set.targetWeight || '—'}</small></span>
                <label>
                  <NumericInput
                    mode="decimal"
                    min={0}
                    disabled={readOnly}
                    value={set.actualWeight}
                    placeholder={String(set.targetWeight)}
                    ariaLabel={`Peso reale serie ${set.setNumber}`}
                    onChange={(value) => updateSet(exercise.id, set.id, 'actualWeight', value)}
                  />
                  <small>kg</small>
                </label>
                <label>
                  <NumericInput
                    mode="integer"
                    min={0}
                    disabled={readOnly}
                    value={set.actualReps}
                    placeholder={String(set.targetReps)}
                    ariaLabel={`Ripetizioni serie ${set.setNumber}`}
                    onChange={(value) => updateSet(exercise.id, set.id, 'actualReps', value)}
                  />
                  <small>reps</small>
                </label>
                <div className="set-actions">
                  <button disabled={readOnly} className="set-check" onClick={() => toggleSet(exercise.id, set.id)} aria-label="Completa serie">
                    {set.status === 'completed' ? <Check size={20} /> : <Circle size={19} />}
                  </button>
                  <button disabled={readOnly} className="set-skip" onClick={() => skipSet(exercise.id, set.id)} aria-label="Salta serie">
                    <SkipForward size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {session.status === 'completed' && exercise.sourceExerciseId && (
            <button className="template-update-button" onClick={() => updateTemplateWeight(exercise)}>
              <CopyCheck size={16} /> Usa i pesi eseguiti nella scheda originale
            </button>
          )}
        </article>
      ))}

      {!readOnly && <button className="dashed-button" onClick={openNewExercise}><Plus size={17} /> Aggiungi esercizio solo a questa sessione</button>}

      <div className="workout-actions">
        {session.status === 'started' && <button className="primary-button" onClick={completeWorkout}><Check size={18} /> Completa allenamento</button>}
        {session.status === 'scheduled' && <button className="primary-button" onClick={startWorkout}><Dumbbell size={18} /> Inizia allenamento</button>}
        {!readOnly && <button className="secondary-button danger-text" onClick={skipWorkout}>Segna come saltato</button>}
      </div>

      {otherSessions.length > 0 && (
        <section className="other-sessions">
          <div className="section-title-row"><h2>Altre sessioni</h2></div>
          {otherSessions.map((item) => (
            <button key={item.id} onClick={() => onSelectSession(item.id)}>
              <span><b>{item.dayNameSnapshot} · {item.dayFocusSnapshot}</b><small>{formatLongDate(item.scheduledDate)}</small></span>
              <span className={`status-badge status-${item.status}`}>{item.status}</span>
            </button>
          ))}
        </section>
      )}

      <nav className="session-shortcuts" aria-label="Scorciatoie allenamento">
        <button onClick={onBack}><CalendarDays size={18} /><span>Calendario</span></button>
        <button className="active"><Dumbbell size={18} /><span>Allenamento</span></button>
        <button onClick={onOpenTimer}><Timer size={18} /><span>Timer</span></button>
      </nav>

      <ExerciseModal
        open={exerciseModalOpen}
        draft={exerciseDraft}
        setDraft={setExerciseDraft}
        onClose={() => setExerciseModalOpen(false)}
        onSave={saveExerciseDraft}
        editing={Boolean(editingExerciseId)}
      />

      <Modal
        open={scopeModalOpen}
        title="Dove applicare la modifica?"
        description="La sessione è una copia indipendente della scheda originale. Gli allenamenti già programmati non verranno modificati."
        onClose={() => { setScopeModalOpen(false); setPendingEdit(null) }}
      >
        <div className="scope-options">
          <button onClick={() => pendingEdit && applyEdit(pendingEdit.exerciseId, pendingEdit.draft, false)}>
            <span className="scope-icon"><Edit3 size={19} /></span>
            <span><b>Solo a questo allenamento</b><small>La scheda originale e le altre sessioni restano invariate.</small></span>
          </button>
          <button onClick={() => pendingEdit && applyEdit(pendingEdit.exerciseId, pendingEdit.draft, true)}>
            <span className="scope-icon"><CopyCheck size={19} /></span>
            <span><b>Aggiorna anche la scheda originale</b><small>Il nuovo valore sarà usato nelle assegnazioni future.</small></span>
          </button>
        </div>
        <button className="secondary-button full-width" onClick={() => { setScopeModalOpen(false); setPendingEdit(null) }}>Annulla</button>
      </Modal>
    </div>
  )
}

interface ExerciseModalProps {
  open: boolean
  draft: SessionExerciseDraft
  setDraft: (draft: SessionExerciseDraft) => void
  onClose: () => void
  onSave: () => void
  editing: boolean
}

function ExerciseModal({ open, draft, setDraft, onClose, onSave, editing }: ExerciseModalProps) {
  const switchMode = (setMode: SetMode) => {
    if (setMode === 'custom') {
      const count = Math.max(1, draft.plannedSets ?? 1)
      const reps = Math.max(1, draft.plannedReps ?? 1)
      const weight = Math.max(0, draft.plannedWeight ?? 0)
      setDraft({ ...draft, setMode, setTargets: standardTargets(count, reps, weight) })
    } else {
      const first = draft.setTargets[0]
      setDraft({
        ...draft,
        setMode,
        plannedSets: Math.max(1, draft.setTargets.length || draft.plannedSets || 1),
        plannedReps: first?.reps ?? draft.plannedReps ?? 1,
        plannedWeight: first?.weight ?? draft.plannedWeight ?? 0,
      })
    }
  }

  const updateTarget = (id: string, field: 'reps' | 'weight', value: number | undefined) => {
    setDraft({
      ...draft,
      setTargets: draft.setTargets.map((target) => (target.id === id ? { ...target, [field]: value } : target)),
    })
  }

  const addTarget = () => {
    const last = draft.setTargets.at(-1)
    setDraft({
      ...draft,
      setTargets: [
        ...draft.setTargets,
        {
          id: uid(),
          setNumber: draft.setTargets.length + 1,
          reps: last?.reps ?? draft.plannedReps ?? 10,
          weight: last?.weight ?? draft.plannedWeight ?? 0,
        },
      ],
    })
  }

  const removeTarget = (id: string) => {
    if (draft.setTargets.length <= 1) return
    setDraft({
      ...draft,
      setTargets: draft.setTargets
        .filter((target) => target.id !== id)
        .map((target, index) => ({ ...target, setNumber: index + 1 })),
    })
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Modifica esercizio della sessione' : 'Aggiungi esercizio alla sessione'}
      description={editing ? 'Dopo il salvataggio potrai scegliere se aggiornare anche la scheda originale.' : 'L’esercizio verrà aggiunto soltanto a questo allenamento.'}
      onClose={onClose}
      wide
    >
      <div className="form-stack two-columns">
        <label className="full"><span>Nome esercizio</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label className="full"><span>Gruppo muscolare</span><input value={draft.muscleGroup} onChange={(event) => setDraft({ ...draft, muscleGroup: event.target.value })} /></label>

        <div className="full set-mode-field">
          <span>Tipo di serie</span>
          <div className="segmented-control">
            <button className={draft.setMode === 'standard' ? 'active' : ''} onClick={() => switchMode('standard')}>Standard</button>
            <button className={draft.setMode === 'custom' ? 'active' : ''} onClick={() => switchMode('custom')}>Piramidale / personalizzata</button>
          </div>
        </div>

        {draft.setMode === 'standard' ? (
          <>
            <label><span>Serie previste</span><NumericInput value={draft.plannedSets} min={1} fallback={1} onChange={(value) => setDraft({ ...draft, plannedSets: value })} /></label>
            <label><span>Ripetizioni previste</span><NumericInput value={draft.plannedReps} min={1} fallback={1} onChange={(value) => setDraft({ ...draft, plannedReps: value })} /></label>
            <label><span>Peso previsto (kg)</span><NumericInput mode="decimal" value={draft.plannedWeight} min={0} fallback={0} onChange={(value) => setDraft({ ...draft, plannedWeight: value })} /></label>
          </>
        ) : (
          <div className="full custom-sets-editor">
            <div className="custom-set-head"><span>Serie</span><span>Ripetizioni</span><span>Peso kg</span><span /></div>
            {draft.setTargets.map((target, index) => (
              <div className="custom-set-row" key={target.id}>
                <b>{index + 1}</b>
                <NumericInput value={target.reps} min={1} fallback={1} onChange={(value) => updateTarget(target.id, 'reps', value)} />
                <NumericInput mode="decimal" value={target.weight} min={0} fallback={0} onChange={(value) => updateTarget(target.id, 'weight', value)} />
                <button className="remove-set-button" disabled={draft.setTargets.length <= 1} onClick={() => removeTarget(target.id)} aria-label="Rimuovi serie"><Trash2 size={15} /></button>
              </div>
            ))}
            <button className="add-set-button" onClick={addTarget}><Plus size={16} /> Aggiungi serie</button>
          </div>
        )}

        <label><span>Recupero (secondi)</span><NumericInput value={draft.recoverySeconds} min={0} fallback={0} onChange={(value) => setDraft({ ...draft, recoverySeconds: value })} /></label>
        <label className="full"><span>Tecnica</span><input value={draft.technique} onChange={(event) => setDraft({ ...draft, technique: event.target.value })} /></label>
        <label className="full"><span>Note del personal trainer</span><textarea rows={2} value={draft.trainerNotes} onChange={(event) => setDraft({ ...draft, trainerNotes: event.target.value })} /></label>
        <div className="modal-actions full"><button className="primary-button" disabled={!draft.name.trim()} onClick={onSave}>Continua</button><button className="secondary-button" onClick={onClose}>Annulla</button></div>
      </div>
    </Modal>
  )
}
