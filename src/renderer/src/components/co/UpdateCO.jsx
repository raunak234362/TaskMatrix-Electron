import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import Input from "../fields/input";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import RichTextEditor from "../fields/RichTextEditor";
import Service from "../../api/Service";
import Modal from "../ui/Modal";
import SectionTitle from "../ui/SectionTitle";
import { Loader2, Save, Plus, Trash2, ChevronUp, ChevronDown, Merge } from "lucide-react";

const EDITABLE_COLS = ["description", "referenceDoc", "elements", "QtyNo", "hours", "cost", "remarks"];

const UpdateCO = ({ coData, projectId, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRows, setLoadingRows] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [cellMergeMode, setCellMergeMode] = useState(false);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [description, setDescription] = useState(coData?.description || "");
  const [files, setFiles] = useState([]);

  const { register, handleSubmit, control, reset, watch } = useForm({
    defaultValues: {
      changeOrderNumber: coData?.changeOrderNumber || "",
      remarks: coData?.remarks || "",
      reason: coData?.reason || "",
      link: coData?.link || "",
      isAproovedByAdmin: coData?.isAproovedByAdmin ?? "PENDING",
      rows: [
        {
          description: "",
          referenceDoc: "",
          elements: "",
          QtyNo: 0,
          hours: 0,
          cost: 0,
          remarks: "",
        },
      ],
    },
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control,
    name: "rows",
  });


  const watchedRows = watch("rows") || [];
  const totalHours = watchedRows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
  const totalCost = watchedRows.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  useEffect(() => {
    const fetchTableRows = async () => {
      const coId = coData.id || coData._id;
      if (!coId) return;
      try {
        setLoadingRows(true);
        const response = await Service.GetAllCOTableRows(coId);
        const rows = response?.data || [];
        if (rows.length > 0) {
          replace(
            rows.map((r) => ({
              description: r.description || "",
              referenceDoc: r.referenceDoc || "",
              elements: r.elements || "",
              QtyNo: r.QtyNo || 0,
              hours: r.hours || 0,
              cost: r.cost || 0,
              remarks: r.remarks || "",
            }))
          );
        }
        setSelectedRowIds(new Set());
      } catch (err) {
        console.error("Fetch table rows error:", err);
      } finally {
        setLoadingRows(false);
      }
    };

    if (coData) {
      reset({
        changeOrderNumber: coData.changeOrderNumber,
        remarks: coData.remarks,
        reason: coData.reason,
        link: coData.link,
        isAproovedByAdmin: coData.isAproovedByAdmin === true ? "APPROVED" : coData.isAproovedByAdmin === false ? "REJECTED" : "PENDING",
        rows: [],
      });
      setDescription(coData.description || "");
      fetchTableRows();
    }
  }, [coData, reset, replace]);

  // Auto-resize all table textareas whenever rows load or change
  useEffect(() => {
    if (loadingRows) return;
    const textareas = document.querySelectorAll('.ref-table-textarea');
    textareas.forEach((ta) => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, [fields, loadingRows]);

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
      QtyNo: selectedRowsData.reduce((sum, r) => sum + (Number(r.QtyNo) || 0), 0),
      hours: selectedRowsData.reduce((sum, r) => sum + (Number(r.hours) || 0), 0),
      cost: selectedRowsData.reduce((sum, r) => sum + (Number(r.cost) || 0), 0),
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
      const c = EDITABLE_COLS.indexOf(colName);
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

    const valuesToMerge = [];
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const fieldName = EDITABLE_COLS[c];
        const val = currentRows[r]?.[fieldName];
        if (val && val !== "_MERGED_LEFT_" && val !== "_MERGED_UP_") {
          valuesToMerge.push(val);
        }
      }
    }
    const combinedText = valuesToMerge.filter((v) => String(v).trim() !== "").join("\n");

    const updatedRows = JSON.parse(JSON.stringify(currentRows));
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const fieldName = EDITABLE_COLS[c];
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
      const c = EDITABLE_COLS.indexOf(colName);

      const val = updatedRows[r]?.[colName];
      if (val === "_MERGED_LEFT_" || val === "_MERGED_UP_") {
        updatedRows[r][colName] = "";
      }

      let nextC = c + 1;
      while (nextC < EDITABLE_COLS.length) {
        const nextFieldName = EDITABLE_COLS[nextC];
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
          const fieldName = EDITABLE_COLS[c + offset];
          if (updatedRows[nextR]?.[fieldName] !== "_MERGED_UP_") {
            allMergedUp = false;
            break;
          }
        }
        if (allMergedUp) {
          for (let offset = 0; offset < width; offset++) {
            const fieldName = EDITABLE_COLS[c + offset];
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
    try {
      setIsSubmitting(true);
      const coId = coData.id || coData._id;

      // 1. Prepare CO Details Data
      const formData = new FormData();
      formData.append("project", projectId || coData.project?._id || coData.project?.id || "");
      formData.append("changeOrderNumber", data.changeOrderNumber);
      formData.append("remarks", data.remarks);
      formData.append("reason", data.reason || "");
      formData.append("link", data.link || "");
      formData.append("description", description);

      const status = data.isAproovedByAdmin === "APPROVED" ? true : data.isAproovedByAdmin === "REJECTED" ? false : "PENDING";
      formData.append("isAproovedByAdmin", status);

      files.forEach((file) => formData.append("files", file));

      // 2. Prepare Table Rows Data
      const formattedRows = data.rows.map((row) => ({
        ...row,
        QtyNo: Number(row.QtyNo) || 0,
        hours: Number(row.hours) || 0,
        cost: Number(row.cost) || 0,
        remarks: row.remarks && row.remarks.trim().length >= 1 ? row.remarks : "—"
      }));

      // 3. Sequential Updates
      let fabricatorName = "";
      let projectName = "";
      const pid = projectId || coData.project?._id || coData.project?.id;
      if (pid) {
        const projectRes = await Service.GetProjectById(pid);
        const project = projectRes?.data || projectRes;
        fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
        projectName = project?.projectName || project?.name || "";
      }

      await Service.EditCoById(coId, formData, fabricatorName, projectName);
      await Service.UpdateCOTableById(coId, formattedRows);

      toast.success("Change Order and Table updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update Change Order or Table");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit Change Order - ${coData.changeOrderNumber}`}>
      <div className="p-6 overflow-y-auto max-h-[85vh]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Basic Details */}
          <section className="space-y-4">
            <SectionTitle title="Basic Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="CO Number *"
                {...register("changeOrderNumber", { required: true })}
              />
              <Input
                label="Subject *"
                {...register("remarks", { required: true })}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  {...register("isAproovedByAdmin")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Detailed description..."
              />
            </div>
          </section>

          {/* Section 2: Reference Table */}
          <section className="space-y-4">
            {cellMergeMode && (
              <div className="mb-2 bg-green-50 border border-green-200 p-3 rounded-lg flex items-center justify-between">
                <span className="text-xs text-green-800 font-medium">
                  <strong>Cell Merge Mode Active:</strong> Click cells in the table to select them (must form a contiguous block), then choose an action. Selected: {selectedCells.size} cell(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleMergeCells}
                    disabled={selectedCells.size < 2}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-auto rounded font-semibold"
                  >
                    Merge Selected Cells
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUnmergeCells}
                    disabled={selectedCells.size === 0}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 h-auto rounded font-semibold"
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
                    className="text-xs px-3 py-1 h-auto rounded border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
              <SectionTitle title="Reference Table" className="!mb-0" />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => setCellMergeMode(true)}
                  className={`flex items-center gap-2 py-1 h-auto text-xs ${
                    cellMergeMode
                      ? "bg-green-600 text-white border-green-600 font-bold"
                      : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                  }`}
                >
                  <Merge size={14} /> Excel Merge Cells
                </Button>
                <Button
                  type="button"
                  onClick={handleMergeSelected}
                  disabled={selectedRowIds.size < 2 || cellMergeMode}
                  className={`flex items-center gap-2 py-1 h-auto text-xs ${
                    selectedRowIds.size < 2 || cellMergeMode
                      ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                      : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                  }`}
                >
                  <Merge size={14} /> Merge Selected Rows ({selectedRowIds.size})
                </Button>
                <Button
                  type="button"
                  disabled={cellMergeMode}
                  onClick={() =>
                    append({
                      description: "",
                      referenceDoc: "",
                      elements: "",
                      QtyNo: 0,
                      hours: 0,
                      cost: 0,
                      remarks: "",
                    })
                  }
                  className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 flex items-center gap-2 py-1 h-auto text-xs"
                >
                  <Plus size={14} /> Add Row
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] text-slate-700 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-8 text-center"></th>
                    <th className="p-3 w-8 text-center">
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
                    <th className="p-3 min-w-[200px]">Description</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Elements</th>
                    <th className="p-3 w-20">Qty</th>
                    <th className="p-3 w-24">Hours</th>
                    <th className="p-3 w-28">Cost ($)</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fields.map((field, index) => {
                    // Compute spans dynamically for this row context
                    const rowSpans = [];
                    for (let c = 0; c < EDITABLE_COLS.length; c++) {
                      rowSpans.push({ rowSpan: 1, colSpan: 1, isSpanned: false });
                    }

                    // Simple wrapper matching main spans algorithm
                    for (let c = 0; c < EDITABLE_COLS.length; c++) {
                      const watchedRows = watch("rows") || [];
                      // Check horizontal spans
                      let colSpan = 1;
                      let nextCol = c + 1;
                      while (nextCol < EDITABLE_COLS.length) {
                        const fieldName = EDITABLE_COLS[nextCol];
                        if (watchedRows[index]?.[fieldName] === "_MERGED_LEFT_") {
                          colSpan++;
                          nextCol++;
                        } else {
                          break;
                        }
                      }

                      // Check vertical spans
                      let rowSpan = 1;
                      let nextRow = index + 1;
                      while (nextRow < watchedRows.length) {
                        let allMergedUp = true;
                        for (let offset = 0; offset < colSpan; offset++) {
                          const fieldName = EDITABLE_COLS[c + offset];
                          if (watchedRows[nextRow]?.[fieldName] !== "_MERGED_UP_") {
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

                      // We check if this cell is spanned by scanning backwards/upwards
                      let isSpanned = false;
                      // Check if merged from left
                      let checkC = c - 1;
                      while (checkC >= 0) {
                        if (watchedRows[index]?.[EDITABLE_COLS[checkC]] !== "_MERGED_LEFT_" && watchedRows[index]?.[EDITABLE_COLS[checkC]] !== "_MERGED_UP_") {
                          // Found potential origin
                          let spansCols = 0;
                          let scanC = checkC + 1;
                          while (scanC < EDITABLE_COLS.length && watchedRows[index]?.[EDITABLE_COLS[scanC]] === "_MERGED_LEFT_") {
                            spansCols++;
                            scanC++;
                          }
                          if (c <= checkC + spansCols) {
                            isSpanned = true;
                          }
                          break;
                        }
                        checkC--;
                      }

                      // Check if merged from up
                      let checkR = index - 1;
                      while (checkR >= 0 && !isSpanned) {
                        if (watchedRows[checkR]?.[EDITABLE_COLS[c]] !== "_MERGED_UP_" && watchedRows[checkR]?.[EDITABLE_COLS[c]] !== "_MERGED_LEFT_") {
                          // Origin cell check
                          let spansCols = 1;
                          let scanC = c + 1;
                          while (scanC < EDITABLE_COLS.length && watchedRows[checkR]?.[EDITABLE_COLS[scanC]] === "_MERGED_LEFT_") {
                            spansCols++;
                            scanC++;
                          }
                          
                          // Check if all columns in that span are merged up in subsequent rows down to this row
                          let spansRows = 0;
                          let scanR = checkR + 1;
                          while (scanR < watchedRows.length) {
                            let allMerged = true;
                            for (let offset = 0; offset < spansCols; offset++) {
                              if (watchedRows[scanR]?.[EDITABLE_COLS[c + offset]] !== "_MERGED_UP_") {
                                allMerged = false;
                                break;
                              }
                            }
                            if (allMerged) {
                              spansRows++;
                              scanR++;
                            } else {
                              break;
                            }
                          }
                          if (index <= checkR + spansRows) {
                            isSpanned = true;
                          }
                          break;
                        }
                        checkR--;
                      }

                      rowSpans[c] = { rowSpan, colSpan, isSpanned };
                    }

                    return (
                      <tr
                        key={field.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="p-1 text-center">
                          <div className="flex flex-col gap-0.5 items-center">
                            <button
                              type="button"
                              disabled={index === 0 || cellMergeMode}
                              onClick={() => move(index, index - 1)}
                              className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              disabled={index === fields.length - 1 || cellMergeMode}
                              onClick={() => move(index, index + 1)}
                              className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="p-1 text-center">
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

                        {EDITABLE_COLS.map((colName, colIndex) => {
                          const spanInfo = rowSpans[colIndex] || { rowSpan: 1, colSpan: 1, isSpanned: false };
                          if (spanInfo.isSpanned) return null;

                          const cellKey = `${index}-${colName}`;
                          const isSelected = selectedCells.has(cellKey);
                          const watchedRows = watch("rows") || [];
                          const cellVal = watchedRows[index]?.[colName];

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
                              ) : ["QtyNo", "hours", "cost"].includes(colName) ? (
                                <input
                                  {...register(`rows.${index}.${colName}`)}
                                  type="number"
                                  className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none h-8 text-xs"
                                />
                              ) : (
                                <textarea
                                  {...register(`rows.${index}.${colName}`)}
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
                              )}
                            </td>
                          );
                        })}

                        <td className="p-2 text-center">
                          <button
                            type="button"
                            disabled={cellMergeMode}
                            onClick={() => remove(index)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {fields.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400 italic bg-slate-50/30">
                        No rows added. Click &quot;Add Row&quot; to contribute to the table.
                      </td>
                    </tr>
                  )}
                </tbody>
                {fields.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-700">
                      <td colSpan={6} className="p-3 text-right">Totals:</td>
                      <td className="p-3 text-blue-600 font-black">{totalHours} hr</td>
                      <td className="p-3 text-green-600 font-black">${totalCost.toLocaleString()}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          {/* Section 3: Files */}
          <section className="space-y-4">
            <SectionTitle title="Add Files (Optional)" />
            <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
          </section>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 bg-white sticky bottom-0 z-10 -m-6 p-6 mt-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 border-gray-200 text-gray-600 hover:bg-gray-50 uppercase tracking-widest text-sm font-semibold"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-8 uppercase tracking-widest text-sm font-semibold shadow-lg shadow-green-200 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Update change order & table
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UpdateCO;
