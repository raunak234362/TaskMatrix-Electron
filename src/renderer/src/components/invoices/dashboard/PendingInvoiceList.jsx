
import DataTable from "../../ui/table";
import GetInvoiceById from "../GetInvoiceById";
import { Eye, Send } from "lucide-react";


const PendingInvoiceList = ({ invoices }) => {
  const pendingInvoices = invoices.filter(
    (inv) => !inv.paymentStatus || inv.paymentStatus === "Pending",
  );

  const columns = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <span className="font-medium text-gray-800">
          {row.getValue("invoiceNumber") || `#${row.index + 1000}`}
        </span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Client",
    },
    {
      accessorKey: "invoiceDate",
      header: "Issued Date",
      cell: ({ row }) => {
        const date = row.getValue("invoiceDate");
        return date ? new Date(date).toLocaleDateString() : "N/A";
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const date = row.original.dueDate || row.original.invoiceDate; // Fallback
        if (!date) return "N/A";
        // Check overdue
        const isOverdue = new Date(date) < new Date();
        return (
          <span
            className={isOverdue ? "text-red-500 font-medium" : "text-gray-600"}
          >
            {new Date(date).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      accessorKey: "totalInvoiceValue",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("totalInvoiceValue"));
        const currency = row.original.currencyType || "USD";
        return (
          <span className="font-semibold text-gray-800">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency,
            }).format(amount)}
          </span>
        );
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => {
        // Logic for overdue based on date if status is pending
        const date = row.original.dueDate || row.original.invoiceDate;
        const isOverdue = date && new Date(date) < new Date();

        if (isOverdue) {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
              Overdue
            </span>
          );
        }

        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-600 border border-yellow-100">
            Pending
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: () => {
        return (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"
              title="View"
            >
              <Eye size={16} />
            </button>
            <button
              className="p-1.5 hover:bg-green-50 rounded-md text-green-600"
              title="Send"
            >
              <Send size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg  text-gray-800">Pending Invoices</h3>
        <button className="text-sm font-semibold text-green-600 hover:text-green-700">
          View All
        </button>
      </div>

      {/* Table Container */}
      <div className="group">
        <DataTable
          columns={columns}
          data={pendingInvoices}
          detailComponent={({ row, close }) => (
            <GetInvoiceById id={row.id} close={close} />
          )}

        />
      </div>
    </div>
  );
};

export default PendingInvoiceList;
