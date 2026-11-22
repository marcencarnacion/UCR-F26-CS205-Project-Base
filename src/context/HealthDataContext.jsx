import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { loadData, saveData, saveFileHandleInfo, getFileHandleInfo } from '../utils/storage'
import { createFile, openFile, writeFile, readFile } from '../utils/fileOperations'
import { isValidSleepEntries } from '../utils/sleepHelpers'
import {
  DEFAULT_WATER_GOAL,
  isValidWaterEntries,
  isValidWaterGoal,
} from '../utils/waterUtils'
import {
  DEFAULT_EXERCISE_GOAL_MINUTES,
  isValidExerciseEntries,
  isValidExerciseGoal,
} from '../utils/exerciseUtils'

const HealthDataContext = createContext()

export function HealthDataProvider({ children }) {
  const [moodEntries, setMoodEntries] = useState([])
  const [sleepEntries, setSleepEntries] = useState([])
  const [waterEntries, setWaterEntries] = useState([])
  const [waterGoal, setWaterGoalState] = useState(DEFAULT_WATER_GOAL)
  const [exerciseEntries, setExerciseEntries] = useState([])
  const [exerciseGoalMinutes, setExerciseGoalMinutesState] = useState(DEFAULT_EXERCISE_GOAL_MINUTES)
  const [isLoaded, setIsLoaded] = useState(false)
  const [fileHandle, setFileHandle] = useState(null)
  const [fileStatus, setFileStatus] = useState('none') // 'none', 'saving', 'saved', 'error'
  const fileHandleRef = useRef(null)

  // Load data on startup
  useEffect(() => {
    async function initialize() {
      // Load from localStorage first
      const loaded = loadData()
      setMoodEntries(loaded.moodEntries)
      setSleepEntries(loaded.sleepEntries)
      setWaterEntries(loaded.waterEntries)
      setWaterGoalState(loaded.waterGoal)
      setExerciseEntries(loaded.exerciseEntries)
      setExerciseGoalMinutesState(loaded.exerciseGoalMinutes)
      setIsLoaded(true)
      
      // Try to set up file auto-save
      const handleInfo = getFileHandleInfo()
      if (handleInfo && 'showOpenFilePicker' in window) {
        const handle = await openFile()
        if (handle) {
          fileHandleRef.current = handle
          setFileHandle(handle)
          
          // Load data from file if it's newer
          const fileData = await readFile(handle)
          if (fileData?.moodEntries) {
            const fileDate = fileData.lastSaved ? new Date(fileData.lastSaved) : null
            const storageDate = loaded.moodEntries.length > 0 
              ? new Date(Math.max(...loaded.moodEntries.map(e => e.id))) 
              : null
            
            if (!storageDate || (fileDate && fileDate > storageDate)) {
              setMoodEntries(fileData.moodEntries)
              const fileSleepEntries = isValidSleepEntries(fileData.sleepEntries) ? fileData.sleepEntries : []
              const fileWaterEntries = isValidWaterEntries(fileData.waterEntries) ? fileData.waterEntries : []
              const fileWaterGoal = isValidWaterGoal(fileData.waterGoal) ? fileData.waterGoal : DEFAULT_WATER_GOAL
              const fileExerciseEntries = isValidExerciseEntries(fileData.exerciseEntries) ? fileData.exerciseEntries : []
              const fileExerciseGoal = isValidExerciseGoal(fileData.exerciseGoalMinutes)
                ? fileData.exerciseGoalMinutes
                : DEFAULT_EXERCISE_GOAL_MINUTES
              setSleepEntries(fileSleepEntries)
              setWaterEntries(fileWaterEntries)
              setWaterGoalState(fileWaterGoal)
              setExerciseEntries(fileExerciseEntries)
              setExerciseGoalMinutesState(fileExerciseGoal)
              saveData(
                fileData.moodEntries,
                fileSleepEntries,
                fileWaterEntries,
                fileWaterGoal,
                fileExerciseEntries,
                fileExerciseGoal,
              )
            }
          }
        }
      } else {
        // Auto-setup file on first use
        const handle = await createFile()
        if (handle) {
          fileHandleRef.current = handle
          setFileHandle(handle)
          saveFileHandleInfo(handle)
          await writeFile(handle, {
            moodEntries: loaded.moodEntries,
            sleepEntries: loaded.sleepEntries,
            waterEntries: loaded.waterEntries,
            waterGoal: loaded.waterGoal,
            exerciseEntries: loaded.exerciseEntries,
            exerciseGoalMinutes: loaded.exerciseGoalMinutes,
            lastSaved: new Date().toISOString()
          })
        }
      }
    }
    
    initialize()
  }, [])

  // Auto-save to localStorage and file when data changes
  useEffect(() => {
    if (isLoaded) {
      saveData(
        moodEntries,
        sleepEntries,
        waterEntries,
        waterGoal,
        exerciseEntries,
        exerciseGoalMinutes,
      )
      saveToFile()
    }
  }, [moodEntries, sleepEntries, waterEntries, waterGoal, exerciseEntries, exerciseGoalMinutes, isLoaded])

  async function saveToFile() {
    const handle = fileHandleRef.current
    if (!handle) return

    setFileStatus('saving')
    const success = await writeFile(handle, {
      moodEntries,
      sleepEntries,
      waterEntries,
      waterGoal,
      exerciseEntries,
      exerciseGoalMinutes,
      lastSaved: new Date().toISOString()
    })
    
    if (success) {
      setFileStatus('saved')
      setTimeout(() => setFileStatus('none'), 2000)
    } else {
      setFileStatus('error')
      setTimeout(() => setFileStatus('none'), 3000)
    }
  }

  async function setupFileHandle() {
    const handle = await createFile()
    if (handle) {
      fileHandleRef.current = handle
      setFileHandle(handle)
      saveFileHandleInfo(handle)
      await saveToFile()
      return true
    }
    return false
  }

  async function loadFromFile() {
    const handle = await openFile()
    if (handle) {
      fileHandleRef.current = handle
      setFileHandle(handle)
      saveFileHandleInfo(handle)
      
      const data = await readFile(handle)
      if (data?.moodEntries) {
        setMoodEntries(data.moodEntries)
        const fileSleepEntries = isValidSleepEntries(data.sleepEntries) ? data.sleepEntries : []
        const fileWaterEntries = isValidWaterEntries(data.waterEntries) ? data.waterEntries : []
        const fileWaterGoal = isValidWaterGoal(data.waterGoal) ? data.waterGoal : DEFAULT_WATER_GOAL
        const fileExerciseEntries = isValidExerciseEntries(data.exerciseEntries) ? data.exerciseEntries : []
        const fileExerciseGoal = isValidExerciseGoal(data.exerciseGoalMinutes)
          ? data.exerciseGoalMinutes
          : DEFAULT_EXERCISE_GOAL_MINUTES
        setSleepEntries(fileSleepEntries)
        setWaterEntries(fileWaterEntries)
        setWaterGoalState(fileWaterGoal)
        setExerciseEntries(fileExerciseEntries)
        setExerciseGoalMinutesState(fileExerciseGoal)
        saveData(
          data.moodEntries,
          fileSleepEntries,
          fileWaterEntries,
          fileWaterGoal,
          fileExerciseEntries,
          fileExerciseGoal,
        )
        return true
      }
    }
    return false
  }

  const addMoodEntry = (entry) => {
    setMoodEntries([...moodEntries, entry])
  }

  const deleteMoodEntry = (id) => {
    setMoodEntries(moodEntries.filter(entry => entry.id !== id))
  }

  const setAllData = (moodEntries) => {
    setMoodEntries(moodEntries)
  }

  const addSleepEntry = (entry) => {
    setSleepEntries((entries) => [...entries, entry])
  }

  const updateSleepEntry = (entry) => {
    setSleepEntries((entries) => entries.map((current) => (
      current.id === entry.id ? entry : current
    )))
  }

  const deleteSleepEntry = (id) => {
    setSleepEntries((entries) => entries.filter((entry) => entry.id !== id))
  }

  const addWaterEntry = (entry) => {
    setWaterEntries((entries) => [...entries, entry])
  }

  const updateWaterEntry = (entry) => {
    setWaterEntries((entries) => entries.map((current) => (
      current.id === entry.id ? entry : current
    )))
  }

  const deleteWaterEntry = (id) => {
    setWaterEntries((entries) => entries.filter((entry) => entry.id !== id))
  }

  const setWaterGoal = (goal) => {
    setWaterGoalState(goal)
  }

  const addExerciseEntry = (entry) => {
    setExerciseEntries((entries) => [...entries, entry])
  }

  const updateExerciseEntry = (entry) => {
    setExerciseEntries((entries) => entries.map((current) => (
      current.id === entry.id ? entry : current
    )))
  }

  const deleteExerciseEntry = (id) => {
    setExerciseEntries((entries) => entries.filter((entry) => entry.id !== id))
  }

  const setExerciseGoalMinutes = (goal) => {
    setExerciseGoalMinutesState(goal)
  }

  const addDemoData = (demoData) => {
    setMoodEntries((entries) => [...entries, ...demoData.moodEntries])
    setSleepEntries((entries) => [...entries, ...demoData.sleepEntries])
    setWaterEntries((entries) => [...entries, ...demoData.waterEntries])
    setExerciseEntries((entries) => [...entries, ...demoData.exerciseEntries])
  }

  const removeDemoData = () => {
    setMoodEntries((entries) => entries.filter((entry) => !entry?.isDemo))
    setSleepEntries((entries) => entries.filter((entry) => !entry?.isDemo))
    setWaterEntries((entries) => entries.filter((entry) => !entry?.isDemo))
    setExerciseEntries((entries) => entries.filter((entry) => !entry?.isDemo))
  }

  const exportData = () => {
    const data = {
      moodEntries,
      sleepEntries,
      waterEntries,
      waterGoal,
      exerciseEntries,
      exerciseGoalMinutes,
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (Array.isArray(data.moodEntries)
        && (data.sleepEntries === undefined || isValidSleepEntries(data.sleepEntries))
        && (data.waterEntries === undefined || isValidWaterEntries(data.waterEntries))
        && (data.waterGoal === undefined || isValidWaterGoal(data.waterGoal))
        && (data.exerciseEntries === undefined || isValidExerciseEntries(data.exerciseEntries))
        && (data.exerciseGoalMinutes === undefined || isValidExerciseGoal(data.exerciseGoalMinutes))) {
        setMoodEntries(data.moodEntries)
        setSleepEntries(data.sleepEntries || [])
        setWaterEntries(data.waterEntries || [])
        setWaterGoalState(data.waterGoal || DEFAULT_WATER_GOAL)
        setExerciseEntries(data.exerciseEntries || [])
        setExerciseGoalMinutesState(data.exerciseGoalMinutes ?? DEFAULT_EXERCISE_GOAL_MINUTES)
        return true
      }
      return false
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  return (
    <HealthDataContext.Provider
      value={{
        moodEntries,
        sleepEntries,
        waterEntries,
        waterGoal,
        exerciseEntries,
        exerciseGoalMinutes,
        addMoodEntry,
        deleteMoodEntry,
        addSleepEntry,
        updateSleepEntry,
        deleteSleepEntry,
        addWaterEntry,
        updateWaterEntry,
        deleteWaterEntry,
        setWaterGoal,
        addExerciseEntry,
        updateExerciseEntry,
        deleteExerciseEntry,
        setExerciseGoalMinutes,
        addDemoData,
        removeDemoData,
        exportData,
        importData,
        setAllData,
        setupFileHandle,
        loadFromFile,
        fileHandle,
        fileStatus,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  )
}

export function useHealthData() {
  const context = useContext(HealthDataContext)
  if (!context) {
    throw new Error('useHealthData must be used within HealthDataProvider')
  }
  return context
}
