import { useState, useMemo } from "react";
import DataTable from "../ui/table";
import { Search, X, Filter } from "lucide-react";

import GetRFQByID from "./GetRFQByID";

const AllRFQ = ({ rfq }) => {
  const userType = localStorage.getItem("userType");

  // Dynamic filter options extraction
  const statusOptions = useMemo(() => {
    const statuses = new Set();
    rfq?.forEach(item => {
      const status = item.wbtStatus || item.status || 'PENDING';
      statuses.add(status);
    });
    return Array.from(statuses).map(s => ({ label: s, value: s }));
  }, [rfq]);

  const fabricatorOptions = useMemo(() => {
    const fabs = new Set();
    rfq?.forEach(item => {
      const name = item.fabricator?.fabName;
      if (name) fabs.add(name);
    });
    return Array.from(fabs).map(f => ({ label: f, value: f }));
  }, [rfq]);

  // Premium styled columns
  let columns = [
    {
      accessorKey: "projectName",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.original.projectName}</span>
          <span className="text-[10px] text-primary font-semibold uppercase tracking-widest mt-0.5">
            RFQ #{row.original.projectNumber || 'N/A'}
          </span>
        </div>
      )
    },
    {
      id: "rfqType",
      header: "RFQ Type",
      cell: ({ row }) => {
        const r = row.original;
        const types = [];
        const isTrue = (val) => val === true || val === "true";
        const isMTO = isTrue(r.MTOManual) || r.MTOStickModel || r.MTOValue;
        const isDetailing = isTrue(r.detailingMain) || isTrue(r.detailingMisc) || isTrue(r.miscDesign) || isTrue(r.customerDesign) || isTrue(r.connectionDesign);

        if (isMTO) types.push("MTO");
        if (isDetailing) types.push("Detailing");

        return (
          <div className="flex gap-1 flex-wrap">
            {types.map(t => (
              <span
                key={t}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                  t === 'MTO'
                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}
              >
                {t}
              </span>
            ))}
            {types.length === 0 && <span className="text-gray-300 font-bold tracking-widest text-[10px]">N/A</span>}
          </div>
        );
      }
    },
  ];

  // ➕ Only Admin / Staff see Fabricator
  if (userType !== "CLIENT") {
    columns.push({
      accessorKey: "fabricator",
      header: "Fabricator",
      enableColumnFilter: true,
      filterType: "select",
      filterOptions: fabricatorOptions,
      filterFn: (row, columnId, filterValue) => {
        const fabName = row.original?.fabricator?.fabName;
        return fabName === filterValue;
      },
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-gray-600">
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
            <span className="text-sm font-semibold text-gray-700">{name}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{sender?.userType || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "wbtStatus",
      header: "Status",
      enableColumnFilter: true,
      filterType: "select",
      filterOptions: statusOptions,
      filterFn: (row, columnId, filterValue) => {
        const status = row.original.wbtStatus || row.original.status || 'PENDING';
        return status === filterValue;
      },
      cell: ({ row }) => {
        let status = row.original.wbtStatus || row.original.status || 'PENDING';

        if (status === 'AWARDED') {
          const r = row.original;
          const isTrue = (val) => val === true || val === "true";
          const isMTO = isTrue(r.MTOManual) || r.MTOStickModel || r.MTOValue;
          if (isMTO) {
            status = 'SUBMITTED';
          }
        }

        const colors = {
          IN_REVIEW: 'bg-orange-100 text-black shadow-sm border border-black',
          COMPLETED: 'bg-green-100 text-black shadow-sm border border-black',
          PENDING: 'bg-gray-100 text-black/40 shadow-sm border border-black',
          RECEIVED: 'bg-blue-100 text-black shadow-sm border border-black',
          SENT: 'bg-green-100 text-black shadow-sm border border-black',
          AWARDED: 'bg-green-200 text-black shadow-sm border border-black',
          SUBMITTED: 'bg-green-200 text-black shadow-sm border border-black',
          OPEN: 'bg-blue-50 text-blue-800 shadow-sm border border-black',
          CLOSED: 'bg-red-100 text-red-800 shadow-sm border border-black',
          RE_APPROVAL: 'bg-yellow-100 text-yellow-800 shadow-sm border border-black',
          REJECTED: 'bg-red-200 text-red-900 shadow-sm border border-black',
        };
        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${colors[status] || colors.PENDING}`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-600">
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString("en-IN", {
              month: "short",
              day: "2-digit",
              year: "numeric"
            })
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "estimationDate",
      header: "Due Date",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-600">
          {row.original.estimationDate
            ? new Date(row.original.estimationDate).toLocaleDateString("en-IN", {
              month: "short",
              day: "2-digit",
              year: "numeric"
            })
            : "—"}
        </span>
      ),
    },
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [activeTab, setActiveTab] = useState("all");

  const filteredRfq = useMemo(() => {
    return (rfq || []).filter(item => {
      // 1. Search Filter
      const matchesSearch = item.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Tab Filter (Awarded vs All)
      if (activeTab === "awarded") {
        const isAwarded = item.wbtStatus === "AWARDED" || item.status === "AWARDED";
        if (!isAwarded) return false;
      }

      // 3. Type Filter
      if (selectedType === "ALL") return true;

      const isTrue = (val) => val === true || val === "true";
      const isMTO = isTrue(item.MTOManual) || item.MTOStickModel || item.MTOValue;
      const isDetailing = isTrue(item.detailingMain) || isTrue(item.detailingMisc) || isTrue(item.miscDesign) || isTrue(item.customerDesign) || isTrue(item.connectionDesign);

      if (selectedType === "MTO") return isMTO;
      if (selectedType === "DETAILING") return isDetailing;
      if (selectedType === "BOTH") return isMTO && isDetailing;

      return true;
    });
  }, [rfq, searchQuery, selectedType, activeTab]);

  return (
    <div className="bg-[#fcfdfc] min-h-[600px] animate-in fade-in duration-700">
      {/* Premium Header Controls */}
      <div className="mb-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          {/* Search Bar */}
          <div className="relative group max-w-xl flex-1 min-w-[300px]">
            <div className="absolute -inset-1 bg-linear-to-r from-green-100 to-emerald-100 rounded-xl blur-sm opacity-25 group-hover:opacity-40 transition-all duration-1000"></div>
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

          <div className="flex flex-wrap items-center gap-4">
            {/* RFQ Type Toggle */}
            <div className="flex items-center bg-gray-50/50 p-1.5 rounded-2xl border border-black/5 shadow-sm">
              {['ALL', 'MTO', 'DETAILING', 'BOTH'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-6 py-2 rounded-xl text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 ${
                    selectedType === type
                      ? 'bg-green-200 text-black shadow-md border border-black/5'
                      : 'text-black hover:text-black/60'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-gray-50/50 p-1.5 rounded-2xl border border-black/5 shadow-sm">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 ${
                  activeTab === "all"
                    ? 'bg-green-200 text-black shadow-md border border-black/5'
                    : 'text-black hover:text-black/60'
                }`}
              >
                All RFQs
              </button>
              <button
                onClick={() => setActiveTab("awarded")}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 ${
                  activeTab === "awarded"
                    ? 'bg-green-200 text-black shadow-md border border-black/5'
                    : 'text-black hover:text-black/60'
                }`}
              >
                Awarded
              </button>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRfq}
        detailComponent={({ row, close }) => <GetRFQByID id={row.id || row._id} onClose={close} />}
        disablePagination={true}
      />
    </div>
  );
};

export default AllRFQ;
