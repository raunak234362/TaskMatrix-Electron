import { useMemo, useState } from "react";
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
    <div className="py-3 hover:bg-green-50/10 transition-all border-b border-black/5 last:border-b-0">
      <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={handleToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-black tracking-tight leading-snug">
              {c.commit.message}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-gray-100 text-black/60 border border-black/5 px-1.5 py-0.5 rounded-none">
              {c.repoName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-black/45 font-bold uppercase tracking-widest">
            <span className="text-black/60 font-black">{c.employeeName}</span>
            <span>•</span>
            <a 
              href={c.html_url} 
              target="_blank" 
              rel="noreferrer" 
              onClick={(e) => e.stopPropagation()} 
              className="text-green-700 hover:underline font-mono"
            >
              {c.sha.substring(0, 7)}
            </a>
            <span>•</span>
            <span>
              {new Date(c.commit.author.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="shrink-0 mt-0.5 text-black/30 hover:text-black">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-black/5 animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div className="flex items-center gap-2 text-black/40 text-[10px] font-black uppercase tracking-widest">
              <div className="w-3.5 h-3.5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              Loading details...
            </div>
          ) : details ? (
            <div className="space-y-3">
              <div className="bg-gray-50 p-2.5 rounded-none border border-black/5 text-[11px] font-medium text-black whitespace-pre-wrap leading-relaxed">
                {c.commit.message}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-green-700 font-bold text-[10px] uppercase tracking-widest bg-green-50/40 px-2 py-1 rounded-none border border-green-200">
                  <PlusCircle className="w-3 h-3" />
                  <span>{details.stats?.additions || 0} Additions</span>
                </div>
                <div className="flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase tracking-widest bg-red-50/40 px-2 py-1 rounded-none border border-red-200">
                  <MinusCircle className="w-3 h-3" />
                  <span>{details.stats?.deletions || 0} Deletions</span>
                </div>
                <div className="flex items-center gap-1 text-black/60 font-bold text-[10px] uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-none border border-black/10">
                  <FileCode2 className="w-3 h-3" />
                  <span>{details.files?.length || 0} Files</span>
                </div>
              </div>

              {details.files && details.files.length > 0 && (
                <div className="bg-gray-50 rounded-none p-2 max-h-32 overflow-y-auto custom-scrollbar border border-black/5">
                  <ul className="space-y-1">
                    {details.files.map((file, fIdx) => (
                      <li key={fIdx} className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-black/60 font-mono truncate max-w-[200px]" title={file.filename}>{file.filename}</span>
                        <span className="shrink-0 ml-2">
                          <span className="text-green-700">+{file.additions}</span>
                          <span className="text-black/20 mx-1">/</span>
                          <span className="text-red-600">-{file.deletions}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] font-bold uppercase text-red-600">Failed to load details.</p>
          )}
        </div>
      )}
    </div>
  );
};

const CommitTimeline = ({ commits }) => {
  const groupedCommits = useMemo(() => {
    const groups = {};
    
    commits.forEach((c) => {
      const date = new Date(c.commit.author.date);
      const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(c);
    });

    return Object.entries(groups).map(([date, dayCommits]) => {
      dayCommits.sort((a, b) => new Date(b.commit.author.date) - new Date(a.commit.author.date));
      return {
        date,
        totalForDay: dayCommits.length,
        commits: dayCommits
      };
    });
  }, [commits]);

  if (groupedCommits.length === 0) {
    return (
      <div className="bg-white border border-black rounded-none p-5 shadow-sm h-full flex items-center justify-center min-h-[300px]">
        <p className="text-xs font-black uppercase tracking-widest text-black/55">No commits found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-black rounded-none p-5 shadow-sm h-full max-h-[600px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/10 shrink-0">
        <CalendarIcon className="w-4 h-4 text-black" />
        <h3 className="text-xs font-black uppercase tracking-widest text-black">Commit Timeline</h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
        {groupedCommits.map((group, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between border-b border-black/10 pb-1.5 mb-2 sticky top-0 bg-white z-10">
              <h4 className="font-black text-xs text-black uppercase tracking-widest">{group.date}</h4>
              <span className="text-[10px] font-black uppercase text-green-700 tracking-wider">
                {group.totalForDay} {group.totalForDay === 1 ? 'Commit' : 'Commits'}
              </span>
            </div>

            <div className="divide-y divide-black/5">
              {group.commits.map((c, cIdx) => (
                <TimelineCommit key={cIdx} c={c} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitTimeline;
