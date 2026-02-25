/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import Button from "../../fields/Button";
import { X, Users, UserPlus, Building2 } from "lucide-react";
import AddClients from "./AddClient";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import DataTable from "../../ui/table";
import GetEmployeeByID from "../../manageTeam/employee/GetEmployeeByID";

const AllClients = ({ fabricator, onClose }) => {
  const [addClientModal, setAddClientModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllClientsByFabricatorID = async (fabId) => {
    if (!fabId) return;
    setIsLoading(true);
    try {
      const response = await Service.FetchAllClientsByFabricatorID(fabId);
      const rawClients = Array.isArray(response.data) ? response.data : [];
      const mappedClients = rawClients.map((c) => ({
        id: c.id ?? "",
        username: c.username ?? "",
        email: c.email ?? "",
        firstName: c.firstName ?? "",
        middleName: c.middleName ?? null,
        lastName: c.lastName ?? "",
        phone: c.phone ?? "",
        designation: c.designation ?? "",
        city: c.city ?? "",
        zipCode: c.zipCode ?? "",
        state: c.state ?? "",
        country: c.country ?? "",
        address: c.address ?? "",
        branchId: c.branchId,
        extension: c.extensionNumber ?? c.extension ?? "",
        createdAt: c.createdAt ?? "",
        updatedAt: c.updatedAt ?? "",
      }));
      setClients(mappedClients);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch clients");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllClientsByFabricatorID(fabricator.id);
  }, [fabricator.id]);

  const openAddClient = () => setAddClientModal(true);
  const closeAddClient = () => {
    setAddClientModal(false);
    fetchAllClientsByFabricatorID(fabricator.id);
  };

  const columns = useMemo(
    () => [
      {
        accessorFn: (r) => [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
        header: "NAME",
        id: "fullName",
      },
      { accessorKey: "email", header: "EMAIL" },
      {
        accessorKey: "phone",
        header: "PHONE",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{row.original.phone}</span>
            {row.original.extension && (
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                EXT: {row.original.extension}
              </span>
            )}
          </div>
        ),
      },
      { accessorKey: "designation", header: "DESIGNATION" },
      {
        accessorFn: (r) => {
          const parts = [];
          if (r.city) parts.push(r.city);
          if (r.state) parts.push(r.state);
          if (r.country) parts.push(r.country);
          return parts.join(", ") || "—";
        },
        header: "LOCATION",
        id: "location",
      },
    ],
    []
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">

        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
              <Users size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Fabricator POCs</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={12} />
                  {fabricator.fabName}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {clients.length} CONNECTED ENTITIES
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAddClient}
              className="px-6 py-2.5 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <UserPlus size={16} />
              Add POC
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all active:scale-95 border border-gray-100"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-8 bg-gray-50/30">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="flex-1 overflow-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6bbd45] mb-4"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronizing POC Data...</p>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={clients}
                  onRowClick={(row) => console.log("Client clicked:", row.id)}
                  detailComponent={({ row }) => <GetEmployeeByID id={row.id} />}
                />
              )}
            </div>
          </div>
        </div>

        {/* Add Client Modal */}
        {addClientModal && (
          <AddClients fabricator={fabricator} onClose={closeAddClient} />
        )}
      </div>
    </div>
  );
};

export default AllClients;
