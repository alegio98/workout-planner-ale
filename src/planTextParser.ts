import type { PlanDay, PlanExercise } from './types'
import { createStandardTargets, uid } from './utils'

export interface ParsedPlanText {
  days: PlanDay[]
  ignoredLines: string[]
}

const dayPattern = /^giorno\s*([a-z0-9]+)(?:\s*[-–—:]\s*(.+))?$/i
const numberedExercisePattern = /^\s*(?:\d+\s*[).:\-]\s*)?(.+?)\s*$/

const parseRepetitions = (value: string): number[] => {
  const compact = value.trim()
  const multiplied = compact.match(/^(\d+)\s*[x×]\s*(\d+)$/i)
  if (multiplied) {
    const count = Math.max(1, Number(multiplied[1]))
    const repetitions = Math.max(1, Number(multiplied[2]))
    return Array.from({ length: count }, () => repetitions)
  }

  if (!/^\d+(?:\s+\d+)*$/.test(compact)) return []
  return compact.split(/\s+/).map(Number).filter((item) => Number.isFinite(item) && item > 0)
}

const normalizeDayName = (token: string) => `Giorno ${token.toUpperCase()}`

const createExercise = (name: string, repetitions: number[], trainerNotes: string, order: number): PlanExercise => {
  const normalizedRepetitions = repetitions.length ? repetitions : [10, 10, 10]
  const isCustom = normalizedRepetitions.some((value) => value !== normalizedRepetitions[0])
  const setTargets = normalizedRepetitions.map((reps, index) => ({
    id: uid(),
    setNumber: index + 1,
    reps,
    weight: 0,
  }))

  return {
    id: uid(),
    name,
    muscleGroup: '',
    sets: setTargets.length,
    reps: setTargets[0]?.reps ?? 10,
    suggestedWeight: 0,
    setMode: isCustom ? 'custom' : 'standard',
    setTargets: isCustom ? setTargets : createStandardTargets(setTargets.length, setTargets[0]?.reps ?? 10, 0),
    recoverySeconds: 60,
    technique: '',
    trainerNotes,
    order,
  }
}

export const parsePlanText = (source: string): ParsedPlanText => {
  const days: PlanDay[] = []
  const ignoredLines: string[] = []
  let currentDay: PlanDay | null = null

  source
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const dayMatch = line.match(dayPattern)
      if (dayMatch) {
        currentDay = {
          id: uid(),
          name: normalizeDayName(dayMatch[1]),
          focus: dayMatch[2]?.trim() ?? '',
          notes: '',
          order: days.length,
          exercises: [],
        }
        days.push(currentDay)
        return
      }

      if (!currentDay) {
        ignoredLines.push(line)
        return
      }

      const exerciseBody = line.match(numberedExercisePattern)?.[1]?.trim() ?? ''
      if (!exerciseBody) {
        ignoredLines.push(line)
        return
      }

      const notes = [...exerciseBody.matchAll(/\(([^()]*)\)/g)]
        .map((match) => match[1].trim())
        .filter(Boolean)
      const withoutNotes = exerciseBody.replace(/\s*\([^()]*\)\s*/g, ' ').trim()
      const commaIndex = withoutNotes.lastIndexOf(',')

      let exerciseName = withoutNotes
      let repetitions: number[] = []

      if (commaIndex >= 0) {
        const possibleRepetitions = withoutNotes.slice(commaIndex + 1).trim()
        const parsed = parseRepetitions(possibleRepetitions)
        if (parsed.length) {
          repetitions = parsed
          exerciseName = withoutNotes.slice(0, commaIndex).trim()
        }
      }

      if (!repetitions.length) {
        const trailing = withoutNotes.match(/^(.*?)\s+(\d+(?:\s+\d+)+)$/)
        if (trailing) {
          const parsed = parseRepetitions(trailing[2])
          if (parsed.length) {
            repetitions = parsed
            exerciseName = trailing[1].trim()
          }
        }
      }

      if (!exerciseName) {
        ignoredLines.push(line)
        return
      }

      currentDay.exercises.push(
        createExercise(exerciseName, repetitions, notes.join(' · '), currentDay.exercises.length),
      )
    })

  return { days: days.filter((day) => day.exercises.length > 0), ignoredLines }
}
