export default function Table({ columns, data, onRowClick }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-ahk-slate-100 border-b border-ahk-slate-200">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className="px-6 py-4 text-left text-xs font-bold text-ahk-slate-700 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ahk-slate-200">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-ahk-slate-50' : ''} transition-colors`}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-sm text-ahk-slate-900">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-12 text-ahk-slate-500">
          <p>No data available</p>
        </div>
      )}
    </div>
  )
}
