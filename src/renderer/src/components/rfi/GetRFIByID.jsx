import React, { useEffect, useState } from "react";
import Service from "../../api/Service";
import { AlertCircle, Loader2 } from "lucide-react";
import DataTable from "../ui/table";
import Button from "../fields/Button";
import RenderFiles from "../common/RenderFiles";
import RFIResponseModal from "./RFIResponseModal";
import RFIResponseDetailsModal from "./RFIResponseDetailsModal";

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
        Loading RFQ details...
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
  const userRole = sessionStorage.getItem("userRole");

  const responseColumns = [
    {
      accessorKey: "createdByRole",
      header: "From",
      cell: ({ row }) => (
        <span className="font-medium text-sm">
          {row.original.createdByRole === "CLIENT" ? "Client" : "WBT Team"}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Message",
      cell: ({ row }) => (
        <p className="truncate max-w-[180px]">
          {row.original.reason || row.original.description}
        </p>
      ),
    },
    {
      accessorKey: "files",
      header: "Files",
      cell: ({ row }) => {
        const count = row.original.files?.length ?? 0;
        return count > 0 ? (
          <span className="text-[#6bbd45] font-medium">{count} file(s)</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-gray-700 text-sm">
          {new Date(row.original.date).toLocaleString()}
        </span>
      ),
    },

    {
      accessorKey: "reason",
      header: "Message",
      cell: ({ row }) => (
        <div
          style={{ marginLeft: row.original.parentResponseId ? "20px" : "0px" }}
        >
          {row.original.reason}
        </div>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status === "OPEN"
            ? "bg-[#6bbd45]/15 text-[#6bbd45]"
            : "bg-[#6bbd45]/15 text-[#6bbd45]"
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT Details */}
          <div className="bg-white p-6 rounded-xl shadow-none border border-gray-100 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h1 className="text-2xl  text-[#6bbd45]">
                {rfi.subject}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${rfi.isAproovedByAdmin
                  ? "bg-[#6bbd45]/15 text-[#6bbd45]"
                  : "bg-[#6bbd45]/15 text-[#6bbd45]"
                  }`}
              >
                {rfi.isAproovedByAdmin ? "Approved" : "Pending"}
              </span>
            </div>

            {/* Basic Info */}
            <Info label="Project" value={rfi.project?.name || "—"} />
            <Info label="Fabricator" value={rfi?.fabricator?.fabName || "—"} />
            <Info
              label="Created At"
              value={new Date(rfi?.date).toLocaleString()}
            />

            {/* Description */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
              <div
                className="text-gray-700 bg-gray-50 p-3 rounded-lg border prose prose-sm max-w-none"
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
          <div className="bg-white p-6 rounded-xl shadow-none border border-gray-100 space-y-6">
            {/* Header + Add Response Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#6bbd45]">Responses</h2>

              {(userRole === "CLIENT" || userRole === "CLIENT_ADMIN") && (
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
