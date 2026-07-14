const fs = require('fs');
const path = './src/renderer/src/components/project/MeasDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `
                                                                <div className="col-span-2">
                                                                    <p className="font-normal text-black truncate">{t.name || "—"}</p>
                                                                    <p className="text-xs text-black/60 uppercase mt-0.5">{t.wbsType || "Task"}</p>
                                                                </div>
                                                                <div className="text-right">{allocated.toFixed(2)}h</div>
                                                                <div className="text-right font-normal">{worked.toFixed(2)}h</div>
                                                                <div className="text-right">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded-none text-xs border"
                                                                        style={{
                                                                            backgroundColor: over ? "#fef3c7" : "#eff6ff",
                                                                            color: over ? "#d97706" : "#2563eb",
                                                                            borderColor: over ? "#d97706" : "#2563eb",
                                                                        }}
                                                                    >
                                                                        {over ? "+" : ""}{dev}%
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded-none text-xs font-normal border"
                                                                        style={{
                                                                            backgroundColor: getMEASBg(acc),
                                                                            color: getMEASColor(acc),
                                                                            borderColor: getMEASColor(acc),
                                                                        }}
                                                                    >
                                                                        {acc.toFixed(0)}
                                                                    </span>
                                                                </div>
                                                                <div className="text-end">
                                                                    <span className="px-2 py-0.5 rounded-none text-xs uppercase tracking-wider border border-black bg-slate-50 text-black font-normal">
                                                                        {t.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
`;

const oldWrapperStart = `
                                                            <div
                                                                key={t.id}
                                                                onClick={() => setSelectedTaskId(t.id)}
                                                                className="grid grid-cols-7 gap-4 p-4 hover:bg-gray-50/50 transition-colors cursor-pointer items-center text-sm font-normal text-black"
                                                            >
`;

const replaceIndex = content.indexOf(oldWrapperStart);
if (replaceIndex === -1) {
    console.error("Could not find wrapper start");
    process.exit(1);
}

const newWrapperStart = `
                                                            <div
                                                                key={t.id}
                                                                className="flex flex-col border-b border-black/10 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                                onClick={() => setSelectedTaskId(t.id)}
                                                            >
                                                              <div className="grid grid-cols-7 gap-4 p-4 items-center text-sm font-normal text-black">
`;

content = content.replace(oldWrapperStart, newWrapperStart);

const newCode = `
                                                                <div className="col-span-2">
                                                                    <p className="font-normal text-black truncate">{t.name || "—"}</p>
                                                                    <p className="text-xs text-black/60 uppercase mt-0.5">
                                                                        {t.wbsType || "Task"} {t.created_on ? \` • \${new Date(t.created_on).toLocaleDateString()}\` : ""}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">{allocated.toFixed(2)}h</div>
                                                                <div className="text-right font-normal">{worked.toFixed(2)}h</div>
                                                                <div className="text-right">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded-none text-xs border"
                                                                        style={{
                                                                            backgroundColor: over ? "#fef3c7" : "#eff6ff",
                                                                            color: over ? "#d97706" : "#2563eb",
                                                                            borderColor: over ? "#d97706" : "#2563eb",
                                                                        }}
                                                                    >
                                                                        {over ? "+" : ""}{dev}%
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded-none text-xs font-normal border"
                                                                        style={{
                                                                            backgroundColor: getMEASBg(acc),
                                                                            color: getMEASColor(acc),
                                                                            borderColor: getMEASColor(acc),
                                                                        }}
                                                                    >
                                                                        {acc.toFixed(0)}
                                                                    </span>
                                                                </div>
                                                                <div className="text-end">
                                                                    <span className="px-2 py-0.5 rounded-none text-xs uppercase tracking-wider border border-black bg-slate-50 text-black font-normal">
                                                                        {t.status}
                                                                    </span>
                                                                </div>
                                                              </div>
                                                              {t.taskcomment && t.taskcomment.length > 0 && t.taskcomment[0].data && (
                                                                  <div className="px-4 pb-4">
                                                                      <div 
                                                                          className="text-xs text-black bg-white p-3 border border-black shadow-sm"
                                                                          dangerouslySetInnerHTML={{ __html: t.taskcomment[0].data }}
                                                                      />
                                                                  </div>
                                                              )}
                                                            </div>
                                                        );
`;

content = content.replace(oldCode, newCode);

fs.writeFileSync(path, content);
console.log("Patched task rendering");
