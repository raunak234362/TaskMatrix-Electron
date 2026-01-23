const CoTableView = ({ rows }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Elements</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-center">Hours</th>
              <th className="px-4 py-3 text-right">Cost ($)</th>
              <th className="px-4 py-3">Remarks</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {rows.map((r, i) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{i + 1}</td>

                <td className="px-4 py-3 max-w-xs">
                  <p className="line-clamp-2">{r.description}</p>
                </td>

                <td className="px-4 py-3">{r.referenceDoc}</td>
                <td className="px-4 py-3">{r.elements}</td>

                <td className="px-4 py-3 text-center font-medium">{r.QtyNo}</td>

                <td className="px-4 py-3 text-center">{r.hours}</td>

                <td className="px-4 py-3 text-right font-semibold">${r.cost}</td>

                <td className="px-4 py-3 max-w-xs text-gray-700">{r.remarks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CoTableView
