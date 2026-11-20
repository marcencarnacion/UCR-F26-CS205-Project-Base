import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHealthData } from '../context/HealthDataContext'
import { useTheme } from '../context/ThemeContext'

function WeeklyGraph() {
  const { moodEntries } = useHealthData()
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
    const days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

      const dayMoods = moodEntries.filter(entry => entry.date === dateStr)
      const avgMood =
        dayMoods.length === 0
          ? 0
          : dayMoods.reduce((sum, entry) => sum + entry.mood, 0) / dayMoods.length

      days.push({
        day: dayName,
        averageMood: Number(avgMood.toFixed(2)),
      })
    }

    return days
  }, [moodEntries])

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-4">Last 7 Days – Average Mood</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="day" tick={{ fill: chartText }} />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: chartText }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chartText }} />
          <Bar dataKey="averageMood" fill="#6366f1" name="Average Mood (1–5)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyGraph
