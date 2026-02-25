import { useEffect, useState, useMemo } from "react";
import Button from "../../fields/Button";
import { X, Users, Plus, UserPlus, Info } from "lucide-react";
import DataTable from "../../ui/table";
import GetEmployeeByID from "../../manageTeam/employee/GetEmployeeByID";
import AddCDEngineer from "./AddCDEngineer";

const AllCDEngineer = ({ onClose, designerData }) => {
  const [addEngineerModal, setAddEngineerModal] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (Array.isArray(designerData?.CDEngineers)) {
      setEngineers(designerData.CDEngineers);
    }
    setIsLoading(false);
  }, [designerData]);

  const columns = useMemo(() => [
    {
      accessorFn: (r) => [r.firstName, r.lastName].filter(Boolean).join(" "),
      header: "Engineer Name",
      id: "fullName",
    },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "designation", header: "Designation" },
  ], []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/20">

        {/* Header Section */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Workforce Intelligence</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                MANAGE ENGINEERING TEAM FOR {designerData.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar min-h-[400px]">
          {/* Stat Bar from Image 3 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 pb-10 border-b border-gray-50">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-black shadow-sm">
                D
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Total Active</p>
                <p className="text-lg font-black text-gray-700">Skilled Engineers</p>
              </div>
            </div>

            <button
              onClick={() => setAddEngineerModal(true)}
              className="px-8 py-3.5 bg-green-200 hover:bg-green-300 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-100 transition-all flex items-center gap-3 active:scale-95"
            >
              <Plus size={16} strokeWidth={3} /> Add New Engineer
            </button>
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent mb-4"></div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Compiling Roster...</p>
            </div>
          ) : engineers.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <DataTable
                columns={columns}
                data={engineers}
                onRowClick={(row) => console.log(row)}
                detailComponent={({ row }) => <GetEmployeeByID id={row.id} />}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-8 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                <Users size={32} className="text-gray-200" />
              </div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-4">No Engineers found in this network</h3>
              <button
                onClick={() => setAddEngineerModal(true)}
                className="px-8 py-3 bg-white border border-gray-200 hover:border-green-500 rounded-xl text-[10px] font-black text-gray-400 hover:text-green-600 uppercase tracking-[0.2em] shadow-sm transition-all"
              >
                Onboard First Engineer
              </button>
            </div>
          )}
        </div>

        {addEngineerModal && (
          <AddCDEngineer designer={designerData} onClose={() => setAddEngineerModal(false)} />
        )}
      </div>
    </div>
  );
};

export default AllCDEngineer;
