import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useHealthData } from '../context/HealthDataContext'
import { useTheme } from '../context/ThemeContext'
import {
  fromMilliliters,
  getLocalDateTime,
  isValidDateString,
  isValidTimeString,
  toMilliliters,
} from '../utils/waterUtils'
import DemoBadge from '../components/DemoBadge'

const QUICK_ADD_AMOUNTS = [8, 12, 16]

function formatAmount(amount) {
  return Number(amount.toFixed(1)).toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function displayDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function createUniqueId(entries) {
  let id = Date.now()
  while (entries.some((entry) => entry.id === id)) {
    id += 1
  }
  return id
}

function WaterTracker() {
  const {
    waterEntries,
    waterGoal,
    addWaterEntry,
    updateWaterEntry,
    deleteWaterEntry,
    setWaterGoal,
  } = useHealthData()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chartText = isDark ? '#cbd5e1' : '#4b5563'
  const gridColor = isDark ? '#475569' : '#d1d5db'
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
    color: chartText,
  }

  const [goalForm, setGoalForm] = useState({
    amount: String(waterGoal.amount),
    unit: waterGoal.unit,
  })
  const [goalError, setGoalError] = useState('')
  const [form, setForm] = useState(() => {
    const now = getLocalDateTime()
    return { ...now, amount: '', unit: waterGoal.unit }
  })
  const [editingId, setEditingId] = useState(null)
  const [entryError, setEntryError] = useState('')

  useEffect(() => {
    setGoalForm({ amount: String(waterGoal.amount), unit: waterGoal.unit })
  }, [waterGoal])

  const today = getLocalDateTime().date
  const todayEntries = useMemo(
    () => waterEntries.filter((entry) => entry.date === today),
    [waterEntries, today],
  )
  const totalTodayMl = todayEntries.reduce((total, entry) => total + entry.amountMl, 0)
  const totalToday = fromMilliliters(totalTodayMl, waterGoal.unit)
  const goalMl = toMilliliters(waterGoal.amount, waterGoal.unit)
  const progressPercent = goalMl > 0 ? (totalTodayMl / goalMl) * 100 : 0

  const weeklyData = useMemo(() => {
    const totalsByDate = new Map()
    waterEntries.forEach((entry) => {
      totalsByDate.set(entry.date, (totalsByDate.get(entry.date) || 0) + entry.amountMl)
    })

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      const dateParts = getLocalDateTime(date)
      const milliliters = totalsByDate.get(dateParts.date) || 0
      return {
        date: dateParts.date,
        day: date.toLocaleDateString(undefined, { weekday: 'short' }),
        total: Number(fromMilliliters(milliliters, waterGoal.unit).toFixed(1)),
      }
    })
  }, [waterEntries, waterGoal.unit, today])
  const averageDaily = weeklyData.reduce((total, day) => total + day.total, 0) / 7
  const maxChartAmount = Math.max(
    1,
    waterGoal.amount,
    ...weeklyData.map((day) => day.total),
  )
  const sortedEntries = useMemo(
    () => [...waterEntries].sort((a, b) => (
      b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || b.id - a.id
    )),
    [waterEntries],
  )

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setEntryError('')
  }

  const addEntry = (amount, unit, dateTime = getLocalDateTime()) => {
    const record = {
      id: createUniqueId(waterEntries),
      date: dateTime.date,
      time: dateTime.time,
      amount,
      unit,
      amountMl: toMilliliters(amount, unit),
    }
    addWaterEntry(record)
  }

  const handleQuickAdd = (amount) => {
    addEntry(amount, 'oz')
  }

  const handleSaveGoal = (event) => {
    event.preventDefault()
    const amount = Number(goalForm.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setGoalError('Enter a daily goal greater than zero.')
      return
    }
    setWaterGoal({ amount, unit: goalForm.unit })
    setGoalError('')
  }

  const handleSaveEntry = (event) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!isValidDateString(form.date) || form.date > today) {
      setEntryError('Choose a valid date that is not in the future.')
      return
    }
    if (!isValidTimeString(form.time)) {
      setEntryError('Enter a valid time.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setEntryError('Enter a water amount greater than zero.')
      return
    }

    const record = {
      id: editingId ?? createUniqueId(waterEntries),
      date: form.date,
      time: form.time,
      amount,
      unit: form.unit,
      amountMl: toMilliliters(amount, form.unit),
    }
    if (editingId === null) {
      addWaterEntry(record)
    } else {
      updateWaterEntry(record)
    }
    const now = getLocalDateTime()
    setForm({ ...now, amount: '', unit: form.unit })
    setEditingId(null)
    setEntryError('')
  }

  const handleEdit = (entry) => {
    setForm({
      date: entry.date,
      time: entry.time,
      amount: String(entry.amount),
      unit: entry.unit,
    })
    setEditingId(entry.id)
    setEntryError('')
    document.getElementById('water-date')?.focus()
  }

  const handleCancelEdit = () => {
    const now = getLocalDateTime()
    setForm({ ...now, amount: '', unit: waterGoal.unit })
    setEditingId(null)
    setEntryError('')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-gray-600 dark:text-slate-300">Water consumed today</h2>
              <p className="mt-1 text-3xl font-bold text-sky-700 dark:text-sky-300">
                {formatAmount(totalToday)} <span className="text-xl">{waterGoal.unit}</span>
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Goal: {formatAmount(waterGoal.amount)} {waterGoal.unit}
            </p>
          </div>
          <div
            className="mt-4 h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700"
            role="progressbar"
            aria-label="Daily water intake goal progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(progressPercent, 100)}
            aria-valuetext={`${formatAmount(totalToday)} ${waterGoal.unit} of ${formatAmount(waterGoal.amount)} ${waterGoal.unit}`}
          >
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
            {formatAmount(progressPercent)}% of daily goal
            {progressPercent >= 100 ? ' — goal reached!' : ''}
          </p>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
          <h2 className="text-sm font-medium text-gray-600 dark:text-slate-300">
            Average daily intake
          </h2>
          <p className="mt-1 text-3xl font-bold text-sky-700 dark:text-sky-300">
            {formatAmount(averageDaily)} {waterGoal.unit}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Daily average for the last 7 days, including days with no entries
          </p>
        </section>
      </div>

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-1 text-xl font-semibold text-gray-800 dark:text-slate-100">
          Water Intake — Last 7 Days
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
          Daily total in {waterGoal.unit}; dashed line marks your goal
        </p>
        {waterEntries.length === 0 && (
          <p className="mb-3 text-sm text-gray-500 dark:text-slate-400" role="status">
            No water entries yet. Log water to start your chart.
          </p>
        )}
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weeklyData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="day" tick={{ fill: chartText }} />
            <YAxis
              domain={[0, Math.ceil(maxChartAmount)]}
              tick={{ fill: chartText }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: chartText }}
              formatter={(value) => [`${value} ${waterGoal.unit}`, 'Water']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
            />
            <ReferenceLine y={waterGoal.amount} stroke="#10b981" strokeDasharray="5 5" />
            <Bar dataKey="total" fill="#0ea5e9" name="Water intake" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-slate-100">
          Daily Water Goal
        </h2>
        <form onSubmit={handleSaveGoal} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label htmlFor="water-goal" className="block flex-1 text-sm font-medium text-gray-700 dark:text-slate-200">
            Goal amount
            <input
              id="water-goal"
              type="number"
              min="0.1"
              step="any"
              required
              value={goalForm.amount}
              onChange={(event) => {
                setGoalForm((current) => ({ ...current, amount: event.target.value }))
                setGoalError('')
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label htmlFor="water-goal-unit" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
            Unit
            <select
              id="water-goal-unit"
              value={goalForm.unit}
              onChange={(event) => setGoalForm((current) => ({ ...current, unit: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="oz">ounces (oz)</option>
              <option value="ml">milliliters (mL)</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          >
            Save Goal
          </button>
        </form>
        {goalError && <p className="mt-2 text-sm text-red-600 dark:text-red-300" role="alert">{goalError}</p>}
      </section>

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-800 dark:text-slate-100">Quick Add</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">
          Add a serving in ounces to today&apos;s intake.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ADD_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleQuickAdd(amount)}
              className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-3 font-semibold text-sky-800 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-900"
              aria-label={`Add ${amount} ounces of water`}
            >
              +{amount} oz
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-slate-100">
          {editingId === null ? 'Log Water' : 'Edit Water Entry'}
        </h2>
        <form onSubmit={handleSaveEntry} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label htmlFor="water-date" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Date
              <input
                id="water-date"
                type="date"
                value={form.date}
                max={today}
                onChange={(event) => updateForm('date', event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label htmlFor="water-time" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Time
              <input
                id="water-time"
                type="time"
                value={form.time}
                onChange={(event) => updateForm('time', event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label htmlFor="water-amount" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Amount
              <input
                id="water-amount"
                type="number"
                min="0.1"
                step="any"
                value={form.amount}
                onChange={(event) => updateForm('amount', event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label htmlFor="water-unit" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Unit
              <select
                id="water-unit"
                value={form.unit}
                onChange={(event) => updateForm('unit', event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="oz">ounces (oz)</option>
                <option value="ml">milliliters (mL)</option>
              </select>
            </label>
          </div>
          {entryError && <p className="text-sm text-red-600 dark:text-red-300" role="alert">{entryError}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              {editingId === null ? 'Save Water Entry' : 'Update Water Entry'}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-slate-100">Water History</h2>
        {sortedEntries.length === 0 ? (
          <p className="py-6 text-center text-gray-500 dark:text-slate-400">
            No water entries yet. Use a quick-add button or log an entry above.
          </p>
        ) : (
          <ul className="space-y-3">
            {sortedEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4 dark:bg-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-slate-100">
                    {displayDate(entry.date)} · {entry.time}
                    {entry.isDemo && <DemoBadge />}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {formatAmount(entry.amount)} {entry.unit}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(entry)}
                    className="rounded px-3 py-1 text-sm font-medium text-sky-700 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-sky-300 dark:hover:bg-slate-600"
                    aria-label={`Edit ${formatAmount(entry.amount)} ${entry.unit} entry from ${displayDate(entry.date)} at ${entry.time}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete this water entry from ${displayDate(entry.date)} at ${entry.time}?`)) {
                        deleteWaterEntry(entry.id)
                        if (editingId === entry.id) handleCancelEdit()
                      }
                    }}
                    className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-300 dark:hover:bg-slate-600"
                    aria-label={`Delete ${formatAmount(entry.amount)} ${entry.unit} entry from ${displayDate(entry.date)} at ${entry.time}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default WaterTracker
