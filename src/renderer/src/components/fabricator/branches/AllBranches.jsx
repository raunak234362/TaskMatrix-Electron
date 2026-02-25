/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, MapPin, Plus, Building2, CheckCircle2 } from "lucide-react";
import AddBranch from "./AddBranch";
import { useState } from "react";

const AllBranches = ({ fabricator, onClose }) => {
  const [addBranchModal, setAddBranchModal] = useState(false);

  const handleOpenAddBranch = () => setAddBranchModal(true);
  const handleCloseAddBranch = () => setAddBranchModal(false);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-200">

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
                  {fabricator.branches?.length || 0} OPERATIONAL HUBS
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
              className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all active:scale-95 border border-gray-100"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-8 bg-gray-50/30">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="flex-1 overflow-auto custom-scrollbar">
              {fabricator.branches && fabricator.branches.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">IDENTIFIER / NAME</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">SECURE EMAIL</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">CONTACT PHONE</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">GEOGRAPHIC ADDRESS</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">TYPE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {fabricator.branches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900 group-hover:text-black">{branch.name}</span>
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
            fabricatorId={fabricator.id}
            onClose={handleCloseAddBranch}
            fabricatorName={fabricator.fabName}
          />
        )}
      </div>
    </div>
  );
};

export default AllBranches;
