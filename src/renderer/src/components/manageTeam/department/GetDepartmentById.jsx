import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { AlertCircle, Loader2, Edit2, Archive, Zap } from "lucide-react";
import Button from "../../fields/Button";
import { formatDate } from "../../../utils/dateUtils";
import EditDepartment from "./EditDepartment";

const GetDepartmentById = ({ id }) => {
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDepartment = async () => {
    if (!id) {
      setError("Invalid department ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await Service.FetchDepartmentByID(id);
      setDepartment(response?.data || null);
    } catch (err) {
      const msg = "Failed to load department details";
      setError(msg);
      console.error("Error fetching department:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-black/60">
        <Loader2 className="w-6 h-6 animate-spin mr-3 text-[#6bbd45]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-black">
          Loading department details...
        </span>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600 bg-red-50/50 rounded-2xl border border-red-100 italic">
        <AlertCircle className="w-5 h-5 mr-3" />
        <span className="text-xs font-bold uppercase tracking-wide">
          {error || "Department not found"}
        </span>
      </div>
    );
  }

  const managers = department.managerIds || [];

  return (
    <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#6bbd45]/15 rounded-xl text-[#6bbd45]">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">
              {department.name}
            </h3>
            <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mt-1">
              DEPARTMENT INFORMATION SYSTEM
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {/* Basic Info */}
        <div className="space-y-6">
          <InfoRow label="Department Name" value={department.name} />
          <InfoRow label="Managers Count" value={Array.isArray(managers) ? managers.length : 0} />
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          <InfoRow label="Created At" value={formatDate(department?.createdAt)} />
          <InfoRow label="Last Updated" value={formatDate(department?.updatedAt)} />
        </div>

        {/* Managers List */}
        <div className="space-y-2 lg:col-span-1">
          <span className="text-black/40 font-black uppercase tracking-[0.15em] text-[10px]">
            Assigned Managers
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(managers) && managers?.length > 0 ? (
              managers.map((m, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-black font-bold text-[10px] uppercase tracking-tight"
                >
                  {`${m.firstName || ""} ${m.lastName || ""}`.trim() || "System User"}
                </div>
              ))
            ) : (
              <span className="text-black/30 font-bold text-xs italic">
                No Managers Assigned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-12 pt-8 border-t border-gray-100 justify-end">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-3 px-8 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm"
        >
          <Edit2 className="w-4 h-4 text-[#6bbd45]" />
          Edit Department
        </button>
        <button className="flex items-center gap-3 px-8 py-3 bg-red-50 border border-red-600 hover:bg-red-100 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm">
          <Archive className="w-4 h-4" />
          Archive Department
        </button>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditDepartment
          id={id}
          onCancel={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchDepartment();
          }}
        />
      )}
    </div>
  );
};

// Reusable info row
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-black/40 font-black uppercase tracking-[0.15em] text-[10px]">
      {label}
    </span>
    <span className="text-black font-black text-sm tracking-tight">{value}</span>
  </div>
);

export default GetDepartmentById;
