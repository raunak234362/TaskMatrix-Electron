import { useEffect, useState } from "react";
import { Loader2, AlertCircle, X, Download } from "lucide-react";
import Service from "../../api/Service";
import logo from "../../assets/logo.png";

const GetInvoiceById = ({
  id,
  onClose,
  close,
}) => {
  const handleClose = onClose || close;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await Service.GetInvoiceById(id);
        const data = response?.data || response;
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
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size4;
            margin: 0;
          }
          body {
            visibility: hidden;
          }
          .modal-root {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 9999 !important;
          }
          .modal-root * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always !important;
          }
          .print-page:last-child {
            page-break-after: auto !important;
          }
        }
      `,
        }}
      />

      <div className="modal-root fixed inset-0 z-[100] flex items-start justify-center overflow-auto bg-black/80 backdrop-blur-xl pt-0 pb-0 print:static print:bg-white print:block">
        {/* Action Header - Hidden in Print */}
        <div className="fixed top-6 right-10 z-[110] flex gap-4 no-print print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 transition-all  group scale-110"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            Download PDF
          </button>
          <br />
          {handleClose && (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-3 py-3 bg-white text-gray-900 rounded-full shadow-2xl hover:bg-red-50 hover:text-red-600 transition-all border border-gray-100 scale-110 "
            >
              <X className="w-5 h-3" />
              Close
            </button>
          )}
        </div>

        <div className="w-[210mm] flex flex-col gap-0 shadow-[0_0_100px_rgba(0,0,0,0.5)] print:shadow-none bg-gray-100 print:bg-white  print:my-0">
          {/* Page 1 Invoice */}
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
            <div className="h-[1px] bg-[#e6554d] w-full mb-3"></div>

            <div className="flex justify-between items-start mb-5 text-[12px]">
              {/* Receiver Details */}
              <div className="w-1/2">
                <h2 className=" text-black mb-3 text-[13px]">
                  Details of Receiver (Billed to)
                </h2>
                <div className="grid grid-cols-[120px_1fr] gap-y-1">
                  <span className="text-black">Name:</span>
                  <span className="">{invoice.customerName}</span>

                  <span className="text-black">Contact Name:</span>
                  <span className="">
                    {invoice.contactPerson || "Mr."}
                  </span>

                  <span className="text-black">Address:</span>
                  <span className=" leading-tight">
                    {invoice.address}
                  </span>

                  <span className="text-black">Country/State/Code:</span>
                  <span className="">{invoice.stateCode || "-"}</span>

                  <span className="text-black">GSTIN / UNIQUE ID:</span>
                  <span className="">{invoice.GSTIN || "-"}</span>
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="w-[220px]">
                <div className="text-right mb-4">
                  <h2 className=" text-[14px]">
                    Original for Recipient
                  </h2>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-y-1">
                  <span className="text-black">Invoice No:</span>
                  <span className="">{invoice.invoiceNumber}</span>

                  <span className="text-black">Invoice Date:</span>
                  <span className="">
                    {formatDate(invoice.invoiceDate)}
                  </span>

                  <span className="text-black">Date of Supply:</span>
                  <span className="">
                    {formatDate(invoice.dateOfSupply)}
                  </span>

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
                    <tr key={index} className="border-b border-black">
                      <td className="py-1 px-3 text-left align-top">
                        {index + 1}.
                      </td>
                      <td className="py-1 px-3 text-center align-top whitespace-pre-wrap leading-relaxed">
                        <div className="font-medium">{item.description}</div>
                        {item.remarks && (
                          <div className="text-[10px] text-gray-400 italic">
                            ({item.remarks})
                          </div>
                        )}
                      </td>
                      <td className="py-1 px-3 text-center align-top">
                        {item.sacCode || "998333"}
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
                      key={`filler-${i}`}
                      className="border-b border-black h-7"
                    >
                      <td colSpan={7}>&nbsp;</td>
                    </tr>
                  ))}

                  {/* Summary Section */}
                  <tr className="border-b border-black  h-7">
                    <td colSpan={5} className="px-16 text-left">
                      Total
                    </td>
                    <td
                      colSpan={2}
                      className="px-3 text-right  text-[15px]"
                    >
                      $ {invoice.totalInvoiceValue?.toFixed(0) || "0000"}
                    </td>
                  </tr>

                  <tr className="text-[11px]  text-gray-900 border-b border-black h-7">
                    <td colSpan={4}></td>
                    <td className="py-1 text-center">IGST</td>
                    <td className="py-1 text-center whitespace-nowrap">Rate</td>
                    <td className="py-1 text-center pr-6">Amount</td>
                  </tr>

                  <tr className="text-[11px] text-gray-700 border-b border-black h-7">
                    <td colSpan={4}></td>
                    <td className="py-1 text-center italic">IGST</td>
                    <td className="py-1 text-center">-</td>
                    <td className="py-1 text-center pr-6">-</td>
                  </tr>

                  <tr className=" text-[11px] text-gray-900 border-b border-black h-7">
                    <td colSpan={4}></td>
                    <td className="py-1 text-center">Total GST</td>
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
                          US Dollars
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
              <p className="text-xs text-gray-700 leading-relaxed border-[1px] border-gray-600 p-1 mb-1">
                Consulting Proforma Invoice for Steel Detailing of{" "}
                {invoice.jobName} -{" "}
                <span className="">Cobb P.O #</span>
              </p>
              <p className="text-xs text-black">
                All payments to be made to{" "}
                <span className=" uppercase">
                  Whiteboard Technologies LLC
                </span>{" "}
                in US Dollars via Wire Transfers within 15 days.
              </p>
            </div>

            {/* Signature Area at Base */}
            <div className="mt-auto flex flex-col items-end pr-10">
              <div className="text-left">
                <p className="text-[#6bbd45] font-medium text-[11px] mb-4">
                  Thank you for your business!
                </p>
                <p className="text-[11px]  text-gray-800 mb-2">
                  For Whiteboard Technologies Pvt Ltd
                </p>
              </div>
              <div className="text-center">
                <div className="relative h-[80px] w-[180px] mb-2 flex flex-col items-center justify-center">
                  {/* Signature Placeholder/Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-80">
                    <span className="text-gray-400 font-serif text-[40px] italic leading-none rotate-[-5deg]"></span>
                  </div>
                  <div className="w-full border-gray-300 mt-auto"></div>
                </div>
                <p className="text-[10px]  text-black tracking-wider">
                  Authorised signatory
                </p>
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

          {/* Page 2 Info */}
          <div className="w-[210mm] min-h-[297mm] h-[297mm] bg-white p-[20mm] pt-[15mm] relative flex flex-col shrink-0 overflow-hidden box-border border-t-[10px] border-gray-50 print:border-none print-page">
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
            <div className="h-[1px] bg-[#e6554d] w-full mb-3"></div>
            <p className="mb-10 text-[14px] leading-relaxed text-gray-700">
              Please initiate the ACH/Wire Transfer in{" "}
              <span className=" underline">USD</span> currency from
              your local Bank with the following information:
            </p>

            <h3 className=" text-[15px] text-gray-800 mb-10">
              ACH / Domestic Wire instructions:
            </h3>

            {invoice.accountInfo && invoice.accountInfo.length > 0 ? (
              <div className="grid grid-cols-[250px_1fr] gap-y-10 text-[14px] text-gray-700">
                <span className="">ABA/Routing number:</span>
                <span className="font-medium text-gray-900">
                  {invoice.accountInfo[0].abaRoutingNumber || "121145349"}
                </span>

                <span className="">Account number:</span>
                <span className="font-medium text-gray-900">
                  {invoice.accountInfo[0].accountNumber || "201408414172265"}
                </span>

                <span className="">Account type:</span>
                <span className="text-gray-900">
                  {invoice.accountInfo[0].accountType || "Business checking"}
                </span>

                <span className="">Recipient / beneficiary information*:</span>
                <span className="text-gray-900">
                  Whiteboard Technologies LLC.
                </span>

                <span className="text-gray-900 whitespace-pre-wrap leading-snug">
                  {invoice.accountInfo[0].beneficiaryAddress ||
                    "2055, Limestone Rd STE 200-C, Wilmington New Castle Country,\nWilmington, DE, 19808."}
                </span>

                <span className="">Bank information:</span>
                <span className="text-gray-900">
                  {invoice.accountInfo[0].bankName || "Column Bank"}
                </span>

                <span className="text-gray-900 whitespace-pre-wrap leading-snug">
                  {invoice.accountInfo[0].bankAddress ||
                    "1110, Gorg Suite A4-700, San Francisco, CA 94129."}
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
    </>
  );
};

export default GetInvoiceById;
