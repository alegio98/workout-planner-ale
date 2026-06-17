import type { PlanDay, SessionExercise, WorkoutPlan, WorkoutSession } from './types'

export const uid = () => {
  const browserCrypto = globalThis.crypto

  if (browserCrypto?.randomUUID) return browserCrypto.randomUUID()

  if (browserCrypto?.getRandomValues) {
    const bytes = new Uint8Array(16)
    browserCrypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export const safeClone = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === 'function') return globalThis.structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

export const localDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const dateFromLocal = (value: string) => new Date(`${value}T12:00:00`)

export const addDays = (value: string, amount: number) => {
  const date = dateFromLocal(value)
  date.setDate(date.getDate() + amount)
  return localDate(date)
}

export const startOfWeek = (value: string) => {
  const date = dateFromLocal(value)
  const weekday = date.getDay() || 7
  date.setDate(date.getDate() - weekday + 1)
  return localDate(date)
}

export const formatLongDate = (value: string) =>
  dateFromLocal(value).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export const formatShortDate = (value: string) =>
  dateFromLocal(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

export const sortedDays = (plan: WorkoutPlan) =>
  [...(Array.isArray(plan.days) ? plan.days : [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

export const sortedExercises = <T extends { order: number }>(items: T[] | undefined) =>
  [...(Array.isArray(items) ? items : [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

const createSessionExercise = (exercise: PlanDay['exercises'][number]): SessionExercise => ({
  id: uid(),
  sourceExerciseId: exercise.id,
  name: exercise.name,
  muscleGroup: exercise.muscleGroup,
  plannedSets: exercise.sets,
  plannedReps: exercise.reps,
  plannedWeight: exercise.suggestedWeight,
  recoverySeconds: exercise.recoverySeconds,
  technique: exercise.technique,
  trainerNotes: exercise.trainerNotes,
  sessionNotes: '',
  order: exercise.order,
  origin: 'template',
  isCustomized: false,
  sets: Array.from({ length: exercise.sets }, (_, index) => ({
    id: uid(),
    setNumber: index + 1,
    targetReps: exercise.reps,
    targetWeight: exercise.suggestedWeight,
    status: 'pending' as const,
    notes: '',
  })),
})

export const createSessionFromDay = (
  plan: WorkoutPlan,
  day: PlanDay,
  scheduledDate: string,
): WorkoutSession => {
  const timestamp = new Date().toISOString()
  return {
    id: uid(),
    scheduledDate,
    status: 'scheduled',
    sourcePlanId: plan.id,
    sourceDayId: day.id,
    sourcePlanRevision: plan.revision,
    planNameSnapshot: plan.name,
    dayNameSnapshot: day.name,
    dayFocusSnapshot: day.focus,
    exercises: sortedExercises(day.exercises).map(createSessionExercise),
    notes: '',
    hasLocalChanges: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const cloneSessionForDate = (source: WorkoutSession, scheduledDate: string): WorkoutSession => {
  const timestamp = new Date().toISOString()
  return {
    ...safeClone(source),
    id: uid(),
    scheduledDate,
    status: 'scheduled',
    startedAt: undefined,
    completedAt: undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
    exercises: source.exercises.map((exercise) => ({
      ...safeClone(exercise),
      id: uid(),
      perceivedDifficulty: undefined,
      sessionNotes: '',
      sets: exercise.sets.map((set, index) => ({
        id: uid(),
        setNumber: index + 1,
        targetReps: set.targetReps,
        targetWeight: set.targetWeight,
        actualReps: undefined,
        actualWeight: undefined,
        status: 'pending',
        notes: '',
      })),
    })),
  }
}

export const makeEmptyExercise = (order: number): PlanDay['exercises'][number] => ({
  id: uid(),
  name: '',
  muscleGroup: '',
  sets: 3,
  reps: 10,
  suggestedWeight: 0,
  recoverySeconds: 60,
  technique: '',
  trainerNotes: '',
  order,
})

export const normalizeOrders = <T extends { order: number }>(items: T[]) =>
  items.map((item, index) => ({ ...item, order: index }))
