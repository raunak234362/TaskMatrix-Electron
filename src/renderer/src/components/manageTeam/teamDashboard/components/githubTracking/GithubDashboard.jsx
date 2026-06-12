import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchGitHubCommits } from "../../../../../api/githubApi";
import TeamOverviewCards from "./TeamOverviewCards";
import CommitTimeline from "./CommitTimeline";
import RepositoryWiseView from "./RepositoryWiseView";
import VisualAnalytics from "./VisualAnalytics";
import GithubFilters from "./GithubFilters";
import { RefreshCw } from "lucide-react";

const TEAM_MEMBERS = [
  { id: "WBT-171", name: "Raunakdeep Srivastava", github: "raunak234362" },
  { id: "TR78-WBT", name: "Siddhi Singh Rathor", github: "siddhisinghrathor" },
  { id: "WBT-214", name: "Gowtham", github: "Gowtham-beep" },
];

const REPOS = [
  { owner: "raunak234362", name: "TaskMatrix-Electron" },
  { owner: "raunak234362", name: "ProjectStation-PWA" },
  { owner: "wbtit", name: "WBT-AI" },
  { owner: "wbtit", name: "engineering-file-platform" },
  { owner: "wbtit", name: "QuizCave" },
  { owner: "wbtit", name: "WBTportfolioBE" },
  { owner: "wbtit", name: "P-T_backend_ts" },
  { owner: "wbtit", name: "ProjectStationBE" },
  { owner: "raunak234362", name: "ProjectStation-FE" },
  { owner: "raunak234362", name: "whiteboardtec-react" },
  { owner: "raunak234362", name: "QuizCave" },
  { owner: "raunak234362", name: "Task-Matrix" },
];

const GithubDashboard = () => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Filters state
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [selectedRepo, setSelectedRepo] = useState("ALL");
  const [dateFilter, setDateFilter] = useState({ 
    type: "month", 
    month: new Date().getMonth(), 
    year: new Date().getFullYear() 
  });

  const fetchAllData = useCallback(async (forceRefresh = false) => {
    // Basic caching mechanism to avoid rate limit
    const cacheKey = "github_dashboard_commits_v3";
    const cachedTimeKey = "github_dashboard_time_v3";
    
    if (!forceRefresh) {
      const cachedData = sessionStorage.getItem(cacheKey);
      const cachedTime = sessionStorage.getItem(cachedTimeKey);
      
      if (cachedData && cachedTime) {
        // Check if cache is less than 30 mins old
        const now = new Date().getTime();
        const thirtyMins = 30 * 60 * 1000;
        if (now - parseInt(cachedTime) < thirtyMins) {
          setCommits(JSON.parse(cachedData));
          setLastRefreshed(new Date(parseInt(cachedTime)));
          setLoading(false);
          return;
        }
      }
    }

    setLoading(true);
    let allCommits = [];

    // Date calculations
    const now = new Date();
    // Default fetch up to 30 days of data at a time to keep local processing manageable
    const sinceDate = new Date();
    sinceDate.setDate(now.getDate() - 30);

    for (const member of TEAM_MEMBERS) {
      for (const repo of REPOS) {
        const repoCommits = await fetchGitHubCommits(
          repo.owner,
          repo.name,
          member.github,
          null, // Fetch latest 100 commits regardless of date
          null
        );

        // Add metadata for easier filtering later
        const enrichedCommits = repoCommits.map(c => ({
          ...c,
          employeeId: member.id,
          employeeName: member.name,
          repoName: repo.name,
          repoOwner: repo.owner,
          repoFullName: `${repo.owner}/${repo.name}`,
        }));
        allCommits = [...allCommits, ...enrichedCommits];
      }
    }

    // Sort by date desc
    allCommits.sort((a, b) => new Date(b.commit.author.date) - new Date(a.commit.author.date));

    setCommits(allCommits);
    const refreshedTime = new Date();
    setLastRefreshed(refreshedTime);
    sessionStorage.setItem(cacheKey, JSON.stringify(allCommits));
    sessionStorage.setItem(cachedTimeKey, refreshedTime.getTime().toString());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
    // Auto refresh every 30 minutes
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Apply Filters
  const filteredCommits = useMemo(() => {
    let filtered = commits;

    if (selectedEmployee !== "ALL") {
      filtered = filtered.filter(c => c.employeeId === selectedEmployee);
    }

    if (selectedRepo !== "ALL") {
      filtered = filtered.filter(c => c.repoFullName === selectedRepo);
    }

    // Date filter logic based on dateFilter object
    filtered = filtered.filter(c => {
      const commitDate = new Date(c.commit.author.date);
      commitDate.setHours(0, 0, 0, 0);

      if (dateFilter.type === "all") return true;

      if (dateFilter.type === "specificDate") {
        if (!dateFilter.date) return true;
        const d = new Date(dateFilter.date);
        d.setHours(0, 0, 0, 0);
        return commitDate.getTime() === d.getTime();
      }

      if (dateFilter.type === "month") {
        if (dateFilter.month === undefined || dateFilter.year === undefined) return true;
        return commitDate.getMonth() === dateFilter.month && commitDate.getFullYear() === dateFilter.year;
      }

      if (dateFilter.type === "year") {
        if (!dateFilter.year) return true;
        return commitDate.getFullYear() === dateFilter.year;
      }

      if (dateFilter.type === "week") {
        if (!dateFilter.weekStart || !dateFilter.weekEnd) return true;
        const start = new Date(dateFilter.weekStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter.weekEnd);
        end.setHours(23, 59, 59, 999);
        return commitDate >= start && commitDate <= end;
      }

      if (dateFilter.type === "dateRange") {
        if (!dateFilter.startDate || !dateFilter.endDate) return true;
        const start = new Date(dateFilter.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter.endDate);
        end.setHours(23, 59, 59, 999);
        return commitDate >= start && commitDate <= end;
      }

      if (dateFilter.type === "range") { // month range
        if (dateFilter.year === undefined || dateFilter.startMonth === undefined || dateFilter.endMonth === undefined) return true;
        if (commitDate.getFullYear() !== dateFilter.year) return false;
        return commitDate.getMonth() >= dateFilter.startMonth && commitDate.getMonth() <= dateFilter.endMonth;
      }

      return true;
    });

    return filtered;
  }, [commits, selectedEmployee, selectedRepo, dateFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">GitHub Commit Tracking</h2>
          {lastRefreshed && (
            <p className="text-sm text-slate-500">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-4 items-center w-full sm:w-auto">
          <GithubFilters
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            selectedRepo={selectedRepo}
            setSelectedRepo={setSelectedRepo}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            teamMembers={TEAM_MEMBERS}
            repos={REPOS}
          />
          <button
            onClick={() => fetchAllData(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 disabled:opacity-50 h-10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && commits.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <TeamOverviewCards 
            commits={filteredCommits} 
            teamMembers={TEAM_MEMBERS} 
            onUserClick={(memberId) => {
              setSelectedEmployee(memberId);
              document.getElementById('commit-timeline')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          
          <div id="commit-timeline" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisualAnalytics commits={filteredCommits} teamMembers={TEAM_MEMBERS} repos={REPOS} />
            <CommitTimeline commits={filteredCommits} />
          </div>

          <RepositoryWiseView commits={filteredCommits} repos={REPOS} />
        </div>
      )}
    </div>
  );
};

export default GithubDashboard;
