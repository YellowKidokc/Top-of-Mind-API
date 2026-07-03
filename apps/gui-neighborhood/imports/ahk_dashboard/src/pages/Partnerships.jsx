// ...existing code...
import { useState } from 'react'
import { Building2, Globe, ChevronDown, ChevronRight, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { useClients } from '../utils/useData'

export default function Partnerships() {
  const clientGroups = useClients()
  const [expandedSectors, setExpandedSectors] = useState({})
  const [publicMaskMode, setPublicMaskMode] = useState(false)

  const toggleSector = (sector) => {
    setExpandedSectors(prev => ({
      ...prev,
      [sector]: !prev[sector]
    }))
  }

  const maskName = (name) => {
    if (!publicMaskMode) return name
    // Mask client names for public display
    const words = name.split(' ')
    return words.map(word => word.charAt(0) + '*'.repeat(word.length - 1)).join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ahk-navy-900">
            Strategic Partnerships
          </h1>
          <p className="text-ahk-slate-600 mt-1">
            Client network and partnership ecosystem
          </p>
        </div>
        <button
          onClick={() => setPublicMaskMode(!publicMaskMode)}
          className={`btn-secondary flex items-center space-x-2 ${
            publicMaskMode ? 'bg-ahk-gold-100 border-ahk-gold-500' : ''
          }`}
        >
          {publicMaskMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          <span>{publicMaskMode ? 'Show Names' : 'Public Mask Mode'}</span>
        </button>
      </div>

      {/* Public Mask Mode Notice */}
      {publicMaskMode && (
        <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300">
          <div className="flex items-start space-x-4">
            <EyeOff className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-1">Public Display Mode Active</h3>
              <p className="text-sm text-yellow-800">
                Client names are masked for website publishing. Click the button above to reveal actual names for internal use.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-ahk-navy-600 to-ahk-navy-800 text-white">
          <Building2 className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold mb-1">{clientGroups.reduce((sum, g) => sum + g.items.length, 0)}</p>
          <p className="text-white text-opacity-80 text-sm">Total Partnerships</p>
        </div>
        <div className="card bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-700 text-white">
          <Globe className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold mb-1">{new Set(clientGroups.map(g => g.sector)).size}</p>
          <p className="text-white text-opacity-80 text-sm">Industry Sectors</p>
        </div>
        <div className="card bg-gradient-to-br from-ahk-slate-600 to-ahk-slate-800 text-white">
          <Globe className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold mb-1">{new Set(clientGroups.map(g => g.country)).size}</p>
          <p className="text-white text-opacity-80 text-sm">Countries</p>
        </div>
      </div>

      {/* Partnerships by Sector */}
      <div className="space-y-4">
        {clientGroups.reduce((acc, group) => {
          if (!acc[group.sector]) {
            acc[group.sector] = []
          }
          acc[group.sector].push(group)
          return acc
        }, {}) && Object.entries(
          clientGroups.reduce((acc, group) => {
            if (!acc[group.sector]) {
              acc[group.sector] = []
            }
            acc[group.sector].push(group)
            return acc
          }, {})
        ).map(([sector, groups]) => {
          const isExpanded = expandedSectors[sector]
          const totalClients = groups.reduce((sum, g) => sum + g.items.length, 0)
          
          return (
            <div key={sector} className="card">
              <button
                onClick={() => toggleSector(sector)}
                className="w-full flex items-center justify-between p-4 hover:bg-ahk-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-ahk-navy-100 rounded-lg p-3">
                    <Building2 className="w-6 h-6 text-ahk-navy-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-display font-bold text-ahk-navy-900">
                      {sector}
                    </h3>
                    <p className="text-sm text-ahk-slate-600">
                      {totalClients} partner{totalClients !== 1 ? 's' : ''} • {groups.length} countr{groups.length !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>
                </div>
                <div className="text-ahk-slate-400">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4">
                  {groups.map((group) => (
                    <div key={`${group.sector}-${group.country}`} className="border-l-4 border-ahk-gold-500 pl-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Globe className="w-4 h-4 text-ahk-slate-600" />
                        <h4 className="font-semibold text-ahk-navy-700">{group.country}</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-ahk-slate-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-ahk-slate-700 uppercase">
                                Company
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-ahk-slate-700 uppercase">
                                Website
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-ahk-slate-700 uppercase">
                                Source
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ahk-slate-200">
                            {group.items.map((client, idx) => (
                              <tr key={idx} className="hover:bg-ahk-slate-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-ahk-navy-900">
                                  {maskName(client.name)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {!publicMaskMode && client.website ? (
                                    <a
                                      href={client.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center space-x-1 text-ahk-navy-600 hover:text-ahk-gold-600 transition-colors"
                                    >
                                      <span>Visit</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-ahk-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-ahk-slate-600">
                                  {client.source || 'Internal'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA Section */}
      <div className="card bg-gradient-to-r from-ahk-navy-700 to-ahk-navy-900 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold mb-2">Expand Your Network</h3>
            <p className="text-white text-opacity-80 text-sm">
              Connect with strategic partners across automotive, logistics, and mobility sectors
            </p>
          </div>
          <button className="btn-primary bg-ahk-gold-500 text-white hover:bg-ahk-gold-600">
            Request Introduction
          </button>
        </div>
      </div>
    </div>
  )
}
