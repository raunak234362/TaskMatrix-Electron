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
            className="bg-white border-2 border-black/10 rounded-none p-5 shadow-sm hover:shadow-md hover:border-green-600 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-5 gap-4">
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-tight group-hover:text-green-700 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-[10px] text-black/50 font-black uppercase tracking-widest mt-1">
                    Employee ID: {member.id}
                  </p>
                </div>
                <div className="bg-gray-50 border border-black/15 px-3 py-1 rounded-none flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-black/60 font-black uppercase tracking-widest">GitHub</span>
                  <span className="text-xs text-green-700 font-bold">@{member.github}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-green-50/30 p-3 rounded-none border border-black/5 flex flex-col justify-between min-h-[70px]">
                  <div className="flex items-center gap-1 text-green-700 mb-1">
                    <GitCommit className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Today</span>
                  </div>
                  <p className="text-lg font-black text-black">{stats.today}</p>
                </div>
                
                <div className="bg-blue-50/30 p-3 rounded-none border border-black/5 flex flex-col justify-between min-h-[70px]">
                  <div className="flex items-center gap-1 text-blue-700 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Week</span>
                  </div>
                  <p className="text-lg font-black text-black">{stats.thisWeek}</p>
                </div>
                
                <div className="bg-indigo-50/30 p-3 rounded-none border border-black/5 flex flex-col justify-between min-h-[70px]">
                  <div className="flex items-center gap-1 text-indigo-700 mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Month</span>
                  </div>
                  <p className="text-lg font-black text-black">{stats.thisMonth}</p>
                </div>

                <div className="bg-amber-50/30 p-3 rounded-none border border-black/5 flex flex-col justify-between min-h-[70px]">
                  <div className="flex items-center gap-1 text-amber-700 mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Repos</span>
                  </div>
                  <p className="text-lg font-black text-black">{stats.repos}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-black/60 bg-gray-50/80 p-2.5 rounded-none border border-black/10 uppercase tracking-widest mt-2">
              <Clock className="w-3.5 h-3.5 text-black/40" />
              <span>Last Commit: <span className="font-bold text-black">{stats.lastCommitDate}</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamOverviewCards;
