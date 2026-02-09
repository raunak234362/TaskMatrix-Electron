import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Input from "../fields/input";
import Button from "../fields/Button";
import Service from "../../api/Service";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";
import { numberToWords } from "../../utils/numberToWords";





const AddInvoice = ({
  onSuccess,
  initialFabricatorId,
  initialProjectId,
}) => {
  const [accounts, setAccounts] = useState([]);
  const [fabricators, setFabricators] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedFabricatorId, setSelectedFabricatorId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [contacts, setContacts] = useState([]);

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
      invoiceItems: [
        {
          description: "",
          unit: 1,
          rateUSD: 0,
          totalUSD: 0,
          sacCode: 0,
          remarks: "",
        },
      ],
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
        const [accountsRes, fabricatorsRes, projectsRes] = await Promise.all([
          Service.GetBankAccounts(),
          Service.GetAllFabricators(),
          Service.GetAllProjects(),
        ]);

        const accountsData = accountsRes?.data || accountsRes || []
        setAccounts(Array.isArray(accountsData) ? accountsData : []);

        const fabricatorsData = fabricatorsRes?.data || fabricatorsRes || []
        setFabricators(Array.isArray(fabricatorsData) ? fabricatorsData : []);

        const projectsData = projectsRes?.data || projectsRes || []
        setAllProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectFabricator = (fabricatorId) => {
    setSelectedFabricatorId(fabricatorId);
    setValue("fabricatorId", fabricatorId);
    setSelectedProjectId("");
    setValue("projectId", "");

    if (!fabricatorId) {
      setFilteredProjects();
      return;
    }

    const selectedFabricator = fabricators.find(
      (f) => f.id === fabricatorId || f._id === fabricatorId
    );
    console.log(selectedFabricator);

    if (selectedFabricator) {
      setValue("customerName", selectedFabricator.fabName || "");
      setValue("address", selectedFabricator.website || "");
      setContacts(selectedFabricator.pointOfContact || []);
    }

    const projects = allProjects.filter(
      (p) =>
        p.fabricatorID === fabricatorId || p.fabricator_id === fabricatorId
    );
    setFilteredProjects(projects);

    if (selectedFabricator?.accountId) {
      const selectedAccount = accounts.find(
        (a) =>
          a._id === selectedFabricator.accountId ||
          a.id === selectedFabricator.accountId
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
    }
  };

  const selectProject = async (projectId) => {
    setSelectedProjectId(projectId);
    setValue("projectId", projectId);

    if (!projectId) return;

    const project = allProjects.find(
      (p) => p.id === projectId || p._id === projectId
    );
    console.log("Project-------", project);

    if (project) {
      setValue("jobName", project.name || "");

      if (project.rfqId) {
        try {
          const rfqRes = await Service.GetRFQbyId(project.rfqId);
          const rfq = rfqRes.data;
          console.log("RFQ Data-------", rfq);

          if (rfq && rfq.sender) {
            const senderName = `${rfq.sender.firstName || ""} ${rfq.sender.lastName || ""
              }`.trim();
            setValue("customerName", senderName);
            setValue("clientId", rfq.senderId || rfq.sender.id);
          }
        } catch (error) {
          console.error("Error fetching RFQ:", error);
        }
      }
    }
  };

  useEffect(() => {
    if (fabricators.length > 0 && initialFabricatorId) {
      selectFabricator(initialFabricatorId);
    }
  }, [fabricators, initialFabricatorId]);

  useEffect(() => {
    if (filteredProjects.length > 0 && initialProjectId) {
      selectProject(initialProjectId);
    }
  }, [filteredProjects, initialProjectId]);

  const handleCalculateTotal = () => {
    if (watchedItems) {
      const total = watchedItems.reduce(
        (sum, item) => sum + (item.totalUSD || 0),
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

  const handleFabricatorSelect = (e) => {
    selectFabricator(e.target.value);
  };

  const handleProjectSelect = async (e) => {
    selectProject(e.target.value);
  };
  const onSubmit = async (data) => {
    // Ensure numeric fields are numbers
    const formattedData = {
      ...data,
      totalInvoiceValue: Number(data.totalInvoiceValue),
      invoiceItems: data.invoiceItems?.map((item) => ({
        ...item,
        rateUSD: Number(item.rateUSD),
        totalUSD: Number(item.totalUSD),
        unit: Number(item.unit),
        sacCode: item.sacCode ? String(item.sacCode) : 0,
      })),
    };

    try {
      await Service.AddInvoice(formattedData);
      toast.success("Invoice created successfully");
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full mx-auto">
      <header className="mb-6 border-b pb-4 border-green-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl  text-green-700">
            Create New Invoice
          </h1>
          <p className="text-gray-700">
            Enter details to generate a new invoice.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Fabricator
            </label>
            <select
              onChange={handleFabricatorSelect}
              className="w-full p-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-green-50/30"
              disabled={loading}
              value={selectedFabricatorId}
            >
              <option value="">-- Choose a Fabricator --</option>
              {fabricators.map((fab) => (
                <option key={fab.id || fab._id} value={fab.id || fab._id}>
                  {fab.fabName}
                </option>
              ))}
            </select>
          </div>

          {selectedFabricatorId && (
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Project
              </label>
              <select
                onChange={handleProjectSelect}
                className="w-full p-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-green-50/30"
                disabled={loading}
                value={selectedProjectId}
              >
                <option value="">-- Choose a Project --</option>
                {filteredProjects.map((project) => (
                  <option
                    key={project.id || project._id}
                    value={project.id || project._id}
                  >
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Existing Account
            </label>
            <select
              onChange={handleAccountSelect}
              className="w-full p-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-green-50/30"
              disabled={loading}
            >
              <option value="">-- Choose an Account --</option>
              {accounts.map((account) => (
                <option
                  key={account._id || account.id}
                  value={account._id || account.id}
                >
                  {account.accountName} ({account.accountNumber})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Customer Details */}
        <fieldset className="border p-4 rounded-lg shadow-inner">
          <legend className="text-lg font-semibold text-green-600 px-2">
            Customer Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Input
                label="Customer Name *"
                {...register("customerName", {
                  required: "Customer Name is required",
                })}
              />
              {errors.customerName && (
                <p className="text-red-500 text-xs">
                  {errors.customerName.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt ID (Contact)
              </label>
              <select
                {...register("receiptId")}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">-- Select Contact --</option>
                {contacts.map((contact) => (
                  <option
                    key={contact.id || contact._id}
                    value={`${contact.firstName || ""} ${contact.lastName || ""
                      }`.trim()}
                  >
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Input label="GSTIN" {...register("GSTIN")} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Input label="Address" {...register("address")} />
            </div>
            <div className="space-y-1">
              <Input label="State Code" {...register("stateCode")} />
            </div>
          </div>
        </fieldset>

        {/* Invoice Details */}
        <fieldset className="border p-4 rounded-lg shadow-inner">
          <legend className="text-lg font-semibold text-green-600 px-2">
            Invoice Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Input
                label="Invoice Number *"
                {...register("invoiceNumber", {
                  required: "Invoice Number is required",
                })}
              />
              {errors.invoiceNumber && (
                <p className="text-red-500 text-xs">
                  {errors.invoiceNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                label="Invoice Date"
                type="date"
                {...register("invoiceDate")}
              />
            </div>
            <div className="space-y-1">
              <Input
                label="Job Name *"
                {...register("jobName", { required: "Job Name is required" })}
              />
              {errors.jobName && (
                <p className="text-red-500 text-xs">{errors.jobName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                label="Date of Supply"
                type="date"
                {...register("dateOfSupply")}
              />
            </div>
            <div className="space-y-1">
              <Input label="Place of Supply" {...register("placeOfSupply")} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                {...register("currencyType")}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="INR">Rupees</option>
                <option value="CAD">CAD</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Invoice Items */}
        <fieldset className="border p-4 rounded-lg shadow-inner">
          <legend className="text-lg font-semibold text-green-600 px-2">
            Invoice Items
          </legend>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4"
              >
                <div className="md:col-span-3">
                  <Input
                    label={index === 0 ? "Description *" : ""}
                    placeholder="Item description"
                    {...register(`invoiceItems.${index}.description`, {
                      required: "Description is required",
                    })}
                  />
                  {errors.invoiceItems?.[index]?.description && (
                    <p className="text-red-500 text-xs">
                      {errors.invoiceItems[index]?.description?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <Input
                    label={index === 0 ? "Unit *" : ""}
                    placeholder="Unit"
                    type="number"
                    {...register(`invoiceItems.${index}.unit`, {
                      required: "Unit is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Min 0" },
                      onChange: (e) => {
                        const unit = parseFloat(e.target.value) || 0;
                        const rate =
                          watch(`invoiceItems.${index}.rateUSD`) || 0;
                        setValue(`invoiceItems.${index}.totalUSD`, unit * rate);
                      },
                    })}
                  />
                  {errors.invoiceItems?.[index]?.unit && (
                    <p className="text-red-500 text-xs">
                      {errors.invoiceItems[index]?.unit?.message}
                    </p>
                  )}
                </div>
                <div className="md:col-span-1">
                  <Input
                    label={index === 0 ? "SAC" : ""}
                    placeholder="SAC"
                    type="number"
                    {...register(`invoiceItems.${index}.sacCode`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label={index === 0 ? "Rate *" : ""}
                    type="number"
                    step="any"
                    {...register(`invoiceItems.${index}.rateUSD`, {
                      required: "Rate is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Min 0" },
                      onChange: (e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        const unit = watch(`invoiceItems.${index}.unit`) || 0;
                        setValue(`invoiceItems.${index}.totalUSD`, unit * rate);
                      },
                    })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label={index === 0 ? "Total" : ""}
                    type="number"
                    readOnly
                    {...register(`invoiceItems.${index}.totalUSD`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={20} />
                    </Button>
                  )}
                </div>
                <div className="md:col-span-12">
                  <Input
                    label="Remarks"
                    placeholder="Remarks"
                    {...register(`invoiceItems.${index}.remarks`)}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                append({
                  description: "",
                  unit: 1,
                  rateUSD: 0,
                  totalUSD: 0,
                  sacCode: 0,
                  remarks: "",
                })
              }
              className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
            >
              <Plus size={18} /> Add Item
            </Button>
          </div>
        </fieldset>

        {/* Totals and Bank Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <fieldset className="border p-4 rounded-lg shadow-inner">
            <legend className="text-lg font-semibold text-green-600 px-2">
              Summary
            </legend>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xl  text-green-800">
                <span>Total Value:</span>
                <span>
                  {watch("currencyType")}{" "}
                  {watch("totalInvoiceValue").toLocaleString()}
                </span>
              </div>
              <Button
                type="button"
                onClick={handleCalculateTotal}
                className="w-full bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 py-2 text-sm font-semibold"
              >
                Calculate Total & Words
              </Button>
              <Input
                label="Total in Words"
                placeholder="e.g. One Thousand Dollars"
                readOnly
                {...register("totalInvoiceValueInWords")}
              />
            </div>
          </fieldset>

          <fieldset className="border p-4 rounded-lg shadow-inner">
            <legend className="text-lg font-semibold text-green-600 px-2">
              Payment Info
            </legend>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("paymentStatus")}
                  id="paymentStatus"
                  className="w-4 h-4 text-green-600"
                />
                <label
                  htmlFor="paymentStatus"
                  className="text-sm font-medium text-gray-700"
                >
                  Mark
                </label>
              </div>
              {watch("accountInfo") && watch("accountInfo").length > 0 && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
                  <p className=" text-green-800">
                    Selected Bank Account:
                  </p>
                  <p>{watch("accountInfo")[0].accountName}</p>
                  <p>{watch("accountInfo")[0].bankName}</p>
                  <p>A/C: {watch("accountInfo")[0].accountNumber}</p>
                </div>
              )}
            </div>
          </fieldset>
        </div>

        <Button
          type="submit"
          className="mt-8 bg-green-700 hover:bg-green-800 text-white w-full py-4 text-xl  shadow-lg transition transform hover:scale-[1.01]"
        >
          Create Invoice
        </Button>
      </form>
    </div>
  );
};

export default AddInvoice;
