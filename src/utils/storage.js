import { isValidSleepEntries } from './sleepHelpers'
import { DEFAULT_WATER_GOAL, isValidWaterEntries, isValidWaterGoal } from './waterUtils'
import {
  DEFAULT_EXERCISE_GOAL_MINUTES,
  isValidExerciseEntries,
  isValidExerciseGoal,
} from './exerciseUtils'

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
      const waterDataIsValid = data.waterEntries === undefined || isValidWaterEntries(data.waterEntries)
      const waterEntries = waterDataIsValid ? data.waterEntries || [] : []
      if (!waterDataIsValid) {
        console.error('Invalid water records in localStorage; ignoring water data.')
      }
      const exerciseDataIsValid = data.exerciseEntries === undefined
        || isValidExerciseEntries(data.exerciseEntries)
      const exerciseEntries = exerciseDataIsValid ? data.exerciseEntries || [] : []
      if (!exerciseDataIsValid) {
        console.error('Invalid exercise records in localStorage; ignoring exercise data.')
      }
      return {
        moodEntries: data.moodEntries || [],
        sleepEntries,
        waterEntries,
        waterGoal: isValidWaterGoal(data.waterGoal) ? data.waterGoal : DEFAULT_WATER_GOAL,
        exerciseEntries,
        exerciseGoalMinutes: isValidExerciseGoal(data.exerciseGoalMinutes)
          ? data.exerciseGoalMinutes
          : DEFAULT_EXERCISE_GOAL_MINUTES,
      }
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
  return {
    moodEntries: [],
    sleepEntries: [],
    waterEntries: [],
    waterGoal: DEFAULT_WATER_GOAL,
    exerciseEntries: [],
    exerciseGoalMinutes: DEFAULT_EXERCISE_GOAL_MINUTES,
  }
}

export function saveData(
  moodEntries,
  sleepEntries = [],
  waterEntries = [],
  waterGoal = DEFAULT_WATER_GOAL,
  exerciseEntries = [],
  exerciseGoalMinutes = DEFAULT_EXERCISE_GOAL_MINUTES,
) {
  try {
    const data = {
      moodEntries,
      sleepEntries,
      waterEntries,
      waterGoal,
      exerciseEntries,
      exerciseGoalMinutes,
    }
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
