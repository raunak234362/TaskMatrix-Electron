import React from "react";
import { Paperclip } from "lucide-react";

/**
 * A standard, high-aesthetics file item chip for use in list and details views.
 */
const FileItem = ({ 
    name, 
    onClick, 
    className = "" 
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 hover:border-[#6bbd45] hover:text-[#0f766e] hover:bg-[#6bbd45]/5 transition-all shadow-sm group ${className}`}
        >
            <Paperclip size={10} className="text-gray-400 group-hover:text-[#6bbd45]" />
            <span className="truncate max-w-[150px] uppercase tracking-tight">
                {name}
            </span>
        </button>
    );
};

export default FileItem;
