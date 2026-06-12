import React from "react";
import { GitCommit, Calendar, Layers, Clock } from "lucide-react";

const TeamOverviewCards = ({ commits, teamMembers, onUserClick }) => {
  const getStats = (memberId) => {
    const memberCommits = commits.filter((c) => c.employeeId === memberId);
    
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Calculate Today
    const today = memberCommits.filter(c => new Date(c.commit.author.date).toDateString() === todayStr).length;
    
    // Calculate This Week (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thisWeek = memberCommits.filter(c => new Date(c.commit.author.date) >= sevenDaysAgo).length;

    // Calculate This Month (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thisMonth = memberCommits.filter(c => new Date(c.commit.author.date) >= thirtyDaysAgo).length;

    // Active Repos
    const repos = new Set(memberCommits.map(c => c.repoName));
    
    // Last Commit
    let lastCommitDate = "N/A";
    if (memberCommits.length > 0) {
      // Commits are sorted desc
      const date = new Date(memberCommits[0].commit.author.date);
      lastCommitDate = `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }

    return { today, thisWeek, thisMonth, repos: repos.size, lastCommitDate };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {teamMembers.map((member) => {
        const stats = getStats(member.id);
        
        return (
          <div 
            key={member.id} 
            onClick={() => onUserClick && onUserClick(member.id)}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-indigo-300 group"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{member.name}</h3>
                <p className="text-sm text-slate-500 font-medium">Employee ID: {member.id}</p>
              </div>
              <div className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">GitHub</span>
                <span className="text-sm text-indigo-600 font-medium">@{member.github}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <GitCommit className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Today</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.today}</p>
              </div>
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Week</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.thisWeek}</p>
              </div>
              
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Month</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.thisMonth}</p>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase">Repos</span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{stats.repos}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Last Commit: <span className="font-semibold text-slate-800">{stats.lastCommitDate}</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamOverviewCards;
