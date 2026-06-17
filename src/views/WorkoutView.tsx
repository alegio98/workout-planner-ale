import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Circle,
  CopyCheck,
  Dumbbell,
  Edit3,
  Plus,
  RotateCcw,
  SkipForward,
  Trash2,
} from 'lucide-react'
import Modal from '../components/Modal'
import { db } from '../db'
import type { SessionExercise, SessionSet, WorkoutPlan, WorkoutSession } from '../types'
import { formatLongDate, localDate, normalizeOrders, sortedExercises, uid } from '../utils'

interface WorkoutViewProps {
  plans: WorkoutPlan[]
  sessions: WorkoutSession[]
  activeSessionId: string | null
  onSelectSession: (id: string | null) => void
  onBack: () => void
  notify: (message: string) => void
}

type SessionExerciseDraft = Pick<
  SessionExercise,
  | 'name'
  | 'muscleGroup'
  | 'plannedSets'
  | 'plannedReps'
  | 'plannedWeight'
  | 'recoverySeconds'
  | 'technique'
  | 'trainerNotes'
>

const emptyDraft = (): SessionExerciseDraft => ({
  name: '',
  muscleGroup: '',
  plannedSets: 3,
  plannedReps: 10,
  plannedWeight: 0,
  recoverySeconds: 60,
  technique: '',
  trainerNotes: '',
})

const createSet = (setNumber: number, reps: number, weight: number): SessionSet => ({
  id: uid(),
  setNumber,
  targetReps: reps,
  targetWeight: weight,
  status: 'pending',
  notes: '',
})

const resizeSets = (exercise: SessionExercise, count: number, reps: number, weight: number) => {
  const current = exercise.sets.slice(0, count).map((set, index) => ({
    ...set,
    setNumber: index + 1,
    targetReps: reps,
    targetWeight: weight,
  }))
  while (current.length < count) current.push(createSet(current.length + 1, reps, weight))
  return current
}

export default function WorkoutView({ plans, sessions, activeSessionId, onSelectSession, onBack, notify }: WorkoutViewProps) {
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
      plannedSets: exercise.plannedSets,
      plannedReps: exercise.plannedReps,
      plannedWeight: exercise.plannedWeight,
      recoverySeconds: exercise.recoverySeconds,
      technique: exercise.technique,
      trainerNotes: exercise.trainerNotes,
    })
    setExerciseModalOpen(true)
  }

  const saveExerciseDraft = async () => {
    if (!session || !exerciseDraft.name.trim()) return
    if (!editingExerciseId) {
      const exercise: SessionExercise = {
        id: uid(),
        name: exerciseDraft.name.trim(),
        muscleGroup: exerciseDraft.muscleGroup,
        plannedSets: exerciseDraft.plannedSets,
        plannedReps: exerciseDraft.plannedReps,
        plannedWeight: exerciseDraft.plannedWeight,
        recoverySeconds: exerciseDraft.recoverySeconds,
        technique: exerciseDraft.technique,
        trainerNotes: exerciseDraft.trainerNotes,
        sessionNotes: '',
        order: session.exercises.length,
        origin: 'custom',
        isCustomized: true,
        sets: Array.from({ length: exerciseDraft.plannedSets }, (_, index) =>
          createSet(index + 1, exerciseDraft.plannedReps, exerciseDraft.plannedWeight),
        ),
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
      setPendingEdit({ exerciseId: current.id, draft: { ...exerciseDraft, name: exerciseDraft.name.trim() } })
      setScopeModalOpen(true)
    } else {
      await applyEdit(current.id, { ...exerciseDraft, name: exerciseDraft.name.trim() }, false)
    }
  }

  const applyEdit = async (exerciseId: string, draft: SessionExerciseDraft, updateTemplate: boolean) => {
    if (!session) return
    const current = session.exercises.find((exercise) => exercise.id === exerciseId)
    if (!current) return
    const edited: SessionExercise = {
      ...current,
      ...draft,
      isCustomized: true,
      sets: resizeSets(current, draft.plannedSets, draft.plannedReps, draft.plannedWeight),
    }
    await persistSession({
      ...session,
      exercises: session.exercises.map((exercise) => (exercise.id === exerciseId ? edited : exercise)),
      hasLocalChanges: true,
    })

    if (updateTemplate && session.sourcePlanId && current.sourceExerciseId) {
      const plan = plans.find((item) => item.id === session.sourcePlanId)
      if (plan) {
        const days = plan.days.map((day) => ({
          ...day,
          exercises: day.exercises.map((exercise) =>
            exercise.id === current.sourceExerciseId
              ? {
                  ...exercise,
                  name: draft.name,
                  muscleGroup: draft.muscleGroup,
                  sets: draft.plannedSets,
                  reps: draft.plannedReps,
                  suggestedWeight: draft.plannedWeight,
                  recoverySeconds: draft.recoverySeconds,
                  technique: draft.technique,
                  trainerNotes: draft.trainerNotes,
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
    const actualWeights = exercise.sets
      .filter((set) => set.status === 'completed' && set.actualWeight !== undefined)
      .map((set) => set.actualWeight as number)
    if (!actualWeights.length) {
      notify('Registra almeno una serie completata.')
      return
    }
    const weight = actualWeights.at(-1) ?? actualWeights[0]
    const plan = plans.find((item) => item.id === session.sourcePlanId)
    if (!plan) return
    const days = plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((item) =>
        item.id === exercise.sourceExerciseId ? { ...item, suggestedWeight: weight } : item,
      ),
    }))
    await db.plans.put({ ...plan, days, revision: plan.revision + 1, updatedAt: new Date().toISOString() })
    notify(`Peso consigliato aggiornato a ${weight} kg nella scheda.`)
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
      <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Torna al calendario</button>
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
        {session.status === 'scheduled' && <button className="light-button" onClick={startWorkout}><Dumbbell size={17} /> Inizia allenamento</button>}
        {session.status === 'skipped' && <button className="light-button" onClick={reopenWorkout}><RotateCcw size={17} /> Ripristina allenamento</button>}
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
                <button disabled={exerciseIndex === 0} onClick={() => moveExercise(exercise, -1)} aria-label="Sposta su"><ArrowUp size={15} /></button>
                <button disabled={exerciseIndex === orderedExercises.length - 1} onClick={() => moveExercise(exercise, 1)} aria-label="Sposta giù"><ArrowDown size={15} /></button>
                <button onClick={() => openEditExercise(exercise)} aria-label="Modifica"><Edit3 size={15} /></button>
                <button className="danger" onClick={() => deleteExercise(exercise)} aria-label="Elimina"><Trash2 size={15} /></button>
              </div>
            )}
          </div>

          <div className="programmed-line">
            <b>Programmato:</b> {exercise.plannedSets} serie × {exercise.plannedReps} ripetizioni · {exercise.plannedWeight} kg
            {exercise.recoverySeconds > 0 && ` · recupero ${exercise.recoverySeconds} sec`}
          </div>

          <div className="set-list">
            <div className="set-label-row"><span>Serie</span><span>Peso reale</span><span>Ripetizioni</span><span>Stato</span></div>
            {exercise.sets.map((set) => (
              <div className={`set-row ${set.status}`} key={set.id}>
                <span className="set-number">{set.setNumber}</span>
                <label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    disabled={readOnly}
                    value={set.actualWeight ?? ''}
                    placeholder={String(set.targetWeight)}
                    onChange={(event) => updateSet(exercise.id, set.id, 'actualWeight', event.target.value === '' ? undefined : Number(event.target.value))}
                  />
                  <small>kg</small>
                </label>
                <label>
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly}
                    value={set.actualReps ?? ''}
                    placeholder={String(set.targetReps)}
                    onChange={(event) => updateSet(exercise.id, set.id, 'actualReps', event.target.value === '' ? undefined : Number(event.target.value))}
                  />
                  <small>reps</small>
                </label>
                <div className="set-actions">
                  <button disabled={readOnly} className="set-check" onClick={() => toggleSet(exercise.id, set.id)} aria-label="Completa serie">
                    {set.status === 'completed' ? <Check size={18} /> : <Circle size={17} />}
                  </button>
                  <button disabled={readOnly} className="set-skip" onClick={() => skipSet(exercise.id, set.id)} aria-label="Salta serie">
                    <SkipForward size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {session.status === 'completed' && exercise.sourceExerciseId && (
            <button className="template-update-button" onClick={() => updateTemplateWeight(exercise)}>
              <CopyCheck size={16} /> Usa l’ultimo peso nella scheda originale
            </button>
          )}
        </article>
      ))}

      {!readOnly && <button className="dashed-button" onClick={openNewExercise}><Plus size={17} /> Aggiungi esercizio solo a questa sessione</button>}


      <div className="workout-actions">
        {session.status === 'started' && <button className="primary-button" onClick={completeWorkout}><Check size={17} /> Completa allenamento</button>}
        {session.status === 'scheduled' && <button className="primary-button" onClick={startWorkout}><Dumbbell size={17} /> Inizia allenamento</button>}
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
        <label><span>Serie previste</span><input type="number" min="1" value={draft.plannedSets} onChange={(event) => setDraft({ ...draft, plannedSets: Math.max(1, Number(event.target.value)) })} /></label>
        <label><span>Ripetizioni previste</span><input type="number" min="1" value={draft.plannedReps} onChange={(event) => setDraft({ ...draft, plannedReps: Math.max(1, Number(event.target.value)) })} /></label>
        <label><span>Peso previsto (kg)</span><input type="number" min="0" step="0.5" value={draft.plannedWeight} onChange={(event) => setDraft({ ...draft, plannedWeight: Number(event.target.value) })} /></label>
        <label><span>Recupero (secondi)</span><input type="number" min="0" step="5" value={draft.recoverySeconds} onChange={(event) => setDraft({ ...draft, recoverySeconds: Number(event.target.value) })} /></label>
        <label className="full"><span>Tecnica</span><input value={draft.technique} onChange={(event) => setDraft({ ...draft, technique: event.target.value })} /></label>
        <label className="full"><span>Note del personal trainer</span><textarea rows={2} value={draft.trainerNotes} onChange={(event) => setDraft({ ...draft, trainerNotes: event.target.value })} /></label>
        <div className="modal-actions full"><button className="primary-button" disabled={!draft.name.trim()} onClick={onSave}>Continua</button><button className="secondary-button" onClick={onClose}>Annulla</button></div>
      </div>
    </Modal>
  )
}
