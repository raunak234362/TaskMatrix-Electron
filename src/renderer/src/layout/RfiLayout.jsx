import { useState } from "react";
import AddRFI from "../components/rfi/AddRFI";
import AllRFI from "../components/rfi/AllRfi";

// import GetRFQByID from "../components/rfq/GetRFQByID";


const RfiLayout = () => {
  const [activeTab, setActiveTab] = useState("addRFI");

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 flex flex-col justify-between items-start backdrop-blur-2xl bg-linear-to-t from-emerald-200/60 to-teal-600/50 border-b rounded-t-2xl ">
          <h1 className="text-2xl py-2 font-bold text-white">RFQ Detail</h1>
          <div className="flex flex-row w-full">
            <button
              onClick={() => setActiveTab("allRFI")}
              className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                activeTab === "allRFI"
                  ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                  : "md:text-base text-sm text-white font-semibold"
              }`}
            >
              ALL RFI
            </button>

            <button
              onClick={() => setActiveTab("addRFI")}
              className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                activeTab === "addRFI"
                  ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                  : "md:text-base text-sm text-white font-semibold"
              }`}
            >
              Add RFI
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "allRFI" && (
          <div>
            <AllRFI/>
          </div>
        )}
        {activeTab === "addRFI" && (
          <div>
            <AddRFI />
          </div>
        )}
      </div>
    </div>
  );
};

export default RfiLayout