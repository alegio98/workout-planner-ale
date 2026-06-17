import Dexie, { type EntityTable } from 'dexie'
import type { WorkoutPlan, WorkoutSession } from './types'

class WorkoutPlannerDB extends Dexie {
  plans!: EntityTable<WorkoutPlan, 'id'>
  sessions!: EntityTable<WorkoutSession, 'id'>

  constructor() {
    super('WorkoutPlannerDB')
    this.version(1).stores({
      plans: 'id, updatedAt, createdAt',
      sessions: 'id, scheduledDate, status, sourcePlanId, updatedAt',
    })
  }
}

export const db = new WorkoutPlannerDB()
