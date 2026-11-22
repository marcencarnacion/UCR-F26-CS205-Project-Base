import { useEffect, useRef, useState } from 'react'
import { COLOR_SCHEMES, useTheme } from '../context/ThemeContext'

const APPEARANCE_MODES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
]

function ThemeSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const {
    appearanceMode,
    colorScheme,
    customAccentColor,
    accentColor,
    setAppearanceMode,
    setColorScheme,
    setCustomAccentColor,
    resetTheme,
  } = useTheme()

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  const closePanel = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-950"
        aria-expanded={isOpen}
        aria-controls={isOpen ? 'theme-settings-panel' : undefined}
      >
        <span aria-hidden="true">🎨</span>
        Theme settings
      </button>

      {isOpen && (
        <section
          id="theme-settings-panel"
          aria-labelledby="theme-settings-title"
          className="absolute right-0 z-30 mt-3 w-[min(92vw,38rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 id="theme-settings-title" className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Theme Settings
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                Choose how the app looks. Changes apply immediately and are saved on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="min-h-11 min-w-11 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Close theme settings"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-slate-100">
              Appearance
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {APPEARANCE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setAppearanceMode(mode.id)}
                  aria-pressed={appearanceMode === mode.id}
                  className={`min-h-11 rounded-lg border px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    appearanceMode === mode.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800 dark:border-indigo-400 dark:bg-slate-700 dark:text-indigo-300'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-slate-100">
              Color scheme
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  type="button"
                  onClick={() => setColorScheme(scheme.id)}
                  aria-pressed={colorScheme === scheme.id}
                  className={`flex min-h-[4.25rem] items-center gap-2 rounded-lg border p-2 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                    colorScheme === scheme.id
                      ? 'border-indigo-600 ring-2 ring-indigo-500 dark:border-indigo-400'
                      : 'border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700'
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: scheme.accent }}
                    aria-hidden="true"
                  >
                    Aa
                  </span>
                  <span className="text-gray-800 dark:text-slate-100">{scheme.name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-col gap-3 rounded-lg bg-gray-50 p-3 dark:bg-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <label htmlFor="custom-accent-color" className="flex items-center gap-3 text-sm font-medium text-gray-800 dark:text-slate-100">
              <input
                id="custom-accent-color"
                type="color"
                value={customAccentColor}
                onChange={(event) => setCustomAccentColor(event.target.value)}
                className="h-11 w-14 cursor-pointer rounded border border-gray-300 bg-white p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-500 dark:bg-slate-800"
              />
              Custom accent color
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300" aria-live="polite">
              <span
                className="h-8 w-8 rounded-md border border-gray-300 dark:border-slate-500"
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
              />
              <span>
                Preview: <span className="font-semibold" style={{ color: 'var(--accent-accessible)' }}>{accentColor}</span>
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetTheme}
              className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Reset to Default
            </button>
            <button
              type="button"
              onClick={closePanel}
              className="min-h-11 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              Done
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default ThemeSettings
