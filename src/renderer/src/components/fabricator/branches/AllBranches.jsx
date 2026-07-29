/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, MapPin, Plus, Building2, CheckCircle2, Trash2, Loader2, AlertCircle, Eye } from "lucide-react";
import AddBranch from "./AddBranch";
import { useState, useEffect } from "react";
import Service from "../../../api/Service";
import { useDispatch } from "react-redux";
import { deleteBranchFromFabricator } from "../../../store/fabricatorSlice";
import { toast } from "react-toastify";

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

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-150 animate-in fade-in zoom-in duration-150">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <h3 className="text-lg font-bold text-gray-900 uppercase">Branch Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 bg-white space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-600">
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
                <p className="text-xs font-bold text-gray-500 uppercase">Branch Name</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{branchDetail.name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Secure Email</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{branchDetail.email || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Phone</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{branchDetail.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Extension</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{branchDetail.extension || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Geographic Address</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-relaxed">
                  {branchDetail.address || ""}, {branchDetail.city || ""}, {branchDetail.state || ""} {branchDetail.zipCode || ""}, {branchDetail.country || ""}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Type</p>
                <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border mt-1.5 ${
                  branchDetail.isHeadquarters
                    ? "bg-green-50 text-[#6bbd45] border-green-200"
                    : "bg-gray-50 text-gray-400 border-gray-200"
                }`}>
                  {branchDetail.isHeadquarters ? "Headquarters" : "Branch Hangar"}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-bold uppercase transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">

        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
              <MapPin size={32} strokeWidth={1.5} className="text-[#6bbd45]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Fabricator Branches</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={12} />
                  {fabricator.fabName}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {branches.length} OPERATIONAL HUBS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddBranch}
              className="px-6 py-2.5 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 active:scale-95 shadow-sm"
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
                <div className="flex items-center justify-center py-20 text-sm text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin mr-2 text-green-600" />
                  Loading branches...
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-20 text-sm text-red-600">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  {error}
                </div>
              ) : branches.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">IDENTIFIER / NAME</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">SECURE EMAIL</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">CONTACT PHONE</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">GEOGRAPHIC ADDRESS</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">TYPE</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {branches.map((branch) => (
                      <tr key={branch.id || branch._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedBranchId(branch.id || branch._id)}>
                          <span className="text-sm font-bold text-gray-900 group-hover:text-[#6bbd45] transition-colors">{branch.name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {branch.email}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{branch.phone}</span>
                            {branch.extension && (
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                EXT: {branch.extension}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-black/60 font-medium leading-relaxed block max-w-xs">
                            {branch.address}, {branch.city}, {branch.state} {branch.zipCode}, {branch.country}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {branch.isHeadquarters ? (
                              <span className="px-3 py-1 bg-green-100 text-[#6bbd45] text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200 flex items-center gap-1.5 shadow-xs">
                                <CheckCircle2 size={12} /> HQ
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-gray-100">
                                BRANCH
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => setSelectedBranchId(branch.id || branch._id)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                              title="View Branch details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.id || branch._id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete Branch"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                    <MapPin size={24} />
                  </div>
                  <p className="text-[11px] font-black text-black/40 uppercase tracking-[0.2em]">No Branches Established</p>
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
    </div>
  );
};

export default AllBranches;
