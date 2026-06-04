import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { AlertCircle, Loader2, Edit2, Archive, Zap } from "lucide-react";
import Button from "../../fields/Button";
import { formatDate } from "../../../utils/dateUtils";
import EditDepartment from "./EditDepartment";

const GetDepartmentById = ({ id, onClose }) => {
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
      <div className="flex items-center justify-center p-12 text-black bg-white rounded-none border border-black shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-black" />
        <span className="text-sm font-semibold uppercase tracking-normal text-black">
          Loading department details...
        </span>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex items-center justify-center p-12 text-red-600 bg-white rounded-none border border-black shadow-xl">
        <AlertCircle className="w-8 h-8 mr-3" />
        <span className="text-sm font-semibold uppercase tracking-normal">
          {error || "Department not found"}
        </span>
      </div>
    );
  }

  const managers = department.managerIds || [];

  return (
    <div className="bg-white rounded-none shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-4xl mx-auto flex flex-col max-h-[90vh]">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-black/10 bg-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-none border border-black/10 text-black">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-black tracking-normal uppercase">
              {department.name}
            </h2>
           
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-semibold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
        >
          Close
        </button>
      </header>

      <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
        <div className="mb-8 p-6 bg-gray-50 rounded-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <span className="text-black font-semibold uppercase tracking-normal text-xs">
                Assigned Managers
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(managers) && managers?.length > 0 ? (
                  managers.map((m, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 bg-white border border-black/10 rounded-none text-black font-semibold text-xs uppercase tracking-normal shadow-sm"
                    >
                      {`${m.firstName || ""} ${m.lastName || ""}`.trim() || "System User"}
                    </div>
                  ))
                ) : (
                  <span className="text-black/60 font-semibold text-xs italic">
                    No Managers Assigned
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Action Buttons */}
      <footer className="p-6 border-t border-black/10 bg-white flex flex-wrap justify-end gap-3 shrink-0">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-semibold text-xs uppercase tracking-normal shadow-sm cursor-pointer"
        >
          <Edit2 className="w-4 h-4 text-black" />
          Edit Department
        </button>
        <button
          className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-semibold text-xs uppercase tracking-normal shadow-sm cursor-pointer"
        >
          <Archive className="w-4 h-4 text-black" />
          Archive Department
        </button>
      </footer>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <EditDepartment
            id={id}
            onCancel={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setIsEditModalOpen(false);
              fetchDepartment();
            }}
          />
        </div>
      )}
    </div>
  );
};

// Reusable info row
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-black font-semibold uppercase tracking-normal text-xs">
      {label}
    </span>
    <span className="text-black font-semibold text-base tracking-normal">{value}</span>
  </div>
);

export default GetDepartmentById;
