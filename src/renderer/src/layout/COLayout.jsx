import { useState } from "react";
import AllCO from "../components/co/AllCO";
import AddCO from "../components/co/AddCO";
import CoTable from "../components/co/CoTable";

const COLayout = ({
  project,
  changeOrderData = [],
  fetchProject,
  canCreate = true
}) => {
  const [changeOrderView, setChangeOrderView] = useState("list");
  const [selectedCoId, setSelectedCoId] = useState(null);

  const userRole = (sessionStorage.getItem("userRole") || "").toLowerCase().trim();
  const isCreationAllowed = canCreate && userRole !== "operation_executive_trainee";

  const handleCoSuccess = (createdCO) => {
    if (fetchProject) fetchProject();
    const createdId = createdCO?.id || createdCO?._id;
    if (createdId) {
      setSelectedCoId(createdId);
      setChangeOrderView("table");
    } else {
      setChangeOrderView("list");
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-start mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setChangeOrderView("list")}
            className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${
              changeOrderView === "list"
                ? "bg-green-50 text-black border-2 border-green-700/80"
                : "bg-gray-100 text-black border border-gray-300 hover:bg-gray-200"
            }`}
          >
            All Change Order
          </button>

          {isCreationAllowed && (
            <button
              onClick={() => setChangeOrderView("add")}
              className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${
                changeOrderView === "add"
                  ? "bg-green-50 text-black border-2 border-green-700/80"
                  : "bg-gray-100 text-black border border-gray-300 hover:bg-gray-200"
              }`}
            >
              Raise Change Order
            </button>
          )}
        </nav>
      </div>

      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {changeOrderView === "list" ? (
          <AllCO changeOrderData={changeOrderData} onUpdate={fetchProject} />
        ) : changeOrderView === "add" && isCreationAllowed ? (
          <AddCO
            project={project}
            onSuccess={handleCoSuccess}
            changeOrderData={changeOrderData}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-black">Change Order Table</h4>
              <button
                onClick={() => setChangeOrderView("list")}
                className="text-sm text-black hover:text-black font-medium cursor-pointer"
              >
                &larr; Back to List
              </button>
            </div>
            {selectedCoId && (
              <CoTable
                coId={selectedCoId}
                onSuccess={() => setChangeOrderView("add")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default COLayout;

