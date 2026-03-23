/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Service from "../../api/Service";
import {
  Loader2,
  AlertCircle,
  Building2,
  CreditCard,
  Landmark,
  Hash,
} from "lucide-react";


const GetAccountByID = ({ id, onClose }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const response = await Service.GetBankAccountById(id);
      setAccount(response.data);
    } catch {
      setError("Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAccount();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-black bg-white rounded-2xl border border-gray-200 shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-[#6bbd45]" />
        <span className="text-sm font-black uppercase tracking-widest">Loading account details...</span>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex items-center justify-center p-12 text-red-600 bg-white rounded-2xl border border-gray-200 shadow-xl">
        <AlertCircle className="w-8 h-8 mr-3" />
        <span className="text-sm font-black uppercase tracking-widest">{error || "Account not found"}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#6bbd45]/15 rounded-xl text-[#6bbd45]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase">
              {account.accountName}
            </h2>
            <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
              {account.bankName}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
        >
          Close
        </button>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard
            icon={<Hash className="w-4 h-4" />}
            label="Account Number"
            value={account.accountNumber}
          />
          <InfoCard
            icon={<CreditCard className="w-4 h-4" />}
            label="Account Type"
            value={account.accountType}
          />
          <InfoCard
            icon={<Landmark className="w-4 h-4" />}
            label="ABA Routing Number"
            value={account.abaRoutingNumber || "—"}
          />
          <InfoCard
            icon={<Hash className="w-4 h-4" />}
            label="Institution Number"
            value={account.institutionNumber || "—"}
          />
          <InfoCard
            icon={<Hash className="w-4 h-4" />}
            label="Transit Number"
            value={account.transitNumber || "—"}
          />
          <InfoCard
            icon={<CreditCard className="w-4 h-4" />}
            label="Payment Method"
            value={account.paymentMethod || "—"}
          />
        </div>

        {account.bankAddress && (
          <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">BANK ADDRESS</p>
            <p className="text-sm font-bold text-black">{account.bankAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCard = ({
  icon,
  label,
  value,
}) => (
  <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 text-gray-500 mb-1">
      {icon}
      <span className="text-xs uppercase font-medium">{label}</span>
    </div>
    <p className="font-semibold text-gray-900 break-all">{value}</p>
  </div>
);

export default GetAccountByID;
