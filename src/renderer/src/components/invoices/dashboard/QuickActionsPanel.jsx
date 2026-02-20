import React from "react";
import { Plus, Download, Send, FileText } from "lucide-react";


const QuickActionsPanel = ({ onRaiseInvoice, onDownloadReport, onSendReminders }) => {
    return (
        <div className="bg-gray-100 rounded-3xl p-6 sm:p-8 border border-black shadow-sm">
            <h3 className="text-sm font-black text-black mb-6 flex items-center gap-2 uppercase tracking-widest">
                <FileText size={18} className="text-black/40" />
                Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                    onClick={onRaiseInvoice}
                    className="flex items-center justify-center gap-2 bg-white text-black border border-black px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-green-100 transition-all shadow-sm cursor-pointer"
                >
                    <Plus size={16} className="shrink-0" />
                    <span className="truncate">Raise New Invoice</span>
                </button>
                <button
                    onClick={onDownloadReport}
                    className="flex items-center justify-center gap-2 bg-white text-black border border-black px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-green-100 transition-all shadow-sm cursor-pointer"
                >
                    <Download size={16} className="shrink-0" />
                    <span className="truncate">Download Report</span>
                </button>
                <button
                    onClick={onSendReminders}
                    className="flex items-center justify-center gap-2 bg-white text-black border border-black px-4 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-green-100 transition-all shadow-sm cursor-pointer"
                >
                    <Send size={16} className="shrink-0" />
                    <span className="truncate">Send Reminders</span>
                </button>
                {/* Fill space or another action
                <button className="flex items-center justify-center gap-2 bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors backdrop-blur-sm cursor-pointer border border-white/20">
                    ... More Actions
                </button> */}
            </div>
        </div>
    );
};

export default QuickActionsPanel;
