import React from 'react'
import {
  FileText,
  Settings,
  FolderOpenDot,
  Users,
  Clock,
  ClipboardList,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react'

const TABS_CONFIG = [
  { key: 'overview', label: 'Overview', icon: ClipboardList },
  { key: 'wpr', label: 'WPR', icon: FileSpreadsheet },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
  { key: 'teamAnalytics', label: 'Team Analytics', icon: Users },
  { key: 'files', label: 'Files', icon: FolderOpenDot },
  { key: 'wbs', label: 'WBS', icon: ClipboardList },
  { key: 'milestones', label: 'Milestones', icon: Clock },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'projectNotes', label: 'Project Notes', icon: FileText },
  { key: 'rfi', label: 'RFI', icon: FileText },
  { key: 'submittals', label: 'Submittals', icon: FileText },
  { key: 'changeOrder', label: 'Change Order', icon: Settings },
  { key: 'coordinationDrawings', label: 'Coordination Drawings', icon: FileText }
]

const ProjectSidebar = ({ activeTab, setActiveTab, userRole }) => {
  const visibleTabs = TABS_CONFIG.filter((tab) => {
    if (userRole === 'human_resource') {
      return ['analytics', 'teamAnalytics'].includes(tab.key)
    }
    if (
      userRole === 'staff' &&
      [
        'wbs',
        'milestones',
        'analytics',
        'teamAnalytics',
        'CDrfi',
        'CDsubmittals'
      ].includes(tab.key)
    ) {
      return false
    }
    if (tab.key === 'projectNotes') {
      return [
        'admin',
        'project_manager',
        'deputy_manager',
        'client',
        'staff',
        'client_admin',
        'operation_executive',
        'connection_designer_engineer',
        'connection_designer_admin',
        'dept_manager'
      ].includes(userRole)
    }
    if (tab.key === 'wpr') {
      return [
        'admin',
        'operation_executive',
        'deputy_manager',
        'project_manager_officer'
      ].includes(userRole)
    }
    return true
  })

  return (
    <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-4 overflow-x-auto lg:overflow-x-visible sticky top-[120px] bg-[#fcfdfc] z-20 self-start no-scrollbar">
      {visibleTabs.map(({ key, label, icon: TabIcon }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key)}
          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold tracking-normal rounded-none transition-all text-left cursor-pointer shrink-0 ${
            activeTab === key
              ? 'bg-green-50 text-green-700 font-bold border-b-4 lg:border-b-0 lg:border-l-4 border-green-600 pl-3'
              : 'text-black hover:bg-gray-50 hover:text-black border-b-4 lg:border-b-0 lg:border-l-4 border-transparent'
          }`}
        >
          <TabIcon
            className={`w-4 h-4 shrink-0 ${activeTab === key ? 'text-green-600' : 'text-black'}`}
          />
          {label}
        </button>
      ))}
    </div>
  )
}

export default ProjectSidebar
