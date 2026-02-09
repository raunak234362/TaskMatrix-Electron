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
  const [activeTab, setActiveTab] = useState(
    "dashboard"
  );
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

  const handleModel = (fabricator) => {
    console.log(fabricator);
    setEditModel(fabricator);
  };
  const handleModelClose = () => {
    setEditModel(null);
  };

  const handleBranch = (fabricator) => {
    console.log(fabricator);
    setBranch(fabricator);
  };
  const handleBranchClose = () => {
    setBranch(null);
  };

  const handlePoc = (fabricator) => {
    console.log(fabricator);
    setPoc(fabricator);
  };
  const handlePocClose = () => {
    setPoc(null);
  };

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
  console.log(fabricator);

  return (
    <div className="bg-linear-to-br from-green-50 to-green-50 p-4 sm:p-6 rounded-xl shadow-inner text-sm">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <h3 className="text-xl  text-green-800">
          {fabricator.fabName}
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${fabricator.isDeleted
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-800"
            }`}
        >
          {fabricator.isDeleted ? "Inactive" : "Active"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 border-b border-green-200">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-2 px-1 text-sm font-semibold transition-colors ${activeTab === "dashboard"
            ? "text-green-700 border-b-2 border-green-600"
            : "text-gray-500 hover:text-green-600"
            }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-2 px-1 text-sm font-semibold transition-colors ${activeTab === "details"
            ? "text-green-700 border-b-2 border-green-600"
            : "text-gray-500 hover:text-green-600"
            }`}
        >
          Basic Details
        </button>
      </div>

      {activeTab === "dashboard" ? (
        <FabricatorDashboard fabricator={fabricator} />
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              {fabricator.website && (
                <InfoRow
                  label="Website"
                  value={
                    <a
                      href={fabricator.website}
                      target="_blank"
                      rel="noreferrer"
                      title={fabricator.website}
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
                      title={fabricator.drive}
                      className="text-cyan-700 underline hover:text-cyan-900 flex gap-1"
                    >
                      <Link className="w-4 h-4" />{" "}
                      {truncateText(fabricator.drive, 20)}
                    </a>
                  }
                />
              )}
            </div>

            <div className="space-y-3">
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
                  Array.isArray(fabricator.files) ? fabricator.files.length : 0
                }
              />
            </div>
          </div>

          {/* Files Section */}
          {Array.isArray(fabricator.files) && fabricator.files.length > 0 && (
            <div className="mt-6 pt-5 border-t border-green-200">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                <FileText className="w-4 h-4" /> Files
              </h4>
              <ul className="text-gray-700 space-y-1">
                {(
                  fabricator.files
                ).map((file) => (
                  <li
                    key={file.id}
                    className="flex justify-between items-center bg-white px-3 py-2 rounded-md shadow-sm"
                  >
                    <span>{file.originalName}</span>
                    <a
                      className="text-green-600 text-sm flex items-center gap-1 hover:underline cursor-pointer"
                      onClick={() =>
                        openFileSecurely("fabricator", id, file.id)
                      }
                    >
                      <Link2 className="w-3 h-3" /> Open
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {/* Buttons */}
      <div className="py-3 flex flex-wrap gap-2 sm:gap-3">
        <Button
          onClick={() => handleBranch(fabricator)}
          className="py-1 px-2 text-lg"
        >
          View Branches
        </Button>
        <Button
          onClick={() => handlePoc(fabricator)}
          className="py-1 px-2 text-lg"
        >
          View POC
        </Button>
        <Button
          onClick={() => handleModel(fabricator)}
          className="py-1 px-2 text-lg"
        >
          Edit Fabricator
        </Button>
        <Button className="py-1 px-2 text-lg bg-red-200 text-red-700">
          Archive
        </Button>
      </div>
      {editModel && (
        <EditFabricator
          fabricatorData={fabricator}
          onClose={handleModelClose}
        />
      )}
      {branch && (
        <AllBranches fabricator={fabricator} onClose={handleBranchClose} />
      )}
      {poc && <AllClients fabricator={fabricator} onClose={handlePocClose} />}
    </div>
  );
};

// ✅ Reusable Info Row
const InfoRow = ({
  label,
  value,
  href,
}) => (
  <div className="flex justify-between">
    <span className=" text-gray-700">{label}:</span>
    {href ? (
      <a
        href={href}
        className="text-green-600 hover:underline hover:text-green-800 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {value}
      </a>
    ) : (
      <span className="text-gray-700">{value}</span>
    )}
  </div>
);

export default GetFabricatorByID;
