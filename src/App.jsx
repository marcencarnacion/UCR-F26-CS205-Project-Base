import { useState } from 'react'
import { HealthDataProvider } from './context/HealthDataContext'
import MoodTracker from './modules/MoodTracker'
import DailyGraph from './components/DailyGraph'
import WeeklyGraph from './components/WeeklyGraph'
import HistoryView from './components/HistoryView'
import FileManager from './components/FileManager'
import { ThemeProvider, useTheme } from './context/ThemeContext'

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { theme, toggleTheme } = useTheme()

  return (
    <HealthDataProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 transition-colors dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">
                Mood Tracking App
              </h1>
              <p className="text-gray-600 dark:text-slate-300">
                Track how you feel over time with a simple 1–5 mood scale
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="shrink-0 min-w-11 h-11 px-3 rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-950"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={theme === 'dark'}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          </header>

          <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Main navigation">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'data'
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
              >
                Data Management
              </button>
            </nav>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MoodTracker />
                <DailyGraph />
                <WeeklyGraph />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <HistoryView />
          )}

          {activeTab === 'data' && (
            <FileManager />
          )}
        </div>
      </div>
    </HealthDataProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
