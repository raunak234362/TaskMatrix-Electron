import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import Select from "react-select";
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
  const [allRfqs, setAllRfqs] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [availableRfqs, setAvailableRfqs] = useState([]);
  const [projectChangeOrders, setProjectChangeOrders] = useState([]);
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
        const [accountsRes, fabricatorsRes, projectsRes, rfqsRes, invoicesRes] = await Promise.all([
          Service.GetBankAccounts(),
          Service.GetAllFabricators(1, 100),
          Service.GetAllProjects(1, 100),
          Service.FetchAllRFQ(),
          Service.GetAllInvoice()
        ]);

        let accountsData = [];
        if (Array.isArray(accountsRes)) accountsData = accountsRes;
        else if (accountsRes?.data?.data && Array.isArray(accountsRes.data.data)) accountsData = accountsRes.data.data;
        else if (accountsRes?.data && Array.isArray(accountsRes.data)) accountsData = accountsRes.data;
        setAccounts(accountsData);

        let fabricatorsData = [];
        if (Array.isArray(fabricatorsRes)) fabricatorsData = fabricatorsRes;
        else if (fabricatorsRes?.data?.data && Array.isArray(fabricatorsRes.data.data)) fabricatorsData = fabricatorsRes.data.data;
        else if (fabricatorsRes?.data && Array.isArray(fabricatorsRes.data)) fabricatorsData = fabricatorsRes.data;
        else if (fabricatorsRes?.fabricators && Array.isArray(fabricatorsRes.fabricators)) fabricatorsData = fabricatorsRes.fabricators;
        setFabricators(fabricatorsData);

        let projectsData = [];
        if (Array.isArray(projectsRes)) projectsData = projectsRes;
        else if (projectsRes?.data?.data && Array.isArray(projectsRes.data.data)) projectsData = projectsRes.data.data;
        else if (projectsRes?.data && Array.isArray(projectsRes.data)) projectsData = projectsRes.data;
        else if (projectsRes?.projects && Array.isArray(projectsRes.projects)) projectsData = projectsRes.projects;
        setAllProjects(projectsData);

        let rfqsData = [];
        if (Array.isArray(rfqsRes)) rfqsData = rfqsRes;
        else if (rfqsRes?.data?.data && Array.isArray(rfqsRes.data.data)) rfqsData = rfqsRes.data.data;
        else if (rfqsRes?.data && Array.isArray(rfqsRes.data)) rfqsData = rfqsRes.data;
        setAllRfqs(rfqsData);

        let invoicesData = [];
        if (Array.isArray(invoicesRes)) invoicesData = invoicesRes;
        else if (invoicesRes?.data?.data && Array.isArray(invoicesRes.data.data)) invoicesData = invoicesRes.data.data;
        else if (invoicesRes?.data && Array.isArray(invoicesRes.data)) invoicesData = invoicesRes.data;
        setAllInvoices(invoicesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFabricatorSearch = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return;
    try {
      const res = await Service.GetAllFabricators(1, 100, inputValue);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res?.data?.data && Array.isArray(res.data.data)) list = res.data.data;
      else if (res?.data && Array.isArray(res.data)) list = res.data;
      else if (res?.fabricators && Array.isArray(res.fabricators)) list = res.fabricators;
      if (list.length > 0) setFabricators(list);
    } catch (err) {
      console.error("Error searching fabricators:", err);
    }
  };

  const handleProjectSearch = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return;
    try {
      const res = await Service.GetAllProjects(1, 100, inputValue);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res?.data?.data && Array.isArray(res.data.data)) list = res.data.data;
      else if (res?.data && Array.isArray(res.data)) list = res.data;
      else if (res?.projects && Array.isArray(res.projects)) list = res.projects;
      if (list.length > 0) setAllProjects(list);
    } catch (err) {
      console.error("Error searching projects:", err);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "rgba(240, 253, 244, 0.4)",
      borderColor: "#bbf7d0",
      borderRadius: "0.5rem",
      minHeight: "40px",
      boxShadow: "none",
      "&:hover": { borderColor: "#22c55e" },
    }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
  };

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

      // Set default SAC code for all current items
      const sacCode = selectedFabricator.SAC || "";
      const currentItems = watch("invoiceItems") || [];
      currentItems.forEach((_, index) => {
        setValue(`invoiceItems.${index}.sacCode`, sacCode);
      });
    }

    const projects = allProjects.filter(
      (p) =>
        p.fabricatorID === fabricatorId || p.fabricator_id === fabricatorId
    );
    setFilteredProjects(projects);

    const raisedRfqIds = allInvoices.map(inv => inv.rfqId).filter(Boolean);
    const fbRfqs = allRfqs.filter(rfq => {
      const fabId = rfq.fabricatorId || (rfq.fabricator && (rfq.fabricator.id || rfq.fabricator._id)) || rfq.clientId || rfq.senderId || (rfq.sender && (rfq.sender.id || rfq.sender._id));
      return fabId === fabricatorId;
    });
    const unbilledRfqs = fbRfqs.filter(rfq => !raisedRfqIds.includes(rfq._id) && !raisedRfqIds.includes(rfq.id));
    setAvailableRfqs(unbilledRfqs);

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

    if (!projectId) {
      setProjectChangeOrders([]);
      return;
    }

    try {
      const coRes = await Service.GetChangeOrder(projectId);
      setProjectChangeOrders(coRes?.data || []);
    } catch (e) {
      setProjectChangeOrders([]);
    }

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
            // Keep customerName as the fabricator name. Do not overwrite it with sender name.
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

  const handleRfqSelect = (e) => {
    const rfqId = e.target.value;
    setValue("rfqId", rfqId);

    if (rfqId) {
      const selectedRfq = availableRfqs.find(r => r.id === rfqId || r._id === rfqId);
      let isMTO = false;
      let isDetailing = false;

      if (selectedRfq) {
        isMTO = selectedRfq.MTOManual || selectedRfq.mtoStickModelEnabled || selectedRfq.MTOStickModel || selectedRfq.MTOValue || selectedRfq.mto3dModel || selectedRfq.mtoTeklaSDS2 || selectedRfq.mtoIFC || selectedRfq.mtoEJE || selectedRfq.mtoKss || selectedRfq.mtoBoltList || selectedRfq.mtoMaterialSummary;
        isDetailing = selectedRfq.connectionDesign || selectedRfq.miscDesign || selectedRfq.customerDesign || selectedRfq.detailingMain || selectedRfq.detailingMisc;

        if (isMTO && !isDetailing) {
          setValue("invoiceType", "MTO");
          setValue("jobName", selectedRfq.subject || selectedRfq.projectName || selectedRfq.jobName || selectedRfq.rfqNumber || "");
        }
      }

      // Filter projects related to this RFQ (for both Detailing and MTO)
      const matchedProjects = allProjects.filter(
        (p) =>
          p.rfqId === rfqId ||
          p.rfqID === rfqId ||
          p.rfq_id === rfqId ||
          (p.rfq && (p.rfq.id || p.rfq._id) === rfqId)
      );
      setFilteredProjects(matchedProjects);

      if (matchedProjects.length > 0) {
        selectProject(matchedProjects[0].id || matchedProjects[0]._id);
      } else {
        if (isMTO && !isDetailing) {
          setSelectedProjectId("");
          setValue("projectId", "");
          setProjectChangeOrders([]);
        } else {
          setSelectedProjectId("");
          setValue("projectId", "");
          setProjectChangeOrders([]);
        }
      }
    } else {
      // Restore projects for selected fabricator
      const projects = allProjects.filter(
        (p) =>
          p.fabricatorID === selectedFabricatorId || p.fabricator_id === selectedFabricatorId
      );
      setFilteredProjects(projects);
      setSelectedProjectId("");
      setValue("projectId", "");
      setProjectChangeOrders([]);
    }
  };

  const handleProjectSelect = async (e) => {
    selectProject(e.target.value);
  };
  const onSubmit = async (data) => {
    // Ensure numeric fields are numbers
    const formattedData = {
      ...data,
      clientId: data.receiptId || data.clientId || "",
      totalInvoiceValue: Number(data.totalInvoiceValue),
      changeOrderId: data.changeOrderId || "",
      rfqId: data.rfqId || "",
      invoiceItems: data.invoiceItems?.map((item) => ({
        ...item,
        rateUSD: Number(item.rateUSD),
        totalUSD: Number(item.totalUSD),
        unit: Number(item.unit),
        sacCode: item.sacCode ? String(item.sacCode) : "",
        remarks: item.remarks || "",
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

  const fabricatorOptions = (fabricators || []).map((fab) => ({
    label: fab.fabName || fab.name || fab.fabricatorName || fab.companyName || "Unnamed Fabricator",
    value: fab.id || fab._id,
  }));

  const rfqOptions = (availableRfqs || []).map((rfq) => ({
    label: rfq.projectName || rfq.rfqNumber || String(rfq.id || rfq._id),
    value: rfq.id || rfq._id,
  }));

  const projectOptions = (filteredProjects || []).map((project) => ({
    label: project.name || project.projectName || "Unnamed Project",
    value: project.id || project._id,
  }));

  const changeOrderOptions = (projectChangeOrders || []).map((co) => ({
    label: co.coNumber || co.changeOrderNumber || co.title || String(co.id || co._id),
    value: co.id || co._id,
  }));

  const accountOptions = (accounts || []).map((account) => ({
    label: `${account.accountName} (${account.accountNumber})`,
    value: account._id || account.id,
  }));

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full mx-auto">
      <header className="mb-6 border-b pb-4 border-green-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl  text-green-700">
            Create New Invoice
          </h1>

        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          {/* Select Fabricator */}
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Fabricator
            </label>
            <Select
              options={fabricatorOptions}
              value={fabricatorOptions.find((o) => String(o.value) === String(selectedFabricatorId)) || null}
              onChange={(opt) => selectFabricator(opt?.value || "")}
              onInputChange={(val, { action }) => {
                if (action === "input-change") handleFabricatorSearch(val);
              }}
              placeholder="-- Choose a Fabricator --"
              isClearable
              isSearchable
              isDisabled={loading}
              styles={customSelectStyles}
            />
          </div>

          {/* Select RFQ */}
          {selectedFabricatorId && availableRfqs.length > 0 && (
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select RFQ
              </label>
              <Controller
                name="rfqId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={rfqOptions}
                    value={rfqOptions.find((o) => String(o.value) === String(field.value)) || null}
                    onChange={(opt) => {
                      const val = opt?.value || "";
                      field.onChange(val);
                      handleRfqSelect({ target: { value: val } });
                    }}
                    placeholder="-- Choose an RFQ --"
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                  />
                )}
              />
            </div>
          )}

          {/* Select Project */}
          {selectedFabricatorId && (
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Project
              </label>
              <Select
                options={projectOptions}
                value={projectOptions.find((o) => String(o.value) === String(selectedProjectId)) || null}
                onChange={(opt) => selectProject(opt?.value || "")}
                onInputChange={(val, { action }) => {
                  if (action === "input-change") handleProjectSearch(val);
                }}
                placeholder="-- Choose a Project --"
                isClearable
                isSearchable
                isDisabled={loading}
                styles={customSelectStyles}
              />
            </div>
          )}

          {/* Select Change Order */}
          {selectedProjectId && projectChangeOrders.length > 0 && (
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Change Order
              </label>
              <Controller
                name="changeOrderId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={changeOrderOptions}
                    value={changeOrderOptions.find((o) => String(o.value) === String(field.value)) || null}
                    onChange={(opt) => field.onChange(opt?.value || "")}
                    placeholder="-- Choose a Change Order --"
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                  />
                )}
              />
            </div>
          )}

          {/* Invoice Type */}
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Type
            </label>
            <select
              {...register("invoiceType", {
                onChange: (e) => {
                  const type = e.target.value;
                  const currentRfqId = watch("rfqId");
                  if (currentRfqId) {
                    const matchedProject = allProjects.find(p => p.rfqId === currentRfqId || p.rfqID === currentRfqId || p.rfq_id === currentRfqId || (p.rfq && (p.rfq.id || p.rfq._id) === currentRfqId));
                    if (matchedProject) {
                      selectProject(matchedProject.id || matchedProject._id);
                    } else if (type === "MTO") {
                      const selectedRfq = availableRfqs.find(r => r.id === currentRfqId || r._id === currentRfqId);
                      if (selectedRfq) {
                        setValue("jobName", selectedRfq.subject || selectedRfq.projectName || selectedRfq.jobName || selectedRfq.rfqNumber || "");
                      }
                      setSelectedProjectId("");
                      setValue("projectId", "");
                      setProjectChangeOrders([]);
                    }
                  }
                }
              })}
              className="w-full p-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-green-50/30"
            >
              <option value="">-- Select Type --</option>
              <option value="APPROVAL">Approval</option>
              <option value="FABRICATION">Fabrication</option>
              <option value="MTO">MTO</option>
              <option value="CHANGE_ORDER">Change Order</option>
            </select>
          </div>

          {/* Select Existing Account */}
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Existing Account
            </label>
            <Select
              options={accountOptions}
              value={accountOptions.find((o) => String(o.value) === String(watch("accountId"))) || null}
              onChange={(opt) => handleAccountSelect({ target: { value: opt?.value || "" } })}
              placeholder="-- Choose an Account --"
              isClearable
              isSearchable
              isDisabled={loading}
              styles={customSelectStyles}
            />
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
                    value={contact.id || contact._id}
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
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
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
            <button
              type="button"
              onClick={() => {
                const selectedFab = fabricators.find(f => f.id === selectedFabricatorId || f._id === selectedFabricatorId);
                append({
                  description: "",
                  unit: 1,
                  rateUSD: 0,
                  totalUSD: 0,
                  sacCode: selectedFab?.SAC || "",
                  remarks: "",
                });
              }}
              className="flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
            >
              <Plus size={18} /> Add Item
            </button>
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
              <button
                type="button"
                onClick={handleCalculateTotal}
                className="w-full px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
              >
                Calculate Total & Words
              </button>
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

        <div className="flex justify-center pt-6">
          <button
            type="submit"
            className="w-full max-w-md px-8 py-2.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm text-center active:scale-95"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddInvoice;
