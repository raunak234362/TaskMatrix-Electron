import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Input from "../fields/input";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import RichTextEditor from "../fields/RichTextEditor";
import Service from "../../api/Service";
import Modal from "../ui/Modal";
import SectionTitle from "../ui/SectionTitle";
import { Loader2, Save, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";

const UpdateCO = ({ coData, projectId, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingRows, setLoadingRows] = useState(true);
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
      await Service.EditCoById(coId, formData);
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
            <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100">
              <SectionTitle title="Reference Table" className="!mb-0" />
              <Button
                type="button"
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

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] text-slate-700 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-8 text-center"></th>
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
                  {fields.map((field, index) => (
                    <tr
                      key={field.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-1 text-center">
                        <div className="flex flex-col gap-0.5 items-center">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => move(index, index - 1)}
                            className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={index === fields.length - 1}
                            onClick={() => move(index, index + 1)}
                            className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-2 min-w-[250px]">
                        <textarea
                          {...register(`rows.${index}.description`)}
                          className="ref-table-textarea w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none text-xs resize-none overflow-hidden"
                          placeholder="Doc desc..."
                          rows={1}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          {...register(`rows.${index}.referenceDoc`)}
                          className="ref-table-textarea w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none text-xs resize-none overflow-hidden"
                          placeholder="Ref..."
                          rows={1}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          {...register(`rows.${index}.elements`)}
                          className="ref-table-textarea w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none text-xs resize-none overflow-hidden"
                          placeholder="Elements..."
                          rows={1}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          {...register(`rows.${index}.QtyNo`)}
                          type="number"
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          {...register(`rows.${index}.hours`)}
                          type="number"
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          {...register(`rows.${index}.cost`)}
                          type="number"
                          className="w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <textarea
                          {...register(`rows.${index}.remarks`)}
                          className="ref-table-textarea w-full p-1.5 border border-gray-200 rounded focus:ring-1 focus:ring-green-500 outline-none text-xs resize-none overflow-hidden"
                          placeholder="Remarks..."
                          rows={1}
                          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fields.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 italic bg-slate-50/30">
                        No rows added. Click "Add Row" to contribute to the table.
                      </td>
                    </tr>
                  )}
                </tbody>
                {fields.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold text-slate-700">
                      <td colSpan={5} className="p-3 text-right">Totals:</td>
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
