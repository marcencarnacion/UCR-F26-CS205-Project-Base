import { useEffect, useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import ExerciseGraph from '../components/ExerciseGraph'
import {
  DEFAULT_EXERCISE_GOAL_MINUTES,
  EXERCISE_TYPES,
  getExerciseDateString,
  getWeeklyExerciseData,
  isValidExerciseDate,
  isValidExerciseGoal,
  toKilometers,
} from '../utils/exerciseUtils'
import DemoBadge from '../components/DemoBadge'

function formatNumber(value) {
  return Number(value.toFixed(1)).toLocaleString(undefined, { maximumFractionDigits: 1 })
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

const NEW_ENTRY = () => ({
  date: getExerciseDateString(),
  type: EXERCISE_TYPES[0],
  durationMinutes: '',
  distance: '',
  distanceUnit: 'mi',
  calories: '',
  notes: '',
})

function ExerciseTracker() {
  const {
    exerciseEntries,
    exerciseGoalMinutes,
    addExerciseEntry,
    updateExerciseEntry,
    deleteExerciseEntry,
    setExerciseGoalMinutes,
  } = useHealthData()
  const [goalInput, setGoalInput] = useState(String(exerciseGoalMinutes))
  const [goalError, setGoalError] = useState('')
  const [form, setForm] = useState(NEW_ENTRY)
  const [editingId, setEditingId] = useState(null)
  const [entryError, setEntryError] = useState('')

  useEffect(() => {
    setGoalInput(String(exerciseGoalMinutes))
  }, [exerciseGoalMinutes])

  const today = getExerciseDateString()
  const weeklyData = useMemo(
    () => getWeeklyExerciseData(exerciseEntries),
    [exerciseEntries, today],
  )
  const weekDates = useMemo(
    () => new Set(weeklyData.map((day) => day.date)),
    [weeklyData],
  )
  const weeklyEntries = exerciseEntries.filter((entry) => weekDates.has(entry.date))
  const weeklyMinutes = weeklyData.reduce((total, day) => total + day.durationMinutes, 0)
  const workoutCount = weeklyEntries.length
  const averageDuration = workoutCount ? weeklyMinutes / workoutCount : null
  const totalDistanceKm = weeklyEntries.reduce((total, entry) => (
    total + (typeof entry.distance === 'number' ? toKilometers(entry.distance, entry.distanceUnit) : 0)
  ), 0)
  const progressPercent = (weeklyMinutes / exerciseGoalMinutes) * 100

  const sortedEntries = useMemo(
    () => [...exerciseEntries].sort((a, b) => (
      b.date.localeCompare(a.date) || b.id - a.id
    )),
    [exerciseEntries],
  )

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setEntryError('')
  }

  const handleSaveGoal = (event) => {
    event.preventDefault()
    const goal = Number(goalInput)
    if (!isValidExerciseGoal(goal)) {
      setGoalError('Enter a weekly goal in whole minutes greater than zero.')
      return
    }
    setExerciseGoalMinutes(goal)
    setGoalError('')
  }

  const handleSaveEntry = (event) => {
    event.preventDefault()
    const durationMinutes = Number(form.durationMinutes)
    const distance = form.distance === '' ? null : Number(form.distance)
    const calories = form.calories === '' ? null : Number(form.calories)

    if (!isValidExerciseDate(form.date) || form.date > today) {
      setEntryError('Choose a valid exercise date that is not in the future.')
      return
    }
    if (!EXERCISE_TYPES.includes(form.type)) {
      setEntryError('Choose a valid exercise type.')
      return
    }
    if (!Number.isSafeInteger(durationMinutes) || durationMinutes <= 0) {
      setEntryError('Duration must be a whole number of minutes greater than zero.')
      return
    }
    if (distance !== null && (
      !Number.isFinite(distance)
      || distance <= 0
      || !Number.isFinite(toKilometers(distance, form.distanceUnit))
    )) {
      setEntryError('Distance must be greater than zero, or left blank.')
      return
    }
    if (calories !== null && (!Number.isSafeInteger(calories) || calories <= 0)) {
      setEntryError('Calories burned must be a whole number greater than zero, or left blank.')
      return
    }

    const entry = {
      id: editingId ?? createUniqueId(exerciseEntries),
      date: form.date,
      type: form.type,
      durationMinutes,
      distance,
      distanceUnit: form.distanceUnit,
      calories,
      notes: form.notes.trim(),
    }
    if (editingId === null) {
      addExerciseEntry(entry)
    } else {
      updateExerciseEntry(entry)
    }
    setForm(NEW_ENTRY())
    setEditingId(null)
    setEntryError('')
  }

  const handleEdit = (entry) => {
    setForm({
      date: entry.date,
      type: entry.type,
      durationMinutes: String(entry.durationMinutes),
      distance: entry.distance == null ? '' : String(entry.distance),
      distanceUnit: entry.distanceUnit || 'mi',
      calories: entry.calories == null ? '' : String(entry.calories),
      notes: entry.notes || '',
    })
    setEditingId(entry.id)
    setEntryError('')
    document.getElementById('exercise-date')?.focus()
  }

  const handleCancelEdit = () => {
    setForm(NEW_ENTRY())
    setEditingId(null)
    setEntryError('')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-slate-100">Weekly Goal</h2>
        <form onSubmit={handleSaveGoal} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label htmlFor="exercise-goal" className="block flex-1 text-sm font-medium text-gray-700 dark:text-slate-200">
            Goal in minutes per week
            <input
              id="exercise-goal"
              type="number"
              min="1"
              step="1"
              value={goalInput}
              onChange={(event) => {
                setGoalInput(event.target.value)
                setGoalError('')
              }}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          >
            Save Weekly Goal
          </button>
        </form>
        {goalError && <p className="mt-2 text-sm text-red-600 dark:text-red-300" role="alert">{goalError}</p>}
        <div
          className="mt-5 h-4 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700"
          role="progressbar"
          aria-label="Weekly exercise goal progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(progressPercent, 100)}
          aria-valuetext={`${weeklyMinutes} of ${exerciseGoalMinutes} minutes`}
        >
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
          {weeklyMinutes} of {exerciseGoalMinutes} minutes
          ({formatNumber(progressPercent)}%)
          {progressPercent >= 100 ? ' — goal reached!' : ''}
        </p>
      </section>

      <section aria-labelledby="exercise-stats-title">
        <h2 id="exercise-stats-title" className="sr-only">Weekly exercise statistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg bg-white p-5 shadow-lg transition-colors dark:bg-slate-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Total exercise</h3>
            <p className="mt-1 text-3xl font-bold text-violet-700 dark:text-violet-300">{weeklyMinutes} min</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Last 7 days</p>
          </article>
          <article className="rounded-lg bg-white p-5 shadow-lg transition-colors dark:bg-slate-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Workouts</h3>
            <p className="mt-1 text-3xl font-bold text-violet-700 dark:text-violet-300">{workoutCount}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Last 7 days</p>
          </article>
          <article className="rounded-lg bg-white p-5 shadow-lg transition-colors dark:bg-slate-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Average workout</h3>
            <p className="mt-1 text-3xl font-bold text-violet-700 dark:text-violet-300">
              {averageDuration === null ? '—' : `${formatNumber(averageDuration)} min`}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Last 7 days</p>
          </article>
          <article className="rounded-lg bg-white p-5 shadow-lg transition-colors dark:bg-slate-800">
            <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Total distance</h3>
            <p className="mt-1 text-3xl font-bold text-violet-700 dark:text-violet-300">
              {totalDistanceKm === 0 ? '—' : `${formatNumber(totalDistanceKm)} km`}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Last 7 days; converted from miles when needed
            </p>
          </article>
        </div>
      </section>

      <ExerciseGraph weeklyData={weeklyData} />

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-slate-100">
          {editingId === null ? 'Log Exercise' : 'Edit Exercise Entry'}
        </h2>
        <form onSubmit={handleSaveEntry} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label htmlFor="exercise-date" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Exercise date
              <input
                id="exercise-date"
                type="date"
                value={form.date}
                max={today}
                onChange={(event) => updateForm('date', event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label htmlFor="exercise-type" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Exercise type
              <select
                id="exercise-type"
                value={form.type}
                onChange={(event) => updateForm('type', event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                {EXERCISE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label htmlFor="exercise-duration" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Duration (minutes)
              <input
                id="exercise-duration"
                type="number"
                min="1"
                step="1"
                value={form.durationMinutes}
                onChange={(event) => updateForm('durationMinutes', event.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label htmlFor="exercise-distance" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Distance (optional)
              <input
                id="exercise-distance"
                type="number"
                min="0"
                step="any"
                value={form.distance}
                onChange={(event) => updateForm('distance', event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label htmlFor="exercise-distance-unit" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Distance unit
              <select
                id="exercise-distance-unit"
                value={form.distanceUnit}
                onChange={(event) => updateForm('distanceUnit', event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="mi">Miles</option>
                <option value="km">Kilometers</option>
              </select>
            </label>
            <label htmlFor="exercise-calories" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Calories burned (optional)
              <input
                id="exercise-calories"
                type="number"
                min="1"
                step="1"
                value={form.calories}
                onChange={(event) => updateForm('calories', event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>
          <label htmlFor="exercise-notes" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
            Notes (optional)
            <textarea
              id="exercise-notes"
              value={form.notes}
              onChange={(event) => updateForm('notes', event.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          {entryError && <p className="text-sm text-red-600 dark:text-red-300" role="alert">{entryError}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              {editingId === null ? 'Save Exercise' : 'Update Exercise'}
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
        <h2 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-slate-100">Exercise History</h2>
        {sortedEntries.length === 0 ? (
          <p className="py-6 text-center text-gray-500 dark:text-slate-400">
            No exercise entries yet. Add a workout above to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {sortedEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4 dark:bg-slate-700 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 dark:text-slate-100">
                    {displayDate(entry.date)} · {entry.type}
                    {entry.isDemo && <DemoBadge />}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    {entry.durationMinutes} minutes
                    {typeof entry.distance === 'number' ? ` · ${formatNumber(entry.distance)} ${entry.distanceUnit}` : ''}
                    {typeof entry.calories === 'number' ? ` · ${entry.calories} calories` : ''}
                  </p>
                  {entry.notes && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-500 dark:text-slate-400">
                      {entry.notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(entry)}
                    className="rounded px-3 py-1 text-sm font-medium text-violet-700 hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-violet-300 dark:hover:bg-slate-600"
                    aria-label={`Edit ${entry.type} entry from ${displayDate(entry.date)}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete this ${entry.type} entry from ${displayDate(entry.date)}?`)) {
                        deleteExerciseEntry(entry.id)
                        if (editingId === entry.id) handleCancelEdit()
                      }
                    }}
                    className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-300 dark:hover:bg-slate-600"
                    aria-label={`Delete ${entry.type} entry from ${displayDate(entry.date)}`}
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

export default ExerciseTracker
