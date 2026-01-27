import { useEffect, useState } from "react";
import AddAccount from "../components/accounts/AddAccount";
import AllAccounts from "../components/accounts/AllAccounts";
import Service from "../api/Service";

const AccountLayout = () => {
  const [activeTab, setActiveTab] = useState("allAccounts");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await Service.GetBankAccounts();
      const data = response?.data || response || []
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching accounts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab("allAccounts")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${
              activeTab === "allAccounts"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
            }`}
          >
            All Accounts
          </button>

          <button
            onClick={() => setActiveTab("addAccount")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${
              activeTab === "addAccount"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
            }`}
          >
            Add Account
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "allAccounts" && (
          <div>
            <AllAccounts accounts={accounts} loading={loading} />
          </div>
        )}
        {activeTab === "addAccount" && (
          <div>
            <AddAccount
              onSuccess={() => {
                fetchAccounts();
                setActiveTab("allAccounts");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountLayout;
