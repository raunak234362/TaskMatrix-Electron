import React, { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, PlusCircle, MinusCircle, FileCode2 } from "lucide-react";
import { fetchCommitDetails } from "../../../../../api/githubApi";

const TimelineCommit = ({ c }) => {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!expanded && !details) {
      setLoading(true);
      const data = await fetchCommitDetails(c.repoOwner, c.repoName, c.sha);
      setDetails(data);
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  return (
    <div className="flex gap-3 relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-[3px] top-4 bottom-[-16px] w-[2px] bg-slate-100" />
      <div 
        onClick={handleToggle}
        className="absolute left-[-5px] top-0 w-5 h-5 rounded-full bg-white border-2 border-indigo-400 flex items-center justify-center cursor-pointer hover:border-indigo-600 transition-colors z-10"
      >
        {expanded ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />}
      </div>
      
      <div className="flex-1 bg-white border border-slate-100 rounded-lg p-3 shadow-sm hover:shadow transition-shadow cursor-pointer" onClick={handleToggle}>
        <p className="text-sm text-slate-800 leading-snug font-medium mb-2">{c.commit.message}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">{c.employeeName}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="text-xs text-indigo-600 font-mono">
            <a href={c.html_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline">
              {c.sha.substring(0, 7)}
            </a>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="text-xs text-slate-400">
            {new Date(c.commit.author.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                Loading details...
              </div>
            ) : details ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-slate-50 p-2 rounded-md border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                  {c.commit.message}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    <PlusCircle className="w-3 h-3" />
                    <span>{details.stats?.additions || 0} Additions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600 font-medium text-xs bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                    <MinusCircle className="w-3 h-3" />
                    <span>{details.stats?.deletions || 0} Deletions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    <FileCode2 className="w-3 h-3" />
                    <span>{details.files?.length || 0} Files</span>
                  </div>
                </div>

                {details.files && details.files.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-2 max-h-32 overflow-y-auto custom-scrollbar">
                    <ul className="space-y-1">
                      {details.files.map((file, fIdx) => (
                        <li key={fIdx} className="flex justify-between text-xs">
                          <span className="text-slate-600 font-mono truncate max-w-[200px]" title={file.filename}>{file.filename}</span>
                          <span className="shrink-0 ml-2">
                            <span className="text-emerald-600">+{file.additions}</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-rose-600">-{file.deletions}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-rose-500">Failed to load details.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CommitTimeline = ({ commits }) => {
  const groupedCommits = useMemo(() => {
    // Group by Date -> Repo -> Array of commits
    const groups = {};
    
    commits.forEach((c) => {
      const date = new Date(c.commit.author.date);
      const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      if (!groups[dateStr]) groups[dateStr] = {};
      if (!groups[dateStr][c.repoFullName]) groups[dateStr][c.repoFullName] = [];
      
      groups[dateStr][c.repoFullName].push(c);
    });

    return Object.entries(groups).map(([date, reposMap]) => {
      const totalForDay = Object.values(reposMap).reduce((acc, repoCommits) => acc + repoCommits.length, 0);
      return {
        date,
        totalForDay,
        repos: Object.entries(reposMap).map(([repoFullName, repoCommits]) => ({
          name: repoFullName,
          commits: repoCommits
        }))
      };
    });
  }, [commits]);

  if (groupedCommits.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500">No commits found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full max-h-[600px] flex flex-col">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 shrink-0">
        <CalendarIcon className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-800">Commit Timeline</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
        {groupedCommits.map((group, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 px-4 rounded-lg border border-slate-100">
              <h4 className="font-bold text-slate-800">{group.date}</h4>
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                {group.totalForDay} {group.totalForDay === 1 ? 'Commit' : 'Commits'}
              </span>
            </div>

            <div className="space-y-6 pl-2">
              {group.repos.map((repo, rIdx) => (
                <div key={rIdx} className="relative">
                  <h5 className="text-sm font-bold text-indigo-600 mb-3">{repo.name}</h5>
                  <div className="space-y-3">
                    {repo.commits.map((c, cIdx) => (
                      <TimelineCommit key={cIdx} c={c} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitTimeline;
