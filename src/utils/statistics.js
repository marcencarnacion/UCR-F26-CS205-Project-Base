import { getMoodDateKey } from './moodCalendar'
import { fromMilliliters, isValidWaterGoal, toMilliliters } from './waterUtils'

export function getStatisticsDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidStatisticsDate(dateKey) {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return false
  }
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
}

export function getLastDaysDateRange(days, today = new Date()) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return {
    startDate: getStatisticsDateKey(start),
    endDate: getStatisticsDateKey(end),
  }
}

function createDailyRecord(date) {
  return {
    date,
    moodRealSum: 0,
    moodRealCount: 0,
    moodDemoSum: 0,
    moodDemoCount: 0,
    sleepRealSum: 0,
    sleepRealCount: 0,
    sleepRealQualitySum: 0,
    sleepRealQualityCount: 0,
    sleepDemoSum: 0,
    sleepDemoCount: 0,
    sleepDemoQualitySum: 0,
    sleepDemoQualityCount: 0,
    waterRealMl: 0,
    waterRealCount: 0,
    waterDemoMl: 0,
    waterDemoCount: 0,
    exerciseRealMinutes: 0,
    exerciseDemoMinutes: 0,
  }
}

function getRangeDays(startDate, endDate) {
  const days = []
  const cursor = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  while (cursor <= end) {
    const date = getStatisticsDateKey(cursor)
    days.push(createDailyRecord(date))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function isInRange(dateKey, startDate, endDate) {
  return isValidStatisticsDate(dateKey) && dateKey >= startDate && dateKey <= endDate
}

function makeAverage(sum, count) {
  return count > 0 ? sum / count : null
}

export function calculateStatistics({
  moodEntries = [],
  sleepEntries = [],
  waterEntries = [],
  exerciseEntries = [],
  waterGoal,
  exerciseGoalMinutes,
  startDate,
  endDate,
  includeDemo = true,
  today = new Date(),
}) {
  if (!isValidStatisticsDate(startDate)
    || !isValidStatisticsDate(endDate)
    || startDate > endDate) {
    return null
  }

  const dailyData = getRangeDays(startDate, endDate)
  const byDate = new Map(dailyData.map((day) => [day.date, day]))
  const shouldInclude = (entry) => includeDemo || entry?.isDemo !== true
  let moodSum = 0
  let moodCount = 0
  let sleepDurationSum = 0
  let sleepCount = 0
  let sleepQualitySum = 0
  let sleepQualityCount = 0
  let waterTotalMl = 0
  let exerciseTotalMinutes = 0
  let workoutCount = 0

  ;(Array.isArray(moodEntries) ? moodEntries : []).forEach((entry) => {
    if (!entry || !shouldInclude(entry)) return
    const date = getMoodDateKey(entry)
    const mood = Number(entry.mood)
    const day = byDate.get(date)
    if (!day || !Number.isInteger(mood) || mood < 1 || mood > 5) return

    moodSum += mood
    moodCount += 1
    if (entry.isDemo === true) {
      day.moodDemoSum += mood
      day.moodDemoCount += 1
    } else {
      day.moodRealSum += mood
      day.moodRealCount += 1
    }
  })

  ;(Array.isArray(sleepEntries) ? sleepEntries : []).forEach((entry) => {
    if (!entry || !shouldInclude(entry)) return
    const day = byDate.get(entry.date)
    const duration = Number(entry.durationHours)
    if (!day || !Number.isFinite(duration) || duration <= 0 || duration >= 24) return

    sleepDurationSum += duration
    sleepCount += 1
    const quality = Number(entry.quality)
    if (Number.isInteger(quality) && quality >= 1 && quality <= 5) {
      sleepQualitySum += quality
      sleepQualityCount += 1
    }
    if (entry.isDemo === true) {
      day.sleepDemoSum += duration
      day.sleepDemoCount += 1
      if (Number.isInteger(quality) && quality >= 1 && quality <= 5) {
        day.sleepDemoQualitySum += quality
        day.sleepDemoQualityCount += 1
      }
    } else {
      day.sleepRealSum += duration
      day.sleepRealCount += 1
      if (Number.isInteger(quality) && quality >= 1 && quality <= 5) {
        day.sleepRealQualitySum += quality
        day.sleepRealQualityCount += 1
      }
    }
  })

  ;(Array.isArray(waterEntries) ? waterEntries : []).forEach((entry) => {
    if (!entry || !shouldInclude(entry)) return
    const day = byDate.get(entry.date)
    const amountMl = Number(entry.amountMl)
    if (!day || !Number.isFinite(amountMl) || amountMl <= 0) return

    waterTotalMl += amountMl
    if (entry.isDemo === true) {
      day.waterDemoMl += amountMl
      day.waterDemoCount += 1
    } else {
      day.waterRealMl += amountMl
      day.waterRealCount += 1
    }
  })

  ;(Array.isArray(exerciseEntries) ? exerciseEntries : []).forEach((entry) => {
    if (!entry || !shouldInclude(entry)) return
    const day = byDate.get(entry.date)
    const duration = Number(entry.durationMinutes)
    if (!day || !Number.isSafeInteger(duration) || duration <= 0) return

    exerciseTotalMinutes += duration
    workoutCount += 1
    if (entry.isDemo === true) {
      day.exerciseDemoMinutes += duration
    } else {
      day.exerciseRealMinutes += duration
    }
  })

  const moodDays = dailyData
    .map((day) => {
      const count = day.moodRealCount + day.moodDemoCount
      const sum = day.moodRealSum + day.moodDemoSum
      return count ? { date: day.date, average: sum / count } : null
    })
    .filter(Boolean)
  const highestMood = moodDays.length
    ? Math.max(...moodDays.map((day) => day.average))
    : null
  const lowestMood = moodDays.length
    ? Math.min(...moodDays.map((day) => day.average))
    : null
  const waterGoalMl = isValidWaterGoal(waterGoal)
    ? toMilliliters(waterGoal.amount, waterGoal.unit)
    : null
  const waterDisplayUnit = isValidWaterGoal(waterGoal) ? waterGoal.unit : 'oz'
  let waterTrackedDays = 0
  let waterGoalMetDays = 0

  dailyData.forEach((day) => {
    const sleepAllSum = day.sleepRealSum + day.sleepDemoSum
    const sleepAllCount = day.sleepRealCount + day.sleepDemoCount
    const hasWater = day.waterRealCount + day.waterDemoCount > 0
    if (hasWater) {
      waterTrackedDays += 1
      const waterForDay = day.waterRealMl + day.waterDemoMl
      if (waterGoalMl !== null && waterForDay >= waterGoalMl) {
        waterGoalMetDays += 1
      }
    }

    day.label = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    day.moodRealAverage = makeAverage(day.moodRealSum, day.moodRealCount)
    day.moodDemoAverage = makeAverage(day.moodDemoSum, day.moodDemoCount)
    day.sleepDurationHours = makeAverage(sleepAllSum, sleepAllCount)
    day.sleepRealAverage = makeAverage(day.sleepRealSum, day.sleepRealCount)
    day.sleepDemoAverage = makeAverage(day.sleepDemoSum, day.sleepDemoCount)
    day.waterTotal = hasWater
      ? fromMilliliters(day.waterRealMl + day.waterDemoMl, waterDisplayUnit)
      : null
    day.waterReal = day.waterRealCount
      ? fromMilliliters(day.waterRealMl, waterDisplayUnit)
      : null
    day.waterDemo = day.waterDemoCount
      ? fromMilliliters(day.waterDemoMl, waterDisplayUnit)
      : null
  })

  const rangeStart = new Date(`${startDate}T00:00:00`)
  const rangeEnd = new Date(`${endDate}T00:00:00`)
  const rangeDayCount = Math.round((rangeEnd - rangeStart) / 86400000) + 1
  const currentWeekRange = getLastDaysDateRange(7, today)
  const currentWeekExerciseMinutes = (Array.isArray(exerciseEntries) ? exerciseEntries : [])
    .filter((entry) => entry && shouldInclude(entry)
      && isInRange(entry.date, currentWeekRange.startDate, currentWeekRange.endDate))
    .reduce((sum, entry) => {
      const duration = Number(entry.durationMinutes)
      return Number.isSafeInteger(duration) && duration > 0 ? sum + duration : sum
    }, 0)

  return {
    dailyData,
    summary: {
      averageMood: makeAverage(moodSum, moodCount),
      moodEntryCount: moodCount,
      moodDays: moodDays.length,
      highestMood,
      highestMoodDays: moodDays.filter((day) => day.average === highestMood),
      lowestMood,
      lowestMoodDays: moodDays.filter((day) => day.average === lowestMood),
      averageSleepDuration: makeAverage(sleepDurationSum, sleepCount),
      sleepRecords: sleepCount,
      averageSleepQuality: makeAverage(sleepQualitySum, sleepQualityCount),
      averageWaterDaily: waterTrackedDays > 0
        ? fromMilliliters(waterTotalMl / waterTrackedDays, waterDisplayUnit)
        : null,
      waterTrackedDays,
      waterGoalMetDays,
      waterGoalUnit: isValidWaterGoal(waterGoal) ? waterGoal.unit : null,
      exerciseTotalMinutes,
      workoutCount,
      averageWorkoutDuration: makeAverage(exerciseTotalMinutes, workoutCount),
      rangeDayCount,
      currentWeekExerciseMinutes,
      exerciseGoalMinutes: Number.isSafeInteger(exerciseGoalMinutes) && exerciseGoalMinutes > 0
        ? exerciseGoalMinutes
        : null,
    },
  }
}

