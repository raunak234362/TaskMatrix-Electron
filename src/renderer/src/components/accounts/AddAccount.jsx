import { useForm } from "react-hook-form";
import Input from "../fields/input";
import Button from "../fields/Button";
import Service from "../../api/Service";
import { toast } from "react-toastify";


const AddAccount = ({ onSuccess }) => {
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
    } catch (error) {
      console.error("Error adding bank account:", error);
      toast.error("Failed to add bank account details");
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full mx-auto">
      {/* Header */}
      <header className="mb-6 border-b pb-4 border-green-200">
        <h1 className="text-3xl font-extrabold text-green-700">
          Add Bank Account Details
        </h1>
        <p className="text-gray-700">Enter details to link a bank account.</p>
      </header>

      {/* FORM */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Account Details Section */}
        <fieldset className="border p-4 rounded-lg shadow-inner">
          <legend className="text-lg font-semibold text-green-600 px-2">
            Account Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {errors.accountName.message  }
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
                  {errors.accountNumber.message  }
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
                  {errors.accountType.message  }
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
                  {errors.paymentMethod.message  }
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Bank Details Section */}
        <fieldset className="border p-4 rounded-lg shadow-inner">
          <legend className="text-lg font-semibold text-green-600 px-2">
            Bank Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <fieldset className="border p-4 rounded-lg shadow-inner">
          <legend className="text-lg font-semibold text-green-600 px-2">
            Beneficiary Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Submit */}
        <Button
          type="submit"
          className="mt-8 bg-green-700 hover:bg-green-800 text-white w-full py-3 text-lg font-bold shadow-lg transition"
        >
          Save Bank Account Details
        </Button>
      </form>
    </div>
  );
};

export default AddAccount;
