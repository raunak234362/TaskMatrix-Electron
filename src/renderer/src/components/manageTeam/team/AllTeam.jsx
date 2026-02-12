/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

import DataTable from "../../ui/table";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import GetTeamById from "./GetTeamById";


const AllTeam = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  // ── Fetch All Teams ──
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await Service.AllTeam(); // Adjust API method name
        const fetchedTeams = Object.values(
          response.data || response || {}
        );

        setTeams(fetchedTeams);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setError("Failed to load teams. Please try again.");
        toast.error("Could not load teams");
        setTeams();
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // ── Delete Handler ──
  const handleDelete = async (selectedRows) => {
    try {
      const ids = selectedRows.map((t) => t.id);
      // await Service.DeleteTeams(ids); // Uncomment when API ready
      console.log("Deleting teams:", ids);

      setTeams((prev) => prev.filter((t) => !ids.includes(t.id)));
      toast.success(`${selectedRows.length} team(s) deleted`);
    } catch (error) {
      toast.error("Failed to delete team(s)");
      console.log(error);
    }
  };

  // ── Row Click → Open Detail Modal ──
  const handleRowClick = (row) => {
    setSelectedTeamId(row.id);
  };

  // ── Table Columns ──
  const columns = [
    {
      accessorKey: "name",
      header: "Team Name",
      cell: ({ row }) => (
        <span className="font-medium text-gray-700">{row.original.name}</span>
      ),
    },
    {
      header: "Manager",
      accessorFn: (row) =>
        [row.manager.firstName, row.manager.middleName, row.manager.lastName]
          .filter(Boolean)
          .join(" "),
      id: "manager",
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <span className="text-green-700 font-medium">{value || "—"}</span>
        );
      },
    },
    {
      accessorFn: (row) => row.department.name,
      header: "Department",
      id: "department",
      cell: ({ getValue }) => (
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {String(getValue() ?? "")}
        </span>
      ),
    },
  ];

  // ── Loading / Error States ──
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="text-gray-700">Loading teams...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b">
        <h2 className="text-2xl  text-gray-700">All Teams</h2>
        <p className="text-sm text-gray-700 mt-1">
          Manage and view all project teams
        </p>
      </div>

      <div className="p-4">
        <DataTable
          columns={columns}
          data={teams}
          onRowClick={handleRowClick}
          onDelete={handleDelete}

          detailComponent={({ row }) => <GetTeamById id={row.id} />}
        />
      </div>

      {/* Optional detail on backdrop */}
      {selectedTeamId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSelectedTeamId(null)}
        />
      )}
    </div>
  );
};

export default AllTeam;
