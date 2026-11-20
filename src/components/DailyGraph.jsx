import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useHealthData } from '../context/HealthDataContext'
import { getTodayFormatted } from '../utils/helpers'
import { useTheme } from '../context/ThemeContext'

function DailyGraph() {
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

  const dailyData = useMemo(() => {
    const todayStr = getTodayFormatted()

    const todayMoods = moodEntries
      .filter(entry => entry.date === todayStr)
      .map(entry => ({
        time: entry.time,
        mood: entry.mood,
      }))

    if (todayMoods.length === 0) {
      return []
    }

    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours, 10)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      return hour * 60 + parseInt(minutes || 0, 10)
    }

    return [...todayMoods].sort((a, b) => parseTime(a.time) - parseTime(b.time))
  }, [moodEntries])

  const todayStr = getTodayFormatted()
  const hasTodayData = dailyData.length > 0

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">Today&apos;s Mood</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{todayStr}</p>
      {!hasTodayData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/40 dark:border-yellow-800">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            No moods logged for today yet. Record how you feel to see it here.
          </p>
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="time" tick={{ fill: chartText }} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: chartText }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: chartText }} />
          <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} name="Mood (1–5)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DailyGraph
