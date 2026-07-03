// Utility functions for the AHK Dashboard

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Calculate days between two dates
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {number} Days difference
 */
export const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (part, total) => {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  return num.toLocaleString('en-US')
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} Truncated text with ellipsis
 */
export const truncateText = (text, length) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * Get status color class
 * @param {string} status - Status string
 * @returns {string} Tailwind color classes
 */
export const getStatusColor = (status) => {
  const colors = {
    'completed': 'bg-green-100 text-green-800 border-green-300',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
    'not-started': 'bg-gray-100 text-gray-800 border-gray-300',
    'on-track': 'bg-green-100 text-green-800 border-green-300',
    'at-risk': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'delayed': 'bg-red-100 text-red-800 border-red-300',
    'planning': 'bg-blue-100 text-blue-800 border-blue-300'
  }
  return colors[status] || colors['not-started']
}

/**
 * Get priority color class
 * @param {string} priority - Priority level
 * @returns {string} Tailwind color classes
 */
export const getPriorityColor = (priority) => {
  const colors = {
    'high': 'bg-red-100 text-red-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-green-100 text-green-800'
  }
  return colors[priority] || colors['medium']
}

/**
 * Sort array by property
 * @param {Array} array - Array to sort
 * @param {string} property - Property to sort by
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export const sortBy = (array, property, order = 'asc') => {
  return [...array].sort((a, b) => {
    if (order === 'asc') {
      return a[property] > b[property] ? 1 : -1
    }
    return a[property] < b[property] ? 1 : -1
  })
}

/**
 * Filter tasks by status
 * @param {Array} tasks - Tasks array
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered tasks
 */
export const filterByStatus = (tasks, status) => {
  if (status === 'all') return tasks
  return tasks.filter(task => task.status === status)
}

/**
 * Calculate trend percentage
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {object} { percentage, trend }
 */
export const calculateTrend = (current, previous) => {
  if (previous === 0) return { percentage: 0, trend: 'neutral' }
  const diff = ((current - previous) / previous) * 100
  return {
    percentage: Math.abs(diff).toFixed(1),
    trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
  }
}

/**
 * Generate random ID
 * @returns {string} Random ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Check if date is overdue
 * @param {string} dueDate - Due date string
 * @returns {boolean} Is overdue
 */
export const isOverdue = (dueDate) => {
  const due = new Date(dueDate)
  const today = new Date()
  return due < today
}

/**
 * Get greeting based on time
 * @returns {string} Greeting message
 */
export const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export default {
  formatDate,
  daysBetween,
  calculatePercentage,
  formatNumber,
  truncateText,
  getStatusColor,
  getPriorityColor,
  sortBy,
  filterByStatus,
  calculateTrend,
  generateId,
  isOverdue,
  getGreeting,
  debounce
}
