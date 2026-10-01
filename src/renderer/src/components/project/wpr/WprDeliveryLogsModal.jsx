import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  RefreshCw,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import Service from "../../../api/Service";
import { toast } from "react-toastify";

const WprDeliveryLogsModal = ({ isOpen, onClose, projectId, fabricatorId }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const fetchDeliveries = useCallback(async () => {
    if (!isOpen) return;
    try {
      setLoading(true);
      const params = {
        page,
        limit
      };
      if (projectId) params.projectId = projectId;
      if (fabricatorId) params.fabricatorId = fabricatorId;
      if (statusFilter) params.status = statusFilter;

      const res = await Service.GetDeliveryLogs(params);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      setDeliveries(list);

      if (res?.meta) {
        setMeta({
          total: res.meta.total || list.length,
          totalPages: res.meta.totalPages || Math.ceil((res.meta.total || list.length) / limit) || 1
        });
      } else {
        setMeta({
          total: list.length,
          totalPages: Math.ceil(list.length / limit) || 1
        });
      }
    } catch (err) {
      console.error("Failed to fetch WPR deliveries:", err);
      toast.error("Failed to load WPR email delivery logs");
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, page, limit, projectId, fabricatorId, statusFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchDeliveries();
    }
  }, [isOpen, fetchDeliveries]);

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    switch (s) {
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase rounded-none bg-emerald-50 text-emerald-700 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sent
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase rounded-none bg-amber-50 text-amber-700 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase rounded-none bg-red-50 text-red-700 border border-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Failed
          </span>
        );
      case "SKIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase rounded-none bg-slate-100 text-slate-700 border border-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
            Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase rounded-none bg-slate-50 text-slate-600 border border-slate-200">
            {s || "Unknown"}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border-2 border-black w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-[#6bbd45]" />
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-black" />
              <h2 className="text-base font-bold uppercase tracking-wider text-black">
                WPR Automated Email Delivery Logs
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDeliveries}
              disabled={loading}
              className="p-1.5 hover:bg-slate-200 transition-colors border border-black text-black disabled:opacity-50"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-50 hover:text-red-700 transition-colors border border-black text-black"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 bg-white border-b border-black/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold uppercase tracking-wider text-black mr-1">Status:</span>
            {["", "SENT", "PENDING", "FAILED", "SKIPPED"].map((st) => (
              <button
                key={st || "ALL"}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 font-bold uppercase tracking-wider border transition-all ${
                  statusFilter === st
                    ? "bg-black text-white border-black"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {st || "All"}
              </button>
            ))}
          </div>
          <span className="text-slate-500 font-medium">
            Total Records: <strong className="text-black">{meta.total}</strong>
          </span>
        </div>

        {/* Body Table */}
        <div className="flex-1 overflow-auto custom-scrollbar p-0 bg-white">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#6bbd45] animate-spin" />
              <p className="text-xs uppercase font-bold tracking-wider text-slate-600">
                Loading delivery logs...
              </p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <Mail className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm uppercase text-slate-700">No Delivery Logs Found</p>
              <p className="text-xs text-slate-500 mt-1">
                Automated WPR email delivery records will appear here once scheduled.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-black font-bold uppercase tracking-wider text-black">
                  <th className="p-3 border-r border-black/10 w-44">Date / Time</th>
                  <th className="p-3 border-r border-black/10 w-36">Week Ending</th>
                  <th className="p-3 border-r border-black/10">Recipients</th>
                  <th className="p-3 border-r border-black/10 w-32 text-center">Status</th>
                  <th className="p-3">Details / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 text-black">
                {deliveries.map((item, idx) => {
                  const dateStr = item.sentAt || item.createdAt || item.date || item.updatedAt;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "—";

                  const weekEnding = item.weekEnding
                    ? new Date(item.weekEnding).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : item.weekLabel || "—";

                  const recipients = Array.isArray(item.recipients)
                    ? item.recipients.join(", ")
                    : item.recipientEmail || item.recipient || item.email || "—";

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 border-r border-black/10 font-medium whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="p-3 border-r border-black/10 font-bold whitespace-nowrap">
                        {weekEnding}
                      </td>
                      <td className="p-3 border-r border-black/10 break-all">
                        {recipients}
                      </td>
                      <td className="p-3 border-r border-black/10 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.error || item.errorMessage || item.message || item.note || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        <div className="p-3 border-t border-black bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <span className="font-medium text-slate-600">
            Page {page} of {meta.totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-black bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-black bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold uppercase text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WprDeliveryLogsModal;
