import { useMemo, useRef, useState } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import {
  getDailyMoodMap,
  getLocalDateKey,
  getMonthCalendarCells,
  getMonthlyMoodSummary,
} from '../utils/moodCalendar'

const MOOD_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
}

const MOOD_COLORS = {
  1: 'border-rose-300 bg-rose-100 text-rose-950 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100',
  2: 'border-orange-300 bg-orange-100 text-orange-950 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100',
  3: 'border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  4: 'border-lime-300 bg-lime-100 text-lime-950 dark:border-lime-800 dark:bg-lime-950 dark:text-lime-100',
  5: 'border-emerald-300 bg-emerald-100 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
}
const EMPTY_DAY_COLOR = 'border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getTimestampLabel(entry) {
  if (entry.timestamp) {
    const timestamp = new Date(entry.timestamp)
    if (!Number.isNaN(timestamp.getTime())) {
      return timestamp.toLocaleString()
    }
  }
  return entry.time || 'Time not recorded'
}

function MoodCalendar() {
  const { moodEntries } = useHealthData()
  const now = new Date()
  const todayKey = getLocalDateKey(now)
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [focusedDate, setFocusedDate] = useState(todayKey)
  const dayButtonRefs = useRef(new Map())

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
  const dailyMoods = useMemo(() => getDailyMoodMap(moodEntries), [moodEntries])
  const calendarCells = useMemo(
    () => getMonthCalendarCells(year, month),
    [year, month],
  )
  const moodSummary = useMemo(
    () => getMonthlyMoodSummary(dailyMoods, year, month),
    [dailyMoods, year, month],
  )
  const selectedMoods = selectedDate
    ? [...(dailyMoods.get(selectedDate)?.entries || [])].sort((a, b) => {
      const timeA = Date.parse(a.timestamp)
      const timeB = Date.parse(b.timestamp)
      if (Number.isFinite(timeA) && Number.isFinite(timeB)) {
        return timeA - timeB
      }
      return String(a.time || '').localeCompare(String(b.time || ''))
    })
    : []

  const focusCalendarDate = (date) => {
    const dateKey = getLocalDateKey(date)
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setFocusedDate(dateKey)
    requestAnimationFrame(() => dayButtonRefs.current.get(dateKey)?.focus())
  }

  const navigateMonth = (monthOffset) => {
    const nextMonth = new Date(year, month + monthOffset, 1)
    const focusDay = focusedDate ? dateFromKey(focusedDate).getDate() : 1
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
    const nextFocus = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(focusDay, lastDay))
    setVisibleMonth(nextMonth)
    setFocusedDate(getLocalDateKey(nextFocus))
    setSelectedDate(null)
  }

  const navigateToToday = () => {
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setFocusedDate(todayKey)
    setSelectedDate(todayKey)
  }

  const handleDayKeyDown = (event, date) => {
    let targetDate = null
    switch (event.key) {
      case 'ArrowLeft':
        targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
        break
      case 'ArrowRight':
        targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        break
      case 'ArrowUp':
        targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7)
        break
      case 'ArrowDown':
        targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7)
        break
      case 'Home':
        targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
        break
      case 'End':
        targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 6 - date.getDay())
        break
      case 'PageUp':
      case 'PageDown': {
        const monthDelta = event.key === 'PageUp' ? -1 : 1
        const yearDelta = event.ctrlKey || event.metaKey ? monthDelta * 12 : monthDelta
        const newMonth = new Date(date.getFullYear(), date.getMonth() + yearDelta, 1)
        const lastDay = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0).getDate()
        targetDate = new Date(newMonth.getFullYear(), newMonth.getMonth(), Math.min(date.getDate(), lastDay))
        break
      }
      default:
        return
    }
    event.preventDefault()
    focusCalendarDate(targetDate)
  }

  const summaryDates = (days) => days.map((day) => (
    `${dateFromKey(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (${day.average.toFixed(1)})`
  )).join(', ')

  const rows = []
  for (let index = 0; index < calendarCells.length; index += 7) {
    rows.push(calendarCells.slice(index, index + 7))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Previous month"
            >
              <span aria-hidden="true">←</span>
            </button>
            <h2
              id="mood-calendar-month"
              className="min-w-40 text-center text-xl font-semibold text-gray-800 dark:text-slate-100"
              aria-live="polite"
            >
              {monthLabel}
            </h2>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Next month"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <button
            type="button"
            onClick={navigateToToday}
            className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-slate-700"
          >
            Today
          </button>
        </div>

        <p id="mood-calendar-keyboard-help" className="sr-only">
          Use arrow keys to move by day or week. Home and End move to the start or end of the week.
          Page Up and Page Down change months; hold Control or Command to change years.
          Press Enter or Space to view a day&apos;s mood entries.
        </p>
        <div
          role="grid"
          aria-labelledby="mood-calendar-month"
          aria-describedby="mood-calendar-keyboard-help"
          className="w-full"
        >
          <div role="row" className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                role="columnheader"
                className="py-2 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 sm:text-sm"
              >
                <span className="sm:hidden">{day.slice(0, 1)}</span>
                <span className="hidden sm:inline">{day}</span>
              </div>
            ))}
          </div>
          {rows.map((week, rowIndex) => (
            <div key={`week-${rowIndex}`} role="row" className="grid grid-cols-7 gap-1">
              {week.map((date, columnIndex) => {
                if (!date) {
                  return <div key={`empty-${rowIndex}-${columnIndex}`} role="gridcell" aria-disabled="true" />
                }

                const dateKey = getLocalDateKey(date)
                const dayData = dailyMoods.get(dateKey)
                const average = dayData?.average
                const moodColor = average === undefined
                  ? EMPTY_DAY_COLOR
                  : MOOD_COLORS[Math.min(5, Math.max(1, Math.round(average)))]
                const isToday = dateKey === todayKey
                const isSelected = dateKey === selectedDate
                const moodDescription = average === undefined
                  ? 'No mood entries'
                  : `Average mood ${average.toFixed(1)} from ${dayData.entries.length} ${dayData.entries.length === 1 ? 'entry' : 'entries'}`

                return (
                  <div
                    key={dateKey}
                    role="gridcell"
                    aria-selected={isSelected}
                    className="min-w-0"
                  >
                    <button
                      ref={(element) => {
                        if (element) dayButtonRefs.current.set(dateKey, element)
                        else dayButtonRefs.current.delete(dateKey)
                      }}
                      type="button"
                      tabIndex={focusedDate === dateKey ? 0 : -1}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={`${formatDate(date)}. ${moodDescription}${isToday ? '. Today' : ''}${isSelected ? '. Selected' : ''}`}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setFocusedDate(dateKey)
                        setSelectedDate(dateKey)
                      }}
                      onKeyDown={(event) => handleDayKeyDown(event, date)}
                      className={`flex min-h-[4.5rem] w-full flex-col items-center justify-center rounded-md border p-1 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-slate-800 sm:min-h-20 sm:p-2 ${moodColor} ${isToday ? 'border-2 border-indigo-600 dark:border-indigo-300' : ''} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                      <span className="text-sm font-semibold sm:text-base">{date.getDate()}</span>
                      <span className="text-[10px] leading-tight sm:text-xs">
                        {average === undefined ? '—' : average.toFixed(1)}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-200">Mood color legend</h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5].map((mood) => (
              <li key={mood} className={`rounded-md border px-2 py-1 text-xs font-medium ${MOOD_COLORS[mood]}`}>
                {mood} — {MOOD_LABELS[mood]}
              </li>
            ))}
            <li className={`rounded-md border px-2 py-1 text-xs font-medium ${EMPTY_DAY_COLOR}`}>
              — No entries
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-slate-100">
          {monthLabel} Summary
        </h2>
        {moodSummary.daysWithEntries === 0 ? (
          <p className="text-gray-600 dark:text-slate-300">
            No mood entries recorded this month yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Average mood</h3>
              <p className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {moodSummary.average.toFixed(1)} / 5
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Across all entries this month</p>
            </article>
            <article className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Days with entries</h3>
              <p className="mt-1 text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {moodSummary.daysWithEntries}
              </p>
            </article>
            <article className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Highest average day</h3>
              <p className="mt-1 break-words text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                {summaryDates(moodSummary.highest)}
              </p>
            </article>
            <article className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300">Lowest average day</h3>
              <p className="mt-1 break-words text-sm font-semibold text-rose-800 dark:text-rose-200">
                {summaryDates(moodSummary.lowest)}
              </p>
            </article>
          </div>
        )}
      </section>

      <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6" aria-live="polite">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-slate-100">
          {selectedDate ? formatDate(dateFromKey(selectedDate)) : 'Daily Mood Entries'}
        </h2>
        {!selectedDate ? (
          <p className="text-gray-600 dark:text-slate-300">Select a day on the calendar to view its mood entries.</p>
        ) : selectedMoods.length === 0 ? (
          <p className="text-gray-600 dark:text-slate-300">No mood entries recorded for this date.</p>
        ) : (
          <ul className="space-y-3">
            {selectedMoods.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 dark:bg-slate-700"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-slate-100">
                    Mood {entry.mood} — {MOOD_LABELS[entry.mood] || 'Mood'}
                  </p>
                  <time
                    dateTime={entry.timestamp || undefined}
                    className="text-sm text-gray-600 dark:text-slate-300"
                  >
                    {getTimestampLabel(entry)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default MoodCalendar
