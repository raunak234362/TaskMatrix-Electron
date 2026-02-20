/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import DataTable from "../ui/table";

import { Loader2, Inbox } from "lucide-react";
import Service from "../../api/Service";
import GetSubmittalByID from "./GetSubmittalByID";


const AllSubmittals = ({ submittalData }) => {
  const [submittals, setSubmittals] = useState([]);
  const [loading, setLoading] = useState(true);
  console.log(submittalData);

  const userRole = sessionStorage.getItem("userRole");

  const fetchSubmittals = async () => {
    try {
      setLoading(true);
      let result;

      if (userRole === "CLIENT") result = await Service.SubmittalSent();
      else result = await Service.SubmittalRecieved();

      const data = Array.isArray(result?.data) ? result.data : [];

      const normalized = data.map((item) => ({
        ...item,
        milestone: item.mileStoneBelongsTo || item.milestone || null,
        recipient: item.recepients || null,
        sender: item.sender || null,
        createdAt: item.createdAt || item.date || null,
        statusLabel:
          item.isAproovedByAdmin === true
            ? "APPROVED"
            : item.isAproovedByAdmin === false
              ? "REJECTED"
              : "PENDING",
      }));

      setSubmittals(normalized);
    } catch {
      setSubmittals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submittalData && submittalData.length > 0) {
      setSubmittals(submittalData);
      setLoading(false);
    } else {
      fetchSubmittals();
    }

  }, []);

  const columns = [
    { accessorKey: "subject", header: "Subject" },

    {
      accessorKey: "sender",
      header: "Sender",
      cell: ({ row }) => {
        const s = row.original.sender;
        return s ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() : "—";
      },
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black ${row.original.status === true
            ? "bg-orange-100 text-black shadow-sm"
            : "bg-green-100 text-black shadow-sm"
            }`}
        >
          {row.original.status === true ? "Pending" : "Responded"}
        </span>
      ),
    },

    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.original.date).toLocaleString(),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-gray-700">
        <Loader2 className="animate-spin w-6 h-6" /> Loading Submittals...
      </div>
    );
  }

  if (!submittals.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-gray-700">
        <Inbox className="w-10 h-10 text-gray-400" />
        <p>No Submittals Found</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-2 rounded-xl shadow-md">
      <DataTable
        columns={columns}
        data={submittals}
        detailComponent={({ row }) => <GetSubmittalByID id={row.id} />}

      />
    </div>
  );
};

export default AllSubmittals;
