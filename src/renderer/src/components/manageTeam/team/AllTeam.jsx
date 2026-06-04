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

        const response = await Service.AllTeam();

        console.log("API RESPONSE:", response);

        // ✅ correct extraction
        const fetchedTeams = response?.data || [];

        // ✅ correct filtering
        const activeTeams = fetchedTeams.filter(team => !team.isDeleted);

        setTeams(activeTeams);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setError("Failed to load teams. Please try again.");
        toast.error("Could not load teams");
        setTeams([]);
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

      setTeams((prev) => prev.filter((t) => !ids.includes(t.id)));

      setSelectedTeamId(null);

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
        <span className="font-semibold text-black uppercase tracking-tight text-sm">
          {row.original.name}
        </span>
      ),
    },
    {
      header: "Manager",
      accessorFn: (row) =>
        [row.manager?.firstName, row.manager?.middleName, row.manager?.lastName]
          .filter(Boolean)
          .join(" "),
      id: "manager",
      cell: ({ getValue }) => {
        const value = getValue();
        return (
          <span className="text-black font-semibold uppercase tracking-wide text-xs">
            {value || "—"}
          </span>
        );
      },
    },
    {
      accessorFn: (row) => row.department?.name,
      header: "Department",
      id: "department",
      cell: ({ getValue }) => (
        <span className="px-5 py-1.5 bg-gray-100 text-black font-semibold uppercase tracking-widest rounded-full text-[10px] border border-black/5 shadow-sm">
          {String(getValue() ?? "—")}
        </span>
      ),
    },
  ];

  // ── Loading / Error States ──
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-xl border border-black/10 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black/5 border-t-black"></div>
          <span className="text-black font-semibold uppercase tracking-widest text-xs">Loading teams...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-600 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black uppercase tracking-tight">All Teams</h2>
        <p className="text-black text-xs font-semibold tracking-wide mt-1">
          Manage and view all project teams in the system
        </p>
      </div>

      <div className="bg-white">
        <DataTable
          columns={columns}
          data={teams}
          onRowClick={handleRowClick}
          onDelete={handleDelete}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Modal View for Team Details */}
      {selectedTeamId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GetTeamById 
            id={selectedTeamId} 
            onClose={() => setSelectedTeamId(null)} 
          />
        </div>
      )}
    </div>
  );
};

export default AllTeam;
