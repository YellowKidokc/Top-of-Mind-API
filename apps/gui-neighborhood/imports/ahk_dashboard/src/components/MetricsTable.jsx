import { TrendingUp, TrendingDown } from 'lucide-react'

const MetricsTable = ({ data, title = 'Daily Performance Metrics' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-ahk-navy-500 mb-4">{title}</h3>
        <p className="text-ahk-slate-600">No data available</p>
      </div>
    )
  }

  const getTrendIcon = (current, previous) => {
    if (!previous) return null
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    }
    if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-600" />
    }
    return null
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-ahk-navy-500">{title}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-ahk-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-ahk-slate-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ahk-slate-700 uppercase tracking-wider">
                Visitors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ahk-slate-700 uppercase tracking-wider">
                Leads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ahk-slate-700 uppercase tracking-wider">
                Conversion Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ahk-slate-700 uppercase tracking-wider">
                LinkedIn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-ahk-slate-700 uppercase tracking-wider">
                Emails Sent
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => {
              const prevRow = index > 0 ? data[index - 1] : null
              
              return (
                <tr key={row.date} className="hover:bg-ahk-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-ahk-navy-500">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ahk-slate-900">
                    <div className="flex items-center gap-2">
                      {row.visitors}
                      {getTrendIcon(row.visitors, prevRow?.visitors)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ahk-slate-900">
                    <div className="flex items-center gap-2">
                      {row.leads}
                      {getTrendIcon(row.leads, prevRow?.leads)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ahk-slate-900">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        row.conversionRate >= 5 ? 'text-green-600' : 
                        row.conversionRate >= 3 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {row.conversionRate.toFixed(2)}%
                      </span>
                      {getTrendIcon(row.conversionRate, prevRow?.conversionRate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ahk-slate-900">
                    <div className="flex items-center gap-2">
                      {row.linkedInImpressions?.toLocaleString() || 'N/A'}
                      {row.linkedInImpressions && getTrendIcon(row.linkedInImpressions, prevRow?.linkedInImpressions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ahk-slate-900">
                    {row.emailsSent || 'N/A'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="bg-ahk-slate-50 px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-ahk-slate-600">Total Visitors:</span>
            <span className="ml-2 font-semibold text-ahk-navy-500">
              {data.reduce((sum, row) => sum + row.visitors, 0)}
            </span>
          </div>
          <div>
            <span className="text-ahk-slate-600">Total Leads:</span>
            <span className="ml-2 font-semibold text-ahk-navy-500">
              {data.reduce((sum, row) => sum + row.leads, 0)}
            </span>
          </div>
          <div>
            <span className="text-ahk-slate-600">Avg Conversion:</span>
            <span className="ml-2 font-semibold text-ahk-navy-500">
              {(data.reduce((sum, row) => sum + row.conversionRate, 0) / data.length).toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-ahk-slate-600">Total Impressions:</span>
            <span className="ml-2 font-semibold text-ahk-navy-500">
              {data.reduce((sum, row) => sum + (row.linkedInImpressions || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsTable
