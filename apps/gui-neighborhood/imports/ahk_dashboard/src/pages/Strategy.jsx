// ...existing code...
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Filter, FileText } from 'lucide-react'
import TaskList from '../components/TaskList'
import { useRoadmap, useSources, useProjects, groupTasksBySource, groupTasksByProject, getSourceById } from '../utils/useData'

export default function Strategy() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialTasks = useRoadmap()
  const sources = useSources()
  const projects = useProjects()
  const [filterMode, setFilterMode] = useState('all') // all, by-project, by-source
  const [tasksState, setTasksState] = useState(initialTasks)

  // Handle ?refresh=1 query parameter for cache-busting reload
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('refresh') === '1') {
      console.log('🔄 Refreshing roadmap data...')
      
      // Fetch fresh roadmap data with cache-busting
      fetch(`/src/data/roadmap.json?v=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          console.log('✅ Roadmap data refreshed:', data.length, 'tasks')
          setTasksState(data)
          
          // Remove ?refresh=1 from URL without page reload
          searchParams.delete('refresh')
          const newSearch = searchParams.toString()
          navigate(
            {
              pathname: location.pathname,
              search: newSearch ? `?${newSearch}` : ''
            },
            { replace: true }
          )
        })
        .catch(err => {
          console.error('❌ Failed to refresh roadmap:', err)
          alert('Failed to refresh roadmap data. Using cached version.')
        })
    }
  }, [location.search, location.pathname, navigate])

  const handleTaskUpdate = (updatedTask) => {
    console.log('Task updated:', updatedTask)
    setTasksState(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
  }

  const renderTasksBySource = () => {
    const grouped = groupTasksBySource()
    
    return Object.entries(grouped).map(([sourceId, sourceTasks]) => {
      const sourceDoc = getSourceById(sourceId)
      
      return (
        <div key={sourceId} className="mb-8">
          <div className="flex items-center space-x-4 mb-5 p-5 bg-gradient-to-r from-ahk-navy-600/60 to-ahk-navy-700/60 backdrop-blur-xl border border-ahk-blue-500/30 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group">
            <div className="bg-gradient-to-br from-ahk-blue-500/60 to-ahk-blue-600/60 rounded-lg p-3 border border-ahk-blue-500/50 group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ahk-blue-300">{sourceDoc?.title || sourceId}</h3>
              <p className="text-sm text-ahk-slate-300 font-sans">{sourceTasks.length} tasks • Source Document</p>
            </div>
          </div>
          <TaskList tasks={sourceTasks} onTaskUpdate={handleTaskUpdate} showFilters={false} />
        </div>
      )
    })
  }

  const renderTasksByProject = () => {
    const grouped = groupTasksByProject()
    
    return Object.entries(grouped).map(([projectId, projectTasks]) => {
      const project = projects.find(p => p.id === projectId)
      
      return (
        <div key={projectId} className="mb-8">
          <div className="flex items-center space-x-4 mb-5 p-5 bg-gradient-to-r from-ahk-gold-500 to-ahk-gold-400 text-ahk-navy-900 rounded-xl shadow-gold-lg hover:shadow-gold-xl transition-all duration-300 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-lg animate-glow-pulse"></div>
              <div className="relative w-14 h-14 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center font-display font-black text-2xl border-2 border-white/50 group-hover:scale-110 transition-transform duration-300">
                {project?.name?.charAt(0) || '?'}
              </div>
            </div>
            <div>
              <h3 className="font-display font-black text-xl">{project?.name || projectId}</h3>
              <p className="text-sm font-sans opacity-90">{projectTasks.length} tasks • {project?.stage || 'Planning'}</p>
            </div>
          </div>
          <TaskList tasks={projectTasks} onTaskUpdate={handleTaskUpdate} showFilters={false} />
        </div>
      )
    })
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Premium Page Header */}
      <div className="relative">
        {/* Background Glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-ahk-gold-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-display font-black text-gradient-electric mb-2 animate-fade-in-down">
              Strategy & Roadmap
            </h1>
            <p className="text-lg text-ahk-slate-200 font-sans tracking-wide flex items-center gap-2 animate-fade-in-up">
              <span className="inline-block w-2 h-2 bg-ahk-blue-500 rounded-full animate-glow-pulse"></span>
              Mission tracker: Your path to 100 strategic milestones
            </p>
          </div>
          <button className="btn-secondary flex items-center space-x-3 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Plus className="w-5 h-5" />
            <span className="font-display font-bold">Add Task</span>
          </button>
        </div>
      </div>

      {/* Premium Filter Mode Selector */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/30 shadow-2xl p-6">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-ahk-blue-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-br from-ahk-gold-500/60 to-ahk-gold-600/60 rounded-lg p-2.5 border border-ahk-gold-500/50 shadow-gold-md">
              <Filter className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-xl text-ahk-gold-300">View Mode:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterMode('all')}
              className={`group relative overflow-hidden px-6 py-3.5 rounded-xl font-display font-bold uppercase tracking-wider transition-all duration-300 ${
                filterMode === 'all'
                  ? 'bg-gradient-to-r from-ahk-navy-500 to-ahk-navy-600 text-white shadow-lg scale-105'
                  : 'bg-ahk-navy-600/40 text-ahk-slate-300 hover:bg-ahk-navy-500/50 hover:text-white border border-ahk-gold-500/20 hover:border-ahk-gold-500/40'
              }`}
            >
              {filterMode === 'all' && (
                <div className="absolute inset-0 bg-gradient-to-br from-ahk-blue-500/20 to-transparent"></div>
              )}
              <span className="relative">All Tasks</span>
            </button>
            <button
              onClick={() => setFilterMode('by-project')}
              className={`group relative overflow-hidden px-6 py-3.5 rounded-xl font-display font-bold uppercase tracking-wider transition-all duration-300 ${
                filterMode === 'by-project'
                  ? 'bg-gradient-to-r from-ahk-gold-500 to-ahk-gold-400 text-ahk-navy-900 shadow-gold-lg scale-105'
                  : 'bg-ahk-navy-600/40 text-ahk-slate-300 hover:bg-ahk-navy-500/50 hover:text-white border border-ahk-gold-500/20 hover:border-ahk-gold-500/40'
              }`}
            >
              {filterMode === 'by-project' && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              )}
              <span className="relative">By Project</span>
            </button>
            <button
              onClick={() => setFilterMode('by-source')}
              className={`group relative overflow-hidden px-6 py-3.5 rounded-xl font-display font-bold uppercase tracking-wider transition-all duration-300 ${
                filterMode === 'by-source'
                  ? 'bg-gradient-to-r from-ahk-navy-500 to-ahk-navy-600 text-white shadow-lg scale-105'
                  : 'bg-ahk-navy-600/40 text-ahk-slate-300 hover:bg-ahk-navy-500/50 hover:text-white border border-ahk-gold-500/20 hover:border-ahk-gold-500/40'
              }`}
            >
              {filterMode === 'by-source' && (
                <div className="absolute inset-0 bg-gradient-to-br from-ahk-blue-500/20 to-transparent"></div>
              )}
              <span className="relative">By Source Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task List Component */}
      {filterMode === 'all' && (
        <TaskList tasks={tasksState} onTaskUpdate={handleTaskUpdate} />
      )}
      {filterMode === 'by-project' && renderTasksByProject()}
      {filterMode === 'by-source' && renderTasksBySource()}
    </div>
  )
}
