import React from "react";
import { Clock } from "lucide-react";



const CDCapacityTable = ({ recentActivity }) => {

    return (
        <div className="mb-8">
            {/* Recently Active Designers */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg  text-gray-800 mb-4">Recently Active Designers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recentActivity.slice(0, 8).map((designer) => (
                        <div key={designer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Clock size={16} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">{designer.name}</p>
                                    <p className="text-xs text-gray-400">Updated {new Date(designer.updatedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {recentActivity.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-4 col-span-4">No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CDCapacityTable;
