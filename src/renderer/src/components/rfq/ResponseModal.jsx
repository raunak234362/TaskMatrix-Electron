import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import Service from "../../api/Service";
import { X, Printer } from "lucide-react";

import mainLogo from "../../assets/logo.png";
const Logo = "";  // Asset not found
const ASCI = "";  // Asset not found
import Button from "../fields/Button";
import RichTextEditor from "../fields/RichTextEditor";
import Select from "../fields/Select";
import Input from "../fields/input";


const ResponseModal = ({
  rfqId,
  onClose,
  onSuccess,
}) => {
  const { register, handleSubmit, control, reset, setValue, getValues } =
    useForm();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estimations, setEstimations] = useState([]);
  const [selectedEstimationId, setSelectedEstimationId] = useState("");
  const [selectedEstimation, setSelectedEstimation] = useState(null);
  const [pricingItems, setPricingItems] = useState([
    { label: "Main Steel Detailing", price: "", weeks: "", selected: false },
    { label: "Misc Steel Detailing", price: "", weeks: "", selected: false },
    {
      label: "Main & Misc Steel Detailing",
      price: "",
      weeks: "",
      selected: false,
    },
    { label: "Main Steel Design", price: "", weeks: "", selected: false },
    { label: "Misc Steel Design", price: "", weeks: "", selected: false },
  ]);

  useEffect(() => {
    const fetchEstimations = async () => {
      try {
        const res = await Service.AllEstimation();
        const allEst = Array.isArray(res?.data)
          ? res.data
          : res?.data?.data || [];
        // Filter estimations by rfqId
        const filtered = allEst.filter(
          (est) => String(est.rfqId) === String(rfqId),
        );
        setEstimations(filtered);
      } catch (error) {
        console.error("Error fetching estimations:", error);
      }
    };
    fetchEstimations();
  }, [rfqId]);

  const generateProposalHtml = (est, items) => {
    if (!est) return "";

    const currency = est.fabricators?.currencyType || "USD";
    const currencySymbol = currency === "INR" ? "₹" : "$";

    const headerHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 5mm 10mm; margin-bottom: 15px; margin-top:15px; width: 100%; box-sizing: border-box;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${mainLogo}" alt="Whiteboard Technologies" style="height: 60px; width: auto;" />
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
           <div style="display: flex; align-items: center; gap: 5px;">
              <img src="${Logo}" alt="Whiteboard Technologies" style="height: 60px; width: auto;" />
           </div>
           <div style="text-align: center;">
               <img src="${ASCI}" alt="Whiteboard Technologies" style="height: 70px; width: auto;" />
           </div>
        </div>
      </div>
    `;

    // Helper to safely parse mixed legacy array / new rich text string
    const cleanHtmlList = (htmlString) => {
      if (!htmlString || typeof htmlString !== 'string') return '';
      let cleaned = htmlString;
      // Remove span styling that overrides displaying and blocks list items
      cleaned = cleaned.replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '');

      // Convert LIs containing literal newlines into split LIs
      cleaned = cleaned.replace(/<li>([\s\S]*?)<\/li>/gi, (match, p1) => {
        const items = p1.split(/\r?\n/).map(i => i.trim()).filter(Boolean);
        if (items.length > 1) {
          return items.map(i => `<li>${i}</li>`).join('');
        }
        return match;
      });

      // If it's raw text without any lists but contains newlines, force standard HTML list
      if (!cleaned.includes('<ul') && !cleaned.includes('<ol')) {
        const plainLines = cleaned.replace(/<[^>]+>/g, ' ').split(/\r?\n/).map(i => i.trim()).filter(Boolean);
        if (plainLines.length > 1) {
          cleaned = `<ul>${plainLines.map(l => `<li>${l}</li>`).join('')}</ul>`;
        }
      }

      // Add inline styles to ul/ol
      cleaned = cleaned.replace(/<ul/g, '<ul style="list-style-type: disc; margin: 0; padding-left: 25px; font-size: 12px; line-height: 1.5; color: #444; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%;"');
      cleaned = cleaned.replace(/<ol/g, '<ol style="list-style-type: decimal; margin: 0; padding-left: 25px; font-size: 12px; line-height: 1.5; color: #444; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%;"');

      return cleaned;
    }

    const formatScopeForProposal = (data) => {
      if (Array.isArray(data)) {
        return data.length > 0
          ? `<ul style="list-style-type: disc; margin: 0; padding-left: 25px; font-size: 12px; line-height: 1.5; color: #444; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%;">${data.map((item) => `<li style="margin-bottom: 4px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item}</li>`).join('')}</ul>`
          : '<p style="font-size: 12px; color: #444;">No items specified</p>';
      }
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            return parsed.length > 0
              ? `<ul style="list-style-type: disc; margin: 0; padding-left: 25px; font-size: 12px; line-height: 1.5; color: #444; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; max-width: 100%;">${parsed.map((item) => `<li style="margin-bottom: 4px; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word;">${item}</li>`).join('')}</ul>`
              : '<p style="font-size: 12px; color: #444;">No items specified</p>';
          }
        } catch {
          let cleaned = cleanHtmlList(data);
          return cleaned || '<p style="font-size: 12px; color: #444;">No items specified</p>';
        }
      }
      return '<p style="font-size: 12px; color: #444;">No items specified</p>';
    }

    const inclusionsHtml = formatScopeForProposal(est.inclusions);
    const exclusionsHtml = formatScopeForProposal(est.exclusions);

    const selectedItems = items.filter((item) => item.selected);
    const tableRows = selectedItems
      .map(
        (item) => `
      <tr style="text-align: center;">
        <td style="border: 2px solid #333; padding: 5px; font-weight: bold; color: #333;">${item.label.toUpperCase()}</td>
        <td style="border: 2px solid #333; padding: 5px; font-weight: bold; color: #0056b3;"><span>${currency}: ${currencySymbol} ${item.price || "—"
          }/-</span></td>
        <td style="border: 2px solid #333; padding: 15px; font-weight: bold;"><span>${item.weeks || "—"
          } weeks</span></td>
      </tr>
    `,
      )
      .join("");

    return `
      <div style="background: #f0f0f0; padding: 10px 0; display: flex; flex-direction: column; align-items: center; gap: 40px;">
        <!-- Page 1 -->
        <div style="width: 210mm; height: 297mm; background: white; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: 'Arial', sans-serif; color: #333; line-height: 1.5; box-sizing: border-box; overflow: hidden; position: relative;">
          ${headerHtml}
          <div style="padding: 0 25mm 25mm 25mm;">
            <div style="border-left: 6px solid #6bbd45; padding-left: 20px; margin-bottom: 35px;">
              <h1 style="font-size: 24px; margin: 0; color: #6bbd45; text-transform: uppercase; font-weight: 900; line-height: 1.2;">
                WHITEBOARD TECHNOLOGIES <span style="color: #6bbd45; font-weight: 900;">PROPOSAL FOR</span>
              </h1>
              <h1 style="font-size: 16px; margin: 5px 0 0 0; color: #6bbd45; text-transform: uppercase; font-weight: 900; line-height: 1.2;">
                DETAILING <span>${est.projectName || "Project Name"}</span> JOB
              </h1>
              <div style="margin-top: 5px;">
                <span style="font-weight: bold; font-size: 12px; color: #0056b3;">For ${est.fabricators?.fabName || "Fabricator Name"
      }</span>
              </div>
              ${est.fabricators?.branches?.[0]
        ? `
                <div style="display: block; font-size: 11px; margin-top: 8px; color: #555;">
                  ${est.fabricators.branches[0].address || ""}, ${est.fabricators.branches[0].city || ""
        }, ${est.fabricators.branches[0].state || ""} ${est.fabricators.branches[0].zipCode || ""
        }, Tel: ${est.fabricators.branches[0].phone || ""}
                </div>
              `
        : ""
      }
            </div>

            <!-- Proposal ID & Date -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 12px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              <div><span>Our Proposal ID: <span>WBT/${est.estimationNumber || "Estimation Number"
      }/${new Date().getFullYear()}/VER 1.0</span></span></div>
              <div><span>Date: <span>${new Date().toLocaleDateString()}</span></span></div>
            </div>

            <p style="font-size: 12px; margin-bottom: 25px; color: #444;">
              WHITEBOARD TECHNOLOGIES is pleased to submit this proposal for taking some of the detailing activities of 
              <span style="font-weight: bold; color: #333;">${est.projectName || "SAMPLE PROJECT"
      }</span> JOB.
            </p>

            <!-- Pricing Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; border: 2px solid #333;">
              <thead>
                <tr style="text-align: center; font-weight: bold;">
                  <th style="border: 2px solid #333; padding: 5px; width: 40%;">Item</th>
                  <th style="border: 2px solid #333; padding: 5px; width: 30%;">Price
                  <th style="border: 2px solid #333; padding: 5px; width: 30%;">Approximate Job Duration</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows ||
      `<tr><td colspan="3" style="border: 2px solid #333; padding: 10px; text-align: center;">No items selected</td></tr>`
      }
              </tbody>
            </table>

            <!-- Scope of Work -->
            <div style="margin-bottom: 35px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;">
              <h3 style="color: #6bbd45; font-size: 16px; margin-bottom: 10px; display: inline-block; padding-bottom: 2px;">Scope of work</h3>
              
              <div style="margin-top: 10px;margin-bottom: 10px; max-width: 100%;">
                <h4 style="color: #6bbd45; text-decoration: underline; margin-bottom: 12px; font-size: 14px;">Inclusions:</h4>
                ${inclusionsHtml}
              </div>
              <div style="margin-bottom: 35px; max-width: 100%;">
                <h4 style="color: #6bbd45; text-decoration: underline; margin-bottom: 12px; font-size: 14px;">Exclusions:</h4>
                ${exclusionsHtml}
              </div>

            </div>
          </div>
        </div>

        <!-- Page 2 -->
        <div style="width: 210mm; height: 297mm; background: white; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: 'Arial', sans-serif; color: #333; line-height: 1.5; box-sizing: border-box; overflow: hidden; page-break-before: always; position: relative;">
          ${headerHtml}
          <div style="padding: 0 25mm 25mm 25mm;">
            
            <!-- Standard Deliverables -->
            <div style="margin-bottom: 20px;">
              <h3 style="color: #6bbd45; font-size: 14px; margin-bottom: 10px; border-bottom: 2px solid #6bbd45; display: inline-block; padding-bottom: 2px;">Our Standard Deliverables</h3>
              <ul style="list-style-type: disc; margin: 5px 0 0 0; padding-left: 25px; font-size: 12px; line-height: 1.6; color: #444;">
                <li>Erection drawings</li>
                <li>Shop drawings.</li>
                <li>Embed plan</li>
                <li>ABMs for columns, beam</li>
                <li>DSTV, KSS files</li>
                <li>Bolt lists</li>
                <li>ISO View of the job model</li>
              </ul>
            </div>

            <!-- Delivery Mode -->
            <div style="margin-bottom: 20px;">
              <h3 style="color: #6bbd45; font-size: 14px; margin-bottom: 5px; border-bottom: 2px solid #6bbd45; display: inline-block; padding-bottom: 2px;">Delivery mode:</h3>
              <p style="font-size: 12px; margin-top: 5px; color: #444;">Electronic format of all deliverables through FTP</p>
            </div>

            <!-- Terms and Conditions -->
            <div style="margin-bottom: 20px;">
              <h3 style="color: #6bbd45; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; border-bottom: 2px solid #6bbd45; display: inline-block; padding-bottom: 2px;">Our Proposal terms and conditions</h3>
              <ul style="list-style-type: decimal; margin: 0; padding-left: 25px; font-size: 12px; line-height: 1.4; color: #444;">
                <li style="margin-bottom: 8px;">ORIGINAL SUBCONTRACT BID DOCUMENTS full and complete extent of the original subcontract bid documents is given at the time of bidding.</li>
                <li style="margin-bottom: 8px;">ORIGINAL SUBCONTRACT SCOPE full and complete extent of the original subcontract work scope is given above in this proposal.</li>
                <li style="margin-bottom: 8px;"><span style="font-weight: bold; color: #333;">EXTRA WORK RATE 50 / hour.</span></li>
                <li style="margin-bottom: 8px;">CANCELLATION OR DELAY the project is canceled or delayed, the steel detailing firm will be paid for all material and labor expenditures plus a reasonable profit on all work that has been authorized by the Buyer and is complete as of the stoppage.</li>
                <li style="margin-bottom: 8px;">TERMS OF PAYMENT to the steel detailing firm is the express obligation of the Buyer and is not dependent upon "the condition precedent" of the Buyer receiving funds from other sources. The detailer is to be paid per the following:
                  <ul style="list-style-type: lower-alpha; padding-left: 20px; margin-top: 5px;">
                    <li>Invoices will be submitted when the drawings are submitted for approval. Payment is to be made, within 30 days after the Buyer's receipt of such invoice. Final payment shall be due within 30 days after substantial completion of the work by the detailing firm, less the value of any uncompleted work. An amount past due by these terms and conditions will be subject to a 14% per month service charge.</li>
                  </ul>
                </li>
                <li style="margin-bottom: 8px;">EXTRA WORK Work is to be considered which is defined in the NISD Industry Standard, Chapter 3. Charges for Extra Work shall be paid in the same manner and time frame as the original agreement.</li>
                <li style="margin-bottom: 8px;">BACKCHARGES the event of detailing errors and omissions, confirmed by the detailing firm, the detailing firm agrees to pay charges limited to 6% of the steel detailing price on this job. The buyer agrees to hold the detailing firm and its officers harmless of any litigation, the cost of direct labor, taxes, insurance and material costs and transportation needed to correct the deficiency. The detailing firm liability for damage to the buyer for any cause whatsoever and regardless of the form of action shall not exceed 6% of the amount paid by the buyer.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Page 3 -->
        <div style="width: 210mm; min-height: 297mm; background: white; box-shadow: 0 0 15px rgba(0,0,0,0.1); font-family: 'Arial', sans-serif; color: #333; line-height: 1.5; box-sizing: border-box; overflow: hidden; page-break-before: always; position: relative;">
          ${headerHtml}
          <div style="padding: 0 25mm 25mm 25mm;">
            <!-- Billing Cycle -->
            <div style="margin-bottom: 35px;">
              <div style="background: #f5f5f5; padding: 10px 15px; border-left: 5px solid #6bbd45; margin-bottom: 20px;">
                <h3 style="font-size: 16px; font-weight: bold; margin: 0; color: #333;">BILLING CYCLE progress billing.</h3>
              </div>
              <table style="width: 90%; border-collapse: collapse; font-size: 14px; margin-left: 25px;">
                <tr>
                  <td style="border: 1.5px solid #333; padding: 12px; width: 65%; color: #444;">Submission of Shop drawings for approval</td>
                  <td style="border: 1.5px solid #333; padding: 12px; text-align: center; font-weight: bold; color: #333;">80% of total amount</td>
                </tr>
                <tr>
                  <td style="border: 1.5px solid #333; padding: 12px; color: #444;">Submission of Shop drawings for fabrication</td>
                  <td style="border: 1.5px solid #333; padding: 12px; text-align: center; font-weight: bold; color: #333;">20% of total amount</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; font-weight: bold; margin-bottom: 30px; color: #333; border-top: 1px solid #eee; padding-top: 20px;">
              All Purchase Orders and Payments should be made to Whiteboard Technologies LLC, 1209 Orange Street, Wilmington, DE, 19801.
            </p>

            <!-- Schedule & Delivery -->
            <div style="margin-bottom: 35px;">
              <ul style="list-style-type: disc; padding-left: 25px; font-size: 14px; line-height: 1.6; color: #444;">
                <li style="margin-bottom: 15px;"><span style="font-weight: bold; color: #333;">SCHEDULE & DELIVERY:</span> Upon receipt of signed Purchase Order Whiteboard Technologies LLC will perform detailing activities and deliver drawings as per the schedule above. The delivery schedule can be adjusted to suit customer needs.
                  <ul style="list-style-type: disc; padding-left: 20px; margin-top: 10px;">
                    <li>The delivery schedule is contingent on:</li>
                    <li style="list-style-type: circle; margin-top: 5px;">Complete and correct design documents, drawings and specifications</li>
                    <li style="list-style-type: circle; margin-top: 5px;">Timely receipt of RFI answers. We require the RFI's to be addressed and answered within 48 hours to maintain the schedule. Any delay in the RFI response will affect the delivery schedule.</li>
                  </ul>
                </li>
              </ul>
            </div>

            <p style="font-size: 14px; margin-bottom: 20px; color: #444;">
              We look forward to working with <span style="font-weight: bold; color: #333;">${est.fabricatorName || "Cobb Industrial, Inc"
      }</span> and supporting your efforts on this job. We are confident that we can meet the challenges ahead and stand ready to partner with you in delivering an effective detailing solution.
            </p>
            
            <p style="font-size: 14px; margin-bottom: 30px; color: #444;">
              If you have questions on this proposal, feel free to contact Rajeshwari at your convenience by email at <span style="color: #0056b3; text-decoration: underline;">raj@whiteboardtec.com</span> or by phone at <span style="font-weight: bold;">612-605-5833</span>.
            </p>

            <div style="margin-top: 40px;">
              <p style="font-size: 14px; margin-bottom: 5px; color: #444;">Thank you for your consideration,</p>
              <p style="font-size: 16px; font-weight: bold; margin: 0; color: #333;">Rajeshwari Vishal Khandappanavar</p>
              <p style="font-size: 14px; margin: 0; color: #666;">President</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleEstimationChange = async (estId) => {
    setSelectedEstimationId(estId);
    if (!estId) {
      setSelectedEstimation(null);
      setValue("description", "");
      return;
    }

    try {
      const res = await Service.GetEstimationById(estId);
      const est = res?.data;
      if (!est) return;

      setSelectedEstimation(est);
      const proposalHtml = generateProposalHtml(est, pricingItems);
      setValue("description", proposalHtml);
    } catch (error) {
      console.error("Error fetching estimation details:", error);
    }
  };

  const handlePricingItemChange = (
    index,
    field,
    value,
  ) => {
    const updatedItems = [...pricingItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setPricingItems(updatedItems);

    if (selectedEstimation) {
      const proposalHtml = generateProposalHtml(
        selectedEstimation,
        updatedItems,
      );
      setValue("description", proposalHtml);
    }
  };

  const handlePrint = () => {
    const content = getValues("description");
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Proposal Print</title>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Submit Handler
  const onSubmit = async (data) => {
    let success = false;
    try {
      setLoading(true);

      const userId = sessionStorage.getItem("userId") || ""; // assuming userId stored in session
      const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";

      const payload = {
        ...data,
        rfqId,
        userId,
        parentResponseId: data.parentResponseId || "",
        files,
      };
      console.log(payload);

      // Convert to FormData
      const formData = new FormData();
      formData.append("rfqId", payload.rfqId);
      formData.append("subject", payload.subject || "");
      formData.append("description", payload.description);
      formData.append("status", "OPEN");
      formData.append("wbtStatus", "OPEN");
      formData.append("userRole", userRole ?? "");
      formData.append("userId", userId ?? "");

      if (payload.link) formData.append("link", payload.link);

      formData.append(
        "totalTonnageWithConnection",
        payload.totalTonnageWithConnection || "",
      );
      formData.append(
        "totalTonnageWithoutConnection",
        payload.totalTonnageWithoutConnection || "",
      );
      formData.append("PageNumbers", payload.PageNumbers || "");

      if (files.length > 0) {
        files.forEach((file) => formData.append("files", file));
      }

      await Service.addResponse(formData, rfqId);

      reset();
      setFiles([]);
      success = true;
    } catch (err) {
      console.error("Response submission failed:", err);
      toast.error(err?.response?.data?.message || "Failed to submit response");
    } finally {
      setLoading(false);
    }

    if (success) {
      toast.success("Response added successfully!");
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-200 w-[90%] max-w-7xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-[#6bbd45] rounded-full" />
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">Add Response</h2>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 custom-scrollbar">
          <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Proposal Selection Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                <h3 className="text-lg text-black font-black uppercase tracking-widest">Proposal Details</h3>
              </div>
              
              <div className="flex items-end gap-6">
                <div className="flex-1 space-y-2">
                  <label className="block text-xs text-black font-black uppercase tracking-widest">
                    Select Estimation for Proposal
                  </label>
                  <Select
                    name="estimationId"
                    options={estimations.map((est) => ({
                      label: `${est.estimationNumber} - ${est.projectName}`,
                      value: est.id,
                    }))}
                    value={selectedEstimationId}
                    onChange={(_, val) => handleEstimationChange(val)}
                    placeholder="Select an estimation..."
                    className="border border-black rounded-lg h-14 bg-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!selectedEstimationId}
                  className="flex items-center gap-2 px-8 h-14 bg-green-50 text-black border-2 border-[#6bbd45] rounded-lg hover:bg-green-100 transition-all font-black text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  <Printer className="w-5 h-5" />
                  Print Proposal
                </button>
              </div>

              {/* Pricing Items Selection */}
              {selectedEstimationId && (
                <div className="bg-white p-6 rounded-xl border border-black space-y-6">
                  <h3 className="text-sm font-black text-black uppercase tracking-widest border-b border-black/10 pb-2">
                    Select Pricing Items
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    {pricingItems.map((item, index) => (
                      <div key={item.label} className="space-y-4">
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) =>
                              handlePricingItemChange(index, "selected", e.target.checked)
                            }
                            className="w-5 h-5 accent-[#6bbd45] border-2 border-black rounded cursor-pointer"
                          />
                          <span className="text-sm font-black text-black uppercase tracking-widest group-hover:text-[#6bbd45] transition-colors">
                            {item.label}
                          </span>
                        </label>

                        {item.selected && (
                          <div className="ml-9 flex gap-6 items-center animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="flex-1 space-y-2">
                              <label className="block text-[10px] text-black font-black uppercase tracking-[0.2em] opacity-60">Price ({selectedEstimation?.fabricators?.currencyType || "USD"})</label>
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) => handlePricingItemChange(index, "price", e.target.value)}
                                placeholder="0.00"
                                className="h-12 border-black"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="block text-[10px] text-black font-black uppercase tracking-[0.2em] opacity-60">Approx. Duration (Weeks)</label>
                              <Input
                                type="number"
                                value={item.weeks}
                                onChange={(e) => handlePricingItemChange(index, "weeks", e.target.value)}
                                placeholder="0"
                                className="h-12 border-black"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Message Content Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                <h3 className="text-lg text-black font-black uppercase tracking-widest">Message Content</h3>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs text-black font-black uppercase tracking-widest">
                  Subject *
                </label>
                <Controller
                  name="subject"
                  control={control}
                  rules={{ required: "Subject is required" }}
                  render={({ field }) => (
                    <Input
                      type="text"
                      {...field}
                      value={field.value || ""}
                      className="h-14 border-black font-black"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-black font-black uppercase tracking-widest">
                  Message *
                </label>
                <div className="border border-black rounded-lg overflow-hidden bg-white">
                  <Controller
                    name="description"
                    control={control}
                    rules={{ required: "Message is required" }}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Type your response..."
                      />
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Metrics Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                <h3 className="text-lg text-black font-black uppercase tracking-widest">Tonnage & Documentation</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-xs text-black font-black uppercase tracking-widest">
                    Total Tonnage (With Connection)
                  </label>
                  <Input
                    {...register("totalTonnageWithConnection")}
                    placeholder="e.g. 150 MT"
                    className="h-14 border-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs text-black font-black uppercase tracking-widest">
                    Total Tonnage (Without Connection)
                  </label>
                  <Input
                    {...register("totalTonnageWithoutConnection")}
                    placeholder="e.g. 130 MT"
                    className="h-14 border-black"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs text-black font-black uppercase tracking-widest">
                    Page Numbers
                  </label>
                  <div className="border border-black rounded-lg overflow-hidden bg-white">
                    <Controller
                      name="PageNumbers"
                      control={control}
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="e.g. 1-12"
                          height={150}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Attachments Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 border-b border-black pb-4">
                <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                <h3 className="text-lg text-black font-black uppercase tracking-widest">Attachments & Links</h3>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-black font-black uppercase tracking-widest">
                  Optional Link
                </label>
                <Input
                  {...register("link")}
                  placeholder="Paste URL if any"
                  className="h-14 border-black"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-black font-black uppercase tracking-widest">
                  Attach Files
                </label>
                <div className="bg-white rounded-lg border border-black p-4">
                  <Controller
                    name="files"
                    control={control}
                    render={() => (
                      <MultipleFileUpload
                        onFilesChange={setFiles}
                        initialFiles={files}
                      />
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Form Footer */}
            <div className="pt-10 flex justify-center border-t border-black/10">
              <button
                type="submit"
                disabled={loading}
                className="w-full max-w-2xl py-5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg font-black text-sm uppercase tracking-[0.3em] hover:bg-green-100 transition-all duration-500 shadow-xl active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Submit Response"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResponseModal;
