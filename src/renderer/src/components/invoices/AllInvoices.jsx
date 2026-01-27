import { useEffect, useState } from "react";
import Service from "../../api/Service";

import DataTable from "../ui/table";
import GetInvoiceById from "./GetInvoiceById";

const AllInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

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
            className={`px-2 py-1 rounded-full text-xs font-medium ${status
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

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-700">All Invoices</h2>
      </div>
      <DataTable
        columns={columns}
        data={invoices}
        onRowClick={(row) => setSelectedInvoiceId(row._id || row.id)}
        pageSizeOptions={[5, 10, 25]}
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
