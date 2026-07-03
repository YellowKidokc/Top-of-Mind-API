import { Clock, CheckCircle, AlertCircle, Circle, User, DollarSign, Calendar, FileText } from 'lucide-react'
import { getSourcesByIds } from '../utils/useData'

export default function ProjectCard({ project }) {
  const statusConfig = {
    'on-track': { 
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    'at-risk': { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: AlertCircle,
      iconColor: 'text-yellow-600'
    },
    'planning': { 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Circle,
      iconColor: 'text-blue-600'
    },
    'in-progress': { 
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: Clock,
      iconColor: 'text-purple-600'
    }
  }

  const status = statusConfig[project.status] || statusConfig['planning']
  const StatusIcon = status.icon
  
  // Get source documents for tooltip
  const sourceDocs = getSourcesByIds(project.source_docs || [])

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-ahk-navy-600/50 to-ahk-navy-700/50 backdrop-blur-xl border border-ahk-gold-500/30 hover:border-ahk-gold-500/60 shadow-2xl hover:shadow-gold-lg transition-all duration-500 cursor-pointer">
      {/* Animated Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-ahk-gold-500/5 via-transparent to-ahk-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-ahk-gold-400/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Content Container */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-display font-bold text-white group-hover:text-gradient-gold transition-all duration-300 mb-2">
              {project.name}
            </h3>
            {project.stage && (
              <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-ahk-gold-500/20 to-ahk-gold-400/20 text-ahk-gold-300 rounded-lg border border-ahk-gold-500/40">
                {project.stage}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-ahk-gold-400/30 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-gradient-to-br from-ahk-navy-500/60 to-ahk-navy-600/60 rounded-lg p-2.5 border border-ahk-gold-500/30 group-hover:border-ahk-gold-500/60 transition-all duration-300 group-hover:scale-110">
              <StatusIcon className={`w-6 h-6 ${status.iconColor} flex-shrink-0 transition-colors`} />
            </div>
          </div>
        </div>

        {/* Source Documents Badge */}
        {sourceDocs.length > 0 && (
          <div className="mb-4 relative">
            <div className="flex items-center text-xs text-ahk-slate-300 bg-ahk-navy-600/40 rounded-lg px-3 py-2 border border-ahk-gold-500/20 hover:border-ahk-gold-500/40 transition-all duration-300">
              <FileText className="w-3.5 h-3.5 mr-2 text-ahk-gold-400" />
              <span className="font-medium">{sourceDocs.length} source document{sourceDocs.length > 1 ? 's' : ''}</span>
            </div>
            <div className="absolute left-0 top-full mt-2 w-64 p-4 bg-gradient-to-br from-ahk-navy-600/95 to-ahk-navy-700/95 backdrop-blur-xl border border-ahk-gold-500/30 text-white text-xs rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20">
              <p className="font-display font-bold text-ahk-gold-300 mb-3">Data Sources:</p>
              <ul className="space-y-2">
                {sourceDocs.map(doc => (
                  <li key={doc.id} className="truncate text-ahk-slate-200 flex items-start">
                    <span className="text-ahk-gold-400 mr-2">•</span>
                    <span>{doc.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-display font-semibold text-ahk-slate-200 uppercase tracking-wide">Progress</span>
            <span className="text-sm font-display font-black text-ahk-gold-300">{project.progress}%</span>
          </div>
          <div className="relative w-full bg-ahk-navy-700/60 rounded-full h-3 overflow-hidden border border-ahk-navy-600">
            <div className="absolute inset-0 bg-gradient-to-r from-ahk-gold-500/20 via-ahk-gold-400/10 to-transparent"></div>
            <div 
              className="relative bg-gradient-to-r from-ahk-gold-500 via-ahk-gold-400 to-ahk-gold-500 h-3 rounded-full transition-all duration-700 ease-out shadow-gold-md"
              style={{ 
                width: `${project.progress}%`,
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.6), inset 0 1px 2px rgba(255,255,255,0.3)'
              }}
            />
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-between mb-5">
          <span className={`px-4 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider border ${status.color} shadow-md transition-all duration-300 group-hover:scale-105`}>
            {project.status.replace('-', ' ')}
          </span>
          <div className="text-right">
            <p className="text-xs text-ahk-slate-400 font-sans uppercase tracking-wide mb-1">Next Milestone</p>
            <p className="text-sm font-display font-bold text-ahk-gold-300">{project.nextMilestone}</p>
          </div>
        </div>

        {/* Timeline */}
        {project.timeline && (
          <div className="mb-5 pt-4 border-t border-ahk-gold-500/20">
            <div className="flex items-center text-sm bg-ahk-navy-600/40 rounded-lg px-3 py-2.5 border border-ahk-gold-500/20">
              <Clock className="w-4 h-4 mr-2.5 text-ahk-gold-400" />
              <span className="text-ahk-slate-200 font-medium">{project.timeline}</span>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="pt-4 border-t border-ahk-gold-500/20 space-y-3">
          {project.owner && (
            <div className="flex items-center text-sm bg-ahk-navy-600/30 rounded-lg px-3 py-2 border border-ahk-navy-500/50">
              <User className="w-4 h-4 mr-2.5 text-ahk-gold-400" />
              <span className="font-display font-semibold text-ahk-slate-300 mr-2">Owner:</span>
              <span className="text-ahk-slate-200">{project.owner}</span>
            </div>
          )}
          {project.startDate && (
            <div className="flex items-center text-sm bg-ahk-navy-600/30 rounded-lg px-3 py-2 border border-ahk-navy-500/50">
              <Calendar className="w-4 h-4 mr-2.5 text-ahk-blue-400" />
              <span className="font-display font-semibold text-ahk-slate-300 mr-2">Started:</span>
              <span className="text-ahk-slate-200">{new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          )}
          {project.fundingStage && (
            <div className="flex items-center text-sm bg-gradient-to-r from-ahk-gold-500/10 to-ahk-gold-400/5 rounded-lg px-3 py-2 border border-ahk-gold-500/40">
              <DollarSign className="w-4 h-4 mr-2.5 text-ahk-gold-400" />
              <span className="font-display font-semibold text-ahk-slate-300 mr-2">Funding:</span>
              <span className="text-ahk-gold-300 font-display font-bold">{project.fundingStage}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Accent Line with Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-ahk-gold-500 via-ahk-blue-500 to-ahk-gold-500 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  )
}
