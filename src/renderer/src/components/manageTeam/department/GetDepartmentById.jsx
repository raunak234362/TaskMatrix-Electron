import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { AlertCircle, Loader2 } from "lucide-react";
import Button from "../../fields/Button";
import { formatDate } from "../../../utils/dateUtils";

const GetDepartmentById = ({ id }) => {
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        console.log(response);
        setDepartment(response?.data || null);
      } catch (err) {
        const msg = "Failed to load department details";
        setError(msg);
        console.error("Error fetching department:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading department details...
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Department not found"}
      </div>
    );
  }

  const managers = department.managerIds || [];

  return (
    <div className="bg-gray-50/50 p-10 rounded-3xl border border-black/5 shadow-inner">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-black/5 pb-4">
        <h3 className="text-2xl font-black text-black uppercase tracking-tight">{department.name}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-sm">
        {/* Left Column */}
        <div className="space-y-4">
          <InfoRow label="Department Name" value={department.name} />
          <InfoRow label="Created" value={formatDate(department?.createdAt)} />
          <InfoRow label="Updated" value={formatDate(department?.updatedAt)} />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center py-1">
            <span className="text-black/40 font-black uppercase tracking-[0.15em] text-[10px]">Managers</span>
            <div className="text-black font-black text-sm tracking-tight text-right max-w-[200px]">
              {Array.isArray(managers) && managers?.length > 0
                ? managers
                  .map((m) =>
                    `${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""}`
                      .replace(/\s+/g, " ")
                      .trim(),
                  )
                  .join(", ")
                : "No Managers Assigned"}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-black/5">
        <Button className="flex items-center gap-2 px-8 py-3 bg-white border border-black/10 rounded-2xl text-black font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
          Edit Department
        </Button>
        <Button className="flex items-center gap-2 px-8 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm">
          Archive Department
        </Button>
      </div>
    </div>
  );
};

// Reusable info row
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-black/40 font-black uppercase tracking-[0.15em] text-[10px]">{label}</span>
    <span className="text-black font-black text-sm tracking-tight">{value}</span>
  </div>
);

export default GetDepartmentById;
