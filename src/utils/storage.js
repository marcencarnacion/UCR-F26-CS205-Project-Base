import { isValidSleepEntries } from './sleepHelpers'

const STORAGE_KEY = 'healthTrackingData'
const FILE_HANDLE_KEY = 'healthTrackingFileHandle'

export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      const sleepDataIsValid = data.sleepEntries === undefined || isValidSleepEntries(data.sleepEntries)
      const sleepEntries = sleepDataIsValid ? data.sleepEntries || [] : []
      if (!sleepDataIsValid) {
        console.error('Invalid sleep records in localStorage; ignoring sleep data.')
      }
      return {
        moodEntries: data.moodEntries || [],
        sleepEntries,
      }
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
  return {
    moodEntries: [],
    sleepEntries: [],
  }
}

export function saveData(moodEntries, sleepEntries = []) {
  try {
    const data = { moodEntries, sleepEntries }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function saveFileHandleInfo(fileHandle) {
  const info = { name: fileHandle.name, kind: fileHandle.kind }
  localStorage.setItem(FILE_HANDLE_KEY, JSON.stringify(info))
}

export function getFileHandleInfo() {
  try {
    const stored = localStorage.getItem(FILE_HANDLE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}
