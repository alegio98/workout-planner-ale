import Dexie, { type EntityTable } from 'dexie'
import type { PlanExercise, SessionExercise, WorkoutPlan, WorkoutSession } from './types'
import { uid } from './utils'

const migratePlanExercise = (exercise: PlanExercise) => {
  const sets = Math.max(1, Number(exercise.sets) || 1)
  const reps = Math.max(1, Number(exercise.reps) || 1)
  const weight = Math.max(0, Number(exercise.suggestedWeight) || 0)
  const currentTargets = Array.isArray(exercise.setTargets) ? exercise.setTargets : []

  exercise.setMode = exercise.setMode === 'custom' ? 'custom' : 'standard'
  exercise.setTargets = currentTargets.length
    ? currentTargets.map((target, index) => ({
        id: target.id || uid(),
        setNumber: index + 1,
        reps: Math.max(1, Number(target.reps) || reps),
        weight: Math.max(0, Number(target.weight) || 0),
      }))
    : Array.from({ length: sets }, (_, index) => ({
        id: uid(),
        setNumber: index + 1,
        reps,
        weight,
      }))
}

const migrateSessionExercise = (exercise: SessionExercise) => {
  const sets = Array.isArray(exercise.sets) ? exercise.sets : []
  const first = sets[0]
  const isCustom = sets.some(
    (set) => set.targetReps !== first?.targetReps || set.targetWeight !== first?.targetWeight,
  )

  exercise.setMode = exercise.setMode === 'custom' || isCustom ? 'custom' : 'standard'
  exercise.plannedSets = Math.max(1, Number(exercise.plannedSets) || sets.length || 1)
  exercise.plannedReps = Math.max(1, Number(exercise.plannedReps) || first?.targetReps || 1)
  exercise.plannedWeight = Math.max(0, Number(exercise.plannedWeight) || first?.targetWeight || 0)

  exercise.sets = sets.length
    ? sets.map((set, index) => ({
        ...set,
        id: set.id || uid(),
        setNumber: index + 1,
        targetReps: Math.max(1, Number(set.targetReps) || exercise.plannedReps),
        targetWeight: Math.max(0, Number(set.targetWeight) || 0),
        notes: set.notes || '',
        status: set.status || 'pending',
      }))
    : Array.from({ length: exercise.plannedSets }, (_, index) => ({
        id: uid(),
        setNumber: index + 1,
        targetReps: exercise.plannedReps,
        targetWeight: exercise.plannedWeight,
        status: 'pending' as const,
        notes: '',
      }))
}

class WorkoutPlannerDB extends Dexie {
  plans!: EntityTable<WorkoutPlan, 'id'>
  sessions!: EntityTable<WorkoutSession, 'id'>

  constructor() {
    super('WorkoutPlannerDB')
    this.version(1).stores({
      plans: 'id, updatedAt, createdAt',
      sessions: 'id, scheduledDate, status, sourcePlanId, updatedAt',
    })

    this.version(2)
      .stores({
        plans: 'id, updatedAt, createdAt',
        sessions: 'id, scheduledDate, status, sourcePlanId, updatedAt',
      })
      .upgrade(async (transaction) => {
        await transaction.table<WorkoutPlan, string>('plans').toCollection().modify((plan) => {
          if (!Array.isArray(plan.days)) plan.days = []
          plan.days.forEach((day) => {
            if (!Array.isArray(day.exercises)) day.exercises = []
            day.exercises.forEach(migratePlanExercise)
          })
        })

        await transaction.table<WorkoutSession, string>('sessions').toCollection().modify((session) => {
          if (!Array.isArray(session.exercises)) session.exercises = []
          session.exercises.forEach(migrateSessionExercise)
          session.hasLocalChanges = Boolean(session.hasLocalChanges)
        })
      })
  }
}

export const db = new WorkoutPlannerDB()
