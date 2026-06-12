import React from "react";
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
    <div className="flex items-end gap-3 w-full">
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 font-bold uppercase ml-1 mb-1">Employee</span>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="h-10 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
        >
          <option value="ALL">All Employees</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.id})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 font-bold uppercase ml-1 mb-1">Repository</span>
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="h-10 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
        >
          <option value="ALL">All Repositories</option>
          {repos.map((r) => (
            <option key={`${r.owner}/${r.name}`} value={`${r.owner}/${r.name}`}>
              {r.owner}/{r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col pb-[1px]">
        <span className="text-[10px] text-slate-500 font-bold uppercase ml-1 mb-1">Date Filter</span>
        <DateFilter dateFilter={dateFilter} setDateFilter={setDateFilter} />
      </div>
    </div>
  );
};

export default GithubFilters;
