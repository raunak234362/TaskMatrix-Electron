import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Button from "../fields/Button";
import Service from "../../api/Service";
import { toast } from "react-toastify";
import { Merge } from "lucide-react";


const EDITABLE_COLS = ["description", "referenceDoc", "elements", "QtyNo", "hours", "remarks"];

const sumCellValue = (val) => {
  if (val === undefined || val === null) return 0;
  if (val === "_MERGED_LEFT_" || val === "_MERGED_UP_" || val === -999999 || val === -999998) return 0;
  return Number(val) || 0;
};

const CoTable = ({ coId, onSuccess }) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const hideCost = ["staff", "project_manager", "dept_manager"].includes(userRole);
  const canSeeCost = !hideCost;

  const activeCols = canSeeCost
    ? ["description", "referenceDoc", "elements", "QtyNo", "hours", "cost", "remarks"]
    : ["description", "referenceDoc", "elements", "QtyNo", "hours", "remarks"];

  const [loading, setLoading] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [cellMergeMode, setCellMergeMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const { control, handleSubmit, watch } = useForm({
    defaultValues: {
      rows: [
        {
          description: "",
          referenceDoc: "",
          elements: "",
          QtyNo: "0",
          hours: "0",
          cost: "0",
          remarks: "",
        },
      ],
    },
  });

  const { fields, append, replace } = useFieldArray({ control, name: "rows" });

  const fetchTableRows = async () => {
    if (!coId) return;
    try {
      setLoading(true);
      const response = await Service.GetAllCOTableRows(coId);
      const rows = response?.data || [];
      if (rows.length > 0) {
        replace(
          rows.map((r) => ({
            description: r.description || "",
            referenceDoc: r.referenceDoc || "",
            elements: r.elements || "",
            QtyNo: r.QtyNo === -999999 ? "_MERGED_LEFT_" : r.QtyNo === -999998 ? "_MERGED_UP_" : String(r.QtyNo ?? 0),
            hours: r.hours === -999999 ? "_MERGED_LEFT_" : r.hours === -999998 ? "_MERGED_UP_" : String(r.hours ?? 0),
            cost: r.cost === -999999 ? "_MERGED_LEFT_" : r.cost === -999998 ? "_MERGED_UP_" : String(r.cost ?? 0),
            remarks: r.remarks || "",
          }))
        );
      }
      setSelectedRowIds(new Set());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableRows();
  }, [coId]);

  // Auto-resize all table textareas whenever rows load or change
  useEffect(() => {
    if (loading) return;
    const textareas = document.querySelectorAll('.ref-table-textarea');
    textareas.forEach((ta) => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, [fields, loading]);

  const handleMergeSelected = () => {
    const currentRows = watch("rows") || [];
    const selectedIndices = [];
    fields.forEach((field, index) => {
      if (selectedRowIds.has(field.id)) {
        selectedIndices.push(index);
      }
    });

    if (selectedIndices.length <= 1) {
      toast.warning("Please select at least 2 rows to merge");
      return;
    }

    const selectedRowsData = selectedIndices.map((idx) => currentRows[idx]);

    const mergedRow = {
      description: selectedRowsData
        .map((r) => r.description || "")
        .filter((val) => val.trim() !== "")
        .join("\n"),
      referenceDoc: selectedRowsData
        .map((r) => r.referenceDoc || "")
        .filter((val) => val.trim() !== "")
        .join("\n"),
      elements: selectedRowsData
        .map((r) => r.elements || "")
        .filter((val) => val.trim() !== "")
        .join("\n"),
      QtyNo: String(selectedRowsData.reduce((sum, r) => sum + (Number(r.QtyNo) || 0), 0)),
      hours: String(selectedRowsData.reduce((sum, r) => sum + (Number(r.hours) || 0), 0)),
      cost: String(selectedRowsData.reduce((sum, r) => sum + (Number(r.cost) || 0), 0)),
      remarks: selectedRowsData
        .map((r) => r.remarks || "")
        .filter((val) => val.trim() !== "")
        .join("\n"),
    };

    const newRows = [];
    const firstSelectedIndex = selectedIndices[0];

    currentRows.forEach((row, index) => {
      if (index === firstSelectedIndex) {
        newRows.push(mergedRow);
      } else if (!selectedIndices.includes(index)) {
        newRows.push(row);
      }
    });

    replace(newRows);
    setSelectedRowIds(new Set());
    toast.success("Rows merged successfully!");
  };

  const handleMergeCells = () => {
    if (selectedCells.size <= 1) {
      toast.warning("Please select at least 2 cells to merge");
      return;
    }

    const currentRows = watch("rows") || [];
    const coords = Array.from(selectedCells).map((key) => {
      const [rStr, colName] = key.split("-");
      const r = parseInt(rStr, 10);
      const c = activeCols.indexOf(colName);
      return { r, c, colName };
    });

    const rowsIdx = coords.map((co) => co.r);
    const colsIdx = coords.map((co) => co.c);
    const minR = Math.min(...rowsIdx);
    const maxR = Math.max(...rowsIdx);
    const minC = Math.min(...colsIdx);
    const maxC = Math.max(...colsIdx);

    const expectedSize = (maxR - minR + 1) * (maxC - minC + 1);
    if (coords.length !== expectedSize) {
      toast.error("Please select a contiguous rectangular block of cells to merge");
      return;
    }

    const selectedCols = Array.from(new Set(coords.map((co) => co.colName)));
    const isNumericMerge = selectedCols.some((col) => ["QtyNo", "hours", "cost"].includes(col));

    const valuesToMerge = [];
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const fieldName = activeCols[c];
        const val = currentRows[r]?.[fieldName];
        if (val !== undefined && val !== null && val !== "" && val !== "_MERGED_LEFT_" && val !== "_MERGED_UP_") {
          valuesToMerge.push(val);
        }
      }
    }
    
    let combinedText;
    if (isNumericMerge) {
      const sum = valuesToMerge.reduce((acc, v) => acc + (Number(v) || 0), 0);
      combinedText = String(sum);
    } else {
      combinedText = valuesToMerge.filter((v) => String(v).trim() !== "").join("\n");
    }

    const updatedRows = JSON.parse(JSON.stringify(currentRows));
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const fieldName = activeCols[c];
        if (r === minR && c === minC) {
          updatedRows[r][fieldName] = combinedText;
        } else if (r === minR) {
          updatedRows[r][fieldName] = "_MERGED_LEFT_";
        } else {
          updatedRows[r][fieldName] = "_MERGED_UP_";
        }
      }
    }

    replace(updatedRows);
    setSelectedCells(new Set());
    setCellMergeMode(false);
    toast.success("Cells merged successfully!");
  };

  const handleUnmergeCells = () => {
    if (selectedCells.size === 0) {
      toast.warning("Please select cells to unmerge");
      return;
    }

    const currentRows = watch("rows") || [];
    const updatedRows = JSON.parse(JSON.stringify(currentRows));

    selectedCells.forEach((key) => {
      const [rStr, colName] = key.split("-");
      const r = parseInt(rStr, 10);
      const c = activeCols.indexOf(colName);

      const val = updatedRows[r]?.[colName];
      if (val === "_MERGED_LEFT_" || val === "_MERGED_UP_") {
        updatedRows[r][colName] = "";
      }

      let nextC = c + 1;
      while (nextC < activeCols.length) {
        const nextFieldName = activeCols[nextC];
        if (updatedRows[r]?.[nextFieldName] === "_MERGED_LEFT_") {
          updatedRows[r][nextFieldName] = "";
          nextC++;
        } else {
          break;
        }
      }

      let nextR = r + 1;
      while (nextR < updatedRows.length) {
        let allMergedUp = true;
        const width = nextC - c;
        for (let offset = 0; offset < width; offset++) {
          const fieldName = activeCols[c + offset];
          if (updatedRows[nextR]?.[fieldName] !== "_MERGED_UP_") {
            allMergedUp = false;
            break;
          }
        }
        if (allMergedUp) {
          for (let offset = 0; offset < width; offset++) {
            const fieldName = activeCols[c + offset];
            updatedRows[nextR][fieldName] = "";
          }
          nextR++;
        } else {
          break;
        }
      }
    });

    replace(updatedRows);
    setSelectedCells(new Set());
    setCellMergeMode(false);
    toast.success("Cells unmerged successfully!");
  };

  const onSubmit = async (data) => {
    console.log(data);
    try {
      const formatSaveValue = (val) => {
        if (val === undefined || val === null) return 0;
        const trimmed = String(val).trim();
        if (trimmed === "_MERGED_LEFT_") return -999999;
        if (trimmed === "_MERGED_UP_") return -999998;
        if (trimmed === "") return 0;
        const num = Number(trimmed);
        return isNaN(num) ? 0 : num;
      };

      // Explicitly convert numeric strings to Numbers for backend validation
      // But preserve merge tags and multiline merged values
      const formattedRows = data.rows.map((row) => ({
        ...row,
        QtyNo: formatSaveValue(row.QtyNo),
        hours: formatSaveValue(row.hours),
        cost: formatSaveValue(row.cost),
        remarks: row.remarks && row.remarks.trim().length >= 2 ? row.remarks : "— "
      }));

      await Service.addCOTable(formattedRows, coId);
      toast.success("Table saved successfully!");
      fetchTableRows();
      setSelectedRowIds(new Set());
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save table data");
    }
  };

  const rows = watch("rows") || [];
  const totalHours = rows.reduce((sum, r) => sum + sumCellValue(r.hours), 0);
  const totalCost = rows.reduce((sum, r) => sum + sumCellValue(r.cost), 0);

  // Compute cell spans dynamically
  const cellSpans = [];
  for (let r = 0; r < rows.length; r++) {
    const rowSpans = [];
    for (let c = 0; c < activeCols.length; c++) {
      rowSpans.push({ rowSpan: 1, colSpan: 1, isSpanned: false });
    }
    cellSpans.push(rowSpans);
  }

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < activeCols.length; c++) {
      if (cellSpans[r]?.[c]?.isSpanned) continue;

      let colSpan = 1;
      let nextCol = c + 1;
      while (nextCol < activeCols.length) {
        const fieldName = activeCols[nextCol];
        if (rows[r]?.[fieldName] === "_MERGED_LEFT_") {
          colSpan++;
          nextCol++;
        } else {
          break;
        }
      }

      let rowSpan = 1;
      let nextRow = r + 1;
      while (nextRow < rows.length) {
        let allMergedUp = true;
        for (let offset = 0; offset < colSpan; offset++) {
          const fieldName = activeCols[c + offset];
          if (rows[nextRow]?.[fieldName] !== "_MERGED_UP_") {
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

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse text-green-600">
        Loading Table Data...
      </div>
    );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      {cellMergeMode && (
        <div className="mb-4 bg-green-50 border border-green-200 p-3 rounded-lg flex items-center justify-between">
          <span className="text-xs text-green-800 font-medium">
            <strong>Cell Merge Mode Active:</strong> Click cells in the table to select them (must form a contiguous block), then choose an action. Selected: {selectedCells.size} cell(s)
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleMergeCells}
              disabled={selectedCells.size < 2}
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 h-auto rounded font-semibold"
            >
              Merge Selected Cells
            </Button>
            <Button
              type="button"
              onClick={handleUnmergeCells}
              disabled={selectedCells.size === 0}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1.5 h-auto rounded font-semibold"
            >
              Unmerge
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCellMergeMode(false);
                setSelectedCells(new Set());
              }}
              variant="outline"
              className="text-xs px-3 py-1.5 h-auto rounded border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    disabled={cellMergeMode}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRowIds(new Set(fields.map((f) => f.id)));
                      } else {
                        setSelectedRowIds(new Set());
                      }
                    }}
                    checked={fields.length > 0 && selectedRowIds.size === fields.length}
                  />
                </th>
                <th className="p-3 w-12">#</th>
                <th className="p-3 min-w-[200px]">Description</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Elements</th>
                <th className="p-3 w-20">Qty</th>
                <th className="p-3 w-24">Hours</th>
                {canSeeCost && <th className="p-3 w-28">Cost ($)</th>}
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      disabled={cellMergeMode}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      checked={selectedRowIds.has(field.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRowIds);
                        if (e.target.checked) {
                          newSelected.add(field.id);
                        } else {
                          newSelected.delete(field.id);
                        }
                        setSelectedRowIds(newSelected);
                      }}
                    />
                  </td>
                  <td className="p-3 text-gray-700">{index + 1}</td>
                  
                  {activeCols.map((colName, colIndex) => {
                    const spanInfo = cellSpans[index]?.[colIndex] || { rowSpan: 1, colSpan: 1, isSpanned: false };
                    if (spanInfo.isSpanned) return null;

                    const cellKey = `${index}-${colName}`;
                    const isSelected = selectedCells.has(cellKey);
                    const cellVal = rows[index]?.[colName];

                    return (
                      <td
                        key={colName}
                        colSpan={spanInfo.colSpan}
                        rowSpan={spanInfo.rowSpan}
                        className={`p-2 border border-gray-100 ${
                          cellMergeMode
                            ? isSelected
                              ? "bg-green-100 border-2 border-green-500 cursor-pointer"
                              : "hover:bg-green-50 cursor-pointer"
                            : ""
                        }`}
                        onClick={() => {
                          if (cellMergeMode) {
                            const newSelected = new Set(selectedCells);
                            if (newSelected.has(cellKey)) {
                              newSelected.delete(cellKey);
                            } else {
                              newSelected.add(cellKey);
                            }
                            setSelectedCells(newSelected);
                          }
                        }}
                      >
                        {cellMergeMode ? (
                          <div className="text-xs p-1.5 select-none min-h-[2rem] flex items-center">
                            {cellVal === "_MERGED_LEFT_" || cellVal === "_MERGED_UP_" ? (
                              ""
                            ) : (
                              cellVal || <span className="text-gray-300 italic">empty</span>
                            )}
                          </div>
                        ) : (
                          <Controller
                            name={`rows.${index}.${colName}`}
                            control={control}
                            render={({ field }) => {
                              if (["QtyNo", "hours", "cost"].includes(colName)) {
                                return (
                                  <input
                                    {...field}
                                    type="number"
                                    className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none h-8 text-xs"
                                  />
                                );
                              } else {
                                return (
                                  <textarea
                                    {...field}
                                    className="ref-table-textarea w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none text-xs resize-none overflow-hidden"
                                    placeholder={
                                      colName === "description"
                                        ? "Doc desc..."
                                        : colName === "referenceDoc"
                                        ? "Ref..."
                                        : colName === "elements"
                                        ? "Elements..."
                                        : "Remarks..."
                                    }
                                    rows={1}
                                    onInput={(e) => {
                                      e.target.style.height = "auto";
                                      e.target.style.height = e.target.scrollHeight + "px";
                                    }}
                                  />
                                );
                              }
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-green-50">
                <td colSpan={6} className="p-3 text-right text-green-900 font-bold">
                  Total
                </td>
                <td className="p-3 text-green-900 font-bold">{totalHours}</td>
                {canSeeCost && (
                  <td className="p-3 text-green-900 font-bold">
                    ${totalCost.toLocaleString()}
                  </td>
                )}
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-3 items-center">
          <Button
            type="button"
            disabled={cellMergeMode}
            onClick={() =>
              append({
                description: "",
                referenceDoc: "",
                elements: "",
                QtyNo: "0",
                hours: "0",
                cost: "0",
                remarks: "",
              })
            }
            className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 py-2 px-4 rounded text-xs font-semibold"
          >
            + Add Row
          </Button>
          <Button
            type="button"
            onClick={handleMergeSelected}
            disabled={selectedRowIds.size < 2 || cellMergeMode}
            className={`flex items-center gap-2 border uppercase tracking-widest text-xs font-semibold py-2 px-4 rounded transition-all ${
              selectedRowIds.size < 2 || cellMergeMode
                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200 shadow-sm"
            }`}
          >
            <Merge size={14} /> Merge Selected Rows ({selectedRowIds.size})
          </Button>
          <Button
            type="button"
            onClick={() => setCellMergeMode(true)}
            className={`flex items-center gap-2 border uppercase tracking-widest text-xs font-semibold py-2 px-4 rounded transition-all ${
              cellMergeMode
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
            }`}
          >
            <Merge size={14} /> Excel Merge Cells
          </Button>
          <Button
            type="submit"
            disabled={cellMergeMode}
            className="bg-green-600 hover:bg-green-700 text-white shadow-md ml-auto"
          >
            Finalize & Save Table
          </Button>
        </div>
      </form>
    </div>
  );

};

export default CoTable;
