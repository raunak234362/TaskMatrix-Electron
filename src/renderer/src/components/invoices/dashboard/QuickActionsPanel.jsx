import React from "react";
import { Plus, Download, Send, FileText } from "lucide-react";


const QuickActionsPanel = ({ onRaiseInvoice, onDownloadReport, onSendReminders }) => {
    return (
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-green-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-green-100" />
                Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <button
                    onClick={onRaiseInvoice}
                    className="flex items-center justify-center gap-2 bg-white text-green-600 px-3 py-2.5 rounded-xl font-semibold hover:bg-green-50 transition-colors shadow-sm cursor-pointer text-sm sm:text-base"
                >
                    <Plus size={18} className="shrink-0" />
                    <span className="truncate">Raise New Invoice</span>
                </button>
                <button
                    onClick={onDownloadReport}
                    className="flex items-center justify-center gap-2 bg-white/10 text-white px-3 py-2.5 rounded-xl font-medium hover:bg-white/20 transition-colors backdrop-blur-sm cursor-pointer border border-white/20 text-sm sm:text-base"
                >
                    <Download size={18} className="shrink-0" />
                    <span className="truncate">Download Report</span>
                </button>
                <button
                    onClick={onSendReminders}
                    className="flex items-center justify-center gap-2 bg-white/10 text-white px-3 py-2.5 rounded-xl font-medium hover:bg-white/20 transition-colors backdrop-blur-sm cursor-pointer border border-white/20 text-sm sm:text-base"
                >
                    <Send size={18} className="shrink-0" />
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
