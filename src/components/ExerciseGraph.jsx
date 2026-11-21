import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'

function ExerciseGraph({ weeklyData }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chartText = isDark ? '#cbd5e1' : '#4b5563'
  const gridColor = isDark ? '#475569' : '#d1d5db'
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
    color: chartText,
  }
  const hasWorkouts = weeklyData.some((day) => day.durationMinutes > 0)
  const maxDuration = Math.max(60, ...weeklyData.map((day) => day.durationMinutes))

  return (
    <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
      <h2 className="mb-1 text-xl font-semibold text-gray-800 dark:text-slate-100">
        Exercise Duration — Last 7 Days
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
        Total workout minutes per day
      </p>
      {!hasWorkouts && (
        <p className="mb-3 text-sm text-gray-500 dark:text-slate-400" role="status">
          No workouts this week yet. Add one to start your chart.
        </p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={weeklyData} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="day" tick={{ fill: chartText }} />
          <YAxis
            domain={[0, Math.ceil(maxDuration / 30) * 30]}
            tick={{ fill: chartText }}
            tickFormatter={(value) => `${value} min`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: chartText }}
            formatter={(value) => [`${value} minutes`, 'Exercise']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
          />
          <Bar dataKey="durationMinutes" fill="#8b5cf6" name="Exercise duration" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

export default ExerciseGraph
