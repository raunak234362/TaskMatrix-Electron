/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";

import Button from "../../fields/Button";
import { X } from "lucide-react";
import DataTable from "../../ui/table";

import GetEmployeeByID from "../../manageTeam/employee/GetEmployeeByID";
import AddCDEngineer from "./AddCDEngineer";


const AllCDEngineer = ({ onClose, designerData }) => {
  const [addEngineerModal, setAddEngineerModal] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load engineers directly from designerData ──
  useEffect(() => {
    setIsLoading(true);
    try {
      if (Array.isArray(designerData?.CDEngineers)) {
        const mappedEngineers = designerData.CDEngineers.map(
          (e) => ({
            id: e.id ?? "",
            username: e.username ?? "",
            email: e.email ?? "",
            departmentId: e.departmentId ?? "",
            isFirstLogin: e.isFirstLogin ?? false,
            firstName: e.firstName ?? "",
            middleName: e.middleName ?? "",
            lastName: e.lastName ?? "",
            phone: e.phone ?? "",
            landline: e.landline ?? "",
            altLandline: e.altLandline ?? "",
            altPhone: e.altPhone ?? "",
            zipCode: e.zipCode ?? "",
            designation: e.designation ?? "",
            city: e.city ?? "",
            state: e.state ?? "",
            country: e.country ?? "",
            address: e.address ?? "",
            role: e.role ?? "ENGINEER",
            isActive: e.isActive ?? true,
            extension: e.extensionNumber ?? e.extension ?? "",
            createdAt: e.createdAt ?? "",
            updatedAt: e.updatedAt ?? "",
          })
        );

        setEngineers(mappedEngineers);
      } else {
        setEngineers();
      }
    } catch (error) {
      console.error("Error mapping CDEngineers:", error);
      setEngineers();
    } finally {
      setIsLoading(false);
    }
  }, [designerData]);

  // ── Modal Handlers ──
  const openAddEngineer = () => setAddEngineerModal(true);
  const closeAddEngineer = () => {
    setAddEngineerModal(false);
    // Optionally re-fetch or refresh local data if AddCDEngineer modifies designerData
  };

  // ── Table Columns ──
  const columns = useMemo(
    () => [
      {
        accessorFn: (r) =>
          [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
        header: "Engineer Name",
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
          const parts = ;
          if (r.address) parts.push(r.address);
          if (r.city) parts.push(r.city);
          if (r.state) parts.push(r.state);
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

  );

  // ── Row Click (View engineer details) ──
  const handleRowClick = (row) => {
    console.log("Engineer clicked:", row.id);
  };

  // ── UI ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl  text-gray-700">
            Connection Designer Engineers
          </h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Designer Info */}
        <div className="px-5 pt-3">
          <p className="text-sm font-semibold text-gray-700">
            Connection Designer:{" "}
            <span className=" text-blue-600">{designerData.name}</span>
          </p>
        </div>

        {/* Add Engineer Button */}
        <div className="px-5 pt-3">
          <Button onClick={openAddEngineer} className="text-sm">
            + Add Engineer
          </Button>
        </div>

        {/* DataTable */}
        <div className="flex-1 overflow-auto mt-4 border-t p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-700">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
              Loading engineers...
            </div>
          ) : engineers.length > 0 ? (
            <DataTable
              columns={columns}
              data={engineers}
              onRowClick={handleRowClick}
              detailComponent={({ row }) => <GetEmployeeByID id={row.id} />}

            />
          ) : (
            <div className="text-center text-gray-700 py-10">
              No engineers found for this Connection Designer.
            </div>
          )}
        </div>

        {/* Add Engineer Modal */}
        {addEngineerModal && (
          <AddCDEngineer designer={designerData} onClose={closeAddEngineer} />
        )}
      </div>
    </div>
  );
};

export default AllCDEngineer;
