export function getMoodDateKey(entry) {
  if (!entry || typeof entry !== 'object') {
    return null
  }
  const dateValue = typeof entry.date === 'string' ? entry.date.trim() : ''
  const isoDateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateMatch) {
    return isValidDateParts(...isoDateMatch.slice(1).map(Number))
      ? `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`
      : null
  }

  const localizedDateMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (localizedDateMatch) {
    const [, month, day, year] = localizedDateMatch
    if (isValidDateParts(Number(year), Number(month), Number(day))) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return null
  }

  if (entry.timestamp) {
    const timestamp = new Date(entry.timestamp)
    if (!Number.isNaN(timestamp.getTime())) {
      return getLocalDateKey(timestamp)
    }
  }

  return null
}

function isValidDateParts(year, month, day) {
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
}

export function getLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getMonthCalendarCells(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const numberOfDays = new Date(year, month + 1, 0).getDate()
  const numberOfWeeks = Math.ceil((firstWeekday + numberOfDays) / 7)
  const cells = Array(numberOfWeeks * 7).fill(null)

  for (let day = 1; day <= numberOfDays; day += 1) {
    cells[firstWeekday + day - 1] = new Date(year, month, day)
  }

  return cells
}

export function getDailyMoodMap(moodEntries) {
  const dailyMoods = new Map()
  moodEntries.forEach((entry) => {
    const dateKey = getMoodDateKey(entry)
    const mood = Number(entry.mood)
    if (!dateKey || !Number.isInteger(mood) || mood < 1 || mood > 5) {
      return
    }

    const day = dailyMoods.get(dateKey) || { total: 0, entries: [] }
    day.total += mood
    day.entries.push(entry)
    day.average = day.total / day.entries.length
    dailyMoods.set(dateKey, day)
  })
  return dailyMoods
}

export function getMonthlyMoodSummary(dailyMoods, year, month) {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  const days = [...dailyMoods.entries()]
    .filter(([dateKey]) => dateKey.startsWith(monthPrefix))
    .map(([date, data]) => ({ date, average: data.average, entries: data.entries }))
  const entries = days.flatMap((day) => day.entries)

  if (days.length === 0) {
    return { average: null, daysWithEntries: 0, highest: [], lowest: [] }
  }

  const averages = days.map((day) => day.average)
  const highestAverage = Math.max(...averages)
  const lowestAverage = Math.min(...averages)
  return {
    average: entries.reduce((sum, entry) => sum + Number(entry.mood), 0) / entries.length,
    daysWithEntries: days.length,
    highest: days.filter((day) => day.average === highestAverage),
    lowest: days.filter((day) => day.average === lowestAverage),
  }
}
