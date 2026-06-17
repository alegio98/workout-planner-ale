export type SessionStatus = 'scheduled' | 'started' | 'completed' | 'skipped' | 'moved'
export type SetStatus = 'pending' | 'completed' | 'skipped'

export interface PlanExercise {
  id: string
  name: string
  muscleGroup: string
  sets: number
  reps: number
  suggestedWeight: number
  recoverySeconds: number
  technique: string
  trainerNotes: string
  order: number
}

export interface PlanDay {
  id: string
  name: string
  focus: string
  notes: string
  order: number
  exercises: PlanExercise[]
}

export interface WorkoutPlan {
  id: string
  name: string
  trainerName: string
  startDate: string
  endDate: string
  durationWeeks?: number
  notes: string
  revision: number
  days: PlanDay[]
  createdAt: string
  updatedAt: string
}

export interface SessionSet {
  id: string
  setNumber: number
  targetReps: number
  targetWeight: number
  actualReps?: number
  actualWeight?: number
  status: SetStatus
  notes: string
}

export interface SessionExercise {
  id: string
  sourceExerciseId?: string
  name: string
  muscleGroup: string
  plannedSets: number
  plannedReps: number
  plannedWeight: number
  recoverySeconds: number
  technique: string
  trainerNotes: string
  sessionNotes: string
  perceivedDifficulty?: number
  order: number
  origin: 'template' | 'custom'
  isCustomized: boolean
  sets: SessionSet[]
}

export interface WorkoutSession {
  id: string
  scheduledDate: string
  status: SessionStatus
  sourcePlanId?: string
  sourceDayId?: string
  sourcePlanRevision?: number
  planNameSnapshot: string
  dayNameSnapshot: string
  dayFocusSnapshot: string
  exercises: SessionExercise[]
  notes: string
  hasLocalChanges: boolean
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type AppTab = 'calendar' | 'plans' | 'timer'
