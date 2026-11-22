import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'

const CHARTS = {
  mood: {
    title: 'Mood trends',
    description: 'Daily average rating; gaps mean no mood was recorded.',
    realKey: 'moodRealAverage',
    demoKey: 'moodDemoAverage',
    realName: 'Real mood',
    demoName: 'Demo mood',
    realColor: 'var(--accent-chart-color)',
    axis: 'rating',
    type: 'line',
  },
  sleep: {
    title: 'Sleep duration trends',
    description: 'Average duration per recorded night; gaps mean no sleep record.',
    realKey: 'sleepRealAverage',
    demoKey: 'sleepDemoAverage',
    realName: 'Real sleep',
    demoName: 'Demo sleep',
    realColor: 'var(--accent-chart-color)',
    axis: 'hours',
    type: 'line',
  },
  water: {
    title: 'Daily water consumption',
    description: 'Daily logged totals; days without water entries are left blank.',
    realKey: 'waterReal',
    demoKey: 'waterDemo',
    realName: 'Real water',
    demoName: 'Demo water',
    realColor: 'var(--accent-chart-color)',
    axis: 'water',
    type: 'bar',
  },
  exercise: {
    title: 'Exercise duration',
    description: 'Recorded workout minutes per day; days without logged workouts show 0.',
    realKey: 'exerciseRealMinutes',
    demoKey: 'exerciseDemoMinutes',
    realName: 'Real exercise',
    demoName: 'Demo exercise',
    realColor: 'var(--accent-chart-color)',
    axis: 'minutes',
    type: 'bar',
  },
}

function formatTick(value, axis, waterUnit) {
  if (axis === 'hours') return `${value}h`
  if (axis === 'minutes') return `${value}m`
  if (axis === 'water') return `${value} ${waterUnit}`
  return value
}

function StatisticsChart({ kind, data, hasObservations, includeDemo, waterUnit, rangeValid }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const chart = CHARTS[kind]
  const demoColor = isDark ? '#2dd4bf' : '#0f766e'
  const tickColor = isDark ? '#cbd5e1' : '#4b5563'
  const gridColor = isDark ? '#475569' : '#d1d5db'
  const tooltipStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#475569' : '#d1d5db'}`,
    color: tickColor,
  }
  const formatTooltip = (value, name) => {
    if (chart.axis === 'hours') return [`${Number(value).toFixed(2)} hours`, name]
    if (chart.axis === 'minutes') return [`${value} minutes`, name]
    if (chart.axis === 'water') return [`${Number(value).toFixed(1)} ${waterUnit}`, name]
    return [`${Number(value).toFixed(1)} / 5`, name]
  }
  const chartContents = chart.type === 'line' ? (
    <LineChart data={data} accessibilityLayer>
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
      <XAxis dataKey="label" tick={{ fill: tickColor }} minTickGap={20} />
      <YAxis
        domain={chart.axis === 'rating' ? [1, 5] : [0, 'auto']}
        ticks={chart.axis === 'rating' ? [1, 2, 3, 4, 5] : undefined}
        tick={{ fill: tickColor }}
        tickFormatter={(value) => formatTick(value, chart.axis, waterUnit)}
        width={64}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        labelStyle={{ color: tickColor }}
        labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
        formatter={formatTooltip}
      />
      <Legend />
      <Line
        type="monotone"
        dataKey={chart.realKey}
        name={chart.realName}
        stroke={chart.realColor}
        strokeWidth={2}
        connectNulls={false}
        dot={{ r: 3 }}
        activeDot={{ r: 5 }}
      />
      {includeDemo && (
        <Line
          type="monotone"
          dataKey={chart.demoKey}
          name={chart.demoName}
          stroke={demoColor}
          strokeWidth={2}
          strokeDasharray="5 4"
          connectNulls={false}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      )}
    </LineChart>
  ) : (
    <BarChart data={data} accessibilityLayer>
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
      <XAxis dataKey="label" tick={{ fill: tickColor }} minTickGap={20} />
      <YAxis
        domain={[0, 'auto']}
        tick={{ fill: tickColor }}
        tickFormatter={(value) => formatTick(value, chart.axis, waterUnit)}
        width={64}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        labelStyle={{ color: tickColor }}
        labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
        formatter={formatTooltip}
      />
      <Legend />
      <Bar dataKey={chart.realKey} name={chart.realName} fill={chart.realColor} stackId={kind} />
      {includeDemo && (
        <Bar dataKey={chart.demoKey} name={chart.demoName} fill={demoColor} stackId={kind} />
      )}
    </BarChart>
  )

  return (
    <section className="rounded-lg bg-white p-4 shadow-lg transition-colors dark:bg-slate-800 sm:p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">{chart.title}</h2>
      <p className="mb-3 text-sm text-gray-600 dark:text-slate-300">{chart.description}</p>
      {!rangeValid ? (
        <p className="flex h-[300px] items-center justify-center text-sm text-gray-500 dark:text-slate-400">
          Select a valid date range to view this chart.
        </p>
      ) : !hasObservations ? (
        <p className="flex h-[300px] items-center justify-center text-sm text-gray-500 dark:text-slate-400">
          No {chart.title.toLowerCase()} data in this date range.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          {chartContents}
        </ResponsiveContainer>
      )}
    </section>
  )
}

export default StatisticsChart
