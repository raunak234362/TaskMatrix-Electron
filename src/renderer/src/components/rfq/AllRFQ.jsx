import { useState, useMemo } from "react";
import DataTable from "../ui/table";
import { Search, X, Filter } from "lucide-react";

import GetRFQByID from "./GetRFQByID";

const AllRFQ = ({ rfq, newRfqId, onRfqOpened }) => {
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
      enableColumnFilter: true,
      filterType: "date",
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        if (!row.original.createdAt) return false;
        const d = new Date(row.original.createdAt);
        const rowDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return rowDate === filterValue;
      },
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
      enableColumnFilter: true,
      filterType: "date",
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        if (!row.original.estimationDate) return false;
        const d = new Date(row.original.estimationDate);
        const rowDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return rowDate === filterValue;
      },
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
  const [mtoFilter, setMtoFilter] = useState("ALL");
  const [showAwarded, setShowAwarded] = useState(false);

  const MTO_TYPE_OPTIONS = [
    { label: "All", value: "ALL" },
    { label: "MTO", value: "MTO" },
    { label: "Detailing", value: "DETAILING" },
    { label: "Both", value: "BOTH" },
  ];

  const filteredRfq = useMemo(() => {
    return (rfq || []).filter(item => {
      // 1. Search Filter
      const matchesSearch = item.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.projectNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Awarded Toggle
      if (showAwarded) {
        const isAwarded = item.wbtStatus === "AWARDED" || item.status === "AWARDED";
        if (!isAwarded) return false;
      }

      // 3. MTO / Type Filter
      const isTrue = (val) => val === true || val === "true";
      const isMTO = isTrue(item.MTOManual) || !!item.MTOStickModel || !!item.MTOValue;
      const isDetailing = isTrue(item.detailingMain) || isTrue(item.detailingMisc) || isTrue(item.miscDesign) || isTrue(item.customerDesign) || isTrue(item.connectionDesign);

      if (mtoFilter === "MTO" && !isMTO) return false;
      if (mtoFilter === "DETAILING" && !isDetailing) return false;
      if (mtoFilter === "BOTH" && !(isMTO && isDetailing)) return false;

      return true;
    });
  }, [rfq, searchQuery, showAwarded, mtoFilter]);

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
            {/* Type / MTO Dropdown */}
            <div className="relative">
              <select
                value={mtoFilter}
                onChange={(e) => setMtoFilter(e.target.value)}
                className="appearance-none bg-white border-2 border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm font-bold text-gray-700 uppercase tracking-tight shadow-sm hover:border-purple-400 focus:outline-none focus:border-purple-500 transition-all duration-200 cursor-pointer"
                style={{ minWidth: 150 }}
              >
                {MTO_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-purple-400">
                <svg width="14" height="14" fill="none" viewBox="0 0 20 20"><path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>



            {/* Awarded Toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <span className={`text-sm font-bold uppercase tracking-tight transition-colors duration-200 ${showAwarded ? 'text-green-700' : 'text-gray-400'}`}>
                Awarded
              </span>
              <div
                onClick={() => setShowAwarded(v => !v)}
                className={`relative inline-flex items-center w-12 h-6 rounded-full border-2 transition-all duration-300 ${
                  showAwarded
                    ? 'bg-green-500 border-green-600 shadow-md shadow-green-200'
                    : 'bg-gray-200 border-gray-300'
                }`}
              >
                <span
                  className={`absolute left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                    showAwarded ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRfq}
        detailComponent={({ row, close }) => {
          if (newRfqId && row.id === newRfqId) {
            onRfqOpened?.();
          }
          return <GetRFQByID id={row.id || row._id} onClose={close} />;
        }}
        disablePagination={true}
        forceExpandRowId={newRfqId}
      />
    </div>
  );
};

export default AllRFQ;
