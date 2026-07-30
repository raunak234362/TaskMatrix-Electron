import React from 'react'
import ProjectHoursStats from './ProjectHoursStats'
import ProjectQuickCounts from './ProjectQuickCounts'
import ProjectDetailsCard from './ProjectDetailsCard'
import ProjectProgress from './ProjectProgress'
import ProjectMilestoneMetrics from './ProjectMilestoneMetrics'
import ProjectOtherTasks from './ProjectOtherTasks'
import ProjectPrimaryWbsOverview from './ProjectPrimaryWbsOverview'

const ProjectOverviewTab = ({
  project,
  projectId,
  userRole,
  projectStats,
  rfiCount,
  submittalCount,
  changeOrderCount,
  milestones,
  filesCount,
  setActiveTab,
  handleRemoveAssist,
  formatDate,
  otherTasksByBundle,
  expandedGroups,
  toggleGroup,
  setSelectedTaskId,
  wbsCategoryTotals,
  fetchProject
}) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
      {/* Section 1: Hours Statistics */}
      <ProjectHoursStats projectStats={projectStats} userRole={userRole} />

      {/* Section 2: Counts */}
      <ProjectQuickCounts
        rfiCount={rfiCount}
        submittalCount={submittalCount}
        changeOrderCount={changeOrderCount}
        milestonesCount={milestones.length}
        filesCount={filesCount}
        setActiveTab={setActiveTab}
      />

      {/* Section 3: Project Details & Scopes */}
      <ProjectDetailsCard
        project={project}
        userRole={userRole}
        handleRemoveAssist={handleRemoveAssist}
        formatDate={formatDate}
      />

      {/* Section 4: Reports, Milestones, Other Tasks & WBS */}
      <div className="space-y-12 mt-12">
        {/* Project Progress Reports */}
        <div className="bg-[#f4faf0] p-6 rounded-none mt-8">
          <ProjectProgress projectId={projectId} />
        </div>

        {/* Progress and Milestones */}
        <div>
          <ProjectMilestoneMetrics
            milestones={milestones}
            projectId={projectId}
            onUpdate={fetchProject}
          />
        </div>
      </div>

      {/* Section 5: Other Tasks */}
      <ProjectOtherTasks
        otherTasksByBundle={otherTasksByBundle}
        expandedGroups={expandedGroups}
        toggleGroup={toggleGroup}
        setSelectedTaskId={setSelectedTaskId}
      />

      {/* Section 6: Primary WBS Overview */}
      <ProjectPrimaryWbsOverview wbsCategoryTotals={wbsCategoryTotals} />
    </div>
  )
}

export default ProjectOverviewTab
