import { useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { calculateSleepDuration, formatSleepDate, getLocalDateString } from '../utils/sleepHelpers'
import SleepGraph from '../components/SleepGraph'
import DemoBadge from '../components/DemoBadge'

const EMPTY_FORM = {
  date: getLocalDateString(),
  bedtime: '',
  wakeTime: '',
  quality: '3',
}

function SleepTracker() {
  const {
    sleepEntries,
    addSleepEntry,
    updateSleepEntry,
    deleteSleepEntry,
  } = useHealthData()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const sortedEntries = useMemo(
    () => [...sleepEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [sleepEntries],
  )
  const duration = calculateSleepDuration(form.bedtime, form.wakeTime)
  const averageDuration = sleepEntries.length
    ? sleepEntries.reduce((total, entry) => total + entry.durationHours, 0) / sleepEntries.length
    : null
  const averageQuality = sleepEntries.length
    ? sleepEntries.reduce((total, entry) => total + entry.quality, 0) / sleepEntries.length
    : null

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(form.date)
      && !Number.isNaN(new Date(`${form.date}T00:00:00`).getTime())
      && getLocalDateString(new Date(`${form.date}T00:00:00`)) === form.date
    if (!validDate || form.date > getLocalDateString()) {
      setError('Choose a valid date that is not in the future.')
      return
    }
    if (!form.bedtime || !form.wakeTime) {
      setError('Enter both bedtime and wake-up time.')
      return
    }
    if (duration === null || duration <= 0 || duration >= 24) {
      setError('Enter valid times. Bedtime and wake-up time must be different.')
      return
    }
    const quality = Number(form.quality)
    if (!Number.isInteger(quality) || quality < 1 || quality > 5) {
      setError('Choose a sleep quality rating from 1 to 5.')
      return
    }

    const duplicate = sleepEntries.some(
      (entry) => entry.date === form.date && entry.id !== editingId,
    )
    if (duplicate) {
      setError('A sleep record already exists for this date. Edit or delete it before adding another.')
      return
    }

    const record = {
      id: editingId ?? Date.now(),
      date: form.date,
      bedtime: form.bedtime,
      wakeTime: form.wakeTime,
      durationHours: duration,
      quality,
    }
    if (editingId === null) {
      addSleepEntry(record)
    } else {
      updateSleepEntry(record)
    }
    setForm({ ...EMPTY_FORM, date: getLocalDateString() })
    setEditingId(null)
    setError('')
  }

  const handleEdit = (entry) => {
    setForm({
      date: entry.date,
      bedtime: entry.bedtime,
      wakeTime: entry.wakeTime,
      quality: String(entry.quality),
    })
    setEditingId(entry.id)
    setError('')
    document.getElementById('sleep-date')?.focus()
  }

  const handleCancelEdit = () => {
    setForm({ ...EMPTY_FORM, date: getLocalDateString() })
    setEditingId(null)
    setError('')
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5 transition-colors">
          <h2 className="text-sm font-medium text-gray-600 dark:text-slate-300">Average sleep duration</h2>
          <p className="mt-1 text-3xl font-bold text-indigo-700 dark:text-indigo-300">
            {averageDuration === null ? '—' : `${averageDuration.toFixed(1)} hours`}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Across all recorded nights</p>
        </section>
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5 transition-colors">
          <h2 className="text-sm font-medium text-gray-600 dark:text-slate-300">Average sleep quality</h2>
          <p className="mt-1 text-3xl font-bold text-indigo-700 dark:text-indigo-300">
            {averageQuality === null ? '—' : `${averageQuality.toFixed(1)} / 5`}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">Across all recorded nights</p>
        </section>
      </div>

      <SleepGraph />

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-100 mb-4">
          {editingId === null ? 'Record Sleep' : 'Edit Sleep Record'}
        </h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label htmlFor="sleep-date" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Date
              <input
                id="sleep-date"
                type="date"
                value={form.date}
                max={getLocalDateString()}
                onChange={(event) => updateForm('date', event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
              <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-slate-400">
                The date you went to bed
              </span>
            </label>
            <label htmlFor="sleep-quality" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Sleep quality (1–5)
              <select
                id="sleep-quality"
                value={form.quality}
                onChange={(event) => updateForm('quality', event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="1">1 — Very poor</option>
                <option value="2">2 — Poor</option>
                <option value="3">3 — Okay</option>
                <option value="4">4 — Good</option>
                <option value="5">5 — Excellent</option>
              </select>
            </label>
            <label htmlFor="sleep-bedtime" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Bedtime
              <input
                id="sleep-bedtime"
                type="time"
                value={form.bedtime}
                onChange={(event) => updateForm('bedtime', event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label htmlFor="sleep-wake-time" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Wake-up time
              <input
                id="sleep-wake-time"
                type="time"
                value={form.wakeTime}
                onChange={(event) => updateForm('wakeTime', event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>

          <p className="text-sm text-gray-700 dark:text-slate-200" aria-live="polite">
            Total hours slept: <strong>{duration === null ? 'Enter valid bedtime and wake-up times' : `${duration.toFixed(2)} hours`}</strong>
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-300" role="alert">{error}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              {editingId === null ? 'Save Sleep Record' : 'Update Sleep Record'}
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

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-100 mb-4">Sleep History</h2>
        {sortedEntries.length === 0 ? (
          <p className="py-6 text-center text-gray-500 dark:text-slate-400">
            No sleep records yet. Add a record above to get started.
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
                    {formatSleepDate(entry.date)}
                    {entry.isDemo && <DemoBadge />}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {entry.bedtime} – {entry.wakeTime} · {Number(entry.durationHours).toFixed(2)} hours
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    Quality: {entry.quality} / 5
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(entry)}
                    className="rounded px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-slate-600"
                    aria-label={`Edit sleep record for ${formatSleepDate(entry.date)}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete the sleep record for ${formatSleepDate(entry.date)}?`)) {
                        deleteSleepEntry(entry.id)
                        if (editingId === entry.id) handleCancelEdit()
                      }
                    }}
                    className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-300 dark:hover:bg-slate-600"
                    aria-label={`Delete sleep record for ${formatSleepDate(entry.date)}`}
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

export default SleepTracker
