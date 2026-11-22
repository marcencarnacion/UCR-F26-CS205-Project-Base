import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useHealthData } from '../context/HealthDataContext'
import { useTheme } from '../context/ThemeContext'
import { getLocalDateString } from '../utils/sleepHelpers'

function SleepGraph() {
  const { sleepEntries } = useHealthData()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chartText = isDark ? '#cbd5e1' : '#4b5563'
  const gridColor = isDark ? '#475569' : '#d1d5db'
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
    color: chartText,
  }

  const weeklyData = useMemo(() => {
    const recordsByDate = new Map(sleepEntries.map((entry) => [entry.date, entry]))
    const days = []
    const today = new Date()

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today)
      date.setDate(date.getDate() - offset)
      const dateKey = getLocalDateString(date)
      days.push({
        date: dateKey,
        day: date.toLocaleDateString(undefined, { weekday: 'short' }),
        duration: recordsByDate.get(dateKey)?.durationHours ?? null,
      })
    }

    return days
  }, [sleepEntries])

  const maxDuration = Math.max(10, ...weeklyData.map((day) => day.duration || 0))

  return (
    <section className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-1">
        Sleep Duration — Last 7 Days
      </h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        Hours slept each night
      </p>
      {sleepEntries.length === 0 && (
        <p className="mb-3 text-sm text-gray-500 dark:text-slate-400" role="status">
          No sleep records yet. Add one to start your chart.
        </p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={weeklyData} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="day" tick={{ fill: chartText }} />
          <YAxis
            domain={[0, Math.ceil(maxDuration)]}
            tick={{ fill: chartText }}
            tickFormatter={(value) => `${value}h`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: chartText }}
            formatter={(value) => [`${value} hours`, 'Sleep']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
          />
          <Bar dataKey="duration" fill="var(--accent-chart-color)" name="Sleep duration" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

export default SleepGraph
