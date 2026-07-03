import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function MetricsChart({ data, type = 'line', dataKeys, title }) {
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Transform data for chart
  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date)
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-ahk-slate-200">
          <p className="font-semibold text-ahk-navy-500 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      {title && (
        <h3 className="text-xl font-display font-bold text-ahk-navy-500 mb-6">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={300}>
        {type === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#8892B0"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#8892B0"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
              iconType="circle"
            />
            {dataKeys.map((key, index) => (
              <Line
                key={key.key}
                type="monotone"
                dataKey={key.key}
                name={key.name}
                stroke={key.color || (index === 0 ? '#0A192F' : index === 1 ? '#D4AF37' : '#8892B0')}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#8892B0"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#8892B0"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
              iconType="square"
            />
            {dataKeys.map((key, index) => (
              <Bar
                key={key.key}
                dataKey={key.key}
                name={key.name}
                fill={key.color || (index === 0 ? '#0A192F' : index === 1 ? '#D4AF37' : '#8892B0')}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
