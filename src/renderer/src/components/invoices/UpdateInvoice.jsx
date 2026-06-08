import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Input from "../fields/input";
import Service from "../../api/Service";
import { toast } from "react-toastify";
import { Plus, Trash2, X, Save, Loader2 } from "lucide-react";
import { numberToWords } from "../../utils/numberToWords";
import Modal from "../ui/Modal";

const UpdateInvoice = ({ invoiceId, onClose, onSuccess }) => {
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      currencyType: "USD",
      totalInvoiceValue: 0,
      invoiceItems: [],
      accountInfo: []
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invoiceItems",
  });

  const watchedItems = watch("invoiceItems");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [accountsRes, invoiceRes, fabricatorsRes] = await Promise.all([
          Service.GetBankAccounts(),
          Service.GetInvoiceById(invoiceId),
          Service.GetAllFabricators(),
        ]);

        const accountsData = accountsRes?.data || accountsRes || [];
        setAccounts(Array.isArray(accountsData) ? accountsData : []);

        const invoiceData = invoiceRes?.data || invoiceRes;
        const fabricatorsData = fabricatorsRes?.data || fabricatorsRes || [];

        if (invoiceData) {
          // Find contacts for this fabricator if linked
          const fabricatorId = invoiceData.fabricator?._id || invoiceData.fabricator?.id || invoiceData.fabricatorId;
          if (fabricatorId) {
            const fabricator = fabricatorsData.find(f => f.id === fabricatorId || f._id === fabricatorId);
            if (fabricator && fabricator.pointOfContact) {
              setContacts(fabricator.pointOfContact);
            }
          }

          // Pre-fill form
          reset({
            customerName: invoiceData.customerName,
            receiptId: invoiceData.receiptId,
            GSTIN: invoiceData.GSTIN,
            address: invoiceData.address,
            stateCode: invoiceData.stateCode,
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toISOString().split('T')[0] : "",
            jobName: invoiceData.jobName,
            dateOfSupply: invoiceData.dateOfSupply ? new Date(invoiceData.dateOfSupply).toISOString().split('T')[0] : "",
            placeOfSupply: invoiceData.placeOfSupply,
            currencyType: invoiceData.currencyType || "USD",
            type: invoiceData.type || "",
            totalInvoiceValue: invoiceData.totalInvoiceValue,
            totalInvoiceValueInWords: invoiceData.totalInvoiceValueInWords,
            paymentStatus: invoiceData.paymentStatus === true || invoiceData.paymentStatus === "Paid",
            invoiceItems: invoiceData.invoiceItems || [],
            accountInfo: invoiceData.accountInfo || []
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load invoice data");
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) fetchData();
  }, [invoiceId, reset]);

  const handleCalculateTotal = () => {
    if (watchedItems) {
      const total = watchedItems.reduce(
        (sum, item) => sum + (Number(item.totalUSD) || 0),
        0
      );
      setValue("totalInvoiceValue", total);
      setValue(
        "totalInvoiceValueInWords",
        numberToWords(total, watch("currencyType"))
      );
    }
  };

  const handleAccountSelect = (e) => {
    const accountId = e.target.value;
    if (!accountId) return;

    const selectedAccount = accounts.find(
      (a) => a._id === accountId || a.id === accountId
    );
    if (selectedAccount) {
      const accountInfo = {
        abaRoutingNumber: selectedAccount.abaRoutingNumber || "",
        accountNumber: selectedAccount.accountNumber || "",
        accountName: selectedAccount.accountName || "",
        paymentMethod: selectedAccount.paymentMethod || "",
        institutionNumber: selectedAccount.institutionNumber || "",
        transitNumber: selectedAccount.transitNumber || "",
        bankName: selectedAccount.bankName || "",
        accountType: selectedAccount.accountType || "",
        beneficiaryInfo: selectedAccount.beneficiaryInfo || "",
        beneficiaryAddress: selectedAccount.beneficiaryAddress || "",
        bankInfo: selectedAccount.bankInfo || "",
        bankAddress: selectedAccount.bankAddress || "",
      };
      setValue("accountInfo", [accountInfo]);
    }
  };

  const onSubmit = async (data) => {
    const formattedData = {
      ...data,
      totalInvoiceValue: Number(data.totalInvoiceValue),
      invoiceItems: data.invoiceItems?.map((item) => ({
        ...item,
        rateUSD: Number(item.rateUSD),
        totalUSD: Number(item.totalUSD),
        unit: Number(item.unit),
        sacCode: item.sacCode ? String(item.sacCode) : "0",
      })),
    };

    let success = false;
    try {
      setIsSubmitting(true);
      await Service.UpdateInvoiceById(invoiceId, formattedData);
      success = true;
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsSubmitting(false);
    }

    if (success) {
      toast.success("Invoice updated successfully");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-full max-w-5xl mx-auto overflow-hidden flex flex-col max-h-[90vh]">
      <header className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
        <h3 className="text-lg font-bold text-gray-700 uppercase tracking-tight">Update Invoice #{watch("invoiceNumber")}</h3>
        <button
          onClick={onClose}
          className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-green-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Customer Details */}
          <fieldset className="border p-4 rounded-lg shadow-inner bg-white">
            <legend className="text-sm font-bold text-green-600 px-2 uppercase tracking-wider">
              Customer Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <Input label="Customer Name *" {...register("customerName", { required: true })} />
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt ID (Contact)</label>
                <select
                  {...register("receiptId")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium shadow-sm transition-all"
                >
                  <option value="">-- Select Contact --</option>
                  {contacts.map((contact) => (
                    <option key={contact._id || contact.id} value={contact.userName}>
                      {contact.userName} ({contact.email})
                    </option>
                  ))}
                  {watch("receiptId") && !contacts.some(c => c.userName === watch("receiptId")) && (
                    <option value={watch("receiptId")}>{watch("receiptId")} (Current)</option>
                  )}
                </select>
              </div>

              <Input label="GSTIN" {...register("GSTIN")} />
              <div className="md:col-span-2">
                <Input label="Address" {...register("address")} />
              </div>
              <Input label="State Code" {...register("stateCode")} />
            </div>
          </fieldset>

          {/* Invoice Details */}
          <fieldset className="border p-4 rounded-lg shadow-inner bg-white">
            <legend className="text-sm font-bold text-green-600 px-2 uppercase tracking-wider">
              Invoice Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <Input label="Invoice Number *" {...register("invoiceNumber", { required: true })} />
              <Input label="Invoice Date" type="date" {...register("invoiceDate")} />
              <Input label="Job Name *" {...register("jobName", { required: true })} />
              <Input label="Date of Supply" type="date" {...register("dateOfSupply")} />
              <Input label="Place of Supply" {...register("placeOfSupply")} />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  {...register("currencyType")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type</label>
                <select
                  {...register("type")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium"
                >
                  <option value="">-- Select Type --</option>
                  <option value="APPROVAL">Approval</option>
                  <option value="FABRICATION">Fabrication</option>
                  <option value="MTO">MTO</option>
                  <option value="CHANGE_ORDER">Change Order</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Invoice Items */}
          <fieldset className="border p-4 rounded-lg shadow-inner bg-white">
            <legend className="text-sm font-bold text-green-600 px-2 uppercase tracking-wider">
              Invoice Items
            </legend>
            <div className="space-y-4 mt-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4">
                  <div className="md:col-span-3">
                    <Input
                      label={index === 0 ? "Description *" : ""}
                      placeholder="Item description"
                      {...register(`invoiceItems.${index}.description`, { required: true })}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input
                      label={index === 0 ? "Unit *" : ""}
                      type="number"
                      {...register(`invoiceItems.${index}.unit`, {
                        required: true,
                        onChange: (e) => {
                          const unit = parseFloat(e.target.value) || 0;
                          const rate = watch(`invoiceItems.${index}.rateUSD`) || 0;
                          setValue(`invoiceItems.${index}.totalUSD`, unit * rate);
                        }
                      })}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Input label={index === 0 ? "SAC" : ""} type="number" {...register(`invoiceItems.${index}.sacCode`)} />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label={index === 0 ? "Rate *" : ""}
                      type="number"
                      step="any"
                      {...register(`invoiceItems.${index}.rateUSD`, {
                        required: true,
                        onChange: (e) => {
                          const rate = parseFloat(e.target.value) || 0;
                          const unit = watch(`invoiceItems.${index}.unit`) || 0;
                          setValue(`invoiceItems.${index}.totalUSD`, unit * rate);
                        }
                      })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input label={index === 0 ? "Total" : ""} type="number" readOnly {...register(`invoiceItems.${index}.totalUSD`)} />
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="md:col-span-12">
                    <Input label="Remarks" placeholder="Remarks" {...register(`invoiceItems.${index}.remarks`)} />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ description: "", unit: 1, rateUSD: 0, totalUSD: 0, sacCode: 0, remarks: "" })}
                className="flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
              >
                <Plus size={18} /> Add Item
              </button>
            </div>
          </fieldset>

          {/* Totals and Bank Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <fieldset className="border p-4 rounded-lg shadow-inner bg-white">
              <legend className="text-sm font-bold text-green-600 px-2 uppercase tracking-wider">Summary</legend>
              <div className="space-y-4 mt-2">
                 <div className="flex justify-between items-center text-xl font-bold text-black bg-green-50 p-4 rounded-lg border border-green-100">
                  <span>Total Value:</span>
                  <span>{watch("currencyType")} {Number(watch("totalInvoiceValue")).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCalculateTotal}
                  className="w-full px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
                >
                  Regenerate Total & Words
                </button>
                <Input label="Total in Words" readOnly {...register("totalInvoiceValueInWords")} />
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-lg shadow-inner bg-white">
              <legend className="text-sm font-bold text-green-600 px-2 uppercase tracking-wider">Payment & Bank Info</legend>
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <input type="checkbox" {...register("paymentStatus")} id="paymentStatus" className="w-5 h-5 accent-green-600 cursor-pointer" />
                  <label htmlFor="paymentStatus" className="text-sm font-bold text-gray-700 cursor-pointer uppercase">Mark as Paid</label>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Change Bank Account</label>
                  <select
                    onChange={handleAccountSelect}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium shadow-sm transition-all"
                  >
                    <option value="">-- Select to Override Bank --</option>
                    {accounts.map((account) => (
                      <option key={account._id || account.id} value={account._id || account.id}>
                        {account.accountName} ({account.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {watch("accountInfo")?.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-sm shadow-sm">
                    <p className="font-bold text-green-800 uppercase text-[10px] mb-2 tracking-widest">Active Bank Account Details</p>
                    <p className="font-bold text-gray-900">{watch("accountInfo")[0].accountName}</p>
                    <p className="text-gray-600">{watch("accountInfo")[0].bankName}</p>
                    <p className="text-gray-600 font-medium">No: {watch("accountInfo")[0].accountNumber}</p>
                  </div>
                )}
              </div>
            </fieldset>
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 flex gap-4">
             <button
                type="button"
                className="flex-1 px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm text-center"
                onClick={onClose}
              >
                Discard Changes
              </button>
              <button
                type="submit"
                className="flex-[2] flex items-center justify-center gap-3 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
                disabled={isSubmitting}
              >
                {isSubmitting ? <><Loader2 className="animate-spin w-4 h-4"/> Updating...</> : <><Save className="w-4 h-4"/> Save Updates</>}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateInvoice;
