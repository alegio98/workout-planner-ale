import { db } from './db'
import type { WorkoutPlan } from './types'
import { addDays, createSessionFromDay, createStandardTargets, localDate, uid } from './utils'

const exercise = (
  name: string,
  muscleGroup: string,
  sets: number,
  reps: number,
  weight: number,
  recoverySeconds: number,
  order: number,
) => ({
  id: uid(),
  name,
  muscleGroup,
  sets,
  reps,
  suggestedWeight: weight,
  setMode: 'standard' as const,
  setTargets: createStandardTargets(sets, reps, weight),
  recoverySeconds,
  technique: '',
  trainerNotes: '',
  order,
})

export async function seedDemoData() {
  if ((await db.plans.count()) > 0) return

  const now = new Date().toISOString()
  const today = localDate()
  const plan: WorkoutPlan = {
    id: uid(),
    name: 'Scheda Forza',
    trainerName: 'Mario Rossi',
    startDate: addDays(today, -1),
    endDate: addDays(today, 84),
    durationWeeks: 12,
    notes: 'Aumentare il carico soltanto mantenendo una tecnica pulita.',
    revision: 1,
    createdAt: now,
    updatedAt: now,
    days: [
      {
        id: uid(),
        name: 'Giorno A',
        focus: 'Petto e tricipiti',
        notes: '',
        order: 0,
        exercises: [
          exercise('Panca piana bilanciere', 'Petto', 4, 10, 30, 90, 0),
          exercise('Panca inclinata manubri', 'Petto', 4, 10, 14, 75, 1),
          exercise('Croci ai cavi', 'Petto', 3, 12, 12.5, 60, 2),
          exercise('Pushdown corda', 'Tricipiti', 4, 12, 20, 60, 3),
        ],
      },
      {
        id: uid(),
        name: 'Giorno B',
        focus: 'Schiena e bicipiti',
        notes: '',
        order: 1,
        exercises: [
          exercise('Lat machine presa larga', 'Schiena', 4, 10, 45, 90, 0),
          exercise('Rematore con manubrio', 'Schiena', 4, 10, 22, 75, 1),
          exercise('Curl bilanciere EZ', 'Bicipiti', 3, 12, 18, 60, 2),
        ],
      },
      {
        id: uid(),
        name: 'Giorno C',
        focus: 'Gambe',
        notes: '',
        order: 2,
        exercises: [
          exercise('Squat', 'Gambe', 4, 8, 50, 120, 0),
          exercise('Pressa', 'Gambe', 4, 10, 100, 90, 1),
          exercise('Leg curl', 'Femorali', 3, 12, 30, 60, 2),
        ],
      },
    ],
  }

  await db.plans.add(plan)
  await db.sessions.add(createSessionFromDay(plan, plan.days[0], today))
}
