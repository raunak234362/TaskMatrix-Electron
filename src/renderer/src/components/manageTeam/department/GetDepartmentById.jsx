import { useEffect, useState } from "react";

import Service from "../../../api/Service";
import { AlertCircle, Loader2 } from "lucide-react";
import Button from "../../fields/Button";


const GetDepartmentById = ({ id }) => {
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      if (!id) {
        setError("Invalid department ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await Service.FetchDepartmentByID(id);
        console.log(response);
        setDepartment(response?.data || null);
      } catch (err) {
        const msg = "Failed to load department details";
        setError(msg);
        console.error("Error fetching department:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading department details...
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Department not found"}
      </div>
    );
  }

  //   const formatDate = (dateString) =>
  //     new Date(dateString).toLocaleString("en-IN", {
  //       dateStyle: "medium",
  //       timeStyle: "short",
  //     });

  const managers = department.managerIds || []

  return (
    <div className="bg-linear-to-br from-green-50 to-green-50 p-6 rounded-xl shadow-inner">
      {/* Header */}
      {/* <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl  text-orange-800">{department.name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            department.isDeleted
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {department.isDeleted ? "Inactive" : "Active"}
        </span>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
        {/* Left Column */}
        <div className="space-y-3">
          <InfoRow label="Department Name" value={department.name} />
          {/* <InfoRow label="Created" value={formatDate(department?.createdAt)} />
          <InfoRow label="Updated" value={formatDate(department?.updatedAt)} /> */}
          {/* <InfoRow label="Created By" value={department.createdById || "—"} /> */}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className=" text-gray-700">Managers:</span>
            <div className="text-gray-700 text-right">
              {Array.isArray(managers) && managers?.length > 0
                ? managers
                  .map(
                    (m) =>
                      `${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""
                        }`
                        .replace(/\s+/g, " ")
                        .trim()
                  )
                  .join(", ")
                : "No Managers Assigned"}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="py-2 flex gap-2 mt-4">
        <Button className="py-1 px-2 text-lg">Edit Department</Button>
        <Button className="py-1 px-2 text-lg">Archive Department</Button>
      </div>
    </div>
  );
};

// Reusable info row
const InfoRow = ({
  label,
  value,
}) => (
  <div className="flex justify-between">
    <span className=" text-gray-700">{label}:</span>
    <span className="text-gray-700">{value}</span>
  </div>
);

export default GetDepartmentById;
