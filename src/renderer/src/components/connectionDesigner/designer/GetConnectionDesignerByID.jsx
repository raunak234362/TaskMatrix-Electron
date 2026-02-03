import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { Loader2, AlertCircle, Link2, MapPin } from "lucide-react";
import Button from "../../fields/Button";
import EditConnectionDesigner from "./EditConnectionDesigner";
import { AllCDEngineer } from "../..";
import RenderFiles from "../../common/RenderFiles";


const truncateText = (text, max = 40) =>
  text.length > max ? text.substring(0, max) + "..." : text;

const GetConnectionDesignerByID = ({ id }) => {
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModel, setEditModel] = useState(null);
  const [engineerModel, setEnginnerModel] = useState(
    null
  );

  // Fetch Connection Designer details
  useEffect(() => {
    const fetchDesigner = async () => {
      if (!id) {
        setError("Invalid Connection Designer ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await Service.FetchConnectionDesignerByID(id);
        setDesigner(response?.data || null);
      } catch (err) {
        console.error("Error fetching Connection Designer:", err);
        setError("Failed to load Connection Designer details");
      } finally {
        setLoading(false);
      }
    };

    fetchDesigner();
  }, [id]);

  const handleModel = (designer) => {
    console.log(designer);
    setEditModel(designer);
  };
  const handleModelClose = () => {
    setEditModel(null);
  };

  const handleEngineerModel = () => {
    setEnginnerModel(designer);
  };
  const handleEngineerModelClose = () => {
    setEnginnerModel(null);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  // ---------------- Loading / Error states ----------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading Connection Designer details...
      </div>
    );
  }

  if (error || !designer) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Connection Designer not found"}
      </div>
    );
  }

  // ---------------- Render Main Content ----------------
  return (
    <div className="bg-linear-to-br from-green-50 to-green-50 p-4 sm:p-6 rounded-xl shadow-inner text-sm">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
        <h3 className="text-lg sm:text-xl font-bold text-green-800 tracking-tight">{designer.name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${designer.isDeleted
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-800"
            }`}
        >
          {designer.isDeleted ? "Inactive" : "Active"}
        </span>
      </div>

      {/* Basic Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <div className="space-y-2 sm:space-y-3">
          {designer.websiteLink && (
            <InfoRow
              label="Website"
              value={
                <a
                  href={designer.websiteLink}
                  target="_blank"
                  rel="noreferrer"
                  title={designer.websiteLink}
                  className="text-cyan-700 underline hover:text-cyan-900 break-all"
                >
                  {truncateText(designer.websiteLink, 20)}
                </a>
              }
            />
          )}
          {designer.email && (
            <InfoRow
              label="Email"
              value={
                <a
                  href={`mailto:${designer.email}`}
                  className="text-cyan-700 hover:text-cyan-900 break-all"
                >
                  {designer.email}
                </a>
              }
            />
          )}
          {designer.contactInfo && (
            <InfoRow label="Contact Info" value={designer.contactInfo} />
          )}
          {designer.location && (
            <InfoRow
              label="Location"
              value={
                <span className="flex items-center gap-1 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />{" "}
                  {designer.location}
                </span>
              }
            />
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          <InfoRow label="Created" value={formatDate(designer.createdAt)} />
          <InfoRow label="Updated" value={formatDate(designer.updatedAt)} />
          <InfoRow
            label="Total Files"
            value={Array.isArray(designer.files) ? designer.files.length : 0}
          />
          <InfoRow
            label="States"
            value={
              Array.isArray(designer.state) && designer.state.length > 0
                ? designer.state.join(", ")
                : "N/A"
            }
          />
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-green-200">
        <RenderFiles
          files={designer.files}
          table="connection-designer"
          parentId={id}
        />
      </div>

      {/* Buttons */}
      <div className="py-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <Button
          onClick={() => handleModel(designer)}
          className="py-1 px-3 text-sm sm:text-base font-semibold"
        >
          Edit
        </Button>
        <Button className="py-1 px-3 text-sm sm:text-base font-semibold bg-red-200 text-red-700 hover:bg-red-300">
          Archive
        </Button>
        <Button
          onClick={() => handleEngineerModel()}
          className="py-1 px-3 text-sm sm:text-base font-semibold"
        >
          Connection Designer Engineer
        </Button>
      </div>
      {editModel && (
        <>
          <EditConnectionDesigner
            onClose={handleModelClose}
            designerData={designer}
          />
        </>
      )}
      {engineerModel && (
        <>
          <AllCDEngineer
            onClose={handleEngineerModelClose}
            designerData={designer}
          />
        </>
      )}
    </div>
  );
};

// ✅ Reusable Info Row
const InfoRow = ({
  label,
  value,
}) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-4 border-b border-green-100/50 sm:border-none pb-1 sm:pb-0">
    <span className="font-bold text-gray-700 shrink-0">{label}:</span>
    <span className="text-gray-700 sm:text-right overflow-hidden text-ellipsis">{value}</span>
  </div>
);

export default GetConnectionDesignerByID;
