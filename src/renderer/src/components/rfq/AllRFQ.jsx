import { useState } from "react";
import DataTable from "../ui/table";
import { Search, X } from "lucide-react";

import GetRFQByID from "./GetRFQByID";

const AllRFQ = ({ rfq }) => {
  const userType = localStorage.getItem("userType");

  // Premium styled columns
  let columns = [
    {
      accessorKey: "projectName",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-black text-gray-900">{row.original.projectName}</span>
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">
            RFQ #{row.original.projectNumber || 'N/A'}
          </span>
        </div>
      )
    },
  ];

  // ➕ Only Admin / Staff see Fabricator
  if (userType !== "CLIENT") {
    columns.push({
      accessorKey: "fabricator",
      header: "Fabricator",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-600">
          {(row.original)?.fabricator?.fabName || "—"}
        </span>
      ),
    });
  }

  columns.push(
    {
      accessorKey: "sender",
      header: "Requested By",
      cell: ({ row }) => {
        const sender = row.original?.sender;
        const name = sender ? `${sender.firstName || ""} ${sender.lastName || ""}` : "—";
        return (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-700">{name}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{sender?.userType || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || 'PENDING';
        const colors = {
          IN_REVIEW: 'bg-yellow-100 text-yellow-700',
          COMPLETED: 'bg-green-100 text-green-700',
          PENDING: 'bg-gray-100 text-gray-700',
          RECEIVED: 'bg-blue-100 text-blue-700'
        };
        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[status] || colors.PENDING}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "estimationDate",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-600">
          {row.original.estimationDate
            ? new Date(row.original.estimationDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            })
            : "—"}
        </span>
      ),
    },
  );

  const [searchQuery, setSearchQuery] = useState("");
  const filteredRfq = (rfq || []).filter(item =>
    item.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.projectNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#fcfdfc] min-h-[600px] animate-in fade-in duration-700">
      {/* Search Bar - Premium Style */}
      <div className="mb-10 px-1">
        <div className="relative group max-w-xl">
          <div className="absolute -inset-1 bg-linear-to-r from-green-100 to-emerald-100 rounded-xl blur-sm opacity-25 group-hover:opacity-40 transition-duration-1000"></div>
          <div className="relative bg-white border border-gray-100 rounded-xl p-1 flex items-center shadow-sm hover:border-green-200 transition-colors">
            <Search className="ml-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RFQs by project name or number..."
              className="flex-1 px-4 py-2 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 px-3 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8 px-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Total-RFQs <span className="text-primary/40 ml-2">{filteredRfq.length}</span></h1>
      </div>

      <DataTable
        columns={columns}
        data={filteredRfq}
        detailComponent={({ row }) => <GetRFQByID id={row.id} />}
        disablePagination={true}
      />
    </div>
  );
};

export default AllRFQ;
