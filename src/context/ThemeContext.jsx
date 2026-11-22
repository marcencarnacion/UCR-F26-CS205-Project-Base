import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()
const THEME_STORAGE_KEY = 'health-tracking-theme'
const DEFAULT_ACCENT = '#4f46e5'
const DEFAULT_PREFERENCES = {
  appearanceMode: 'system',
  colorScheme: 'ocean-blue',
  customAccentColor: DEFAULT_ACCENT,
}
const INDIGO_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const DARK_SURFACE = [71, 85, 105]

export const COLOR_SCHEMES = [
  { id: 'ocean-blue', name: 'Ocean Blue', accent: '#4f46e5' },
  { id: 'forest-green', name: 'Forest Green', accent: '#15803d' },
  { id: 'lavender-purple', name: 'Lavender Purple', accent: '#7c3aed' },
  { id: 'sunset-orange', name: 'Sunset Orange', accent: '#c2410c' },
  { id: 'rose-pink', name: 'Rose Pink', accent: '#be185d' },
  { id: 'slate-gray', name: 'Slate Gray', accent: '#475569' },
]

function isValidHexColor(value) {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)
}

function parseHexColor(hex) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16))
}

function mixColors(color, target, amount) {
  return color.map((channel, index) => Math.round(channel + (target[index] - channel) * amount))
}

function toHexColor(color) {
  return `#${color.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function toRgbVariable(color) {
  return color.join(' ')
}

function getLuminance(color) {
  const linear = color.map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2])
}

function getContrastRatio(first, second) {
  const luminance = [getLuminance(first), getLuminance(second)].sort((a, b) => b - a)
  return (luminance[0] + 0.05) / (luminance[1] + 0.05)
}

function getAccessibleShade(color, background, direction, minimumContrast) {
  if (getContrastRatio(color, background) >= minimumContrast) return color
  for (let amount = 0.01; amount <= 1; amount += 0.01) {
    const candidate = mixColors(color, direction, amount)
    if (getContrastRatio(candidate, background) >= minimumContrast) return candidate
  }
  return direction
}

export function getAccentPalette(hexColor, theme = 'light') {
  const base = parseHexColor(hexColor)
  const white = [255, 255, 255]
  const black = [0, 0, 0]
  const accessibleDark = getAccessibleShade(base, white, [0, 0, 0], 4.5)
  const accessibleLight = getAccessibleShade(base, DARK_SURFACE, white, 4.5)
  const lightShades = {
    50: mixColors(base, white, 0.94),
    100: mixColors(base, white, 0.87),
    200: mixColors(base, white, 0.70),
    300: mixColors(base, white, 0.48),
    400: mixColors(base, white, 0.24),
    500: accessibleDark,
    600: accessibleDark,
    700: mixColors(accessibleDark, black, 0.18),
    800: mixColors(accessibleDark, black, 0.36),
    900: mixColors(accessibleDark, black, 0.54),
    950: mixColors(accessibleDark, black, 0.68),
  }
  const darkShades = { ...lightShades }
  const darkTextShades = [50, 100, 200, 300, 400]
  darkTextShades.forEach((shade) => {
    darkShades[shade] = getAccessibleShade(lightShades[shade], DARK_SURFACE, white, 4.5)
  })
  const shadesForTheme = theme === 'dark' ? darkShades : lightShades

  return {
    ...Object.fromEntries(
      INDIGO_SHADES.map((shade) => [`--color-indigo-${shade}`, toRgbVariable(shadesForTheme[shade])]),
    ),
    '--accent-color': toHexColor(base),
    '--accent-accessible': toHexColor(accessibleDark),
    '--accent-chart-color': toHexColor(theme === 'dark' ? accessibleLight : accessibleDark),
  }
}

function getInitialPreferences() {
  const storedValue = localStorage.getItem(THEME_STORAGE_KEY)
  if (storedValue === 'light' || storedValue === 'dark') {
    return { ...DEFAULT_PREFERENCES, appearanceMode: storedValue }
  }

  if (!storedValue || !storedValue.startsWith('{')) return DEFAULT_PREFERENCES

  try {
    const saved = JSON.parse(storedValue)
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
      return DEFAULT_PREFERENCES
    }
    const validMode = ['light', 'dark', 'system'].includes(saved.appearanceMode)
    const validScheme = saved.colorScheme === 'custom'
      || COLOR_SCHEMES.some((scheme) => scheme.id === saved.colorScheme)
    return {
      appearanceMode: validMode ? saved.appearanceMode : DEFAULT_PREFERENCES.appearanceMode,
      colorScheme: validScheme ? saved.colorScheme : DEFAULT_PREFERENCES.colorScheme,
      customAccentColor: isValidHexColor(saved.customAccentColor)
        ? saved.customAccentColor
        : DEFAULT_ACCENT,
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    return DEFAULT_PREFERENCES
  }
}

function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(getInitialPreferences)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)
  const theme = preferences.appearanceMode === 'system'
    ? systemTheme
    : preferences.appearanceMode
  const activeScheme = COLOR_SCHEMES.find((scheme) => scheme.id === preferences.colorScheme)
  const accentColor = preferences.colorScheme === 'custom'
    ? preferences.customAccentColor
    : activeScheme?.accent || DEFAULT_ACCENT

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mediaQuery) return undefined

    const updateSystemTheme = (event) => setSystemTheme(event.matches ? 'dark' : 'light')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemTheme)
      return () => mediaQuery.removeEventListener('change', updateSystemTheme)
    }
    mediaQuery.addListener(updateSystemTheme)
    return () => mediaQuery.removeListener(updateSystemTheme)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    Object.entries(getAccentPalette(accentColor, theme)).forEach(([name, value]) => {
      root.style.setProperty(name, value)
    })
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences))
  }, [theme, accentColor, preferences])

  const setAppearanceMode = (appearanceMode) => {
    if (['light', 'dark', 'system'].includes(appearanceMode)) {
      setPreferences((current) => ({ ...current, appearanceMode }))
    }
  }

  const setColorScheme = (colorScheme) => {
    if (colorScheme === 'custom' || COLOR_SCHEMES.some((scheme) => scheme.id === colorScheme)) {
      setPreferences((current) => ({ ...current, colorScheme }))
    }
  }

  const setCustomAccentColor = (customAccentColor) => {
    if (isValidHexColor(customAccentColor)) {
      setPreferences((current) => ({ ...current, colorScheme: 'custom', customAccentColor }))
    }
  }

  const resetTheme = () => setPreferences(DEFAULT_PREFERENCES)
  const toggleTheme = () => setAppearanceMode(theme === 'dark' ? 'light' : 'dark')
  const value = {
    theme,
    appearanceMode: preferences.appearanceMode,
    colorScheme: preferences.colorScheme,
    customAccentColor: preferences.customAccentColor,
    accentColor,
    setAppearanceMode,
    setColorScheme,
    setCustomAccentColor,
    resetTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
