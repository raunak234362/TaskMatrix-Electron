
const getCols = (canSeeCost) => canSeeCost
  ? ["description", "referenceDoc", "elements", "QtyNo", "hours", "cost", "remarks"]
  : ["description", "referenceDoc", "elements", "QtyNo", "hours", "remarks"];

const CoTableView = ({ rows, canSeeCost = true }) => {
  const activeCols = getCols(canSeeCost);
  const normalizedRows = rows.map((r) => ({
    ...r,
    QtyNo: r.QtyNo === -999999 ? "_MERGED_LEFT_" : r.QtyNo === -999998 ? "_MERGED_UP_" : r.QtyNo,
    hours: r.hours === -999999 ? "_MERGED_LEFT_" : r.hours === -999998 ? "_MERGED_UP_" : r.hours,
    cost: r.cost === -999999 ? "_MERGED_LEFT_" : r.cost === -999998 ? "_MERGED_UP_" : r.cost,
  }));

  // Compute cell spans dynamically
  const cellSpans = [];
  for (let r = 0; r < normalizedRows.length; r++) {
    const rowSpans = [];
    for (let c = 0; c < activeCols.length; c++) {
      rowSpans.push({ rowSpan: 1, colSpan: 1, isSpanned: false });
    }
    cellSpans.push(rowSpans);
  }

  for (let r = 0; r < normalizedRows.length; r++) {
    for (let c = 0; c < activeCols.length; c++) {
      if (cellSpans[r]?.[c]?.isSpanned) continue;

      let colSpan = 1;
      let nextCol = c + 1;
      while (nextCol < activeCols.length) {
        const fieldName = activeCols[nextCol];
        if (normalizedRows[r]?.[fieldName] === "_MERGED_LEFT_") {
          colSpan++;
          nextCol++;
        } else {
          break;
        }
      }

      let rowSpan = 1;
      let nextRow = r + 1;
      while (nextRow < normalizedRows.length) {
        let allMergedUp = true;
        for (let offset = 0; offset < colSpan; offset++) {
          const fieldName = activeCols[c + offset];
          if (normalizedRows[nextRow]?.[fieldName] !== "_MERGED_UP_") {
            allMergedUp = false;
            break;
          }
        }
        if (allMergedUp) {
          rowSpan++;
          nextRow++;
        } else {
          break;
        }
      }

      for (let ri = r; ri < r + rowSpan; ri++) {
        for (let ci = c; ci < c + colSpan; ci++) {
          if (ri === r && ci === c) continue;
          if (cellSpans[ri]?.[ci]) {
            cellSpans[ri][ci].isSpanned = true;
          }
        }
      }

      if (cellSpans[r]?.[c]) {
        cellSpans[r][c].rowSpan = rowSpan;
        cellSpans[r][c].colSpan = colSpan;
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 border border-gray-200">#</th>
              <th className="px-4 py-3 border border-gray-200">Description</th>
              <th className="px-4 py-3 border border-gray-200">Reference</th>
              <th className="px-4 py-3 border border-gray-200">Elements</th>
              <th className="px-4 py-3 text-center border border-gray-200">Qty</th>
              <th className="px-4 py-3 text-center border border-gray-200">Hours</th>
              {canSeeCost && <th className="px-4 py-3 text-right border border-gray-200">Cost ($)</th>}
              <th className="px-4 py-3 border border-gray-200">Remarks</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {normalizedRows.map((r, i) => (
              <tr key={r.id || i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700 border border-gray-200">{i + 1}</td>

                {activeCols.map((colName, colIndex) => {
                  const spanInfo = cellSpans[i]?.[colIndex] || { rowSpan: 1, colSpan: 1, isSpanned: false };
                  if (spanInfo.isSpanned) return null;

                  const cellVal = r[colName];
                  
                  let formattedVal = cellVal;
                  if (cellVal === "_MERGED_LEFT_" || cellVal === "_MERGED_UP_") {
                    formattedVal = "";
                  } else if (colName === "cost" && typeof cellVal === "number") {
                    formattedVal = `$${cellVal.toLocaleString()}`;
                  } else if (colName === "cost" && cellVal && !isNaN(Number(cellVal))) {
                    formattedVal = `$${Number(cellVal).toLocaleString()}`;
                  } else if (colName === "remarks" && (!cellVal || String(cellVal).trim() === "")) {
                    formattedVal = "—";
                  }

                  let alignmentClass = "text-left";
                  if (["QtyNo", "hours"].includes(colName)) {
                    alignmentClass = "text-center font-medium";
                  } else if (colName === "cost") {
                    alignmentClass = "text-right font-semibold";
                  }

                  return (
                    <td
                      key={colName}
                      colSpan={spanInfo.colSpan}
                      rowSpan={spanInfo.rowSpan}
                      className={`px-4 py-3 border border-gray-200 max-w-xs ${alignmentClass}`}
                    >
                      <span className="whitespace-pre-line">{formattedVal}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoTableView;
