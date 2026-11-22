import { getMoodDateKey } from './moodCalendar'
import { calculateSleepDuration } from './sleepHelpers'
import { toMilliliters } from './waterUtils'

const ALLOWED_RANGES = [7, 30, 60, 90]
const MOOD_RATINGS = [1, 2, 3, 4, 5]
const EXERCISE_TYPES = ['Running', 'Walking', 'Cycling', 'Strength training', 'Swimming', 'Other']

function createRandom(seed) {
  let state = 0
  for (let index = 0; index < seed.length; index += 1) {
    state = (state * 31 + seed.charCodeAt(index)) >>> 0
  }
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function padTime(value) {
  return String(value).padStart(2, '0')
}

function createDate(year, month, day, hour, minute) {
  return new Date(year, month, day, hour, minute)
}

function toMoodDateString(date) {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })
}

export function createDemoData(days, existingData, today = new Date()) {
  if (!ALLOWED_RANGES.includes(days)) {
    throw new RangeError('Demo data range must be 7, 30, 60, or 90 days.')
  }

  const generated = {
    moodEntries: [],
    sleepEntries: [],
    waterEntries: [],
    exerciseEntries: [],
  }
  const usedIds = new Set([
    ...existingData.moodEntries,
    ...existingData.sleepEntries,
    ...existingData.waterEntries,
    ...existingData.exerciseEntries,
  ].map((entry) => String(entry?.id)))
  let nextId = Date.now()
  const createId = () => {
    while (usedIds.has(String(nextId))) {
      nextId += 1
    }
    const id = nextId
    usedIds.add(String(id))
    nextId += 1
    return id
  }

  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (let daysAgo = days; daysAgo >= 1; daysAgo -= 1) {
    const date = new Date(currentDay)
    date.setDate(currentDay.getDate() - daysAgo)
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const dateKey = `${year}-${padTime(month + 1)}-${padTime(day)}`
    const dateText = toMoodDateString(date)
    const random = createRandom(`${dateKey}-health-demo`)
    const moodTrend = Math.sin(daysAgo / 5) * 0.8 + Math.cos(daysAgo / 13) * 0.4

    if (!existingData.moodEntries.some((entry) => entry?.isDemo && getMoodDateKey(entry) === dateKey)) {
      for (const hour of [9, 20]) {
        const mood = MOOD_RATINGS[Math.min(
          MOOD_RATINGS.length - 1,
          Math.max(0, Math.round(3 + moodTrend + random() * 1.8 - 0.9) - 1),
        )]
        const timestamp = createDate(year, month, day, hour, Math.floor(random() * 60))
        generated.moodEntries.push({
          id: createId(),
          mood,
          timestamp: timestamp.toISOString(),
          date: dateText,
          time: timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          isDemo: true,
        })
      }
    }

    if (!existingData.sleepEntries.some((entry) => entry?.date === dateKey)) {
      const bedtimeMinutes = 21 * 60 + 30 + Math.floor(random() * 120)
      const sleepHours = 6.4 + random() * 2.5 + Math.sin(daysAgo / 8) * 0.25
      const durationMinutes = Math.round(sleepHours * 60)
      const wakeMinutes = (bedtimeMinutes + durationMinutes) % (24 * 60)
      const bedtime = `${padTime(Math.floor(bedtimeMinutes / 60))}:${padTime(bedtimeMinutes % 60)}`
      const wakeTime = `${padTime(Math.floor(wakeMinutes / 60))}:${padTime(wakeMinutes % 60)}`
      const durationHours = calculateSleepDuration(bedtime, wakeTime)

      generated.sleepEntries.push({
        id: createId(),
        date: dateKey,
        bedtime,
        wakeTime,
        durationHours,
        quality: Math.min(5, Math.max(1, Math.round(durationHours - 4.5 + random()))),
        isDemo: true,
      })
    }

    if (!existingData.waterEntries.some((entry) => entry?.isDemo && entry.date === dateKey)) {
      const waterIntakes = [8, 12, 12, 16].map((baseAmount) => (
        baseAmount + (random() < 0.25 ? 4 : 0)
      ))
      const waterTimes = [8, 11, 14, 18]
      waterIntakes.forEach((amount, index) => {
        const timestamp = createDate(year, month, day, waterTimes[index], Math.floor(random() * 45))
        generated.waterEntries.push({
          id: createId(),
          date: dateKey,
          time: `${padTime(timestamp.getHours())}:${padTime(timestamp.getMinutes())}`,
          amount,
          unit: 'oz',
          amountMl: toMilliliters(amount, 'oz'),
          isDemo: true,
        })
      })
    }

    const isScheduledWorkoutDay = [1, 3, 5, 6].includes(date.getDay())
    if (isScheduledWorkoutDay
      && !existingData.exerciseEntries.some((entry) => entry?.isDemo && entry.date === dateKey)) {
      const exerciseType = EXERCISE_TYPES[Math.floor(random() * EXERCISE_TYPES.length)]
      const durationMinutes = 25 + Math.floor(random() * 46)
      const distanceUnit = random() < 0.5 ? 'mi' : 'km'
      const distance = ['Running', 'Walking', 'Cycling'].includes(exerciseType)
        ? Number((2 + random() * 5).toFixed(1))
        : null
      const caloriesPerMinute = {
        Running: 10,
        Walking: 4,
        Cycling: 8,
        'Strength training': 6,
        Swimming: 9,
      }[exerciseType] || 5

      generated.exerciseEntries.push({
        id: createId(),
        date: dateKey,
        type: exerciseType,
        durationMinutes,
        distance,
        distanceUnit,
        calories: Math.round(durationMinutes * caloriesPerMinute * (0.85 + random() * 0.3)),
        notes: 'Demo workout',
        isDemo: true,
      })
    }
  }

  return generated
}
