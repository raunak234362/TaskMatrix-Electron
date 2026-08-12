/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, MapPin, Plus, Building2, CheckCircle2, Trash2, Loader2, AlertCircle, Eye } from "lucide-react";
import AddBranch from "./AddBranch";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Service from "../../../api/Service";
import { useDispatch } from "react-redux";
import { deleteBranchFromFabricator } from "../../../store/fabricatorSlice";
import { toast } from "react-toastify";
import DataTable from "../../ui/table";

const GetBranchByIDModal = ({ branchId, onClose }) => {
  const [branchDetail, setBranchDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await Service.GetFabricatorBranchByID(branchId);
        const detail = response?.data || response;
        setBranchDetail(detail);
      } catch (err) {
        console.error("Error fetching branch details:", err);
        setError("Failed to load branch details");
      } finally {
        setLoading(false);
      }
    };
    if (branchId) {
      fetchDetail();
    }
  }, [branchId]);

  return createPortal(
    <div className="fixed inset-0 z-[10200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-150">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-sm font-bold text-black uppercase">Branch Details</h2>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </div>
        <div className="p-6 bg-white space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-black">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-green-600" />
              Loading branch details...
            </div>
          ) : error || !branchDetail ? (
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
              {error || "Branch details not found"}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-xs font-bold text-black uppercase">Branch Name</p>
                <p className="text-sm font-semibold text-black mt-0.5">{branchDetail.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase">Secure Email</p>
                <p className="text-sm font-semibold text-black mt-0.5">{branchDetail.email || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-black uppercase">Phone</p>
                  <p className="text-sm font-semibold text-black mt-0.5">{branchDetail.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-black uppercase">Extension</p>
                  <p className="text-sm font-semibold text-black mt-0.5">{branchDetail.extension || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase">Geographic Address</p>
                <p className="text-sm font-semibold text-black mt-0.5 leading-relaxed">
                  {branchDetail.address || ""}, {branchDetail.city || ""}, {branchDetail.state || ""} {branchDetail.zipCode || ""}, {branchDetail.country || ""}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase">Type</p>
                <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border mt-1.5 ${
                  branchDetail.isHeadquarters
                    ? "bg-green-50 text-[#6bbd45] border-green-200"
                    : "bg-white text-black border-gray-200"
                }`}>
                  {branchDetail.isHeadquarters ? "Headquarters" : "Branch Hangar"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const AllBranches = ({ fabricator, onClose, onBranchChange }) => {
  const dispatch = useDispatch();
  const [addBranchModal, setAddBranchModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const fabricatorId = fabricator.id || fabricator._id;

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Service.GetFabricatorBranchesByFabricatorID(fabricatorId);
      let list = [];
      if (response) {
        if (Array.isArray(response)) {
          list = response;
        } else if (response.data) {
          if (Array.isArray(response.data)) {
            list = response.data;
          } else if (response.data.branches && Array.isArray(response.data.branches)) {
            list = response.data.branches;
          } else if (Array.isArray(response.data.data)) {
            list = response.data.data;
          }
        }
      }
      setBranches(list);
    } catch (err) {
      console.error("Error fetching branches:", err);
      setError("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fabricatorId) {
      fetchBranches();
    }
  }, [fabricatorId]);

  const handleOpenAddBranch = () => setAddBranchModal(true);
  const handleCloseAddBranch = () => setAddBranchModal(false);

  const handleDeleteBranch = async (branchId) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;

    try {
      await Service.DeleteBranchByBranchID(branchId);
      const fabId = fabricatorId;
      dispatch(deleteBranchFromFabricator({ fabricatorId: fabId, branchId }));
      toast.success("Branch deleted successfully");
      fetchBranches();
      onBranchChange?.();
    } catch (err) {
      console.error("Failed to delete branch:", err);
      toast.error(err?.response?.data?.message || "Failed to delete branch");
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "IDENTIFIER / NAME",
        cell: ({ row }) => (
          <span
            className="text-sm font-bold text-black hover:text-[#6bbd45] transition-colors cursor-pointer"
            onClick={() => setSelectedBranchId(row.original.id || row.original._id)}
          >
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "SECURE EMAIL",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-black">
            {row.original.email || "—"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "CONTACT PHONE",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-black">{row.original.phone || "—"}</span>
            {row.original.extension && (
              <span className="text-[10px] font-black text-black uppercase tracking-widest mt-0.5">
                EXT: {row.original.extension}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorFn: (r) => {
          const parts = [r.address, r.city, r.state, r.zipCode, r.country].filter(Boolean);
          return parts.join(", ") || "—";
        },
        header: "GEOGRAPHIC ADDRESS",
        id: "address",
        cell: ({ row }) => {
          const r = row.original;
          const parts = [r.address, r.city, r.state, r.zipCode, r.country].filter(Boolean);
          return (
            <span className="text-xs text-black font-medium leading-relaxed block max-w-xs">
              {parts.join(", ") || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "isHeadquarters",
        header: "TYPE",
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.isHeadquarters ? (
              <span className="px-3 py-1 bg-green-100 text-[#6bbd45] text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 size={12} /> HQ
              </span>
            ) : (
              <span className="px-3 py-1 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full border border-gray-100">
                BRANCH
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "ACTIONS",
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setSelectedBranchId(row.original.id || row.original._id)}
              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
              title="View Branch details"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => handleDeleteBranch(row.original.id || row.original._id)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
              title="Delete Branch"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return createPortal(
    <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">

        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white">
          <div className="flex items-center gap-5">
            
            <div>
              <h2 className="text-2xl font-black text-black tracking-tight uppercase">Fabricator Branches</h2>
              <div className="flex items-center gap-3 mt-1">
               
               
            
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddBranch}
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-600 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={16} />
              Add Branch
            </button>
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-8 bg-gray-50/30">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="flex-1 overflow-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-sm text-black">
                  <Loader2 className="w-6 h-6 animate-spin mr-2 text-green-600" />
                  Loading branches...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-20 text-sm text-red-600">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  {error}
                </div>
              ) : branches.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={branches}
                  onRowClick={(row) => setSelectedBranchId(row.id || row._id)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black mb-4 border border-gray-100">
                    <MapPin size={24} />
                  </div>
                  <p className="text-sm font-bold text-black uppercase tracking-[0.2em]">No Branches Established</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Branch Modal Overlay */}
        {addBranchModal && (
          <AddBranch
            fabricatorId={fabricatorId}
            onClose={handleCloseAddBranch}
            fabricatorName={fabricator.fabName}
            onSuccess={() => {
              fetchBranches();
              onBranchChange?.();
            }}
          />
        )}

        {/* View Branch Details Modal Overlay */}
        {selectedBranchId && (
          <GetBranchByIDModal
            branchId={selectedBranchId}
            onClose={() => setSelectedBranchId(null)}
          />
        )}
      </div>
    </div>,
    document.body
  );
};

export default AllBranches;
