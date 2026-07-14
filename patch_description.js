const fs = require('fs');
const path = './src/renderer/src/components/project/MeasDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `
                            {/* Description / Comments */}
                            {task.description ? (
                                <div
                                    style={{
                                        background: "#f9fafb",
                                        border: "1px solid #000000",
                                        borderRadius: "0px",
                                        padding: "14px 16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: GREEN,
                                            letterSpacing: "1.5px",
                                            textTransform: "uppercase",
                                            marginBottom: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <FileText size={12} /> Description / Comments
                                    </div>
                                    <div
                                        style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7 }}
                                        dangerouslySetInnerHTML={{ __html: task.description }}
                                    />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        background: "#f9fafb",
                                        border: "1px dashed #000000",
                                        borderRadius: "0px",
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#000000",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                    }}
                                >
                                    No description or comments for this task.
                                </div>
                            )}
`;

const newCode = `
                            {/* Description / Comments */}
                            {(task.description || (task.taskcomment && task.taskcomment.length > 0)) ? (
                                <div
                                    style={{
                                        background: "#f9fafb",
                                        border: "1px solid #000000",
                                        borderRadius: "0px",
                                        padding: "14px 16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: GREEN,
                                            letterSpacing: "1.5px",
                                            textTransform: "uppercase",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <FileText size={12} /> Description / Comments
                                    </div>
                                    {task.description && (
                                        <div
                                            style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7 }}
                                            dangerouslySetInnerHTML={{ __html: task.description }}
                                        />
                                    )}
                                    {task.taskcomment && task.taskcomment.length > 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: task.description ? "8px" : "0", borderTop: task.description ? "1px dashed #000" : "none", paddingTop: task.description ? "8px" : "0" }}>
                                            {task.taskcomment.map(comment => (
                                                <div key={comment.id} style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: comment.data }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        background: "#f9fafb",
                                        border: "1px dashed #000000",
                                        borderRadius: "0px",
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#000000",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                    }}
                                >
                                    No description or comments for this task.
                                </div>
                            )}
`;

content = content.replace(oldCode.trim(), newCode.trim());

fs.writeFileSync(path, content);
console.log("Patched description to include comments");
