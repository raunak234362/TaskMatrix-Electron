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


const GetAccountByID = ({ id }) => {
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
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading account details...
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Account not found"}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-linear-to-br from-green-50 to-white rounded-xl shadow-sm border border-green-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Building2 className="w-6 h-6 text-green-700" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-green-900">
            {account.accountName}
          </h3>
          <p className="text-sm text-green-600">{account.bankName}</p>
        </div>
      </div>

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
        <div className="mt-6 p-4 bg-white/50 rounded-lg border border-gray-100">
          <p className="text-xs uppercase text-gray-500 mb-1">Bank Address</p>
          <p className="text-gray-700">{account.bankAddress}</p>
        </div>
      )}
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
