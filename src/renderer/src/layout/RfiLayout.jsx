import { useState } from "react";
import AddRFI from "../components/rfi/AddRFI";
import AllRFI from "../components/rfi/AllRfi";

const RfiLayout = () => {
  const [activeTab, setActiveTab] = useState("addRFI");

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 border-b rounded-t-2xl flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-3 items-end justify-end">
            <button
              onClick={() => setActiveTab("allRFI")}
              className={`px-1.5 md:px-4 py-2 rounded-lg ${
                activeTab === "allRFI"
                  ? "md:text-base text-sm bg-green-700 text-white font-bold"
                  : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
              }`}
            >
              ALL RFI
            </button>

            <button
              onClick={() => setActiveTab("addRFI")}
              className={`px-1.5 md:px-4 py-2 rounded-lg ${
                activeTab === "addRFI"
                  ? "md:text-base text-sm bg-green-700 text-white font-bold"
                  : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
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
            <AllRFI />
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

export default RfiLayout;
