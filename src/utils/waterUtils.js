export const DEFAULT_WATER_GOAL = { amount: 64, unit: 'oz' }
const MILLILITERS_PER_OUNCE = 29.5735295625

export function toMilliliters(amount, unit) {
  return unit === 'oz' ? amount * MILLILITERS_PER_OUNCE : amount
}

export function fromMilliliters(amountMl, unit) {
  return unit === 'oz' ? amountMl / MILLILITERS_PER_OUNCE : amountMl
}

export function getLocalDateTime(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
}

export function isValidTimeString(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isValidWaterGoal(goal) {
  return Boolean(
    goal
    && typeof goal.amount === 'number'
    && Number.isFinite(goal.amount)
    && goal.amount > 0
    && (goal.unit === 'oz' || goal.unit === 'ml'),
  ) && Number.isFinite(toMilliliters(goal.amount, goal.unit))
}

export function isValidWaterEntries(entries) {
  if (!Array.isArray(entries)) {
    return false
  }

  const ids = new Set()
  return entries.every((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return false
    }

    const id = String(entry.id)
    const validAmount = typeof entry.amount === 'number'
      && Number.isFinite(entry.amount)
      && entry.amount > 0
      && (entry.unit === 'oz' || entry.unit === 'ml')
    const validMetricAmount = typeof entry.amountMl === 'number'
      && Number.isFinite(entry.amountMl)
      && entry.amountMl > 0
      && Math.abs(entry.amountMl - toMilliliters(entry.amount, entry.unit)) < 0.01

    if (typeof entry.id !== 'number'
      || !Number.isSafeInteger(entry.id)
      || id === ''
      || ids.has(id)
      || !isValidDateString(entry.date)
      || !isValidTimeString(entry.time)
      || !validAmount
      || !validMetricAmount) {
      return false
    }

    ids.add(id)
    return true
  })
}
