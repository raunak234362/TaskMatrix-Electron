import React, { useEffect, useState } from "react";
import Service from "../../api/Service";
import { AlertCircle, Loader2 } from "lucide-react";
import DataTable from "../ui/table";
import Button from "../fields/Button";
import RenderFiles from "../common/RenderFiles";
import RFIResponseModal from "./RFIResponseModal";
import RFIResponseDetailsModal from "./RFIResponseDetailsModal";
import { useSelector } from "react-redux";

const Info = ({ label, value }) => (
  <div>
    <h4 className="text-sm text-gray-700">{label}</h4>
    <div className="text-gray-700 font-medium">{value}</div>
  </div>
);


const GetRFIByID = ({ id }) => {
  const [loading, setLoading] = useState(true);
  const [rfi, setRfi] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const users = useSelector((state) => state.userInfo?.staffData || []);
  //
  const fetchRfi = async () => {
    try {
      setLoading(true);
      const response = await Service.GetRFIbyId(id);
      setRfi(response.data);
    } catch (err) {
      setError("Failed to load RFI");
    } finally {
      setLoading(false);
    }
  };

  console.log(rfi);
  useEffect(() => {
    if (id) fetchRfi();
  }, [id]);
  console.log(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading RFI details...
      </div>
    );
  }
  if (error || !rfi) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "RFI not found"}
      </div>
    );
  }
  const userRole = sessionStorage.getItem("userRole")?.toUpperCase();

  const responseColumns = [
    {
      accessorKey: "createdByRole",
      header: "From",
      cell: ({ row }) => {
        const user = row.original.user;
        if (user) {
          return (
            <span className="font-medium text-sm">
              {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
            </span>
          );
        }

        if (row.original.userRole === "CLIENT" || row.original.userRole === "CLIENT_ADMIN") {
          return <span className="font-medium text-sm">WBT Team</span>;
        }

        return <span className="font-medium text-sm">Client</span>;
      },
    },
    {
      accessorKey: "description",
      header: "Message",
      cell: ({ row }) => {
        const htmlContent = row.original.reason || row.original.description || "";
        const plainText = htmlContent.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");

        return (
          <p className="truncate max-w-[180px]" title={plainText}>
            {plainText}
          </p>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-gray-700 text-sm">
          {new Date(row.original.createdAt).toLocaleString()} IST
        </span>
      ),
    },
    {
      accessorKey: "wbtStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.wbtStatus || row.original.status || "—";
        const getStatusStyles = (s) => {
          switch (s?.toUpperCase()) {
            case "OPEN":
              return "bg-blue-100 text-blue-700 border-blue-200";
            case "PARTIAL":
              return "bg-orange-100 text-orange-700 border-orange-200";
            case "COMPLETE":
              return "bg-green-100 text-green-700 border-green-200";
            default:
              return "bg-gray-100 text-gray-700 border-gray-200";
          }
        };

        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusStyles(status)}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT Details */}
          <div className="bg-gray-100 p-6 rounded-xl shadow-none border border-gray-100 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl  text-black font-semibold">
                {rfi.subject}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${rfi.isAproovedByAdmin
                  ? "bg-[#6bbd45]/15 text-black"
                  : "bg-[#6bbd45]/15 text-black"
                  }`}
              >
                {rfi.isAproovedByAdmin ? "Approved" : "Pending"}
              </span>
            </div>

            {/* Basic Info */}
            <Info label="Project" value={rfi.project?.name || "—"} />
            <Info label="Fabricator" value={rfi?.fabricator?.fabName || "—"} />
            <Info
              label="Recipients"
              value={
                rfi.multipleRecipients?.length > 0
                  ? rfi.multipleRecipients
                      .map((r) => `${r.firstName} ${r.lastName}`)
                      .join(", ")
                  : "—"
              }
            />
            <Info
              label="Created At"
              value={new Date(rfi?.date).toLocaleString()}
            />

            {/* Description */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
              <div
                className="text-gray-700 bg-white p-3 rounded-lg border prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: rfi.description || "No description provided",
                }}
              />
            </div>

            {/* Files */}
            <RenderFiles
              files={rfi.files}
              table="rFI"
              parentId={rfi.id}
            />
          </div>

          {/* RIGHT */}
          <div className="bg-gray-100 p-6 rounded-xl shadow-none border border-gray-100 space-y-6">
            {/* Header + Add Response Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#6bbd45]">Responses</h2>

              {(userRole === "CLIENT" || userRole === "CLIENT_ADMIN" || userRole === "ADMIN" || userRole === "PROJECT_MANAGER" || userRole === "DEPT_MANAGER" || userRole === "DEPUTY_MANAGER" || userRole === "OPERATION_EXECUTIVE") && (
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-[#6bbd45]/20 text-black border border-black hover:bg-[#6bbd45]/30"
                >
                  + Add Response
                </Button>
              )}
            </div>

            {/* Table */}
            {rfi.rfiresponse?.length > 0 ? (
              <DataTable
                columns={responseColumns}
                data={rfi.rfiresponse}

                onRowClick={(row) => setSelectedResponse(row)}
              />
            ) : (
              <p className="text-gray-700 italic">No responses yet.</p>
            )}
          </div>

          {/* Response Modal */}
          {showModal && (
            <RFIResponseModal
              rfiId={id}
              onClose={() => setShowModal(false)}
              onSuccess={fetchRfi}
            />
          )}

          {/* Details Modal */}
          {selectedResponse && (
            <RFIResponseDetailsModal
              response={selectedResponse}
              onClose={() => setSelectedResponse(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default GetRFIByID;
