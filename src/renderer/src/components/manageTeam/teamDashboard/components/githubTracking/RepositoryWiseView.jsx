import { useMemo, useState } from "react";
import { GitBranch, GitCommit, Clock, ChevronDown, ChevronUp, FileCode2, PlusCircle, MinusCircle } from "lucide-react";
import { fetchCommitDetails } from "../../../../../api/githubApi";

const CommitRow = ({ c, repoOwner, repoName }) => {
  const [expanded, setExpanded] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!expanded && !details) {
      setLoading(true);
      const data = await fetchCommitDetails(repoOwner, repoName, c.sha);
      setDetails(data);
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  return (
    <>
      <tr 
        onClick={handleToggle} 
        className="hover:bg-green-50/20 border-b border-black/5 transition-colors cursor-pointer group"
      >
        <td className="px-4 py-3 text-black font-semibold text-xs whitespace-nowrap">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-black/40" /> : <ChevronDown className="w-3.5 h-3.5 text-black/40 group-hover:text-green-600 transition-colors" />}
            <div>
              {new Date(c.commit.author.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} <br/>
              <span className="text-[10px] text-black/40 font-bold uppercase">
                {new Date(c.commit.author.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-black font-semibold text-xs max-w-[200px] truncate" title={c.commit.message}>
          {c.commit.message}
        </td>
        <td className="px-4 py-3 text-black/60 font-black uppercase tracking-widest text-[10px]">
          {c.employeeName}
        </td>
        <td className="px-4 py-3 text-green-700 font-mono text-[10px] font-bold">
          <a href={c.html_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline">
            {c.sha.substring(0, 7)}
          </a>
        </td>
      </tr>
      
      {expanded && (
        <tr className="bg-gray-50/50 border-b border-black/10">
          <td colSpan="4" className="px-8 py-4">
            {loading ? (
              <div className="flex items-center gap-2 text-black/40 text-[10px] font-black uppercase tracking-widest">
                <div className="w-3.5 h-3.5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                Loading commit details...
              </div>
            ) : details ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-white p-3 rounded-none border border-black/10 text-xs font-semibold text-black whitespace-pre-wrap">
                  {c.commit.message}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 text-green-700 font-bold text-[10px] uppercase tracking-widest bg-green-50/50 px-2 py-1 rounded-none border border-green-300">
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{details.stats?.additions || 0} Additions</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase tracking-widest bg-red-50/50 px-2 py-1 rounded-none border border-red-300">
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>{details.stats?.deletions || 0} Deletions</span>
                  </div>
                  <div className="flex items-center gap-1 text-black/60 font-bold text-[10px] uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-none border border-black/15">
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>{details.files?.length || 0} Files Changed</span>
                  </div>
                </div>

                {details.files && details.files.length > 0 && (
                  <div className="bg-white border border-black/10 rounded-none overflow-hidden">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-gray-50 sticky top-0 border-b border-black/10">
                          <tr>
                            <th className="px-3 py-2 font-black uppercase tracking-widest text-black/60">File Name</th>
                            <th className="px-3 py-2 font-black uppercase tracking-widest text-black/60 text-right w-24">Changes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {details.files.map((file, fIdx) => (
                            <tr key={fIdx}>
                              <td className="px-3 py-2 text-black/70 font-mono truncate max-w-[300px] font-bold" title={file.filename}>
                                {file.filename}
                              </td>
                              <td className="px-3 py-2 text-right font-bold">
                                <span className="text-green-700">+{file.additions}</span>
                                <span className="text-black/20 mx-1">/</span>
                                <span className="text-red-600">-{file.deletions}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] font-black uppercase text-red-600">Failed to load commit details.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

const RepositoryWiseView = ({ commits, repos }) => {
  const repoStats = useMemo(() => {
    return repos.map(repo => {
      const repoFullName = `${repo.owner}/${repo.name}`;
      const repoCommits = commits.filter(c => c.repoFullName === repoFullName);
      
      let lastCommitDate = "N/A";
      let latestMessage = "N/A";
      
      if (repoCommits.length > 0) {
        const date = new Date(repoCommits[0].commit.author.date);
        lastCommitDate = `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        latestMessage = repoCommits[0].commit.message;
      }

      return {
        ...repo,
        totalCommits: repoCommits.length,
        lastCommitDate,
        latestMessage,
        commits: repoCommits,
        repoFullName: `${repo.owner}/${repo.name}`
      };
    });
  }, [commits, repos]);

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-black" />
        Repository Wise View
      </h3>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {repoStats.map((repo, idx) => (
          <div key={idx} className="bg-white border border-black rounded-none overflow-hidden shadow-sm flex flex-col h-full max-h-[600px]">
            {/* Header */}
            <div className="bg-gray-50 border-b border-black/10 p-5 shrink-0">
              <div className="flex justify-between items-start mb-4 gap-4">
                <h4 className="text-xs font-black text-green-700 uppercase tracking-widest">{repo.repoFullName}</h4>
                <div className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-300 px-2.5 py-0.5 rounded-none text-[10px] font-black uppercase tracking-widest shrink-0">
                  <GitCommit className="w-3 h-3" />
                  {repo.totalCommits} Commits
                </div>
              </div>
              
              <div className="space-y-2 text-[10px] font-black uppercase tracking-widest text-black/55">
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-black/40 shrink-0" />
                  <span>Last Commit: <span className="font-bold text-black">{repo.lastCommitDate}</span></span>
                </div>
                <div className="flex items-start gap-2">
                  <GitCommit className="w-3.5 h-3.5 text-black/40 shrink-0" />
                  <span className="line-clamp-1" title={repo.latestMessage}>Latest: <span className="font-bold text-black">{repo.latestMessage}</span></span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white sticky top-0 shadow-sm z-10 border-b border-black/10">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/60 whitespace-nowrap">Date & Time</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/60">Commit Message</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/60">Author</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-black/60 whitespace-nowrap">SHA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {repo.commits.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-xs font-black uppercase tracking-widest text-black/40">
                        No commits found for this repository.
                      </td>
                    </tr>
                  ) : (
                    repo.commits.map((c, cIdx) => (
                      <CommitRow 
                        key={cIdx} 
                        c={c} 
                        repoOwner={repo.owner} 
                        repoName={repo.name} 
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepositoryWiseView;
