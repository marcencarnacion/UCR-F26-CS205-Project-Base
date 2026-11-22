import { useState, useRef, useEffect } from 'react'
import { useHealthData } from '../context/HealthDataContext'
import { createDemoData } from '../utils/demoDataGenerator'

function FileManager() {
  const {
    moodEntries,
    sleepEntries,
    waterEntries,
    exerciseEntries,
    exportData,
    importData,
    setupFileHandle,
    loadFromFile,
    fileHandle,
    fileStatus,
    addDemoData,
    removeDemoData,
  } = useHealthData()
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const [demoDays, setDemoDays] = useState('30')
  const [demoStatus, setDemoStatus] = useState('')
  const fileInputRef = useRef(null)
  const demoRecordCount = [
    ...moodEntries,
    ...sleepEntries,
    ...waterEntries,
    ...exerciseEntries,
  ].filter((entry) => entry?.isDemo).length

  useEffect(() => {
    if (fileStatus === 'saved') {
      setTimeout(() => setImportSuccess(false), 2000)
    }
  }, [fileStatus])

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-tracking-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target.result
        setImportText(content)
        handleImport(content)
      }
      reader.readAsText(file)
    }
  }

  const handleImport = (jsonString = importText) => {
    setImportError('')
    setImportSuccess(false)
    
    if (!jsonString.trim()) {
      setImportError('Please provide JSON data')
      return
    }

    const success = importData(jsonString)
    if (success) {
      setImportSuccess(true)
      setImportText('')
      setTimeout(() => setImportSuccess(false), 3000)
    } else {
      setImportError('Invalid data format. Please check your JSON structure.')
    }
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      importData(JSON.stringify({
        moodEntries: [],
        sleepEntries: [],
        waterEntries: [],
        waterGoal: { amount: 64, unit: 'oz' },
        exerciseEntries: [],
        exerciseGoalMinutes: 150,
      }))
      setImportText('')
      setImportSuccess(true)
      setTimeout(() => setImportSuccess(false), 3000)
    }
  }

  const handleGenerateDemoData = () => {
    const days = Number(demoDays)
    if (!window.confirm(
      `Generate up to ${days} days of demo data? Existing user records will be kept. Demo records already present for a date will not be duplicated.`,
    )) {
      return
    }

    const generated = createDemoData(days, {
      moodEntries,
      sleepEntries,
      waterEntries,
      exerciseEntries,
    })
    const counts = Object.values(generated).map((entries) => entries.length)
    const total = counts.reduce((sum, count) => sum + count, 0)
    if (total === 0) {
      setDemoStatus('No new demo records were needed; demo data already exists for the selected dates.')
      return
    }

    addDemoData(generated)
    setDemoStatus(
      `Added ${counts[0]} mood, ${counts[1]} sleep, ${counts[2]} water, and ${counts[3]} exercise demo records.`,
    )
  }

  const handleRemoveDemoData = () => {
    if (!demoRecordCount) {
      return
    }
    if (window.confirm(`Remove all ${demoRecordCount} generated demo records? Your real records will be kept.`)) {
      removeDemoData()
      setDemoStatus('Demo records removed. Your real records were kept.')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 transition-colors">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-slate-100 mb-4">
        Data Management
      </h2>

      <div className="space-y-4">
        <section className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <h3 className="text-lg font-medium text-violet-900 dark:text-violet-100">Demo Data Generator</h3>
          <p className="mb-3 text-sm text-violet-800 dark:text-violet-200">
            Add historical sample data to explore the calendar, history, and graphs. Existing real records are preserved; generated records are tagged as Demo.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="demo-data-days" className="flex-1 text-sm font-medium text-gray-700 dark:text-slate-200">
              Historical range
              <select
                id="demo-data-days"
                value={demoDays}
                onChange={(event) => setDemoDays(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleGenerateDemoData}
              className="self-end rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              Generate Demo Data
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-violet-900 dark:text-violet-200" aria-live="polite">
              {demoRecordCount} demo records currently saved.
              {demoStatus && <span className="block">{demoStatus}</span>}
            </p>
            <button
              type="button"
              onClick={handleRemoveDemoData}
              disabled={!demoRecordCount}
              className="rounded-lg border border-violet-400 px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-700 dark:text-violet-200 dark:hover:bg-violet-900/50"
            >
              Remove Demo Data
            </button>
          </div>
        </section>

        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-2">Auto-Save Status</h3>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
            Data is automatically saved to a file whenever you make changes.
          </p>
          {fileHandle ? (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/40 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Auto-save enabled:</strong> {fileHandle.name || 'File selected'}
              </p>
              {fileStatus === 'saving' && (
                <p className="text-xs text-green-600 dark:text-green-300 mt-1">Saving...</p>
              )}
              {fileStatus === 'saved' && (
                <p className="text-xs text-green-600 dark:text-green-300 mt-1">Saved successfully!</p>
              )}
              {fileStatus === 'error' && (
                <p className="text-xs text-red-600 mt-1">Error saving to file</p>
              )}
            </div>
          ) : (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/40 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                File will be set up automatically on first use. Your data is saved to browser storage.
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={async () => {
                const success = await setupFileHandle()
                if (success) {
                  setImportSuccess(true)
                  setTimeout(() => setImportSuccess(false), 3000)
                }
              }}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {fileHandle ? 'Change File Location' : 'Set Up File Now'}
            </button>
            <button
              onClick={async () => {
                const success = await loadFromFile()
                if (success) {
                  setImportSuccess(true)
                  setTimeout(() => setImportSuccess(false), 3000)
                }
              }}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Load from File
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-2">Manual Export</h3>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
            Download your data as a JSON file that you can edit directly
          </p>
          <button
            onClick={handleExport}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Export to JSON File
          </button>
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-2">Import Data</h3>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
            Load data from a JSON file or paste JSON directly
          </p>
          
          <div className="mb-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium mb-2"
            >
              Select JSON File
            </button>
          </div>

          <div className="mb-3">
            <label htmlFor="importText" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
              Or paste JSON data here:
            </label>
            <textarea
              id="importText"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"moodEntries": [...], "sleepEntries": [...], "waterEntries": [...], "waterGoal": {...}, "exerciseEntries": [...], "exerciseGoalMinutes": 150 }'
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm bg-white text-gray-900 placeholder:text-gray-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600"
              rows="8"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleImport()}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Import Data
            </button>
            <button
              onClick={handleClear}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Clear All Data
            </button>
          </div>

          {importError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/40 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-300">{importError}</p>
            </div>
          )}

          {importSuccess && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/40 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-300">Data imported successfully!</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <h3 className="text-lg font-medium text-gray-700 dark:text-slate-200 mb-2">Data Format</h3>
          <p className="text-xs text-gray-600 dark:text-slate-300 mb-2">
            Your JSON file should follow this structure:
          </p>
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto text-gray-800 dark:bg-slate-900 dark:text-slate-200">
{`{
  "moodEntries": [
    {
      "id": 1234567890,
      "mood": 4,
      "timestamp": "2024-01-15T12:00:00.000Z",
      "time": "12:00 PM",
      "date": "1/15/2024"
    }
  ],
  "sleepEntries": [
    {
      "id": 1234567891,
      "date": "2024-01-15",
      "bedtime": "22:30",
      "wakeTime": "06:30",
      "durationHours": 8,
      "quality": 4
    }
  ],
  "waterEntries": [
    {
      "id": 1234567892,
      "date": "2024-01-15",
      "time": "10:30",
      "amount": 16,
      "unit": "oz",
      "amountMl": 473.176472
    }
  ],
  "waterGoal": {
    "amount": 64,
    "unit": "oz"
  },
  "exerciseEntries": [
    {
      "id": 1234567893,
      "date": "2024-01-15",
      "type": "Running",
      "durationMinutes": 30,
      "distance": 3,
      "distanceUnit": "mi",
      "calories": 250,
      "notes": "Easy afternoon run"
    }
  ],
  "exerciseGoalMinutes": 150
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default FileManager
