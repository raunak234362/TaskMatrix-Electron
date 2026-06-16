import DateFilter from "../../../../common/DateFilter";

const GithubFilters = ({
  selectedEmployee,
  setSelectedEmployee,
  selectedRepo,
  setSelectedRepo,
  dateFilter,
  setDateFilter,
  teamMembers,
  repos,
}) => {
  return (
    <div className="flex flex-wrap items-end gap-5 w-full sm:w-auto">
      <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[180px]">
        <span className="text-[10px] text-black font-black uppercase tracking-widest">Employee</span>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="w-full text-sm font-semibold text-black bg-white border-2 border-black/30 rounded-none px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 hover:border-black/50 transition-all shadow-sm"
        >
          <option value="ALL">All Employees</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[200px]">
        <span className="text-[10px] text-black font-black uppercase tracking-widest">Repository</span>
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="w-full text-sm font-semibold text-black bg-white border-2 border-black/30 rounded-none px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 hover:border-black/50 transition-all shadow-sm"
        >
          <option value="ALL">All Repositories</option>
          {repos.map((r) => (
            <option key={`${r.owner}/${r.name}`} value={`${r.owner}/${r.name}`}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 w-full sm:w-auto">
        <span className="text-[10px] text-black font-black uppercase tracking-widest">Date Filter</span>
        <div className="h-10 flex items-center">
          <DateFilter dateFilter={dateFilter} setDateFilter={setDateFilter} />
        </div>
      </div>
    </div>
  );
};

export default GithubFilters;
