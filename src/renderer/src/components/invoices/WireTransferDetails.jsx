import { useEffect, useState } from "react";
import Service from "../../api/Service";
import { Loader2 } from "lucide-react";

const WireTransferDetails = ({ id }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Service.GetWireTransferById(id)
      .then((res) => {
        setData(res?.data || res);
      })
      .catch((err) => {
        console.error("Error fetching wire transfer details:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load details
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Subject</p>
          <p className="font-medium text-gray-800">{data.subject || "N/A"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Date</p>
          <p className="font-medium text-gray-800">
            {data.date ? new Date(data.date).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Sender</p>
          <p className="font-medium text-gray-800">
            {data.user
              ? `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || data.user.username
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Created At</p>
          <p className="font-medium text-gray-800">
            {data.createdAt ? new Date(data.createdAt).toLocaleString() : "N/A"}
          </p>
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">Description</p>
        <div
          className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700"
          dangerouslySetInnerHTML={{ __html: data.description || "No description provided." }}
        />
      </div>
      {data.files && data.files.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">
            Attached Files ({data.files.length})
          </p>
          <ul className="list-disc pl-5">
            {data.files.map((file) => (
              <li key={file.id} className="text-sm text-gray-700">
                {file.originalName || file.id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WireTransferDetails;
