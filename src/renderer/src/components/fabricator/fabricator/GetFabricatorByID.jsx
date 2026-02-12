import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { Loader2, AlertCircle, Link2, FileText, Link } from "lucide-react";
import Button from "../../fields/Button";

import { openFileSecurely } from "../../../utils/openFileSecurely";
import EditFabricator from "./EditFabricator";
import AllBranches from "../branches/AllBranches";
import AllClients from "../clients/AllClients";
import FabricatorDashboard from "./FabricatorDashboard";

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
          className={`px-3 py-7 rounded-full text-xs font-medium ${
            fabricator.isDeleted
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
          className={`pb-3 px-2 text-sm font-semibold transition-colors ${
            activeTab === "dashboard"
              ? "text-green-700 border-b-2 border-green-600"
              : "text-gray-500 hover:text-green-600"
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-3 px-2 text-sm font-semibold transition-colors ${
            activeTab === "details"
              ? "text-green-700 border-b-2 border-green-600"
              : "text-gray-500 hover:text-green-600"
          }`}
        >
          Basic Details
        </button>
      </div>

      {/* Content Wrapper (IMPORTANT FIX) */}
      <div className="pt-2">
        {activeTab === "dashboard" ? (
          <FabricatorDashboard fabricator={fabricator} />
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
                  <h4 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Files
                  </h4>

                  <ul className="space-y-3">
                    {fabricator.files.map((file) => (
                      <li
                        key={file.id}
                        className="
                          flex justify-between items-center
                          bg-white px-4 py-3
                          rounded-md shadow-sm
                          border border-gray-100
                          hover:border-green-200
                        "
                      >
                        <span className="font-medium text-gray-800">
                          {file.originalName}
                        </span>

                        <button
                          className="text-green-600 text-sm flex items-center gap-1 hover:underline"
                          onClick={() =>
                            openFileSecurely("fabricator", id, file.id)
                          }
                        >
                          <Link2 className="w-3 h-3" /> Open
                        </button>
                      </li>
                    ))}
                  </ul>
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

export default GetFabricatorByID;
