import { useState } from 'react'
import { FolderOpen, FileText, Lock, Download, ExternalLink, Shield, Copy, CheckCircle } from 'lucide-react'
import { useAssets, getSourceById } from '../utils/useData'

export default function AssetVault() {
  const categories = useAssets()
  const [copiedId, setCopiedId] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState({})

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const copyLink = (assetPath) => {
    const fullUrl = `${window.location.origin}/${assetPath}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(assetPath)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openAsset = (assetPath) => {
    window.open(`/${assetPath}`, '_blank')
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Premium Page Header */}
      <div className="relative">
        {/* Background Glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-ahk-gold-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-display font-black text-gradient-gold mb-2 animate-fade-in-down">
              Asset Vault
            </h1>
            <p className="text-lg text-ahk-slate-200 font-sans tracking-wide flex items-center gap-2 animate-fade-in-up">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-glow-pulse"></span>
              Secure storage for all strategic documents and resources
            </p>
          </div>
          <button className="btn-primary flex items-center space-x-3 px-8 py-4 text-lg shadow-gold-lg hover:shadow-gold-xl transition-all duration-300 hover:scale-105">
            <Download className="w-5 h-5" />
            <span className="font-display font-bold">Upload New</span>
          </button>
        </div>
      </div>

      {/* Premium Security Notice */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-700/20 backdrop-blur-xl border-2 border-blue-500/50 shadow-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
        <div className="relative z-10 flex items-start space-x-5">
          <div className="bg-gradient-to-br from-blue-500/60 to-blue-600/60 rounded-xl p-3.5 border border-blue-500/50 shadow-lg">
            <Shield className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-blue-300 mb-2">Secure Data Room</h3>
            <p className="text-sm text-blue-200 font-sans leading-relaxed">
              All files are encrypted and access-controlled. Data Room folders are view-only for external parties.
              No internal file names or sensitive information exposed.
            </p>
          </div>
        </div>
      </div>

      {/* Asset Categories - Expandable */}
      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories[category.id]
          const categoryIcon = category.id === 'CAT-DATA-ROOM' ? Lock : 
                               category.id === 'CAT-TEMPLATES' ? FileText : FolderOpen
          const Icon = categoryIcon
          
          return (
            <div key={category.id} className="card">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-ahk-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`rounded-lg p-3 ${
                    category.id === 'CAT-DATA-ROOM' ? 'bg-red-100' :
                    category.id === 'CAT-INVESTOR-PACKS' ? 'bg-ahk-navy-100' :
                    'bg-ahk-gold-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      category.id === 'CAT-DATA-ROOM' ? 'text-red-600' :
                      category.id === 'CAT-INVESTOR-PACKS' ? 'text-ahk-navy-600' :
                      'text-ahk-gold-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-display font-bold text-ahk-navy-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-ahk-slate-600">
                      {category.items.length} file{category.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-ahk-slate-400">
                  {isExpanded ? '▼' : '▶'}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {category.items.map((item) => {
                    const sourceDoc = getSourceById(item.source_doc)
                    
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-ahk-slate-50 rounded-lg hover:bg-ahk-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-ahk-navy-900">{item.title}</p>
                            {item.confidential && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                CONFIDENTIAL
                              </span>
                            )}
                          </div>
                          {item.tags && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-ahk-slate-200 text-ahk-slate-700 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {sourceDoc && (
                            <p className="text-xs text-ahk-slate-600">
                              Source: {sourceDoc.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => openAsset(item.path)}
                            className="p-2 bg-ahk-navy-500 text-white rounded-lg hover:bg-ahk-navy-600 transition-colors"
                            title="Open"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyLink(item.path)}
                            className={`p-2 rounded-lg transition-colors ${
                              copiedId === item.path
                                ? 'bg-green-500 text-white'
                                : 'bg-ahk-gold-500 text-white hover:bg-ahk-gold-600'
                            }`}
                            title="Copy Link"
                          >
                            {copiedId === item.path ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Premium Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-ahk-navy-700 to-ahk-navy-900 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer border border-ahk-navy-600">
          <div className="absolute top-0 right-0 w-64 h-64 bg-ahk-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-display font-black text-white mb-3">Google Drive Data Room</h3>
            <p className="text-ahk-slate-300 mb-6 text-sm font-sans leading-relaxed">
              Access the main data room with organized folders for investor materials
            </p>
            <button className="bg-white text-ahk-navy-900 hover:bg-ahk-gold-400 hover:text-ahk-navy-900 px-6 py-3 rounded-xl font-display font-bold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <ExternalLink className="w-5 h-5" />
              <span>Open Data Room</span>
            </button>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-600 p-8 shadow-gold-xl hover:shadow-gold-2xl transition-all duration-500 cursor-pointer">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-display font-black text-ahk-navy-900 mb-3">Generate QR Code</h3>
            <p className="text-ahk-navy-800 mb-6 text-sm font-sans leading-relaxed">
              Create QR codes for pitch deck access and investor resource links
            </p>
            <button className="bg-white text-ahk-gold-700 hover:bg-ahk-navy-900 hover:text-white px-6 py-3 rounded-xl font-display font-bold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Download className="w-5 h-5" />
              <span>Create QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
