import { useMemo, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import StatisticsChart from '../components/StatisticsChart'
import {
  calculateStatistics,
  getLastDaysDateRange,
  getStatisticsDateKey,
  isValidStatisticsDate,
} from '../utils/statistics'

function SummaryCard({ title, value, detail }) {
  return (
    <article className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-5">
      <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">{title}</h3>
      <p className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{detail}</p>
    </article>
  )
}

function formatDayAverage(day) {
  const date = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
  return `${date} (${day.average.toFixed(1)} / 5)`
}

function MoodExtremes({ days, label }) {
  if (!days.length) {
    return <p className="text-sm text-gray-500 dark:text-slate-400">No mood entries in this range.</p>
  }
  const visibleDays = days.slice(0, 3)
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</h4>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
        {visibleDays.map(formatDayAverage).join(', ')}
        {days.length > visibleDays.length ? `, +${days.length - visibleDays.length} more tied days` : ''}
      </p>
    </div>
  )
}

function StatisticsDashboard() {
  const {
    moodEntries,
    sleepEntries,
    waterEntries,
    waterGoal,
    exerciseEntries,
    exerciseGoalMinutes,
  } = useHealthData()
  const today = getStatisticsDateKey(new Date())
  const [period, setPeriod] = useState('30')
  const [customStart, setCustomStart] = useState(() => getLastDaysDateRange(30).startDate)
  const [customEnd, setCustomEnd] = useState(today)
  const [includeDemo, setIncludeDemo] = useState(true)

  const range = period === 'custom'
    ? { startDate: customStart, endDate: customEnd }
    : getLastDaysDateRange(Number(period), new Date(`${today}T12:00:00`))
  let rangeError = ''
  if (period === 'custom') {
    if (!range.startDate || !range.endDate) {
      rangeError = 'Select both a start date and an end date.'
    } else if (!isValidStatisticsDate(range.startDate) || !isValidStatisticsDate(range.endDate)) {
      rangeError = 'Enter valid start and end dates.'
    } else if (range.startDate > range.endDate) {
      rangeError = 'The start date must be on or before the end date.'
    } else if (range.endDate > today) {
      rangeError = 'The end date cannot be in the future.'
    }
  }

  const statistics = useMemo(() => {
    if (rangeError) return null
    return calculateStatistics({
      moodEntries,
      sleepEntries,
      waterEntries,
      waterGoal,
      exerciseEntries,
      exerciseGoalMinutes,
      startDate: range.startDate,
      endDate: range.endDate,
      includeDemo,
      today: new Date(`${today}T12:00:00`),
    })
  }, [
    moodEntries,
    sleepEntries,
    waterEntries,
    waterGoal,
    exerciseEntries,
    exerciseGoalMinutes,
    range.startDate,
    range.endDate,
    includeDemo,
    rangeError,
    today,
  ])
  const summary = statistics?.summary
  const dailyData = statistics?.dailyData || []
  const waterUnit = waterGoal?.unit === 'ml' ? 'mL' : 'oz'
  const moodAverage = summary?.averageMood === null || summary?.averageMood === undefined
    ? '—'
    : `${summary.averageMood.toFixed(2)} / 5`
  const sleepAverage = summary?.averageSleepDuration === null || summary?.averageSleepDuration === undefined
    ? '—'
    : `${summary.averageSleepDuration.toFixed(2)} hr`
  const waterAverage = summary?.averageWaterDaily === null || summary?.averageWaterDaily === undefined
    ? '—'
    : `${summary.averageWaterDaily.toFixed(1)} ${waterUnit}`
  const exerciseGoalPercent = summary?.exerciseGoalMinutes
    ? (summary.currentWeekExerciseMinutes / summary.exerciseGoalMinutes) * 100
    : 0

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <label htmlFor="statistics-period" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
              Date range
              <select
                id="statistics-period"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="custom">Custom date range</option>
              </select>
            </label>
            {period === 'custom' && (
              <>
                <label htmlFor="statistics-start-date" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                  Start date
                  <input
                    id="statistics-start-date"
                    type="date"
                    max={today}
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <label htmlFor="statistics-end-date" className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                  End date
                  <input
                    id="statistics-end-date"
                    type="date"
                    max={today}
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
              </>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(event) => setIncludeDemo(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900"
            />
            Include demo records
          </label>
        </div>
        {rangeError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300" role="alert">{rangeError}</p>
        ) : (
          <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
            Showing {range.startDate} through {range.endDate} (inclusive).
            {includeDemo ? ' Demo records are included and shown separately in charts.' : ' Demo records are excluded.'}
          </p>
        )}
      </section>

      <section aria-labelledby="statistics-summary-heading">
        <h2 id="statistics-summary-heading" className="sr-only">Statistics summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            title="Average mood rating"
            value={rangeError ? '—' : moodAverage}
            detail={summary ? `Across ${summary.moodEntryCount} mood entries` : 'Across recorded mood entries'}
          />
          <SummaryCard
            title="Average sleep duration"
            value={rangeError ? '—' : sleepAverage}
            detail={summary ? `Per recorded night · ${summary.sleepRecords} nights` : 'Per recorded night'}
          />
          <SummaryCard
            title="Average daily water"
            value={rangeError ? '—' : waterAverage}
            detail={summary
              ? `Per tracked day · ${summary.waterTrackedDays} days; untracked days excluded`
              : 'Per day with a water entry'}
          />
          <SummaryCard
            title="Total exercise"
            value={rangeError ? '—' : `${summary?.exerciseTotalMinutes ?? 0} min`}
            detail="Recorded exercise in this range"
          />
          <SummaryCard
            title="Workouts completed"
            value={rangeError ? '—' : String(summary?.workoutCount ?? 0)}
            detail="Recorded workouts in this range"
          />
          <SummaryCard
            title="Days with mood entries"
            value={rangeError ? '—' : String(summary?.moodDays ?? 0)}
            detail={summary ? `Across ${summary.rangeDayCount} calendar days` : 'Distinct days in this range'}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Health trends">
        <StatisticsChart
          kind="mood"
          data={dailyData}
          hasObservations={Boolean(summary?.moodEntryCount)}
          includeDemo={includeDemo}
          waterUnit={waterUnit}
          rangeValid={!rangeError}
        />
        <StatisticsChart
          kind="sleep"
          data={dailyData}
          hasObservations={Boolean(summary?.sleepRecords)}
          includeDemo={includeDemo}
          waterUnit={waterUnit}
          rangeValid={!rangeError}
        />
        <StatisticsChart
          kind="water"
          data={dailyData}
          hasObservations={Boolean(summary?.waterTrackedDays)}
          includeDemo={includeDemo}
          waterUnit={waterUnit}
          rangeValid={!rangeError}
        />
        <StatisticsChart
          kind="exercise"
          data={dailyData}
          hasObservations={Boolean(summary?.workoutCount)}
          includeDemo={includeDemo}
          waterUnit={waterUnit}
          rangeValid={!rangeError}
        />
      </section>

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-slate-100">Insights</h2>
        {!summary ? (
          <p className="text-sm text-gray-600 dark:text-slate-300">Correct the date range to view insights.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <article className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
              <h3 className="mb-2 font-semibold text-gray-800 dark:text-slate-100">Mood extremes</h3>
              <div className="space-y-3">
                <MoodExtremes days={summary.highestMoodDays} label="Highest average day(s)" />
                <MoodExtremes days={summary.lowestMoodDays} label="Lowest average day(s)" />
              </div>
            </article>
            <article className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100">Average sleep quality</h3>
              <p className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {summary.averageSleepQuality === null ? '—' : `${summary.averageSleepQuality.toFixed(2)} / 5`}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Across records with a valid quality rating
              </p>
            </article>
            <article className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100">Water goal days</h3>
              <p className="mt-1 text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                {summary.waterGoalUnit
                  ? `${summary.waterGoalMetDays} of ${summary.waterTrackedDays} tracked days`
                  : 'Goal unavailable'}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Days without water entries are not counted as missed goals
              </p>
            </article>
            <article className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
              <h3 className="font-semibold text-gray-800 dark:text-slate-100">Exercise goal progress</h3>
              <p className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {summary.exerciseGoalMinutes
                  ? `${summary.currentWeekExerciseMinutes} / ${summary.exerciseGoalMinutes} min`
                  : 'Goal unavailable'}
              </p>
              {summary.exerciseGoalMinutes && (
                <div
                  className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-600"
                  role="progressbar"
                  aria-label="Exercise goal progress for the last 7 days"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(exerciseGoalPercent, 100)}
                  aria-valuetext={`${summary.currentWeekExerciseMinutes} of ${summary.exerciseGoalMinutes} minutes`}
                >
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${Math.min(exerciseGoalPercent, 100)}%` }}
                  />
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Trailing 7 days, independent of the selected statistics range
              </p>
            </article>
          </div>
        )}
      </section>
    </div>
  )
}

export default StatisticsDashboard
