import { useEffect, useState, useMemo } from "react";
import Service from "../../api/Service";

import DataTable from "../ui/table";
import GetInvoiceById from "./GetInvoiceById";

const INVOICE_TYPES = [
  { label: "All", value: "ALL" },
  { label: "Approval", value: "APPROVAL" },
  { label: "Fabrication", value: "FABRICATION" },
  { label: "MTO", value: "MTO" },
  { label: "Change Order", value: "CHANGE_ORDER" },
];

const AllInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("ALL");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await Service.GetAllInvoice();
        setInvoices(Array.isArray(res) ? res : res?.data || []);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Count per type for badge display
  const countByType = useMemo(() => {
    const counts = { ALL: invoices.length };
    INVOICE_TYPES.slice(1).forEach(({ value }) => {
      counts[value] = invoices.filter((inv) => inv.type === value).length;
    });
    return counts;
  }, [invoices]);

  // Filtered data based on active tab
  const filteredInvoices = useMemo(() => {
    if (activeType === "ALL") return invoices;
    return invoices.filter((inv) => inv.type === activeType);
  }, [invoices, activeType]);

  const columns = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
    },
    {
      accessorKey: "customerName",
      header: "Customer",
    },
    {
      accessorKey: "jobName",
      header: "Job Name",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type");
        const typeLabel = INVOICE_TYPES.find((t) => t.value === type)?.label || type || "—";
        const colorMap = {
          APPROVAL: "bg-blue-50 text-blue-700 border-blue-100",
          FABRICATION: "bg-purple-50 text-purple-700 border-purple-100",
          MTO: "bg-orange-50 text-orange-700 border-orange-100",
          CHANGE_ORDER: "bg-cyan-50 text-cyan-700 border-cyan-100",
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              colorMap[type] || "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {typeLabel}
          </span>
        );
      },
    },
    {
      accessorKey: "invoiceDate",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("invoiceDate");
        return date ? new Date(date).toLocaleDateString() : "N/A";
      },
    },
    {
      accessorKey: "totalInvoiceValue",
      header: "Total",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalInvoiceValue"));
        const currency = row.original.currencyType || "USD";
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        }).format(amount);
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("paymentStatus");
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {status ? "Paid" : "Pending"}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-700">All Invoices</h2>
        <span className="text-xs text-gray-400 font-medium">
          {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {INVOICE_TYPES.map(({ label, value }) => {
          const isActive = activeType === value;
          const count = countByType[value] ?? 0;

          return (
            <button
              key={value}
              onClick={() => setActiveType(value)}
              className={`flex items-center gap-2 px-6 py-1.5 border-2 rounded-lg font-bold text-sm uppercase tracking-tight shadow-sm transition-all duration-300 active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-green-50 text-black border-green-700/80"
                  : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
            >
              {label}
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black ${
                  isActive
                    ? "bg-green-700/20 text-black"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={filteredInvoices}
        onRowClick={(row) => setSelectedInvoiceId(row._id || row.id)}
      />

      {selectedInvoiceId && (
        <GetInvoiceById
          id={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}
    </div>
  );
};

export default AllInvoices;
