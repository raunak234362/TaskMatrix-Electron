import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import RenderFiles from "../../ui/RenderFiles";
import { Loader2, Inbox } from "lucide-react";
import { useParams } from "react-router-dom";

const AllDocumentsByProjectID = ({ projectId }) => {
  const { id } = useParams();
  const finalId = projectId || id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDocs = async () => {
      if (!finalId) return;
      try {
        setLoading(true);
        const response = await Service.GetAllDocumentsByProjectId(finalId);
        setData(response?.data || null);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [finalId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading Documents...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-700">
        <Inbox className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-lg font-medium">No Documents Available</p>
      </div>
    );
  }

  // Pre-process Data for RenderFiles
  // 1. Project Files (Flat list)
  const projectFiles = data.project?.files || [];

  // 2. Design Drawings (Array of {description, files: [...]})
  // RenderFiles expects grouping by description if passed a list of objects with files inside?
  // Actually, RenderFiles logic:
  // if (curr.files && Array.isArray(curr.files)) { ... acc[curr.description].push(...) }
  // So we can pass the designDrawings array directly!
  const designDrawings = data.designDrawings || [];

  // 3. Change Orders
  const changeOrders = (data.changeOrders || []).map((co) => ({
    ...co,
    description: `Change Order: ${co.changeOrderNumber || "Unknown"}`,
    // If files are flat inside co?
    // JSON shows: { id:..., files: [...] }
  }));

  // 4. Notes
  const notes = (data.notes || []).map((note) => ({
    ...note,
    description: `Note (${note.stage})`,
    // JSON shows: { id:..., files: [...] }
  }));

  // 5. RFIs
  const rfis = (data.rfi || []).map((rfi) => ({
    ...rfi,
    description: `RFI: ${rfi.subject}`,
    files: rfi.files || [], // RFI attachments
  }));

  // 6. Submittals
  const submittals = (data.submittals || []).map((sub) => ({
    ...sub,
    description: `Submittal: ${sub.subject}`,
    files: sub.files || [], // Using top level files field if available, or currentVersion
  }));

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "—";

  const hasAnyData =
    projectFiles.length > 0 ||
    designDrawings.length > 0 ||
    changeOrders.length > 0 ||
    notes.length > 0 ||
    rfis.length > 0 ||
    submittals.length > 0;

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-700">
        <Inbox className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-lg font-medium">No Documents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Project Files */}
      {projectFiles.length > 0 && (
        <Section title="Project Documents">
          <RenderFiles
            files={projectFiles}
            table="project"
            parentId={finalId || ""}
            hideHeader={true}
            formatDate={formatDate}
          />
        </Section>
      )}

      {/* 2. Design Drawings */}
      {designDrawings.length > 0 && (
        <Section title="Documents">
          <RenderFiles
            files={designDrawings}
            table="designDrawings" // Check table name from DesignDrawingDetails usage if possible
            parentId={finalId || ""}
            hideHeader={true}
            formatDate={formatDate}
          />
        </Section>
      )}

      {/* 3. Change Orders */}
      {changeOrders.length > 0 && (
        <Section title="Change Orders">
          <RenderFiles
            files={changeOrders}
            table="changeOrder" // Inferred from Service usage or context, might need verification, likely 'changeOrder'
            parentId={finalId || ""}
            hideHeader={true}
            formatDate={formatDate}
          />
        </Section>
      )}

      {/* 4. RFIs */}
      {rfis.length > 0 && (
        <Section title="Requests for Information (RFI)">
          <RenderFiles
            files={rfis}
            table="rFI" // From GetRFIByID.tsx
            parentId={finalId || ""}
            hideHeader={true}
            formatDate={formatDate}
          />
        </Section>
      )}

      {/* 5. Submittals */}
      {submittals.length > 0 && (
        <Section title="Submittals">
          <RenderFiles
            files={submittals}
            table="submittals"
            parentId={finalId || ""}
            hideHeader={true}
            formatDate={formatDate}
          />
        </Section>
      )}

      {/* 6. Notes */}
      {notes.length > 0 && (
        <Section title="Notes">
          <RenderFiles
            files={notes}
            table="project" // Notes usually store files under project or note table? AllNotes.tsx uses 'project'
            parentId={finalId || ""}
            hideHeader={true}
            formatDate={formatDate}
          />
        </Section>
      )}
    </div>
  );
};

const Section = ({
  title,
  children,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100">
      <h3 className=" text-gray-800 font-semibold">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default AllDocumentsByProjectID;
