import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { Loader2, AlertCircle, Link2, FileText, Link, Building2, Hash, CreditCard, Landmark } from "lucide-react";
import Button from "../../fields/Button";

import { openFileSecurely } from "../../../utils/openFileSecurely";
import EditFabricator from "./EditFabricator";
import AllBranches from "../branches/AllBranches";
import AllClients from "../clients/AllClients";
import FabricatorDashboard from "./FabricatorDashboard";
import RenderFiles from "../../common/RenderFiles";

const truncateText = (text, max = 40) =>
  text.length > max ? text.substring(0, max) + "..." : text;

const GetFabricatorByID = ({ id }) => {
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
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading fabricator details...
      </div>
    );
  }

  if (error || !fabricator) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Fabricator not found"}
      </div>
    );
  }

  return (
    <div
      className="
     bg-zinc-100
        p-6 sm:p-8
        rounded-xl shadow-inner
        text-sm
        flex flex-col
        gap-8
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-xl text-green-800">{fabricator.fabName}</h3>
        <span
          className={`px-3 py-7 rounded-full text-xs font-medium ${fabricator.isDeleted
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-800"
            }`}
        >
          {fabricator.isDeleted ? "Inactive" : "Active"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-green-200">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-3 px-2 text-sm font-semibold transition-colors ${activeTab === "dashboard"
            ? "text-green-700 border-b-2 border-green-600"
            : "text-gray-500 hover:text-green-600"
            }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-3 px-2 text-sm font-semibold transition-colors ${activeTab === "details"
            ? "text-green-700 border-b-2 border-green-600"
            : "text-gray-500 hover:text-green-600"
            }`}
        >
          Basic Details
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`pb-3 px-2 text-sm font-semibold transition-colors ${activeTab === "account"
            ? "text-green-700 border-b-2 border-green-600"
            : "text-gray-500 hover:text-green-600"
            }`}
        >
          Account Details
        </button>
      </div>

      {/* Content Wrapper (IMPORTANT FIX) */}
      <div className="pt-2">
        {activeTab === "dashboard" ? (
          <FabricatorDashboard fabricator={fabricator} />
        ) : activeTab === "account" ? (
          <div className="py-6">
            {accountLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-700">
                <Loader2 className="w-6 h-6 animate-spin mr-2 text-green-600" />
                Loading account details...
              </div>
            ) : accountError ? (
              <div className="flex items-center justify-center py-12 text-red-600 bg-red-50 rounded-xl border border-red-100">
                <AlertCircle className="w-6 h-6 mr-2" />
                {accountError}
              </div>
            ) : account ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Account Header Card */}
                <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex items-center gap-4">
                  <div className="p-4 bg-green-50 rounded-2xl text-green-700">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{account.accountName}</h4>
                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{account.bankName}</p>
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
                  <div className="p-6 bg-white border border-green-100 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-green-700 uppercase tracking-[0.2em] mb-3">Bank Address</p>
                    <p className="text-sm font-semibold text-gray-800 leading-relaxed italic">
                      {account.bankAddress}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <AlertCircle className="w-10 h-10 mb-3 opacity-20" />
                <p className="font-medium text-gray-400 uppercase tracking-widest text-xs">No account assigned to this fabricator</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
              <div className="space-y-5">
                {fabricator.website && (
                  <InfoRow
                    label="Website"
                    value={
                      <a
                        href={fabricator.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-700 underline hover:text-cyan-900"
                      >
                        {truncateText(fabricator.website, 20)}
                      </a>
                    }
                  />
                )}

                {fabricator.drive && (
                  <InfoRow
                    label="Drive Link"
                    value={
                      <a
                        href={fabricator.drive}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-700 underline hover:text-cyan-900 flex gap-1"
                      >
                        <Link className="w-4 h-4" />
                        {truncateText(fabricator.drive, 20)}
                      </a>
                    }
                  />
                )}
              </div>

              <div className="space-y-5">
                <InfoRow
                  label="Created"
                  value={formatDate(fabricator.createdAt)}
                />
                <InfoRow
                  label="Updated"
                  value={formatDate(fabricator.updatedAt)}
                />
                <InfoRow
                  label="Total Files"
                  value={
                    Array.isArray(fabricator.files)
                      ? fabricator.files.length
                      : 0
                  }
                />
              </div>
            </div>

            {/* Files */}
            {Array.isArray(fabricator.files) &&
              fabricator.files.length > 0 && (
                <div className="pt-6 border-t border-green-200">
                  <RenderFiles
                    files={fabricator.files}
                    table="fabricator"
                    parentId={id}
                  />
                </div>
              )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-2 pt-6 flex flex-wrap gap-4 border-t border-green-100">
        <Button onClick={() => setBranch(fabricator)}>View Branches</Button>
        <Button onClick={() => setPoc(fabricator)}>View POC</Button>
        <Button onClick={() => setEditModel(fabricator)}>
          Edit Fabricator
        </Button>
        <Button className="bg-red-100 text-red-700 hover:bg-red-200">
          Archive
        </Button>
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
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-600">{label}:</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

const AccountInfoCard = ({ icon, label, value }) => (
  <div className="bg-white p-5 rounded-2xl border border-green-50 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-green-400">
    <div className="flex items-center gap-2 text-gray-500 mb-2">
      {icon}
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
    </div>
    <p className="font-bold text-gray-900 break-all">{value}</p>
  </div>
);

export default GetFabricatorByID;
