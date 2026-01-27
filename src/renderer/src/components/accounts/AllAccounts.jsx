import DataTable from "../ui/table";

import { Loader2, Inbox } from "lucide-react";

import GetAccountByID from "./getAccountByID";


const AllAccounts = ({ accounts, loading }) => {
  const truncateWords = (text, maxWords) => {
    if (!text) return "—";
    const words = text.split(/\s+/);
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(" ") + "...";
    }
    return text;
  };

  const columns = [
    {
      accessorKey: "accountName",
      header: "Account Name",
      cell: ({ row }) => truncateWords(row.original.accountName, 20),
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
    },
    {
      accessorKey: "accountType",
      header: "Account Type",
      cell: ({ row }) => truncateWords(row.original.accountType, 20),
    },
    {
      accessorKey: "bankName",
      header: "Bank Name",
      cell: ({ row }) => truncateWords(row.original.bankName, 20),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
    },
    {
      accessorKey: "createdAt",
      header: "Created On",
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "—",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading Accounts...
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-700">
        <Inbox className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-lg font-medium">No Bank Accounts Available</p>
        <p className="text-sm text-gray-400">
          You haven’t added any bank accounts yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-2 rounded-2xl shadow-md">
      <DataTable
        columns={columns}
        data={accounts}
        detailComponent={({ row }) => <GetAccountByID id={row.id} />}
      />
    </div>
  );
};

export default AllAccounts;
