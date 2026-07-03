// Safe data loading utility with error guards
import projectsData from '../data/projects.json'
import roadmapData from '../data/roadmap.json'
import assetsData from '../data/assets.json'
import clientsData from '../data/clients.json'
import sourcesData from '../data/sources.index.json'

/**
 * Safely loads projects data with fallback
 */
export const useProjects = () => {
  try {
    return Array.isArray(projectsData) ? projectsData : []
  } catch (error) {
    console.error('Error loading projects:', error)
    return []
  }
}

/**
 * Safely loads roadmap/tasks data with fallback
 */
export const useRoadmap = () => {
  try {
    return Array.isArray(roadmapData) ? roadmapData : []
  } catch (error) {
    console.error('Error loading roadmap:', error)
    return []
  }
}

/**
 * Safely loads assets data with fallback
 */
export const useAssets = () => {
  try {
    return assetsData?.categories || []
  } catch (error) {
    console.error('Error loading assets:', error)
    return []
  }
}

/**
 * Safely loads clients data with fallback
 */
export const useClients = () => {
  try {
    return clientsData?.groups || []
  } catch (error) {
    console.error('Error loading clients:', error)
    return []
  }
}

/**
 * Safely loads source documents index with fallback
 */
export const useSources = () => {
  try {
    return sourcesData?.documents || []
  } catch (error) {
    console.error('Error loading sources:', error)
    return []
  }
}

/**
 * Get source document by ID
 */
export const getSourceById = (sourceId) => {
  const sources = useSources()
  return sources.find(doc => doc.id === sourceId) || null
}

/**
 * Get multiple source documents by IDs array
 */
export const getSourcesByIds = (sourceIds = []) => {
  if (!Array.isArray(sourceIds)) return []
  const sources = useSources()
  return sourceIds
    .map(id => sources.find(doc => doc.id === id))
    .filter(Boolean)
}

/**
 * Get tasks by project ID
 */
export const getTasksByProject = (projectId) => {
  const tasks = useRoadmap()
  return tasks.filter(task => task.projectId === projectId)
}

/**
 * Get tasks by source document
 */
export const getTasksBySource = (sourceId) => {
  const tasks = useRoadmap()
  return tasks.filter(task => task.source === sourceId)
}

/**
 * Group tasks by source document
 */
export const groupTasksBySource = () => {
  const tasks = useRoadmap()
  const grouped = {}
  
  tasks.forEach(task => {
    if (task.source) {
      if (!grouped[task.source]) {
        grouped[task.source] = []
      }
      grouped[task.source].push(task)
    }
  })
  
  return grouped
}

/**
 * Group tasks by project
 */
export const groupTasksByProject = () => {
  const tasks = useRoadmap()
  const grouped = {}
  
  tasks.forEach(task => {
    if (task.projectId) {
      if (!grouped[task.projectId]) {
        grouped[task.projectId] = []
      }
      grouped[task.projectId].push(task)
    }
  })
  
  return grouped
}

export default {
  useProjects,
  useRoadmap,
  useAssets,
  useClients,
  useSources,
  getSourceById,
  getSourcesByIds,
  getTasksByProject,
  getTasksBySource,
  groupTasksBySource,
  groupTasksByProject
}
