export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function calculateSleepDuration(bedtime, wakeTime) {
  if (typeof bedtime !== 'string' || typeof wakeTime !== 'string') {
    return null
  }
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
  const bedMatch = bedtime.match(timePattern)
  const wakeMatch = wakeTime.match(timePattern)
  if (!bedMatch || !wakeMatch || bedtime === wakeTime) {
    return null
  }

  const bedMinutes = Number(bedMatch[1]) * 60 + Number(bedMatch[2])
  const wakeMinutes = Number(wakeMatch[1]) * 60 + Number(wakeMatch[2])
  const durationMinutes = (wakeMinutes - bedMinutes + 1440) % 1440
  return Number((durationMinutes / 60).toFixed(2))
}

export function isValidSleepEntries(entries) {
  if (!Array.isArray(entries)) {
    return false
  }

  const dates = new Set()
  const ids = new Set()
  return entries.every((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return false
    }

    const dateIsValid = typeof entry.date === 'string'
      && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
      && getLocalDateString(new Date(`${entry.date}T00:00:00`)) === entry.date
    const duration = calculateSleepDuration(entry.bedtime, entry.wakeTime)
    const id = String(entry.id)
    if (!dateIsValid
      || dates.has(entry.date)
      || entry.id === undefined
      || entry.id === null
      || id === ''
      || ids.has(id)
      || duration === null
      || typeof entry.durationHours !== 'number'
      || entry.durationHours !== duration
      || !Number.isInteger(entry.quality)
      || entry.quality < 1
      || entry.quality > 5) {
      return false
    }

    dates.add(entry.date)
    ids.add(id)
    return true
  })
}

export function formatSleepDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
