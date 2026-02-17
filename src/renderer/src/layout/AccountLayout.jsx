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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "allAccounts"
                ? "bg-[#ebf5ea] text-black border-black shadow-sm"
                : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
              }`}
          >
            All Accounts
          </button>

          <button
            onClick={() => setActiveTab("addAccount")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "addAccount"
                ? "bg-[#ebf5ea] text-black border-black shadow-sm"
                : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
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
