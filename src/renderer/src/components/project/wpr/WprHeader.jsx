import React from "react";
import Logo from '../../../assets/logo.png';

const WprHeader = ({
  weekEnding,
  project,
  fabProjectManager,
  wbtCirculatedTo,
  fabCirculatedTo,
  software,
  formNo,
  setFormNo,
  version,
  setVersion,
  effDate,
  setEffDate
}) => {
  return (
    <div className="border border-black overflow-hidden mb-6 bg-white shadow-sm mt-4">
      <table className="w-full border-collapse text-xs text-black">
        <tbody>
          {/* Header Row */}
          <tr className="bg-[#eaf4fe] border-b border-black">
            <td className="w-1/4 border-r border-black text-center bg-white align-middle">
              <div className="flex items-center justify-center">
                <img src={Logo} alt="WBT Whiteboard Logo" className="h-20" />
              </div>
            </td>
            <td colSpan={2} className="p-4 border-r border-black text-center text-lg font-bold bg-[#eaf4fe]">
              Week Ending {weekEnding}
            </td>
            <td className="w-[30%] p-0 bg-[#eaf4fe] align-top">
              <table className="w-full h-full border-collapse text-[10px]">
                <tbody>
                  <tr>
                    <td className="p-1.5 border-b border-r border-black bg-[#fef2cd] w-1/3">FORM NO</td>
                    <td className="p-0 border-b border-black font-normal bg-white">
                      <input type="text" value={formNo} onChange={(e) => setFormNo(e.target.value)} className="w-full h-full p-1.5 outline-none bg-transparent" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-b border-r border-black bg-[#fef2cd]">VERSION</td>
                    <td className="p-0 border-b border-black font-normal bg-white">
                      <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} className="w-full h-full p-1.5 outline-none bg-transparent" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-1.5 border-r border-black bg-[#fef2cd]">EFF DATE</td>
                    <td className="p-0 font-normal bg-white">
                      <input type="text" value={effDate} onChange={(e) => setEffDate(e.target.value)} className="w-full h-full p-1.5 outline-none bg-transparent" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* Row 1: Customer */}
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Customer</td>
            <td colSpan={3} className="p-2 bg-white font-normal">
              {project?.fabricator?.fabName || "—"}
            </td>
          </tr>

          {/* Row 2: Project Name | Fab PM */}
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Project Name :</td>
            <td className="p-2 border-r border-black bg-white font-normal">
              {project?.projectName || project?.name || "—"}
            </td>
            <td className="p-2 border-r border-black bg-green-200 text-center font-bold w-1/4">Fabricator Project Manager</td>
            <td className="p-0 bg-white font-normal">
              <input
                type="text"
                value={fabProjectManager}
                readOnly
                className="w-full h-full p-2 outline-none uppercase bg-transparent"
              />
            </td>
          </tr>

          {/* Row 3: WBT PM | Fab Report Circulated To */}
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-green-200 text-center font-bold">WBT Project Manager</td>
            <td className="p-2 border-r border-black bg-white font-normal">
              {project?.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "—"}
            </td>
            <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Report Circulated to</td>
            <td className="p-0 bg-white font-normal">
              <input
                type="text"
                value={fabCirculatedTo}
                readOnly
                className="w-full h-full p-2 outline-none uppercase bg-transparent"
              />
            </td>
          </tr>

          {/* Row 4: WBT Report Circulated To | Software */}
          <tr className="border-b border-black">
            <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Report Circulated to</td>
            <td className="p-0 border-r border-black bg-white font-normal">
              <input
                type="text"
                value={wbtCirculatedTo}
                readOnly
                className="w-full h-full p-2 outline-none uppercase bg-transparent"
              />
            </td>
            <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Software</td>
            <td className="p-0 bg-white font-normal">
              <input
                type="text"
                value={software}
                readOnly
                className="w-full h-full p-2 outline-none uppercase bg-transparent"
              />
            </td>
          </tr>
          {/* Spacer Line */}
          <tr className="border-b border-black bg-white">
            <td colSpan={4} className="h-6"></td>
          </tr>
          {/* Row 5: Dates */}
          <tr className="border-b border-black">
            <td colSpan={4} className="p-0">
              <table className="w-full h-full border-collapse text-xs">
                <tbody>
                  <tr>
                    <td className="w-1/6 p-2 border-r border-black text-center font-bold">Project Awarded</td>
                    <td className="w-1/6 p-2 border-r border-black bg-white font-normal">
                      {project?.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="w-1/6 p-2 border-r border-black text-center font-bold">Approval Date</td>
                    <td className="w-1/6 p-2 bg-white font-normal border-r border-black">
                      {project?.approvalDate ? new Date(project.approvalDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="w-1/6 p-2 border-r border-black text-center font-bold">Fab Released Date</td>
                    <td className="w-1/6 p-2 bg-white font-normal">
                      {project?.fabricationDate ? new Date(project.fabricationDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default WprHeader;
