import React, { useMemo, useState } from "react";
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
        className="hover:bg-slate-50 transition-colors cursor-pointer group"
      >
        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
            <div>
              {new Date(c.commit.author.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} <br/>
              <span className="text-xs text-slate-400">
                {new Date(c.commit.author.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-slate-800 font-medium max-w-[200px] truncate" title={c.commit.message}>
          {c.commit.message}
        </td>
        <td className="px-4 py-3 text-slate-600">
          {c.employeeName}
        </td>
        <td className="px-4 py-3 text-indigo-600 font-mono text-xs">
          <a href={c.html_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline">
            {c.sha.substring(0, 7)}
          </a>
        </td>
      </tr>
      
      {expanded && (
        <tr className="bg-slate-50/80 border-b border-slate-200">
          <td colSpan="4" className="px-10 py-4">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                Loading commit details...
              </div>
            ) : details ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-white p-3 rounded-md border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                  {c.commit.message}
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    <PlusCircle className="w-4 h-4" />
                    <span>{details.stats?.additions || 0} Additions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-600 font-medium text-sm bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                    <MinusCircle className="w-4 h-4" />
                    <span>{details.stats?.deletions || 0} Deletions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-sm bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    <FileCode2 className="w-4 h-4" />
                    <span>{details.files?.length || 0} Files Changed</span>
                  </div>
                </div>

                {details.files && details.files.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 font-semibold text-slate-600">File Name</th>
                            <th className="px-3 py-2 font-semibold text-slate-600 text-right w-24">Changes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {details.files.map((file, fIdx) => (
                            <tr key={fIdx}>
                              <td className="px-3 py-2 text-slate-700 font-mono truncate max-w-[300px]" title={file.filename}>
                                {file.filename}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-emerald-600">+{file.additions}</span>
                                <span className="text-slate-300 mx-1">/</span>
                                <span className="text-rose-600">-{file.deletions}</span>
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
              <p className="text-sm text-rose-500">Failed to load commit details.</p>
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
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <GitBranch className="w-6 h-6 text-indigo-600" />
        Repository Wise View
      </h3>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {repoStats.map((repo, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full max-h-[600px]">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-6 shrink-0">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-bold text-indigo-700">{repo.repoFullName}</h4>
                <div className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                  <GitCommit className="w-4 h-4" />
                  {repo.totalCommits} Commits
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-600">Last Commit: <span className="font-semibold text-slate-800">{repo.lastCommitDate}</span></span>
                </div>
                <div className="flex items-start gap-2">
                  <GitCommit className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-600 line-clamp-1" title={repo.latestMessage}>Latest: <span className="font-medium text-slate-800">{repo.latestMessage}</span></span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-white sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">Date & Time</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Commit Message</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200">Author</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">SHA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repo.commits.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
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
