export const EXERCISE_TYPES = [
  'Running',
  'Walking',
  'Cycling',
  'Strength training',
  'Swimming',
  'Other',
]
export const DEFAULT_EXERCISE_GOAL_MINUTES = 150
const KILOMETERS_PER_MILE = 1.609344

export function getExerciseDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidExerciseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
}

export function toKilometers(distance, unit) {
  return unit === 'mi' ? distance * KILOMETERS_PER_MILE : distance
}

export function isValidExerciseEntries(entries) {
  if (!Array.isArray(entries)) {
    return false
  }

  const ids = new Set()
  return entries.every((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return false
    }

    const distanceIsValid = entry.distance === null
      || entry.distance === undefined
      || (
        typeof entry.distance === 'number'
        && Number.isFinite(entry.distance)
        && entry.distance > 0
        && (entry.distanceUnit === 'mi' || entry.distanceUnit === 'km')
        && Number.isFinite(toKilometers(entry.distance, entry.distanceUnit))
      )
    const caloriesAreValid = entry.calories === null
      || entry.calories === undefined
      || (
        Number.isSafeInteger(entry.calories)
        && entry.calories > 0
      )

    if (typeof entry.id !== 'number'
      || !Number.isSafeInteger(entry.id)
      || ids.has(entry.id)
      || !isValidExerciseDate(entry.date)
      || !EXERCISE_TYPES.includes(entry.type)
      || !Number.isSafeInteger(entry.durationMinutes)
      || entry.durationMinutes <= 0
      || !distanceIsValid
      || !caloriesAreValid
      || (entry.notes !== undefined && typeof entry.notes !== 'string')) {
      return false
    }

    ids.add(entry.id)
    return true
  })
}

export function isValidExerciseGoal(goal) {
  return Number.isSafeInteger(goal) && goal > 0
}

export function getWeeklyExerciseData(entries, today = new Date()) {
  const totalsByDate = new Map()
  entries.forEach((entry) => {
    const current = totalsByDate.get(entry.date) || { durationMinutes: 0, distanceKm: 0 }
    current.durationMinutes += entry.durationMinutes
    if (typeof entry.distance === 'number') {
      current.distanceKm += toKilometers(entry.distance, entry.distanceUnit)
    }
    totalsByDate.set(entry.date, current)
  })

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const dateString = getExerciseDateString(date)
    const totals = totalsByDate.get(dateString) || { durationMinutes: 0, distanceKm: 0 }
    return {
      date: dateString,
      day: date.toLocaleDateString(undefined, { weekday: 'short' }),
      durationMinutes: totals.durationMinutes,
      distanceKm: totals.distanceKm,
    }
  })
}
