import { useState } from "react";

import Button from "../fields/Button";
import Service from "../../api/Service";
import { X, Paperclip } from "lucide-react";
import { openFileSecurely } from "../../utils/openFileSecurely";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];

const COResponseDetailsModal = ({ response, onClose, onSuccess }) => {
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyStatus, setReplyStatus] = useState("PENDING");
  const userId = sessionStorage.getItem("userId") || "";
  const userRole = sessionStorage.getItem("userRole") || "";
  console.log(response);

  const handleReply = async () => {
    if (!replyMessage.trim()) return;

    const formData = new FormData();
    formData.append("CoId", response.CoId);
    formData.append("description", replyMessage);
    formData.append("status", replyStatus);
    formData.append("userId", userId);
    formData.append("userRole", userRole);

    // ✅ IMPORTANT — reply points to parent response
    formData.append("parentResponseId", response.id);

    replyFiles.forEach((f) => formData.append("files", f));

    await Service.addCOResponse(formData, response.id);

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 w-full max-w-lg rounded-xl relative space-y-4">
        <button onClick={onClose} className="absolute top-3 right-3">
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold text-green-700">
          Response Details
        </h2>

        <p className="bg-gray-100 p-3 rounded border">{response.description}</p>

        {response.files?.length > 0 && (
          <div className="space-y-1">
            {response.files.map((file) => (
              <p
                key={file.id}
                className="text-green-600 underline cursor-pointer"
                onClick={() =>
                  openFileSecurely("changeOrder/response", response.id, file.id)
                }
              >
                <Paperclip size={14} className="inline mr-1" />
                {file.originalName}
              </p>
            ))}
          </div>
        )}

        {/* Reply */}
        <textarea
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          rows={3}
          className="w-full border rounded p-2"
          placeholder="Reply..."
        />

        <select
          value={replyStatus}
          onChange={(e) => setReplyStatus(e.target.value)}
          className="w-full border rounded p-2"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          type="file"
          multiple
          onChange={(e) =>
            setReplyFiles(e.target.files ? Array.from(e.target.files) : [])
          }
        />

        <div className="flex justify-end gap-3">
          <Button onClick={onClose}>Cancel</Button>
          <Button className="bg-green-600 text-white" onClick={handleReply}>
            Send Reply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default COResponseDetailsModal;
