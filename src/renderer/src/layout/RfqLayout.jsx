import { useState } from "react";
import AddRFQ from "../components/rfq/AddRFQ";
import AllRFQ from "../components/rfq/AllRFQ";

import { useSelector } from "react-redux";
// import GetRFQByID from "../components/rfq/GetRFQByID";

const RfqLayout = () => {
  const [activeTab, setActiveTab] = useState("allRFQ");
  const rfq = useSelector((state) => state.RFQInfos?.RFQData);
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-4 items-center justify-end">
            <button
              onClick={() => setActiveTab("allRFQ")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "allRFQ"
                ? "bg-[#ebf5ea] text-black border-black shadow-sm"
                : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
                }`}
            >
              All RFQ
            </button>

            <button
              onClick={() => setActiveTab("addRFQ")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "addRFQ"
                ? "bg-[#ebf5ea] text-black border-black shadow-sm"
                : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
                }`}
            >
              Create RFQ
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "allRFQ" && (
          <div>
            <AllRFQ rfq={rfq} />
          </div>
        )}
        {activeTab === "addRFQ" && (
          <div>
            <AddRFQ onSuccess={() => setActiveTab("allRFQ")} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RfqLayout;
