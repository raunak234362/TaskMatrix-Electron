import React, { useEffect, useState } from "react";
import Service from "../../api/Service";
import { Loader2, AlertCircle } from "lucide-react";
import Button from "../fields/Button";
import DataTable from "../ui/table";
import RenderFiles from "../common/RenderFiles";

import SubmittalResponseModal from "./SubmittalResponseModal";
import SubmittalResponseDetailsModal from "./SubmittalResponseDetailsModal";

const Info = ({ label, value }) => (
  <div className="mb-2">
    <h4 className="text-sm text-gray-700">{label}</h4>
    <div className="font-medium text-gray-700">{value}</div>
  </div>
);

const GetSubmittalByID = ({ id }) => {
  const [loading, setLoading] = useState(true);
  const [submittal, setSubmittal] = useState(null);
  const [error, setError] = useState(null);

  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const userRole = sessionStorage.getItem("userRole")?.toUpperCase();
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await Service.GetSubmittalbyId(id);
      setSubmittal(res.data);
    } catch {
      setError("Failed to load submittal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading submittal details...
      </div>
    );
  }

  if (!submittal || error) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-600">
        <AlertCircle className="w-5 h-5" />
        {error || "Submittal not found"}
      </div>
    );
  }

  const responseColumns = [
    {
      accessorKey: "description",
      header: "Message",
      cell: ({ row }) => (
        <div
          style={{
            marginLeft: row.original.parentResponseId ? "20px" : "0px",
          }}
        >
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: "files",
      header: "Files",
      cell: ({ row }) => {
        const count = row.original.files?.length ?? 0;
        return count > 0 ? `${count} file(s)` : "—";
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
  ];

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANEL */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-5">
            <h1 className="text-2xl  text-green-700">
              {submittal.subject}
            </h1>

            <Info label="Project" value={submittal.project?.name || "—"} />
            <Info
              label="Submitted By"
              value={submittal.sender?.firstName || "—"}
            />
            <Info
              label="Created On"
              value={new Date(submittal.date).toLocaleString()}
            />

            <div>
              <h4 className="font-semibold text-gray-700">Description</h4>
              <div
                className="p-3 bg-gray-50 border rounded-lg prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: submittal.description || submittal.currentVersion?.description || "—",
                }}
              />
            </div>

            {/* Versioned Attachments */}
            <RenderFiles
              files={submittal.versions || []}
              table="submittals"
              parentId={submittal.id}
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-green-700">Responses</h2>
              {userRole === "CLIENT_ADMIN" && (
                <Button
                  className="bg-green-600 text-white"
                  onClick={() => setShowResponseModal(true)}
                >
                  + Add Response
                </Button>
              )}
            </div>

            {submittal.submittalsResponse?.length > 0 ? (
              <DataTable
                columns={responseColumns}
                data={submittal.submittalsResponse}
                onRowClick={(row) => setSelectedResponse(row)}
                pageSizeOptions={[5, 10]}
              />
            ) : (
              <p className="text-gray-700 italic">No responses yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ADD RESPONSE MODAL */}
      {showResponseModal && (
        <SubmittalResponseModal
          submittalId={submittal.id}
          onClose={() => setShowResponseModal(false)}
          onSuccess={() => {
            setShowResponseModal(false);
            fetchData();
          }}
        />
      )}

      {/* RESPONSE DETAILS MODAL */}
      {selectedResponse && (
        <SubmittalResponseDetailsModal
          response={selectedResponse}
          onClose={() => {
            setSelectedResponse(null);
            fetchData();
          }}
        />
      )}
    </>
  );
};

export default GetSubmittalByID;
