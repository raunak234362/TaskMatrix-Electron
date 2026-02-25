import { useEffect, useState, useMemo } from "react";
import { X, Plus, Users2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import DataTable from "../../ui/table";
import GetEmployeeByID from "../../manageTeam/employee/GetEmployeeByID";
import AddCDEngineer from "./AddCDEngineer";


const AllCDEngineer = ({ onClose, designerData }) => {
  const [addEngineerModal, setAddEngineerModal] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load engineers directly from designerData ──
  useEffect(() => {
    setIsLoading(true);
    try {
      if (Array.isArray(designerData?.CDEngineers)) {
        const mappedEngineers = designerData.CDEngineers.map(
          (e) => ({
            id: e.id ?? "",
            username: e.username ?? "",
            email: e.email ?? "",
            departmentId: e.departmentId ?? "",
            isFirstLogin: e.isFirstLogin ?? false,
            firstName: e.firstName ?? "",
            middleName: e.middleName ?? "",
            lastName: e.lastName ?? "",
            phone: e.phone ?? "",
            landline: e.landline ?? "",
            altLandline: e.altLandline ?? "",
            altPhone: e.altPhone ?? "",
            zipCode: e.zipCode ?? "",
            designation: e.designation ?? "",
            city: e.city ?? "",
            state: e.state ?? "",
            country: e.country ?? "",
            address: e.address ?? "",
            role: e.role ?? "ENGINEER",
            isActive: e.isActive ?? true,
            extension: e.extensionNumber ?? e.extensionIndex ?? "",
            createdAt: e.createdAt ?? "",
            updatedAt: e.updatedAt ?? "",
          })
        );

        setEngineers(mappedEngineers);
      } else {
        setEngineers([]);
      }
    } catch (error) {
      console.error("Error mapping CDEngineers:", error);
      setEngineers([]);
    } finally {
      setIsLoading(false);
    }
  }, [designerData]);

  // ── Table Columns ──
  const columns = useMemo(
    () => [
      {
        accessorFn: (r) =>
          [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
        header: "Engineer Name",
        id: "fullName",
      },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span>
            {row.original.phone}
            {row.original.extension && (
              <span className="text-gray-400 text-xs ml-1">
                (Ext: {row.original.extension})
              </span>
            )}
          </span>
        ),
      },
      { accessorKey: "designation", header: "Designation" },
      {
        accessorFn: (r) => {
          const parts = [];
          if (r.city) parts.push(r.city);
          if (r.state) parts.push(r.state);
          return parts.join(", ");
        },
        header: "Location",
        id: "fullAddress",
      },
    ],
    []
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20"
      >
        {/* Header Section */}
        <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-50 gap-6">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight mb-1">
              Workforce Intelligence
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              MANAGE ENGINEERING TEAM FOR {designerData.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all group shrink-0"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-black" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="px-8 sm:px-10 py-6 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg border border-blue-100 shadow-sm">
              {engineers.length}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">TOTAL ACTIVE</span>
              <span className="text-sm font-black text-black leading-none">Skilled Engineers</span>
            </div>
          </div>
          <button
            onClick={() => setAddEngineerModal(true)}
            className="flex items-center gap-3 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 group"
          >
            <Plus size={18} strokeWidth={3} />
            <span className="text-xs font-black uppercase tracking-widest">Add New Engineer</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 sm:p-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-green-500" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analyzing Human Capital...</p>
            </div>
          ) : engineers.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
              <DataTable
                columns={columns}
                data={engineers}
                onRowClick={(row) => console.log("Engineer clicked:", row.id)}
                detailComponent={({ row }) => <GetEmployeeByID id={row.id} />}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/50">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg mb-6">
                <Users2 size={32} className="text-gray-100" />
              </div>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">No engineers found in this network</p>
              <button
                onClick={() => setAddEngineerModal(true)}
                className="px-8 py-3 bg-white border-2 border-green-500 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all shadow-sm"
              >
                Onboard First Engineer
              </button>
            </div>
          )}
        </div>

        {addEngineerModal && (
          <AddCDEngineer designer={designerData} onClose={() => setAddEngineerModal(false)} />
        )}
      </motion.div>
    </div>
  );
};

export default AllCDEngineer;
