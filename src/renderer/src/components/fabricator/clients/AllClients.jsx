/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/fabricator/AllClients.tsx
import { useEffect, useState, useMemo } from "react";

import Button from "../../fields/Button";
import { X } from "lucide-react";
import AddClients from "./AddClient";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import DataTable from "../../ui/table"; // Assuming this is the correct path

import GetEmployeeByID from "../../manageTeam/employee/GetEmployeeByID";


const AllClients = ({ fabricator, onClose }) => {
  const [addClientModal, setAddClientModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch clients from API ──
  const fetchAllClientsByFabricatorID = async (fabId) => {
    if (!fabId) return;

    setIsLoading(true);
    try {
      const response = await Service.FetchAllClientsByFabricatorID(fabId);

      // API returns: { data: [ {...}, ... ], message: "..." }
      const rawClients = Array.isArray(response.data)
        ? response.data
        : [];

      // Map raw → UserData (safe fallback)
      const mappedClients = rawClients.map((c) => ({
        id: c.id ?? "",
        username: c.username ?? "",
        email: c.email ?? "",
        firstName: c.firstName ?? "",
        middleName: c.middleName ?? null,
        lastName: c.lastName ?? "",
        phone: c.phone ?? "",
        landline: c.landline ?? null,
        altLandline: c.altLandline ?? null,
        altPhone: c.altPhone ?? null,
        designation: c.designation ?? "",
        city: c.city ?? "",
        zipCode: c.zipCode ?? "",
        state: c.state ?? "",
        country: c.country ?? "",
        address: c.address ?? "",
        role: c.role ?? "EMPLOYEE",
        departmentId: c.departmentId ?? "",
        isActive: c.isActive ?? true,
        branchId: c.branchId,
        extension: c.extensionNumber ?? c.extension ?? "",
        isFirstLogin: c.isFirstLogin ?? false,
        createdAt: c.createdAt ?? "",
        updatedAt: c.updatedAt ?? "",
      }));

      setClients(mappedClients);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch clients");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Load on mount & fabricator change ──
  useEffect(() => {
    fetchAllClientsByFabricatorID(fabricator.id);
  }, [fabricator.id]);

  const openAddClient = () => setAddClientModal(true);
  const closeAddClient = () => {
    setAddClientModal(false);
    // Refresh list after adding
    fetchAllClientsByFabricatorID(fabricator.id);
  };

  // ── DataTable Columns Definition ──
  const columns = useMemo(
    () => [
      {
        accessorFn: (r) =>
          [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
        header: "Name",
        id: "fullName",
      },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span>
            {row.original.phone}
            {row.original.extension && (
              <span className="text-gray-700 text-xs ml-1">
                (Ext: {row.original.extension})
              </span>
            )}
          </span>
        ),
      },
      { accessorKey: "designation", header: "Designation" },
      {
        accessorFn: (r) => {
          const parts = [];
          if (r.address) parts.push(r.address);
          if (r.city) parts.push(r.city);
          if (r.state) parts.push(r.state);
          if (r.zipCode) parts.push(r.zipCode);
          if (r.country) parts.push(r.country);
          return parts.join(", ");
        },
        header: "Address",
        id: "fullAddress",
        cell: ({ row }) => (
          <span className="text-gray-700">{row.getValue("fullAddress")}</span>
        ),
      },
    ],
    []
  );

  const handleRowClick = (row) => {
    // Optional logic to view/edit client details
    console.log("Client clicked:", row.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold text-gray-700">
            Fabricator POCs (Clients)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Fabricator Name */}
        <div className="px-5 pt-3">
          <p className="text-sm font-semibold text-gray-700">
            Fabricator:{" "}
            <span className="font-bold text-blue-600">
              {fabricator.fabName}
            </span>
          </p>
        </div>

        {/* Add Button */}
        <div className="px-5 pt-3">
          <Button onClick={openAddClient} className="text-sm">
            + Add POC
          </Button>
        </div>

        {/* Table/Data Area */}
        <div className="flex-1 overflow-auto mt-4 border-t p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-700">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
              Loading clients...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={clients}
              onRowClick={handleRowClick}
              detailComponent={({ row }) => <GetEmployeeByID id={row.id} />}
              pageSizeOptions={[5, 10, 25]}
            />
          )}
        </div>

        {/* Add Client Modal */}
        {addClientModal && (
          <AddClients fabricator={fabricator} onClose={closeAddClient} />
        )}
      </div>
    </div>
  );
};

export default AllClients;
