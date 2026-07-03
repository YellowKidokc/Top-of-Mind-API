import { useState, useEffect } from 'react'
import { CheckSquare, Square, Calendar, Tag } from 'lucide-react'

export default function TaskList({ tasks: initialTasks = [], onTaskUpdate, showFilters = true }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState('all')

  // Update tasks when initialTasks prop changes
  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const toggleTask = (taskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        // Toggle between pending and completed
        const newStatus = task.status === 'completed' ? 'pending' : 'completed'
        const updatedTask = { ...task, status: newStatus }
        
        // Call parent callback if provided
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask)
        }
        
        return updatedTask
      }
      return task
    })
    
    setTasks(updatedTasks)
  }

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter)

  const getStatusBadge = (status) => {
    const badges = {
      'completed': 'bg-green-100 text-green-800 border-green-300',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-300',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'not-started': 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return badges[status] || badges['pending']
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    }
    return badges[priority] || badges['medium']
  }

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const progressPercentage = Math.round((completedCount / tasks.length) * 100)

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="card bg-gradient-to-r from-ahk-navy-500 to-ahk-navy-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-display font-bold">Task Progress</h3>
            <p className="text-white text-opacity-80 mt-1">
              {completedCount} of {tasks.length} tasks completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-display font-bold">{progressPercentage}%</p>
          </div>
        </div>
        <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
          <div 
            className="bg-ahk-gold-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'in-progress', 'completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-ahk-navy-500 text-white'
                  : 'bg-ahk-slate-100 text-ahk-slate-700 hover:bg-ahk-slate-200'
              }`}
            >
              {status === 'all' ? 'All Tasks' : status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed'
          
          return (
            <div
              key={task.id}
              className={`card hover:shadow-lg transition-all cursor-pointer ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
              onClick={() => toggleTask(task.id)}
            >
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <button 
                  className="mt-1 hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTask(task.id)
                  }}
                >
                  {task.status === 'completed' ? (
                    <CheckSquare className="w-6 h-6 text-green-600" />
                  ) : (
                    <Square className="w-6 h-6 text-ahk-slate-400" />
                  )}
                </button>

                {/* Task Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold text-lg ${
                        task.status === 'completed' 
                          ? 'line-through text-ahk-slate-400' 
                          : 'text-ahk-navy-500'
                      }`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-2 text-sm text-ahk-slate-500">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {task.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(task.dueDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                          {isOverdue && (
                            <span className="text-red-600 font-semibold ml-1">(Overdue)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col gap-2 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadge(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(task.status)}`}>
                        {task.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Project Tag */}
                  <div className="mt-2">
                    <span className="text-xs text-ahk-slate-600 bg-ahk-slate-100 px-2 py-1 rounded">
                      {task.project}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredTasks.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-ahk-slate-500">No tasks found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
