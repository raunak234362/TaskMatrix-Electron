import { useState } from "react";
import AllCO from "../components/co/AllCO";
import AddCO from "../components/co/AddCO";

const COLayout = () => {
  const [activeTab, setActiveTab] = useState("allCO");

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 border-b rounded-t-2xl flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-3 items-end justify-end">
            <button
              onClick={() => setActiveTab("allCO")}
              className={`px-1.5 md:px-4 py-2 rounded-lg ${activeTab === "allCO"
                  ? "md:text-base text-sm bg-green-700 text-white "
                  : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
                }`}
            >
              ALL CO
            </button>

            <button
              onClick={() => setActiveTab("addCO")}
              className={`px-1.5 md:px-4 py-2 rounded-lg ${activeTab === "addCO"
                  ? "md:text-base text-sm bg-green-700 text-white "
                  : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
                }`}
            >
              Add CO
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "allCO" && (
          <div>
            <AllCO />
          </div>
        )}
        {activeTab === "addCO" && (
          <div>
            <AddCO onSuccess={() => setActiveTab("allCO")} />
          </div>
        )}
      </div>
    </div>
  );
};

export default COLayout;
