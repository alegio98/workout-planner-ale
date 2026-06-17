import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  Copy,
  Edit3,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import Modal from '../components/Modal'
import { db } from '../db'
import type { PlanDay, PlanExercise, WorkoutPlan } from '../types'
import { localDate, makeEmptyExercise, normalizeOrders, safeClone, sortedDays, sortedExercises, uid } from '../utils'

interface PlansViewProps {
  plans: WorkoutPlan[]
  notify: (message: string) => void
}

type PlanDraft = Pick<WorkoutPlan, 'name' | 'trainerName' | 'startDate' | 'endDate' | 'durationWeeks' | 'notes'>
type DayDraft = Pick<PlanDay, 'name' | 'focus' | 'notes'>
type ExerciseDraft = Omit<PlanExercise, 'id' | 'order'>

const emptyPlanDraft = (): PlanDraft => ({
  name: '',
  trainerName: '',
  startDate: localDate(),
  endDate: '',
  durationWeeks: 12,
  notes: '',
})

const emptyDayDraft = (position: number): DayDraft => ({
  name: `Giorno ${String.fromCharCode(65 + position)}`,
  focus: '',
  notes: '',
})

const emptyExerciseDraft = (): ExerciseDraft => {
  const exercise = makeEmptyExercise(0)
  const { id: _id, order: _order, ...draft } = exercise
  return draft
}

export default function PlansView({ plans, notify }: PlansViewProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedDayId, setSelectedDayId] = useState('')
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planDraft, setPlanDraft] = useState<PlanDraft>(emptyPlanDraft())
  const [dayModalOpen, setDayModalOpen] = useState(false)
  const [editingDayId, setEditingDayId] = useState<string | null>(null)
  const [dayDraft, setDayDraft] = useState<DayDraft>(emptyDayDraft(0))
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [exerciseDraft, setExerciseDraft] = useState<ExerciseDraft>(emptyExerciseDraft())

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0]
  const orderedDays = useMemo(() => (selectedPlan ? sortedDays(selectedPlan) : []), [selectedPlan])
  const selectedDay = orderedDays.find((day) => day.id === selectedDayId) ?? orderedDays[0]
  const orderedExercises = useMemo(() => (selectedDay ? sortedExercises(selectedDay.exercises) : []), [selectedDay])

  useEffect(() => {
    if (!plans.length) {
      setSelectedPlanId('')
      return
    }
    if (!plans.some((plan) => plan.id === selectedPlanId)) setSelectedPlanId(plans[0].id)
  }, [plans, selectedPlanId])

  useEffect(() => {
    if (!orderedDays.length) {
      setSelectedDayId('')
      return
    }
    if (!orderedDays.some((day) => day.id === selectedDayId)) setSelectedDayId(orderedDays[0].id)
  }, [orderedDays, selectedDayId])

  const persistPlan = async (plan: WorkoutPlan, message?: string) => {
    await db.plans.put({ ...plan, revision: plan.revision + 1, updatedAt: new Date().toISOString() })
    if (message) notify(message)
  }

  const openNewPlan = () => {
    setEditingPlanId(null)
    setPlanDraft(emptyPlanDraft())
    setPlanModalOpen(true)
  }

  const openEditPlan = () => {
    if (!selectedPlan) return
    setEditingPlanId(selectedPlan.id)
    setPlanDraft({
      name: selectedPlan.name,
      trainerName: selectedPlan.trainerName,
      startDate: selectedPlan.startDate,
      endDate: selectedPlan.endDate,
      durationWeeks: selectedPlan.durationWeeks,
      notes: selectedPlan.notes,
    })
    setPlanModalOpen(true)
  }

  const savePlan = async () => {
    if (!planDraft.name.trim()) return
    const now = new Date().toISOString()
    if (editingPlanId) {
      const plan = plans.find((item) => item.id === editingPlanId)
      if (!plan) return
      await db.plans.put({
        ...plan,
        ...planDraft,
        name: planDraft.name.trim(),
        revision: plan.revision + 1,
        updatedAt: now,
      })
      notify('Scheda aggiornata.')
    } else {
      const firstDayId = uid()
      const plan: WorkoutPlan = {
        id: uid(),
        ...planDraft,
        name: planDraft.name.trim(),
        durationWeeks: planDraft.durationWeeks || undefined,
        revision: 1,
        days: [{ id: firstDayId, ...emptyDayDraft(0), order: 0, exercises: [] }],
        createdAt: now,
        updatedAt: now,
      }
      await db.plans.add(plan)
      setSelectedPlanId(plan.id)
      setSelectedDayId(firstDayId)
      notify('Nuova scheda creata.')
    }
    setPlanModalOpen(false)
  }

  const duplicatePlan = async () => {
    if (!selectedPlan) return
    const now = new Date().toISOString()
    const copy: WorkoutPlan = {
      ...safeClone(selectedPlan),
      id: uid(),
      name: `${selectedPlan.name} — copia`,
      revision: 1,
      createdAt: now,
      updatedAt: now,
      days: selectedPlan.days.map((day) => ({
        ...safeClone(day),
        id: uid(),
        exercises: day.exercises.map((exercise) => ({ ...safeClone(exercise), id: uid() })),
      })),
    }
    await db.plans.add(copy)
    setSelectedPlanId(copy.id)
    notify('Scheda duplicata.')
  }

  const deletePlan = async () => {
    if (!selectedPlan || !window.confirm(`Eliminare “${selectedPlan.name}”? Gli allenamenti già pianificati resteranno disponibili.`)) return
    await db.plans.delete(selectedPlan.id)
    notify('Scheda eliminata.')
  }

  const openNewDay = () => {
    setEditingDayId(null)
    setDayDraft(emptyDayDraft(orderedDays.length))
    setDayModalOpen(true)
  }

  const openEditDay = () => {
    if (!selectedDay) return
    setEditingDayId(selectedDay.id)
    setDayDraft({ name: selectedDay.name, focus: selectedDay.focus, notes: selectedDay.notes })
    setDayModalOpen(true)
  }

  const saveDay = async () => {
    if (!selectedPlan || !dayDraft.name.trim()) return
    if (editingDayId) {
      const updatedDays = selectedPlan.days.map((day) =>
        day.id === editingDayId ? { ...day, ...dayDraft, name: dayDraft.name.trim() } : day,
      )
      await persistPlan({ ...selectedPlan, days: updatedDays }, 'Giornata aggiornata.')
    } else {
      const newDay: PlanDay = {
        id: uid(),
        ...dayDraft,
        name: dayDraft.name.trim(),
        order: selectedPlan.days.length,
        exercises: [],
      }
      await persistPlan({ ...selectedPlan, days: [...selectedPlan.days, newDay] }, 'Giornata aggiunta.')
      setSelectedDayId(newDay.id)
    }
    setDayModalOpen(false)
  }

  const duplicateDay = async () => {
    if (!selectedPlan || !selectedDay) return
    const copy: PlanDay = {
      ...safeClone(selectedDay),
      id: uid(),
      name: `${selectedDay.name} copia`,
      order: selectedPlan.days.length,
      exercises: selectedDay.exercises.map((exercise) => ({ ...safeClone(exercise), id: uid() })),
    }
    await persistPlan({ ...selectedPlan, days: [...selectedPlan.days, copy] }, 'Giornata duplicata.')
    setSelectedDayId(copy.id)
  }

  const deleteDay = async () => {
    if (!selectedPlan || !selectedDay || !window.confirm(`Eliminare “${selectedDay.name}”?`)) return
    const days = normalizeOrders(sortedDays(selectedPlan).filter((day) => day.id !== selectedDay.id))
    await persistPlan({ ...selectedPlan, days }, 'Giornata eliminata.')
  }

  const moveDay = async (direction: -1 | 1) => {
    if (!selectedPlan || !selectedDay) return
    const days = sortedDays(selectedPlan)
    const index = days.findIndex((day) => day.id === selectedDay.id)
    const target = index + direction
    if (target < 0 || target >= days.length) return
    ;[days[index], days[target]] = [days[target], days[index]]
    await persistPlan({ ...selectedPlan, days: normalizeOrders(days) })
  }

  const openNewExercise = () => {
    setEditingExerciseId(null)
    setExerciseDraft(emptyExerciseDraft())
    setExerciseModalOpen(true)
  }

  const openEditExercise = (exercise: PlanExercise) => {
    const { id: _id, order: _order, ...draft } = exercise
    setEditingExerciseId(exercise.id)
    setExerciseDraft(draft)
    setExerciseModalOpen(true)
  }

  const saveExercise = async () => {
    if (!selectedPlan || !selectedDay || !exerciseDraft.name.trim()) return
    const exercises = editingExerciseId
      ? selectedDay.exercises.map((exercise) =>
          exercise.id === editingExerciseId
            ? { ...exercise, ...exerciseDraft, name: exerciseDraft.name.trim() }
            : exercise,
        )
      : [
          ...selectedDay.exercises,
          { id: uid(), order: selectedDay.exercises.length, ...exerciseDraft, name: exerciseDraft.name.trim() },
        ]
    const days = selectedPlan.days.map((day) => (day.id === selectedDay.id ? { ...day, exercises } : day))
    await persistPlan({ ...selectedPlan, days }, editingExerciseId ? 'Esercizio aggiornato.' : 'Esercizio aggiunto.')
    setExerciseModalOpen(false)
  }

  const duplicateExercise = async (exercise: PlanExercise) => {
    if (!selectedPlan || !selectedDay) return
    const copy = { ...safeClone(exercise), id: uid(), name: `${exercise.name} copia`, order: selectedDay.exercises.length }
    const days = selectedPlan.days.map((day) =>
      day.id === selectedDay.id ? { ...day, exercises: [...day.exercises, copy] } : day,
    )
    await persistPlan({ ...selectedPlan, days }, 'Esercizio duplicato.')
  }

  const deleteExercise = async (exercise: PlanExercise) => {
    if (!selectedPlan || !selectedDay || !window.confirm(`Eliminare “${exercise.name}”?`)) return
    const exercises = normalizeOrders(sortedExercises(selectedDay.exercises).filter((item) => item.id !== exercise.id))
    const days = selectedPlan.days.map((day) => (day.id === selectedDay.id ? { ...day, exercises } : day))
    await persistPlan({ ...selectedPlan, days }, 'Esercizio eliminato.')
  }

  const moveExercise = async (exercise: PlanExercise, direction: -1 | 1) => {
    if (!selectedPlan || !selectedDay) return
    const exercises = sortedExercises(selectedDay.exercises)
    const index = exercises.findIndex((item) => item.id === exercise.id)
    const target = index + direction
    if (target < 0 || target >= exercises.length) return
    ;[exercises[index], exercises[target]] = [exercises[target], exercises[index]]
    const days = selectedPlan.days.map((day) =>
      day.id === selectedDay.id ? { ...day, exercises: normalizeOrders(exercises) } : day,
    )
    await persistPlan({ ...selectedPlan, days })
  }

  if (!plans.length) {
    return (
      <div className="view-shell">
        <section className="page-heading">
          <div><span className="eyebrow">Le mie schede</span><h1>Scheda palestra</h1></div>
          <button className="primary-button compact" onClick={openNewPlan}><Plus size={17} /> Nuova</button>
        </section>
        <button className="empty-state large" onClick={openNewPlan}>
          <span className="empty-icon"><Plus size={24} /></span>
          <b>Crea la tua prima scheda</b>
          <span>Inserisci le indicazioni ricevute dal personal trainer.</span>
        </button>
        <PlanModal
          open={planModalOpen}
          draft={planDraft}
          setDraft={setPlanDraft}
          onClose={() => setPlanModalOpen(false)}
          onSave={savePlan}
          editing={false}
        />
      </div>
    )
  }

  return (
    <div className="view-shell">
      <section className="page-heading">
        <div><span className="eyebrow">Le mie schede</span><h1>Scheda palestra</h1></div>
        <button className="primary-button compact" onClick={openNewPlan}><Plus size={17} /> Nuova</button>
      </section>

      {plans.length > 1 && (
        <label className="inline-select">
          <span>Scheda attiva</span>
          <select value={selectedPlan.id} onChange={(event) => setSelectedPlanId(event.target.value)}>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select>
        </label>
      )}

      <article className="plan-summary-card">
        <div className="plan-summary-top">
          <div>
            <h2>{selectedPlan.name}</h2>
            <p><UserRound size={14} /> {selectedPlan.trainerName || 'Personal trainer non indicato'}</p>
          </div>
          <button className="icon-button"><MoreHorizontal size={20} /></button>
        </div>
        <div className="plan-summary-meta">
          <span><CalendarRange size={14} /> Dal {new Date(`${selectedPlan.startDate}T12:00:00`).toLocaleDateString('it-IT')}</span>
          <span>{selectedPlan.durationWeeks ? `${selectedPlan.durationWeeks} settimane` : 'Durata libera'}</span>
          <span>{orderedDays.length} giornate</span>
        </div>
        {selectedPlan.notes && <p className="plan-note">{selectedPlan.notes}</p>}
        <div className="card-actions">
          <button onClick={openEditPlan}><Edit3 size={15} /> Modifica</button>
          <button onClick={duplicatePlan}><Copy size={15} /> Duplica</button>
          <button className="danger" onClick={deletePlan}><Trash2 size={15} /> Elimina</button>
        </div>
      </article>

      <div className="section-title-row">
        <h2>Giornate</h2>
        <button className="text-button" onClick={openNewDay}><Plus size={15} /> Aggiungi</button>
      </div>
      <div className="day-tabs">
        {orderedDays.map((day) => (
          <button key={day.id} className={day.id === selectedDay?.id ? 'active' : ''} onClick={() => setSelectedDayId(day.id)}>
            {day.name}
          </button>
        ))}
        <button className="add-tab" onClick={openNewDay}><Plus size={15} /></button>
      </div>

      {selectedDay ? (
        <>
          <section className="day-heading">
            <div>
              <h2>{selectedDay.focus || selectedDay.name}</h2>
              <p>{orderedExercises.length} esercizi · circa {Math.max(20, orderedExercises.length * 9)} minuti</p>
            </div>
            <div className="mini-actions">
              <button onClick={() => moveDay(-1)} aria-label="Sposta prima"><ArrowUp size={16} /></button>
              <button onClick={() => moveDay(1)} aria-label="Sposta dopo"><ArrowDown size={16} /></button>
              <button onClick={duplicateDay} aria-label="Duplica"><Copy size={16} /></button>
              <button onClick={openEditDay} aria-label="Modifica"><Edit3 size={16} /></button>
              <button className="danger" onClick={deleteDay} aria-label="Elimina"><Trash2 size={16} /></button>
            </div>
          </section>

          <article className="exercise-list-card">
            {orderedExercises.length ? orderedExercises.map((exercise, index) => (
              <div className="exercise-row" key={exercise.id}>
                <div className="drag-handle"><GripVertical size={17} /></div>
                <button className="exercise-main" onClick={() => openEditExercise(exercise)}>
                  <b>{exercise.name}</b>
                  <span>{exercise.sets} × {exercise.reps} · {exercise.suggestedWeight || '—'} kg · recupero {exercise.recoverySeconds} sec</span>
                </button>
                <div className="exercise-actions">
                  <button disabled={index === 0} onClick={() => moveExercise(exercise, -1)} aria-label="Sposta su"><ArrowUp size={14} /></button>
                  <button disabled={index === orderedExercises.length - 1} onClick={() => moveExercise(exercise, 1)} aria-label="Sposta giù"><ArrowDown size={14} /></button>
                  <button onClick={() => duplicateExercise(exercise)} aria-label="Duplica"><Copy size={14} /></button>
                  <button className="danger" onClick={() => deleteExercise(exercise)} aria-label="Elimina"><Trash2 size={14} /></button>
                </div>
              </div>
            )) : (
              <div className="list-empty">Questa giornata non contiene ancora esercizi.</div>
            )}
            <button className="dashed-button" onClick={openNewExercise}><Plus size={17} /> Aggiungi esercizio</button>
          </article>
        </>
      ) : (
        <button className="empty-state" onClick={openNewDay}>
          <span className="empty-icon"><Plus size={24} /></span>
          <b>Aggiungi una giornata</b>
          <span>Per esempio Giorno A · Petto e tricipiti.</span>
        </button>
      )}

      <PlanModal
        open={planModalOpen}
        draft={planDraft}
        setDraft={setPlanDraft}
        onClose={() => setPlanModalOpen(false)}
        onSave={savePlan}
        editing={Boolean(editingPlanId)}
      />

      <Modal open={dayModalOpen} title={editingDayId ? 'Modifica giornata' : 'Nuova giornata'} onClose={() => setDayModalOpen(false)}>
        <div className="form-stack">
          <label><span>Nome</span><input value={dayDraft.name} onChange={(event) => setDayDraft({ ...dayDraft, name: event.target.value })} placeholder="Giorno A" /></label>
          <label><span>Focus</span><input value={dayDraft.focus} onChange={(event) => setDayDraft({ ...dayDraft, focus: event.target.value })} placeholder="Petto e tricipiti" /></label>
          <label><span>Note</span><textarea value={dayDraft.notes} onChange={(event) => setDayDraft({ ...dayDraft, notes: event.target.value })} rows={3} /></label>
          <div className="modal-actions"><button className="primary-button" onClick={saveDay}>Salva giornata</button><button className="secondary-button" onClick={() => setDayModalOpen(false)}>Annulla</button></div>
        </div>
      </Modal>

      <ExerciseModal
        open={exerciseModalOpen}
        draft={exerciseDraft}
        setDraft={setExerciseDraft}
        onClose={() => setExerciseModalOpen(false)}
        onSave={saveExercise}
        editing={Boolean(editingExerciseId)}
      />
    </div>
  )
}

interface PlanModalProps {
  open: boolean
  draft: PlanDraft
  setDraft: (draft: PlanDraft) => void
  onClose: () => void
  onSave: () => void
  editing: boolean
}

function PlanModal({ open, draft, setDraft, onClose, onSave, editing }: PlanModalProps) {
  return (
    <Modal open={open} title={editing ? 'Modifica scheda' : 'Nuova scheda'} description="I dati vengono salvati nel browser e restano disponibili alla riapertura." onClose={onClose} wide>
      <div className="form-stack two-columns">
        <label className="full"><span>Nome della scheda</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Scheda Forza" /></label>
        <label className="full"><span>Personal trainer</span><input value={draft.trainerName} onChange={(event) => setDraft({ ...draft, trainerName: event.target.value })} placeholder="Facoltativo" /></label>
        <label><span>Data di inizio</span><input type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} /></label>
        <label><span>Data di fine</span><input type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} /></label>
        <label><span>Durata prevista</span><input type="number" min="1" value={draft.durationWeeks ?? ''} onChange={(event) => setDraft({ ...draft, durationWeeks: Number(event.target.value) || undefined })} /></label>
        <label className="full"><span>Note generali</span><textarea rows={3} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
        <div className="modal-actions full"><button className="primary-button" disabled={!draft.name.trim()} onClick={onSave}>Salva scheda</button><button className="secondary-button" onClick={onClose}>Annulla</button></div>
      </div>
    </Modal>
  )
}

interface ExerciseModalProps {
  open: boolean
  draft: ExerciseDraft
  setDraft: (draft: ExerciseDraft) => void
  onClose: () => void
  onSave: () => void
  editing: boolean
}

function ExerciseModal({ open, draft, setDraft, onClose, onSave, editing }: ExerciseModalProps) {
  return (
    <Modal open={open} title={editing ? 'Modifica esercizio' : 'Nuovo esercizio'} onClose={onClose} wide>
      <div className="form-stack two-columns">
        <label className="full"><span>Nome esercizio</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Panca piana bilanciere" /></label>
        <label className="full"><span>Gruppo muscolare</span><input value={draft.muscleGroup} onChange={(event) => setDraft({ ...draft, muscleGroup: event.target.value })} placeholder="Petto" /></label>
        <label><span>Serie</span><input type="number" min="1" value={draft.sets} onChange={(event) => setDraft({ ...draft, sets: Math.max(1, Number(event.target.value)) })} /></label>
        <label><span>Ripetizioni</span><input type="number" min="1" value={draft.reps} onChange={(event) => setDraft({ ...draft, reps: Math.max(1, Number(event.target.value)) })} /></label>
        <label><span>Peso consigliato (kg)</span><input type="number" min="0" step="0.5" value={draft.suggestedWeight} onChange={(event) => setDraft({ ...draft, suggestedWeight: Number(event.target.value) })} /></label>
        <label><span>Recupero (secondi)</span><input type="number" min="0" step="5" value={draft.recoverySeconds} onChange={(event) => setDraft({ ...draft, recoverySeconds: Number(event.target.value) })} /></label>
        <label className="full"><span>Tecnica o modalità</span><input value={draft.technique} onChange={(event) => setDraft({ ...draft, technique: event.target.value })} placeholder="Esecuzione controllata" /></label>
        <label className="full"><span>Note del personal trainer</span><textarea rows={3} value={draft.trainerNotes} onChange={(event) => setDraft({ ...draft, trainerNotes: event.target.value })} /></label>
        <div className="modal-actions full"><button className="primary-button" disabled={!draft.name.trim()} onClick={onSave}>Salva esercizio</button><button className="secondary-button" onClick={onClose}>Annulla</button></div>
      </div>
    </Modal>
  )
}
