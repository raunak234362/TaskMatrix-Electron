import { useEffect, useState, useRef } from "react";
import { Loader2, AlertCircle, X, Download, Pencil } from "lucide-react";
import Service from "../../api/Service";
import logo from "../../assets/logo.png";
import { useDispatch } from "react-redux";
import { incrementModalCount, decrementModalCount } from "../../store/uiSlice";
import UpdateInvoice from "./UpdateInvoice";

const GetInvoiceById = ({
  id,
  onClose,
  close,
}) => {
  const handleClose = onClose || close;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const userRole = sessionStorage.getItem("userRole")?.toUpperCase();
  const canEdit = ["ADMIN", "PROJECT_MANAGER_OFFICER"].includes(userRole);

  const componentRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(incrementModalCount());
    return () => {
      dispatch(decrementModalCount());
    };
  }, [dispatch]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await Service.GetInvoiceById(id);
        const data = response?.data || response || null;
        setInvoice(data);
      } catch (err) {
        setError("Failed to load invoice details");
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchInvoice();
  }, [id]);

  // 🔥 HTML PRINT (RFQ STYLE) - PIXEL PERFECT REPLICATION
  const handleHtmlPrint = () => {
    if (!invoice) return;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const formatDateStr = (date) => {
      if (!date) return "—";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const itemsHtml =
      invoice.invoiceItems
        ?.map(
          (item, index) => `
      <tr style="border-bottom: 1px solid black;">
        <td style="padding: 8px; text-align: left;">${index + 1}.</td>
        <td style="padding: 8px; text-align: left;">${item.description}</td>
        <td style="padding: 8px; text-align: center;">${item.sacCode || "998333"}</td>
        <td style="padding: 8px; text-align: center;">${item.unit}</td>
        <td style="padding: 8px; text-align: center;">${item.rateUSD?.toFixed(0) || "000"}</td>
        <td style="padding: 8px; text-align: center;">${item.totalUSD?.toFixed(0) || "000"}</td>
        <td style="padding: 8px; text-align: center;">${item.totalUSD?.toFixed(0) || "000"}</td>
      </tr>
    `,
        )
        .join("") || "";

    const bankInfo = invoice?.fabricator?.bankAccount || null;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice_${invoice.invoiceNumber || "NA"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: white; font-family: 'Inter', 'Roboto', sans-serif; color: #000; }
            .print-page {
              width: 210mm;
              height: 297mm;
              padding: 15mm;
              box-sizing: border-box;
              page-break-after: always;
              background: white;
              display: flex;
              flex-direction: column;
              position: relative;
            }
            .print-page:last-child { page-break-after: auto; }
            
            .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; }
            .company-name { font-family: serif; color: #6bbd45; font-size: 28px; font-weight: 500; margin: 0; line-height: 1; }
            .logo { height: 90px; object-fit: contain; }
            .divider-red { height: 1px; background: #6bbd45; width: 100%; margin-bottom: 20px; }

            .details-container { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px; line-height: 1.4; }
            .billing-details { width: 60%; }
            .meta-details { width: 35%; text-align: right; }
            .section-title { font-weight: bold; font-size: 13px; margin-bottom: 8px; }
            .grid-details { display: grid; grid-template-columns: 140px 1fr; gap: 2px; text-align: left; }
            .label { color: #000; font-weight: bold; }
            .value { font-weight: normal; }
            .meta-grid { display: grid; grid-template-columns: 1fr 100px; gap: 4px; text-align: left; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #6bbd45; }
            thead { background: #6bbd45; color: white; font-size: 11px; font-weight: bold; }
            th { padding: 8px; text-align: center; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.8); }
            th:last-child { border-right: none; }
            tbody { font-size: 12px; }
            
            .total-row { font-weight: bold; border-top: 2px solid #6bbd45; border-bottom: 1px solid #6bbd45; }
            .gst-row { font-size: 11px; font-weight: bold; border-bottom: 1px solid #6bbd45; }
            .value-row { font-weight: bold; font-size: 13px; border-bottom: 1px solid #6bbd45; }
            
            .instructions { margin-bottom: 25px; }
            .instr-title { color: #6bbd45; font-weight: bold; font-size: 13px; margin-bottom: 5px; }
            .instr-box { border: 1px solid #000; padding: 8px; font-size: 12px; margin-bottom: 8px; font-style: italic; }
            .instr-text { font-size: 12px; }
            
            .signature-area { margin-top: auto; padding-bottom: 20px; display: flex; flex-direction: column; align-items: flex-end; }
            .thank-you { color: #6bbd45; font-weight: bold; font-size: 13px; font-style: italic; margin-bottom: 15px; align-self: center; }
            .sig-box { text-align: center; width: 220px; }
            .sig-company { font-size: 12px; font-weight: bold; margin-bottom: 50px; }
            .sig-line { border-top: 1px solid #000; padding-top: 5px; font-size: 10px; font-weight: bold; text-transform: uppercase; }

            .footer { border-top: 1px solid #eee; padding-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px; color: #000; }
            .footer-green { color: #6bbd45; font-weight: bold; text-transform: uppercase; }
            
            /* Bank Info Styles */
            .bank-grid { display: grid; grid-template-columns: 280px 1fr; gap: 15px; font-size: 14px; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <!-- Page 1 -->
          <div class="print-page">
            <div class="header">
              <h1 class="company-name">Whiteboard Technologies LLC</h1>
              <img src="${logo}" class="logo" />
            </div>
            <div class="divider-red"></div>
            
            <div class="details-container">
              <div class="billing-details">
                <div class="section-title">Details of Receiver (Billed to)</div>
                <div class="grid-details">
                  <span class="label">Name:</span><span class="value">${invoice.customerName}</span>
                  <span class="label">Contact Name:</span><span class="value">${invoice.contactName || "—"}</span>
                  <span class="label">Address:</span>
                  <span class="value" style="line-height: 1.2;">
                    ${invoice.pointOfContact?.[0]?.address || invoice.address || invoice.client?.address || invoice.fabricator?.branches?.[0]?.address || "—"}<br/>
                    ${invoice.pointOfContact?.[0]?.city || invoice.city || invoice.client?.city || invoice.fabricator?.branches?.[0]?.city || ""}${invoice.pointOfContact?.[0]?.city || invoice.city || invoice.client?.city || invoice.fabricator?.branches?.[0]?.city ? ", " : ""}${invoice.pointOfContact?.[0]?.state || invoice.state || invoice.stateCode || invoice.client?.state || invoice.fabricator?.branches?.[0]?.state || ""}${invoice.pointOfContact?.[0]?.zipCode || invoice.zipCode || invoice.client?.zipCode || invoice.fabricator?.branches?.[0]?.zipCode ? ` ${invoice.pointOfContact?.[0]?.zipCode || invoice.zipCode || invoice.client?.zipCode || invoice.fabricator?.branches?.[0]?.zipCode}` : ""}<br/>
                    ${invoice.pointOfContact?.[0]?.country || invoice.country || invoice.client?.country || invoice.fabricator?.branches?.[0]?.country || ""}<br/>
                    ${invoice.pointOfContact?.[0]?.phone || invoice.phone || invoice.client?.phone || invoice.fabricator?.branches?.[0]?.phone ? `Phone: ${invoice.pointOfContact?.[0]?.phone || invoice.phone || invoice.client?.phone || invoice.fabricator?.branches?.[0]?.phone}` : ""}
                  </span>
                  <span class="label">Country/State /Code:</span><span class="value">${invoice.pointOfContact?.[0]?.state || invoice.state || invoice.stateCode || invoice.client?.state || invoice.fabricator?.branches?.[0]?.state || "-"}</span>
                  <span class="label">GSTIN / UNIQUE ID:</span><span class="value">${invoice.GSTIN || "-"}</span>
                </div>
              </div>
              <div class="meta-details">
                <div style="margin-bottom: 10px; font-weight: bold;">Original for Recipient</div>
                <div class="meta-grid">
                  <span class="label">Invoice No:</span><span class="value">${invoice.invoiceNumber || "—"}</span>
                  <span class="label">Invoice Date:</span><span class="value">${formatDateStr(invoice.invoiceDate)}</span>
                  <span class="label">Date of Supply:</span><span class="value">${formatDateStr(invoice.dateOfSupply)}</span>
                  <span class="label">Place of Supply:</span><span class="value">${invoice.placeOfSupply || "USA"}</span>
                  <span class="label">Job Name:</span><span class="value" style="font-weight: bold;">${invoice.jobName}</span>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 45px;">SL #</th>
                  <th style="text-align: left;">DESCRIPTION OF ENGINEERING SERVICES</th>
                  <th style="width: 70px;">SAC</th>
                  <th style="width: 50px;">UNIT</th>
                  <th style="width: 90px;">RATE (USD)</th>
                  <th style="width: 80px;">TOTAL</th>
                  <th style="width: 100px;">TOTAL (USD)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="5" style="padding: 10px 15px; text-transform: bold; text-align: left;">Total</td>
                  <td colspan="2" style="padding: 10px; text-align: right; font-size: 15px;">$ ${invoice.totalInvoiceValue?.toFixed(0) || "0"}</td>
                </tr>
                <tr class="gst-row">
                  <td colspan="4" style="border: none;"></td>
                  <td style="text-align: center; padding: 5px;">IGST</td>
                  <td style="text-align: center; padding: 5px;">Rate</td>
                  <td style="text-align: center; padding: 5px;">Amount</td>
                </tr>
                <tr class="gst-row" style="font-weight: normal;">
                  <td colspan="4" style="border: none;"></td>
                  <td style="text-align: center; padding: 5px;">IGST</td>
                  <td style="text-align: center; padding: 5px;">-</td>
                  <td style="text-align: center; padding: 5px;">-</td>
                </tr>
                <tr class="gst-row">
                  <td colspan="4" style="border: none;"></td>
                  <td colspan="2" style="text-align: center; padding: 5px;">Total GST</td>
                  <td style="text-align: center; padding: 5px;">-</td>
                </tr>
                <tr class="value-row">
                  <td colspan="6" style="padding: 8px; text-align: left;">Total Invoice Value (in Figures)</td>
                  <td style="padding: 8px; text-align: right;">$ ${invoice.totalInvoiceValue?.toFixed(2) || "0.00"}</td>
                </tr>
                <tr>
                  <td colspan="7" style="padding: 8px; border-bottom: 1.5px solid #6bbd45; font-weight: bold;">
                    Total Invoice Value (in Words): <span style="text-transform: uppercase; margin-left: 10px;">${invoice.totalInvoiceValueInWords || "—"}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="instructions">
              <div class="instr-title">Instructions</div>
              <div class="instr-box">
                Consulting Proforma Invoice for Steel Detailing of ${invoice.jobName} - ${invoice.fabricator?.fabName} P.O. #${invoice.project?.projectNumber || invoice.project?.projectCode || ""}
              </div>
              <div class="instr-text">
                All payments to be made to <span style="font-weight: bold; text-transform: uppercase;">Whiteboard Technologies LLC</span> in US Dollars via Wire Transfers within 15 days.
              </div>
            </div>

            <div class="signature-area">
              <div class="thank-you">Thank you for your business!</div>
              <div class="sig-box">
                <div class="sig-company">For Whiteboard Technologies Pvt Ltd</div>
                <div style="height: 60px;"></div>
                <div class="sig-line">Authorised signatory</div>
              </div>
            </div>

            <div class="footer">
              <div>
                <p style="margin-bottom: 5px;">For any questions please contact Raj:</p>
                <p><span class="footer-green">Tel:</span> USA: +1 612.605.5833</p>
                <p><span class="footer-green">Email:</span> raj@whiteboardtec.com</p>
              </div>
              <div style="text-align: right;">
                <p><span style="visibility: hidden;">Tel:</span> INDIA: +1 770.256.6888</p>
                <p><span class="footer-green">Web:</span> www.whiteboardtec.com</p>
              </div>
            </div>
          </div>

          <!-- Page 2 -->
          <div class="print-page">
            <div class="header">
              <h1 class="company-name">Whiteboard Technologies LLC</h1>
              <img src="${logo}" class="logo" />
            </div>
            <div class="divider-red"></div>
            
            <p style="font-size: 14px; margin-bottom: 40px; line-height: 1.5;">
              Please initiate the ACH/Wire Transfer in <span
              ">${invoice?.currencyType}</span> currency from your local Bank with the following information:
            </p>

            <h3 style="font-size: 15px; font-weight: bold; margin-bottom: 30px;">ACH / Domestic Wire instructions:</h3>

            ${bankInfo
        ? `
              <div class="bank-grid">
                <span class="label">ABA/Routing number:</span><span class="value">${bankInfo.abaRoutingNumber || "—"}</span>
                <span class="label">Account number:</span><span class="value">${bankInfo.accountNumber || "—"}</span>
                <span class="label">Account type:</span><span class="value">${bankInfo.accountType || "—"}</span>
                <span class="label">Recipient / beneficiary information*:</span><span class="value" style="text-transform: uppercase;">${bankInfo.accountName || "Whiteboard Technologies LLC."}</span>
                <span class="label">Beneficiary address:</span><span class="value">${bankInfo.beneficiaryAddress || "—"}</span>
                <span class="label">Bank information:</span><span class="value">${bankInfo.bankName || "—"}</span>
                <span class="label">Bank Address:</span><span class="value">${bankInfo.bankAddress || "—"}</span>
              </div>
            `
        : `
              <div style="background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 30px; text-align: center; border-radius: 4px; font-weight: bold;">
                No bank account information attached to this invoice.
              </div>
            `
      }

            <p style="font-size: 11px; color: #666; font-style: italic; margin-top: 20px;">
              *Use this name as the recipient's name of the wire.
            </p>

            <div class="footer" style="margin-top: auto;">
              <div>
                <p style="margin-bottom: 5px;">For any questions please contact Raj:</p>
                <p><span class="footer-green">Tel:</span> USA: +1 612.605.5833</p>
                <p><span class="footer-green">Email:</span> raj@whiteboardtec.com</p>
              </div>
              <div style="text-align: right;">
                <p><span style="visibility: hidden;">Tel:</span> INDIA: +1 770.256.6888</p>
                <p><span class="footer-green">Web:</span> www.whiteboardtec.com</p>
              </div>
            </div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
                window.close();
              }, 700);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading invoice...
      </div>
    );

  if (error || !invoice)
    return (
      <div className="flex items-center justify-center py-12 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        {error || "Invoice not found"}
      </div>
    );

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Print Styles (kept same) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page { size: A4; margin: 0; }
            body { background: white; margin: 0; padding: 0; }
            .print-page {
              box-shadow: none !important;
              margin: 0 !important;
              page-break-after: always !important;
              break-after: page !important;
              width: 100% !important;
              min-height: 297mm !important;
              padding: 15mm !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              background: white !important;
              position: relative !important;
            }
            .print-page:last-child { page-break-after: auto !important; }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
`,
        }}
      />

      <div className="modal-root fixed inset-0 z-[10001] flex items-start justify-center overflow-auto bg-black/80 backdrop-blur-xl pt-0 pb-0">
        {/* Action Header */}
        <div className="fixed top-6 right-10 z-[10002] flex gap-4 no-print">
          <button
            onClick={handleHtmlPrint}
            className="flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          {/* Edit button — ADMIN / PROJECT_MANAGER_OFFICER only */}
          {canEdit && invoice && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}

          {handleClose && (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          )}
        </div>

        <div
          ref={componentRef}
          className="w-[210mm] flex flex-col gap-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-gray-100 print-content"
        >
          {/* Page 1: Main Invoice */}
          <div className="w-[210mm] min-h-[297mm] bg-white p-[15mm] flex flex-col shadow-none print:shadow-none mx-auto box-border font-roboto print-page">
            {/* Header Letterhead */}
            <div className="flex justify-between items-end mb-5">
              <div>
                <h1
                  className="text-[28px] font-medium text-[#6bbd45] mb-2 leading-none"
                  style={{ fontFamily: "serif" }}
                >
                  Whiteboard Technologies LLC
                </h1>
              </div>
              {/* Ensure logo height is proportional */}
              <img src={logo} alt="Logo" className="h-25 object-contain" />
            </div>
            <div className="h-px bg-[#6bbd45] w-full mb-2"></div>

            <div className="flex justify-between items-start mb-2 text-[12px]">
              {/* Receiver Details */}
              <div className="w-1/2">
                <h2 className=" text-black mb-2 text-[13px]">
                  Details of Receiver (Billed to)
                </h2>
                <div className="grid grid-cols-[120px_1fr] gap-y-1">
                  <span className="text-black">Name:</span>
                  <span className="">{invoice.fabricator?.fabName || "—"}</span>

                  <span className="text-black">Contact Name:</span>
                  <span className="">{invoice.contactName || "—"}</span>

                  <span className="text-black">Address:</span>
                  <div className="flex flex-col leading-tight">
                    <span>{invoice.pointOfContact?.[0]?.address || invoice.address || invoice.client?.address || invoice.fabricator?.branches?.[0]?.address || "—"}</span>
                    <span>
                      {invoice.pointOfContact?.[0]?.city || invoice.city || invoice.client?.city || invoice.fabricator?.branches?.[0]?.city}
                      {(invoice.pointOfContact?.[0]?.city || invoice.city || invoice.client?.city || invoice.fabricator?.branches?.[0]?.city) && ", "}
                      {invoice.pointOfContact?.[0]?.state || invoice.state || invoice.stateCode || invoice.client?.state || invoice.fabricator?.branches?.[0]?.state}{" "}
                      {invoice.pointOfContact?.[0]?.zipCode || invoice.zipCode || invoice.client?.zipCode || invoice.fabricator?.branches?.[0]?.zipCode}
                    </span>
                    <span>{invoice.pointOfContact?.[0]?.country || invoice.country || invoice.client?.country || invoice.fabricator?.branches?.[0]?.country}</span>
                    <span>
                      {invoice.pointOfContact?.[0]?.phone || invoice.phone || invoice.client?.phone || invoice.fabricator?.branches?.[0]?.phone ? ` ${invoice.pointOfContact?.[0]?.phone || invoice.phone || invoice.client?.phone || invoice.fabricator?.branches?.[0]?.phone}` : ""}
                    </span>
                  </div>

                  <span className="text-black ">Country/State /Code:</span>
                  {/* <span className=" "> {invoice.pointOfContact?.[0]?.state || invoice.state || invoice.stateCode || invoice.client?.state || invoice.fabricator?.branches?.[0]?.state || "-"} </span> */}
                  <br />
                  <span className="text-black ">GSTIN / UNIQUE ID:</span>
                  <span className=" ">{invoice.GSTIN || "-"}</span>
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="w-[220px]">
                <div className="text-right mb-4">
                  <h2 className=" text-[14px]">Original for Recipient</h2>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-y-2">
                  <span className="text-black">Invoice No:</span>
                  <span className="">
                    {invoice.invoiceNumber || "—"}
                  </span>

                  <span className="text-black">Invoice Date:</span>
                  <span className="">{formatDate(invoice.invoiceDate)}</span>

                  <span className="text-black">Date of Supply:</span>
                  <span className="">{formatDate(invoice.dateOfSupply)}</span>

                  <span className="text-black">Place of Supply:</span>
                  <span className="">
                    {invoice.placeOfSupply || "Electronic"}
                  </span>

                  <span className="text-black">Job Name:</span>
                  <span className="">{invoice.jobName}</span>
                </div>
              </div>
            </div>

            {/* Items Table - Only Rows, No Columns */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="py-2 px-3 border-r border-gray-300 text-left w-[50px]  text-[11px] uppercase">
                      SL #
                    </th>
                    <th className="py-2 px-3 border-r border-gray-300 text-center  text-[11px] uppercase">
                      Description of Engineering Services
                    </th>
                    <th className="py-2 px-3 border-r border-gray-300 text-center w-[70px]  text-[11px] uppercase">
                      SAC
                    </th>
                    <th className="py-2 px-3 border-r border-gray-300 text-center w-[50px]  text-[11px] uppercase">
                      Unit
                    </th>
                    <th className="py-2 px-3 border-r border-gray-300 text-center w-[90px]  text-[11px] uppercase whitespace-nowrap">
                      Rate (USD)
                    </th>
                    <th className="py-2 px-3 border-r border-gray-300 text-center w-[90px]  text-[11px] uppercase whitespace-nowrap">
                      Total
                    </th>
                    <th className="py-2 px-3 text-center w-[110px]  text-[11px] uppercase whitespace-nowrap">
                      Total (USD)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[12px] text-black">
                  {invoice.invoiceItems?.map((item, index) => (
                    <tr key={index} className="border-b border-green-600/20">
                      <td className="py-1 px-3 text-left align-top">
                        {index + 1}.
                      </td>
                      <td className="py-1 px-3 text-left align-top whitespace-pre-wrap leading-relaxed">
                        <div className="font-medium">{item.description}</div>
                        {item.remarks && (
                          <div className="text-[10px] text-gray-400 italic">
                            ({item.remarks})
                          </div>
                        )}
                      </td>
                      <td className="py-1 px-3 text-center align-top">
                        {item.sacCode}
                      </td>
                      <td className="py-1 px-3 text-center align-top">
                        {item.unit}
                      </td>
                      <td className="py-1 px-3 text-center align-top">
                        {item.rateUSD?.toFixed(0) || "000"}
                      </td>
                      <td className="py-1 px-3 text-center align-top">
                        {item.totalUSD?.toFixed(0) || "000"}
                      </td>
                      <td className="py-1 px-3 text-center align-top">
                        {item.totalUSD?.toFixed(0) || "000"}
                      </td>
                    </tr>
                  ))}
                  {/* Filler Rows */}
                  {[
                    ...Array(
                      Math.max(0, 3 - (invoice.invoiceItems?.length || 0)),
                    ),
                  ].map((_, i) => (
                    <tr
                      key={`filler - ${i} `}
                      className="border-b border-black h-7"
                    >
                      <td colSpan={7}>&nbsp;</td>
                    </tr>
                  ))}

                  {/* Summary Section */}
                  <tr className="border-b border-black  h-7 text-sm">
                    <td colSpan={5} className="px-16 text-left">
                      Total
                    </td>
                    <td colSpan={2} className="px-3 text-right font-semibold">
                      $ {invoice.totalInvoiceValue?.toFixed(0) || "0000"}
                    </td>
                  </tr>

                  <tr className="text-sm  text-gray-900 border-b border-black h-7">
                    <td colSpan={4}></td>
                    <td className="py-1 text-center font-bold">IGST</td>
                    <td className="py-1 text-center font-bold whitespace-nowrap">Rate</td>
                    <td className="py-1 text-center font-bold pr-6">Amount</td>
                  </tr>

                  <tr className="text-sm  text-gray-700 border-b border-black h-7">
                    <td colSpan={4}></td>
                    <td className="py-1 text-center">IGST</td>
                    <td className="py-1 text-center">-</td>
                    <td className="py-1 text-center pr-6">-</td>
                  </tr>

                  <tr className="text-sm  text-gray-900 border-b border-black h-7">
                    <td colSpan={4}></td>
                    <td className="py-1 text-center font-bold">Total GST</td>
                    <td className="py-1 text-center">-</td>
                    <td className="py-1 text-center pr-6">-</td>
                  </tr>

                  <tr className=" h-7 text-[13px] border-b border-black">
                    <td colSpan={6} className="px-3 text-left">
                      Total Invoice Value (in Figures)
                    </td>
                    <td className="px-3 text-right text-sm">
                      $ {invoice.totalInvoiceValue?.toFixed(2) || "0000.00"}
                    </td>
                  </tr>

                  <tr className="border-b border-black">
                    <td colSpan={7} className="px-3 py-1">
                      <div className="flex gap-2 text-[12px] items-center">
                        <span className="">
                          Total Invoice Value (in Words):
                        </span>
                        <span className=" uppercase tracking-tight text-gray-700">
                          {invoice.totalInvoiceValueInWords || "—"}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Instructions */}
            <div className="mb-3">
              <h4 className="text-green-600  text-[12px] mb-1 tracking-tight">
                Instructions
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed border border-green-500/20 p-2 mb-1 rounded-lg bg-green-50/30">
                Consulting Proforma Invoice for Steel Detailing of{" "}
                {invoice.jobName} - {invoice.fabricator?.fabName} P.O. #{" "}
                {invoice.project?.projectNumber || invoice.project?.projectCode || ""}
              </p>
              <p className="text-xs text-black">
                All payments to be made to{" "}
                <span className=" uppercase">Whiteboard Technologies LLC</span>{" "}
                in {invoice?.currencyType} Dollars via Wire Transfers within 15 days.
              </p>
            </div>

            {/* Signature Area at Base */}
            <div className="mt-auto flex flex-col items-center pr-10 self-end">
              <p className="text-[#6bbd45] font-semibold text-[13px] mb-8 text-center">
                Thank you for your business!
              </p>
              <div className="text-center w-[220px]">
                <p className="text-[12px] font-bold text-gray-900 mb-10">
                  For Whiteboard Technologies Pvt Ltd
                </p>
                <div className="border-t border-[#6bbd45]/20 w-full pt-1">
                  <p className="text-[10px] font-semibold text-black uppercase tracking-wider">
                    Authorised signatory
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Footer */}
            <div className="mt-12 pt-8 flex justify-between text-[12px] text-gray-500">
              <div className="flex-1">
                <p className="mb-4 text-gray-700 font-normal">
                  For any questions please contact Raj:
                </p>
                <div className="flex gap-16">
                  <div className="flex flex-col items-start justify-start gap-1">
                    <span className="uppercase  text-[12px]">
                      {" "}
                      <span className="text-[#6bbd45] ">Tel:</span> USA: +1
                      612.605.5833
                    </span>
                    <span className="uppercase  text-[12px]">
                      INDIA: +1 770.256.6888
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#6bbd45] uppercase  text-[12px]">
                      Email:{" "}
                      <span className="text-gray-500 normal-case font-medium">
                        raj@whiteboardtec.com
                      </span>
                    </span>
                    <span className="text-[#6bbd45] uppercase  text-[12px]">
                      Web:{" "}
                      <span className="text-gray-500 normal-case font-medium">
                        www.whiteboardtec.com
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page 2: Bank Info */}
          <div className="w-[210mm] min-h-[297mm] bg-white p-[20mm] pt-[15mm] relative flex flex-col shrink-0 overflow-visible box-border border-t-10 border-gray-50 print-page">
            {/* Header Letterhead */}
            <div className="flex justify-between items-end mb-5">
              <div>
                <h1
                  className="text-[28px] font-medium text-[#6bbd45] mb-2 leading-none"
                  style={{ fontFamily: "serif" }}
                >
                  Whiteboard Technologies LLC
                </h1>
              </div>
              {/* Ensure logo height is proportional */}
              <img src={logo} alt="Logo" className="h-25 object-contain" />
            </div>
            <div className="h-px bg-[#e6554d] w-full mb-3"></div>
            <p className="mb-10 text-[14px] leading-relaxed text-gray-700">
              Please initiate the ACH/Wire Transfer in{" "}
              <span className=" underline">{invoice?.currencyType}</span> currency from your local
              Bank with the following information:
            </p>

            <h3 className=" text-[15px] text-gray-800 mb-10">
              ACH / Domestic Wire instructions:
            </h3>

            {invoice?.fabricator?.bankAccount ? (
              <div className="grid grid-cols-[250px_1fr] gap-y-10 text-[14px] text-gray-700">
                <span className="">ABA/Routing number:</span>
                <span className="font-medium text-gray-900">
                  {invoice.fabricator.bankAccount.abaRoutingNumber || "—"}
                </span>

                <span className="">Account number:</span>
                <span className="font-medium text-gray-900">
                  {invoice.fabricator.bankAccount.accountNumber || "—"}
                </span>

                <span className="">Account type:</span>
                <span className="text-gray-900">
                  {invoice.fabricator.bankAccount.accountType || "—"}
                </span>

                <span className="">Recipient / beneficiary information*:</span>
                <span className="text-gray-900">
                  {invoice.fabricator.bankAccount.accountName ||
                    "Whiteboard Technologies LLC."}
                </span>

                <span className="">Beneficiary address:</span>
                <span className="text-gray-900 whitespace-pre-wrap leading-snug">
                  {invoice.fabricator.bankAccount.beneficiaryAddress || "—"}
                </span>

                <span className="">Bank information:</span>
                <span className="text-gray-900">
                  {invoice.fabricator.bankAccount.bankName || "—"}
                </span>

                <span className="">Bank Address:</span>
                <span className="text-gray-900 whitespace-pre-wrap leading-snug">
                  {invoice.fabricator.bankAccount.bankAddress || "—"}
                </span>
              </div>
            ) : (
              <div className="bg-red-50 p-8 rounded text-center">
                <p className="text-red-500 ">
                  No bank account information attached to this invoice.
                </p>
              </div>
            )}

            <p className="mt-12 text-[12px] text-gray-600 font-normal">
              *Use this name as the recipient's name of the wire.
            </p>



            {/* Contact Footer Page 2 */}
            <div className="mt-auto pt-8 flex justify-between text-[10px] text-gray-500">
              <div className="flex-1">
                <p className="mb-4 text-gray-700 font-normal text-[12px]">
                  For any questions please contact Raj:
                </p>
                <div className="flex gap-16">
                  <div className="flex flex-col items-start justify-start gap-1">
                    <span className="uppercase  text-[12px]">
                      {" "}
                      <span className="text-[#6bbd45] ">Tel:</span> USA: +1
                      612.605.5833
                    </span>
                    <span className="uppercase  text-[12px]">
                      INDIA: +1 770.256.6888
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#6bbd45] uppercase  text-[12px]">
                      Email:{" "}
                      <span className="text-gray-500 normal-case font-medium">
                        raj@whiteboardtec.com
                      </span>
                    </span>
                    <span className="text-[#6bbd45] uppercase  text-[12px]">
                      Web:{" "}
                      <span className="text-gray-500 normal-case font-medium">
                        www.whiteboardtec.com
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode — render UpdateInvoice as overlay */}
      {editMode && invoice && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-black text-black uppercase tracking-tight">Edit Invoice</h2>
              <button
                onClick={() => setEditMode(false)}
                className="p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-all text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <UpdateInvoice
                invoiceId={id}
                onSuccess={() => {
                  setEditMode(false);
                  Service.GetInvoiceById(id).then((res) =>
                    setInvoice(res?.data || res || null)
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GetInvoiceById;
