import React from "react";
import { UserPlus } from "lucide-react";


const CDInsightsList = ({ insights }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Recently Added */}
      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={20} className="text-blue-500" />
          <h3 className="text-md  text-blue-800">
            Recently Onboarded
          </h3>
        </div>
        <div className="space-y-2">
          {insights.recentlyAdded.slice(0, 4).map((name, i) => (
            <div
              key={i}
              className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-sm"
            >
              <span className="text-sm font-medium text-gray-700">{name}</span>
            </div>
          ))}
          {insights.recentlyAdded.length === 0 && (
            <p className="text-xs text-gray-500 italic">No recent additions.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CDInsightsList;
