import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { Loader2, AlertCircle, Link2, FileText, Link, Building2, Hash, CreditCard, Landmark, X } from "lucide-react";
import Button from "../../fields/Button";
import { motion } from "framer-motion";

import { openFileSecurely } from "../../../utils/openFileSecurely";
import EditFabricator from "./EditFabricator";
import AllBranches from "../branches/AllBranches";
import AllClients from "../clients/AllClients";
import FabricatorDashboard from "./FabricatorDashboard";
import RenderFiles from "../../common/RenderFiles";

const truncateText = (text, max = 40) =>
  text.length > max ? text.substring(0, max) + "..." : text;

const GetFabricatorByID = ({ id, onClose }) => {
  const [fabricator, setFabricator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModel, setEditModel] = useState(null);
  const [branch, setBranch] = useState(null);
  const [poc, setPoc] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState(null);

  useEffect(() => {
    const fetchFab = async () => {
      if (!id) {
        setError("Invalid Fabricator ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await Service.GetFabricatorByID(id);
        setFabricator(response?.data || null);
      } catch (err) {
        setError("Failed to load fabricator");
        console.error("Error fetching fabricator:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFab();
  }, [id]);

  useEffect(() => {
    const fetchAccount = async () => {
      if (activeTab === "account" && fabricator?.accountId && !account) {
        try {
          setAccountLoading(true);
          setAccountError(null);
          const response = await Service.GetBankAccountById(fabricator.accountId);
          setAccount(response?.data || null);
        } catch (err) {
          setAccountError("Failed to load account details");
          console.error("Error fetching account:", err);
        } finally {
          setAccountLoading(false);
        }
      }
    };

    fetchAccount();
  }, [activeTab, fabricator?.accountId, account]);

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm tracking-normal text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading fabricator details...
      </div>
    );
  }

  if (error || !fabricator) {
    return (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white p-8 rounded-2xl shadow-xl flex items-center text-sm tracking-normal text-red-600" onClick={(e) => e.stopPropagation()}>
          <AlertCircle className="w-5 h-5 mr-2" />
          {error || "Fabricator not found"}
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="
          bg-white
          w-full max-w-9xl
          rounded-2xl shadow-2xl
          overflow-hidden
          h-[90vh]
          flex flex-col
          relative
          border border-gray-200
        "
      >
        {/* Header Section */}
        <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-black tracking-tight uppercase">{fabricator.fabName}</h3>
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-normal border ${fabricator.isDeleted
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
                }`}
            >
              {fabricator.isDeleted ? "Inactive" : "Active"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-normal transition-all border-2 shadow-sm active:scale-95 ${activeTab === "dashboard"
                ? "bg-green-50 text-black  border-green-700/80 hover:bg-green-100"
                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 hover:text-black hover:border-gray-400"
                }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-normal transition-all border-2 shadow-sm active:scale-95 ${activeTab === "details"
                ? "bg-green-50 text-green-700 border-green-700/80 hover:bg-green-100"
                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 hover:text-black hover:border-gray-400"
                }`}
            >
              Basic Details
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-normal transition-all border-2 shadow-sm active:scale-95 ${activeTab === "account"
                ? "bg-green-50 text-green-700 border-green-700/80 hover:bg-green-100"
                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50 hover:text-black hover:border-gray-400"
                }`}
            >
              Account Details
            </button>
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-red-50 text-black  border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-normal shadow-sm active:scale-95 ml-2"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 pt-6 no-scrollbar flex flex-col gap-6 bg-white">
          <div className="flex-1">
            {activeTab === "dashboard" ? (
              <FabricatorDashboard fabricator={fabricator} />
            ) : activeTab === "account" ? (
              <div className="py-6">
                {accountLoading ? ( 
                  <div className="flex items-center justify-center py-12 text-sm tracking-normal text-gray-700">
                    <Loader2 className="w-6 h-6 animate-spin mr-2 text-green-600" />
                    Loading account details...
                  </div>
                ) : accountError ? (
                  <div className="flex items-center justify-center py-12 text-sm tracking-normal text-red-600 bg-red-50 rounded-xl border border-red-100">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    {accountError}
                  </div>
                ) : account ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Account Header Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-300 shadow-sm flex items-center gap-4">
                      <div className="p-4 bg-green-50 rounded-2xl text-green-700 border border-green-300">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 tracking-normal">{account.accountName}</h4>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-normal">{account.bankName}</p>
                      </div>
                    </div>

                    {/* Account Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AccountInfoCard
                        icon={<Hash className="w-4 h-4 text-green-600" />}
                        label="Account Number"
                        value={account.accountNumber}
                      />
                      <AccountInfoCard
                        icon={<CreditCard className="w-4 h-4 text-green-600" />}
                        label="Account Type"
                        value={account.accountType}
                      />
                      <AccountInfoCard
                        icon={<Landmark className="w-4 h-4 text-green-600" />}
                        label="ABA Routing"
                        value={account.abaRoutingNumber || "—"}
                      />
                      <AccountInfoCard
                        icon={<Hash className="w-4 h-4 text-green-600" />}
                        label="Institution #"
                        value={account.institutionNumber || "—"}
                      />
                      <AccountInfoCard
                        icon={<Hash className="w-4 h-4 text-green-600" />}
                        label="Transit #"
                        value={account.transitNumber || "—"}
                      />
                      <AccountInfoCard
                        icon={<CreditCard className="w-4 h-4 text-green-600" />}
                        label="Payment Method"
                        value={account.paymentMethod || "—"}
                      />
                    </div>

                    {account.bankAddress && (
                      <div className="p-6 bg-white border border-gray-300 rounded-2xl shadow-sm">
                        <p className="text-sm font-black text-green-700 uppercase tracking-normal mb-3">Bank Address</p>
                        <p className="text-sm font-semibold text-gray-800 leading-relaxed italic tracking-normal">
                          {account.bankAddress}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <AlertCircle className="w-10 h-10 mb-3 opacity-20" />
                    <p className="font-medium text-gray-400 uppercase tracking-normal text-sm">No account assigned to this fabricator</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 p-8 rounded-2xl border border-gray-300 bg-white shadow-sm py-6">
                  <DetailItem label="Partner Stage" value={fabricator.fabStage || "—"} />
                  <DetailItem
                    label="WBT Contact"
                    value={
                      Array.isArray(fabricator.wbtFabricatorPointOfContact) && fabricator.wbtFabricatorPointOfContact.length > 0
                        ? fabricator.wbtFabricatorPointOfContact
                            .map(c => typeof c === 'object' ? `${c.firstName} ${c.lastName}` : String(c).replace(/^Contact:/i, ""))
                            .filter(Boolean)
                            .join(", ")
                        : "—"
                    }
                  />
                  <DetailItem
                    label="Point of Contact"
                    value={
                      Array.isArray(fabricator.pointOfContact) && fabricator.pointOfContact.length > 0
                        ? fabricator.pointOfContact
                            .map(c => typeof c === 'object' ? `${c.firstName} ${c.lastName}` : String(c).replace(/^Contact:/i, ""))
                            .filter(Boolean)
                            .join(", ")
                        : "—"
                    }
                  />
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-black uppercase tracking-normal">Website</p>
                    {fabricator.website ? (
                      <a
                        href={fabricator.website.startsWith("http") ? fabricator.website : `https://${fabricator.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 hover:text-green-900 underline font-semibold break-all tracking-normal"
                      >
                        {fabricator.website}
                      </a>
                    ) : (
                      <p className="text-sm text-black tracking-normal">-</p>
                    )}
                  </div>
                  {fabricator.drive && (
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-black uppercase tracking-normal">Drive Link</p>
                      <a
                        href={fabricator.drive.startsWith("http") ? fabricator.drive : `https://${fabricator.drive}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 hover:text-green-900 underline font-semibold break-all flex items-center gap-1 tracking-normal"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        {fabricator.drive}
                      </a>
                    </div>
                  )}
                  <DetailItem label="Approval Percentage" value={fabricator.approvalPercentage ? `${fabricator.approvalPercentage}%` : "0%"} />
                  <DetailItem label="Fabrication Percentage" value={fabricator.fabricatPercentage ? `${fabricator.fabricatPercentage}%` : "0%"} />
                  <DetailItem label="Settlement Cycle" value={fabricator.paymenTDueDate ? `${fabricator.paymenTDueDate} Days` : "0 Days"} />
                  <DetailItem label="Created" value={formatDate(fabricator.createdAt)} />
                  <DetailItem label="Updated" value={formatDate(fabricator.updatedAt)} />
                  <DetailItem label="Total Files" value={Array.isArray(fabricator.files) ? String(fabricator.files.length) : "0"} />
                </div>

                {/* Files Section */}
                {Array.isArray(fabricator.files) && fabricator.files.length > 0 && (
                  <div className="pt-8 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-6 text-green-700">
                      <FileText className="w-4 h-4" />
                      <h4 className="text-sm font-black uppercase tracking-normal text-slate-800">Resource Documents</h4>
                    </div>
                    <RenderFiles files={fabricator.files} table="fabricator" parentId={id} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-6 flex flex-wrap gap-4 border-t border-gray-200 shrink-0">
            <button
              onClick={() => setBranch(fabricator)}
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-normal shadow-sm active:scale-95"
            >
              View Branches
            </button>
            <button
              onClick={() => setPoc(fabricator)}
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-normal shadow-sm active:scale-95"
            >
              View POC
            </button>
            <button
              onClick={() => setEditModel(fabricator)}
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-normal shadow-sm active:scale-95"
            >
              Edit Fabricator
            </button>
            <button
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-normal shadow-sm active:scale-95"
            >
              Archive
            </button>
          </div>

          {editModel && (
            <EditFabricator
              fabricatorData={fabricator}
              onClose={() => setEditModel(null)}
            />
          )}

          {branch && (
            <AllBranches
              fabricator={fabricator}
              onClose={() => setBranch(null)}
            />
          )}

          {poc && (
            <AllClients
              fabricator={fabricator}
              onClose={() => setPoc(null)}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="space-y-1.5">
    <p className="text-sm font-bold text-black uppercase tracking-normal">{label}</p>
    <p className="text-sm text-black break-all tracking-normal">{value || '-'}</p>
  </div>
);

const AccountInfoCard = ({ icon, label, value }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex items-center gap-2 text-black/50 mb-2">
      {icon}
      <span className="text-sm uppercase font-black tracking-normal">{label}</span>
    </div>
    <p className="text-sm font-bold text-gray-900 break-all tracking-normal">{value}</p>
  </div>
);

export default GetFabricatorByID;
