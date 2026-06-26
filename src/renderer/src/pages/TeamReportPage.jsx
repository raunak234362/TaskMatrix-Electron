import React from 'react'
import TeamProjectReport from '../components/report/TeamProjectReport'

const TeamReportPage = () => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";

  if (userRole === "staff" || userRole === "user") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
          You do not have access to view Team Reports.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <TeamProjectReport />
    </div>
  )
}

export default TeamReportPage
