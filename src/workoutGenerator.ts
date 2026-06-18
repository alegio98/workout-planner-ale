import { EXERCISE_LIBRARY, type LibraryExercise, type MuscleGroup } from './data/exerciseLibrary'
import type { SessionExercise, WorkoutSession } from './types'
import { uid } from './utils'

const durationExerciseCount: Record<number, number> = {
  30: 4,
  60: 6,
  90: 8,
  120: 10,
}

const shuffle = <T,>(items: T[]) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
  }
  return copy
}

const rank = (exercise: LibraryExercise) => {
  if (exercise.kind === 'compound') return 0
  if (exercise.kind === 'accessory') return 1
  return 2
}

const toSessionExercise = (exercise: LibraryExercise, order: number): SessionExercise => ({
  id: uid(),
  name: exercise.name,
  muscleGroup: exercise.muscleGroup,
  plannedSets: exercise.defaultSets,
  plannedReps: exercise.defaultReps,
  plannedWeight: 0,
  setMode: 'standard',
  recoverySeconds: exercise.recoverySeconds,
  technique: exercise.instructions,
  trainerNotes: `Attrezzatura: ${exercise.equipment}`,
  order,
  origin: 'custom',
  isCustomized: true,
  sets: Array.from({ length: exercise.defaultSets }, (_, index) => ({
    id: uid(),
    setNumber: index + 1,
    targetReps: exercise.defaultReps,
    targetWeight: 0,
    status: 'pending' as const,
    notes: '',
  })),
})

export const createFreeWorkoutSession = (scheduledDate: string): WorkoutSession => {
  const timestamp = new Date().toISOString()
  return {
    id: uid(),
    scheduledDate,
    origin: 'free',
    status: 'scheduled',
    planNameSnapshot: 'Allenamento libero',
    dayNameSnapshot: 'Allenamento libero',
    dayFocusSnapshot: 'Componi la sessione mentre ti alleni',
    exercises: [],
    hasLocalChanges: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const generateShuffleWorkout = (
  muscleGroups: MuscleGroup[],
  durationMinutes: 30 | 60 | 90 | 120,
  scheduledDate: string,
): WorkoutSession => {
  const targetCount = durationExerciseCount[durationMinutes]
  const selected: LibraryExercise[] = []
  const used = new Set<string>()

  const pools = muscleGroups.map((group) => ({
    group,
    exercises: shuffle(EXERCISE_LIBRARY.filter((exercise) => exercise.muscleGroup === group)).sort(
      (a, b) => rank(a) - rank(b),
    ),
  }))

  let cursor = 0
  while (selected.length < targetCount) {
    const pool = pools[cursor % pools.length]
    const next = pool.exercises.find((exercise) => !used.has(exercise.id))
    if (next) {
      selected.push(next)
      used.add(next.id)
    }
    cursor += 1
    if (cursor > targetCount * pools.length * 3) break
  }

  if (selected.length < targetCount) {
    const fallbacks = shuffle(
      EXERCISE_LIBRARY.filter((exercise) =>
        exercise.secondaryMuscles.some((group) => muscleGroups.includes(group)) && !used.has(exercise.id),
      ),
    )
    for (const exercise of fallbacks) {
      if (selected.length >= targetCount) break
      selected.push(exercise)
      used.add(exercise.id)
    }
  }

  const ordered = selected.sort((a, b) => rank(a) - rank(b))
  const timestamp = new Date().toISOString()

  return {
    id: uid(),
    scheduledDate,
    origin: 'shuffle',
    estimatedDurationMinutes: durationMinutes,
    selectedMuscleGroups: muscleGroups,
    status: 'scheduled',
    planNameSnapshot: 'Workout Shuffle',
    dayNameSnapshot: 'Workout Shuffle',
    dayFocusSnapshot: muscleGroups.join(' + '),
    exercises: ordered.map(toSessionExercise),
    hasLocalChanges: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
