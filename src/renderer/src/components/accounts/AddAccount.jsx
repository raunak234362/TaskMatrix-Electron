import { useForm } from "react-hook-form";
import Input from "../fields/input";
import Button from "../fields/Button";
import Service from "../../api/Service";
import { toast } from "react-toastify";


const AddAccount = ({ onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Submit logic
  const onSubmit = async (formData) => {
    const payload = {
      abaRoutingNumber: formData.abaRoutingNumber,
      accountNumber: formData.accountNumber,
      accountName: formData.accountName,
      paymentMethod: formData.paymentMethod,
      institutionNumber: formData.institutionNumber,
      transitNumber: formData.transitNumber,
      bankName: formData.bankName,
      accountType: formData.accountType,
      beneficiaryInfo: formData.beneficiaryInfo,
      beneficiaryAddress: formData.beneficiaryAddress,
      bankInfo: formData.bankInfo,
      bankAddress: formData.bankAddress,
    };

    console.log("Bank Account Payload ===>", payload);

    try {
      await Service.AddBankAccount(payload);
      toast.success("Bank details added successfully");
      reset();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error adding bank account:", error);
      toast.error("Failed to add bank account details");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full mx-auto border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-xl font-black text-black tracking-tight uppercase">
            Add Bank Account Details
          </h1>
          <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
            ENTER DETAILS TO LINK A BANK ACCOUNT
          </p>
        </div>
       
      </header>

      {/* FORM */}
      <div className="p-8 h-[70vh] overflow-y-auto custom-scrollbar">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Account Details Section */}
          <fieldset className="border border-gray-200 p-6 rounded-xl bg-gray-50/30">
            <legend className="text-xs font-black text-black uppercase tracking-widest px-3 bg-white border border-gray-200 rounded-full">
              Account Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="space-y-1">
                <Input
                  label="Account Name *"
                  placeholder="Enter Account Name"
                  {...register("accountName", {
                    required: "Account Name is required",
                  })}
                />
                {errors.accountName && (
                  <p className="text-red-500 text-xs">
                    {errors.accountName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  label="Account Number *"
                  placeholder="Enter Account Number"
                  {...register("accountNumber", {
                    required: "Account Number is required",
                  })}
                />
                {errors.accountNumber && (
                  <p className="text-red-500 text-xs">
                    {errors.accountNumber.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  label="Account Type *"
                  placeholder="Savings / Current"
                  {...register("accountType", {
                    required: "Account Type is required",
                  })}
                />
                {errors.accountType && (
                  <p className="text-red-500 text-xs">
                    {errors.accountType.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  label="Payment Method *"
                  placeholder="Enter Payment Method"
                  {...register("paymentMethod", {
                    required: "Payment Method is required",
                  })}
                />
                {errors.paymentMethod && (
                  <p className="text-red-500 text-xs">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Bank Details Section */}
          <fieldset className="border border-gray-200 p-6 rounded-xl bg-gray-50/30">
            <legend className="text-xs font-black text-black uppercase tracking-widest px-3 bg-white border border-gray-200 rounded-full">
              Bank Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="space-y-1">
                <Input
                  label="Bank Name"
                  placeholder="Enter Bank Name"
                  {...register("bankName")}
                />
              </div>
              <div className="space-y-1">
                <Input
                  label="Bank Info"
                  placeholder="Enter Bank Info"
                  {...register("bankInfo")}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Input
                  label="Bank Address"
                  placeholder="Enter Bank Address"
                  {...register("bankAddress")}
                />
              </div>
              <div className="space-y-1">
                <Input
                  label="ABA Routing Number"
                  placeholder="Enter ABA Routing Number"
                  {...register("abaRoutingNumber")}
                />
              </div>
              <div className="space-y-1">
                <Input
                  label="Institution Number"
                  placeholder="Enter Institution Number"
                  {...register("institutionNumber")}
                />
              </div>
              <div className="space-y-1">
                <Input
                  label="Transit Number"
                  placeholder="Enter Transit Number"
                  {...register("transitNumber")}
                />
              </div>
            </div>
          </fieldset>

          {/* Beneficiary Details Section */}
          <fieldset className="border border-gray-200 p-6 rounded-xl bg-gray-50/30">
            <legend className="text-xs font-black text-black uppercase tracking-widest px-3 bg-white border border-gray-200 rounded-full">
              Beneficiary Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="space-y-1">
                <Input
                  label="Beneficiary Info"
                  placeholder="Enter Beneficiary Info"
                  {...register("beneficiaryInfo")}
                />
              </div>
              <div className="space-y-1">
                <Input
                  label="Beneficiary Address"
                  placeholder="Enter Beneficiary Address"
                  {...register("beneficiaryAddress")}
                />
              </div>
            </div>
          </fieldset>
        </form>
      </div>

      {/* Footer */}
      <footer className="footer-actions p-6 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="add-account-form"
          className="px-6 py-1.5 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all active:scale-95"
          onClick={handleSubmit(onSubmit)}
        >
          Save Bank Details
        </button>
      </footer>
    </div>
  );
};

export default AddAccount;
