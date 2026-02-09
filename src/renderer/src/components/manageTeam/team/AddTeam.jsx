/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from "react-hook-form";

import Button from "../../fields/Button";
import Input from "../../fields/input";
import { useEffect, useMemo, useState } from "react";
import Service from "../../../api/Service";
import Select from "../../fields/Select";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";


const AddTeam = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const [loading, setLoading] = useState(true);
  const [staffs, setStaffs] = useState([]);

  const departments = useSelector(
    (state) => state.userInfo.departmentData || []
  );

  // ── Safely fetch managers (no errors shown) ──
  const fetchManagers = async () => {
    try {
      setLoading(true);

      const rolesToFetch = [
        "ADMIN",
        "DEPT_MANAGER",
        "PROJECT_MANAGER",
        "PROJECT_MANAGER_OFFICER",
      ];

      const promises = rolesToFetch.map((role) =>
        Service.FetchEmployeeByRole(role).catch(() => ({
          data: { employees: [] },
        })),
      );

      const responses = await Promise.all(promises);
      const allStaffs = responses
        .flatMap((res) => res?.data?.employees || [])
        .filter(Boolean);

      setStaffs(allStaffs);
    } catch (err) {
      console.warn("Managers not available (this is okay)", err);
      setStaffs([]); // Silent fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // ── Build manager options safely ──
  const managerOptions = useMemo(() => {
    if (!Array.isArray(staffs) || staffs.length === 0) {
      return [{ label: "No managers available", value: "" }];
    }

    return staffs
      .filter((user) => {
        const role = user.role?.toUpperCase();
        return [
          "ADMIN",
          "DEPT_MANAGER",
          "PROJECT_MANAGER",
          "PROJECT_MANAGER_OFFICER",
          "TEAM_LEAD",
        ].includes(role);
      })
      .map((user) => ({
        label:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Unnamed Manager",
        value: user.id || "",
      }))
      .filter((opt) => opt.value);
  }, [staffs]);

  // ── Department options (safe) ──
  const departmentOptions = useMemo(() => {
    if (!Array.isArray(departments) || departments.length === 0) {
      return [{ label: "No departments found", value: "" }];
    }
    return departments.map((dept) => ({
      label: dept.name || "Unnamed Dept",
      value: dept.id || "",
    }));
  }, [departments]);

  // ── Form submit ──
  const addTeam = async (data) => {
    if (!data.managerID || !data.departmentID) {
      toast.warning("Please select a manager and department");
      return;
    }

    try {
      await Service.AddTeam(data);
      toast.success("Team created successfully!");
    } catch (error) {
      toast.error(error?.message || "Failed to create team");
    }
  };

  // ── Early loading UI ──
  if (loading) {
    return (
      <div className="w-full mx-auto bg-white rounded-xl shadow-md p-10 border border-gray-200 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="text-gray-700">Loading team setup...</span>
        </div>
      </div>
    );
  }

  const hasManagers = managerOptions.some((opt) => opt.value);
  const hasDepartments = departmentOptions.some((opt) => opt.value);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 mt-6 border border-gray-200">
      <h2 className="text-2xl  text-gray-700 mb-6">Create New Team</h2>

      <form onSubmit={handleSubmit(addTeam)} className="space-y-6">
        {/* Team Name */}
        <div>
          <Input
            label="Team Name"
            type="text"
            placeholder="e.g. Alpha Squad"
            {...register("name", { required: "Team name is required" })}
            className="w-full"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Manager Select */}
        <div>
          <Select
            label="Team Manager"
            placeholder={
              hasManagers ? "Choose a manager" : "No managers available"
            }
            options={managerOptions}
            {...register("managerID")}
            onChange={(_, value) => setValue("managerID", value)}
          // disabled={!hasManagers}
          />
          {!hasManagers && (
            <p className="text-amber-600 text-xs mt-1">
              Managers will appear once added in the system.
            </p>
          )}
        </div>

        {/* Department Select */}
        <div>
          <Select
            label="Department"
            placeholder={
              hasDepartments ? "Choose a department" : "No departments found"
            }
            options={departmentOptions}
            {...register("departmentID")}
            onChange={(_, value) => setValue("departmentID", value)}
          // disabled={!hasDepartments}
          />
          {!hasDepartments && (
            <p className="text-amber-600 text-xs mt-1">
              Create departments first to assign teams.
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-center w-full pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !hasManagers || !hasDepartments}
            className={`w-full px-8 py-3 rounded-lg font-medium transition ${isSubmitting || !hasManagers || !hasDepartments
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
              }`}
          >
            {isSubmitting ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTeam;
