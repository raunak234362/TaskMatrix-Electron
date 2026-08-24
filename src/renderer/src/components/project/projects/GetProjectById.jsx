import { useEffect, useState, useMemo } from 'react'
import { Loader2, AlertCircle, Users, X } from 'lucide-react'
import Service from '../../../api/Service'
import AllMileStone from '../mileStone/AllMileStone'
import AllDocument from '../projectDocument/AllDocument'
import WBS from '../wbs/WBS'
import WbsBreakdownPanel from '../wbs/WbsBreakdownPanel'
import AllRFI from '../../rfi/AllRfi'
import AddRFI from '../../rfi/AddRFI'
import AllSubmittals from '../../submittals/AllSubmittals'
import AllNotes from '../notes/AllNotes'
import EditProject from '../EditProject'
import AddSubmittal from '../../submittals/AddSubmittals'
import AllCO from '../../co/AllCO'
import AddCO from '../../co/AddCO'
import CoTable from '../../co/CoTable'
import ProjectAnalyticsDashboard from './ProjectAnalyticsDashboard'
import TeamsAnalytics from '../TeamsAnalytics'
import AllProjectNotes from '../notes/AllProjectNotes'
import AddAssistsModal from '../AddAssistsModal'
import { toast } from 'react-toastify'
import CoordinationDrawings from '../coordinationDrawings/CoordinationDrawings'
import WorkProgressReport from '../wpr/WorkProgressReport'
import GetTaskByID from '../../task/GetTaskByID'

import ProjectHeader from './ProjectHeader'
import ProjectSidebar from './ProjectSidebar'
import ProjectOverviewTab from './ProjectOverviewTab'
import StandardsChatbot from '../standards/StandardsChatbot'

const WBS_TYPE_ALIAS = {
  modeling: 'modelling',
  modelling: 'modelling',
  modeling_checking: 'modelling_checking',
  modelling_checking: 'modelling_checking',
  'modeling checking': 'modelling_checking',
  'modelling checking': 'modelling_checking',
  'modeling-checking': 'modelling_checking',
  'modelling-checking': 'modelling_checking',
  modelingchecking: 'modelling_checking',
  modellingchecking: 'modelling_checking',
  detailing: 'detailing',
  detailing_checking: 'detailing_checking',
  'detailing checking': 'detailing_checking',
  'detailing-checking': 'detailing_checking',
  detailingchecking: 'detailing_checking',
  erection: 'erection',
  erection_plan: 'erection',
  erection_checking: 'erection_checking',
  'erection checking': 'erection_checking',
  'erection-checking': 'erection_checking',
  erectionchecking: 'erection_checking',
  others: 'others',
  other: 'others'
}

const normaliseWbsType = (raw) => {
  if (!raw) return 'others'
  const key = String(raw).toLowerCase().trim().replace(/\s+/g, ' ')
  return WBS_TYPE_ALIAS[key] ?? 'others'
}

const GetProjectById = ({ id, onClose }) => {
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [rfiData, setRfiData] = useState([])
  const [submittalData, setSubmittalData] = useState([])
  const [changeOrderData, setChangeOrderData] = useState([])
  const [coordinationDrawings, setCoordinationDrawings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('userRole')?.toLowerCase() === 'human_resource'
      ? 'analytics'
      : 'overview'
  })

  const [expandedGroups, setExpandedGroups] = useState({
    'Training and Practice': false,
    'Job Study': false,
    Meeting: false,
    'Other Tasks': false
  })

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const [rfiView, setRfiView] = useState('list')
  const [submittalView, setSubmittalView] = useState('list')
  const [editModel, setEditModel] = useState(null)
  const [changeOrderView, setChangeOrderView] = useState('list')
  const [selectedCoId, setSelectedCoId] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [projectTasks, setProjectTasks] = useState([])
  const [showAssistsModal, setShowAssistsModal] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
  const currentUserId = sessionStorage.getItem('userId')

  const isAssist = useMemo(() => {
    const userId = currentUserId || sessionStorage.getItem('userId')
    if (!project?.assists || !userId || !Array.isArray(project.assists)) return false
    return project.assists.some((assist) => {
      if (!assist) return false
      const aId = String(assist.userId || assist.user?.id || assist.user || '').trim()
      const uId = String(userId).trim()
      return aId === uId
    })
  }, [project, currentUserId])

  const canCreate = useMemo(() => {
    if (isAssist) return true
    const role = (userRole || sessionStorage.getItem('userRole') || '').toLowerCase().trim()
    return !['client', 'estimator'].includes(role)
  }, [isAssist, userRole])

  const fetchProjectTasks = async () => {
    try {
      const response = await Service.GetAllTask()
      if (response && response.data) {
        const allTasks = Array.isArray(response.data) ? response.data : []
        setProjectTasks(allTasks.filter((t) => t.project_id === id))
      }
    } catch (error) {
      console.error('Error fetching project tasks:', error)
    }
  }

  const handleRemoveAssist = async (assistUserId) => {
    try {
      if (window.confirm('Are you sure you want to remove this assist?')) {
        await Service.RemoveProjectAssist(id, assistUserId)
        toast.success('Assist removed successfully')
        fetchProject()
      }
    } catch (error) {
      console.error('Error removing assist:', error)
      import('react-toastify').then(({ toast }) => {
        toast.error(error?.response?.data?.message || 'Failed to remove assist')
      })
    }
  }

  const handleArchiveProject = async () => {
    if (!window.confirm('Are you sure you want to archive this project? This action manually triggers the file archival process.')) {
      return
    }

    try {
      setArchiving(true)
      const res = await Service.ArchiveProject(id)
      toast.success(res?.message || 'Project files archived successfully')
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error archiving project:', error)
      toast.error(error?.response?.data?.message || 'Failed to archive project files')
    } finally {
      setArchiving(false)
    }
  }

  const projectStats = useMemo(() => {
    if (!project)
      return {
        assigned: 0,
        completed: 0,
        overrun: 0,
        completedStr: '0:00',
        overrunStr: '0:00',
        totalSeconds: 0,
        ifaStr: '0:00',
        ifcStr: '0:00',
        coStr: '0:00'
      }

    const assigned = Number(project.estimatedHours) || 0

    const stageStats = projectTasks.reduce(
      (acc, task) => {
        const taskStatus = (task.status || '').toLowerCase().trim()
        if (
          normaliseWbsType(task.wbsType) === 'others' ||
          taskStatus === 'wrong_allocation' ||
          taskStatus === 'absent'
        ) {
          return acc
        }
        const stage = (task.Stage || '').toUpperCase().trim()
        const taskSecs = (task.workingHourTask || []).reduce(
          (tSum, entry) => tSum + (entry.duration_seconds || 0),
          0
        )

        if (stage === 'IFA' || stage === 'RE-IFA') {
          acc.ifa.secs += taskSecs
          acc.ifa.count += 1
        } else if (stage === 'IFC' || stage === 'RIFC') {
          acc.ifc.secs += taskSecs
          acc.ifc.count += 1
        } else if (stage.startsWith('CO') || stage.includes('CHANGE ORDER')) {
          acc.co.secs += taskSecs
          acc.co.count += 1
        } else {
          acc.other.secs += taskSecs
          acc.other.count += 1
        }

        acc.totalSecs += taskSecs
        return acc
      },
      {
        ifa: { secs: 0, count: 0 },
        ifc: { secs: 0, count: 0 },
        co: { secs: 0, count: 0 },
        other: { secs: 0, count: 0 },
        totalSecs: 0
      }
    )

    const totalSeconds = stageStats.totalSecs
    const completedHours = totalSeconds / 3600
    const overrunHours = Math.max(0, completedHours - assigned)

    const formatSecondsToHHMM = (totalSecs) => {
      const h = Math.floor(totalSecs / 3600)
      const m = Math.floor((totalSecs % 3600) / 60)
      return `${h}:${m.toString().padStart(2, '0')}`
    }

    return {
      assigned,
      completed: completedHours,
      overrun: overrunHours,
      completedStr: formatSecondsToHHMM(totalSeconds),
      overrunStr: formatSecondsToHHMM(Math.max(0, totalSeconds - assigned * 3600)),
      totalSeconds,
      ifa: {
        str: formatSecondsToHHMM(stageStats.ifa.secs),
        count: stageStats.ifa.count,
        hours: stageStats.ifa.secs / 3600
      },
      ifc: {
        str: formatSecondsToHHMM(stageStats.ifc.secs),
        count: stageStats.ifc.count,
        hours: stageStats.ifc.secs / 3600
      },
      co: { str: formatSecondsToHHMM(stageStats.co.secs), count: stageStats.co.count }
    }
  }, [project, projectTasks])

  const otherTasksByBundle = useMemo(() => {
    const grouped = {
      'Training and Practice': [],
      'Job Study': [],
      Meeting: [],
      'Other Tasks': []
    }

    projectTasks.forEach((task) => {
      const taskStatus = (task.status || '').toLowerCase().trim()
      const isExcludedStatus = taskStatus === 'wrong_allocation' || taskStatus === 'absent'

      if (normaliseWbsType(task.wbsType) !== 'others' && !isExcludedStatus) return

      const name = String(task.name || task.title || task.wbsTemplate?.name || '').toLowerCase()

      if (isExcludedStatus) {
        grouped['Other Tasks'].push(task)
      } else if (name.includes('training') || name.includes('practice')) {
        grouped['Training and Practice'].push(task)
      } else if (name.includes('job study') || name.includes('jobstudy')) {
        grouped['Job Study'].push(task)
      } else if (name.includes('meeting')) {
        grouped['Meeting'].push(task)
      } else {
        grouped['Other Tasks'].push(task)
      }
    })

    const cleanedGrouped = {}
    Object.entries(grouped).forEach(([key, list]) => {
      if (list.length > 0) {
        cleanedGrouped[key] = list
      }
    })

    return cleanedGrouped
  }, [projectTasks])

  const wbsTasksByBundle = useMemo(() => {
    const grouped = {}
    projectTasks.forEach((task) => {
      const taskStatus = (task.status || '').toLowerCase().trim()
      if (taskStatus === 'wrong_allocation' || taskStatus === 'absent') return

      const bundleKey =
        task.projectBundle?.bundleKey ||
        task.projectBundle?.bundle?.bundleKey ||
        task.bundleKey ||
        'Uncategorised'
      if (!grouped[bundleKey]) grouped[bundleKey] = {}

      const typeKey = normaliseWbsType(task.wbsType)

      if (!grouped[bundleKey][typeKey]) grouped[bundleKey][typeKey] = []
      grouped[bundleKey][typeKey].push(task)
    })
    return grouped
  }, [projectTasks])

  const wbsCategoryTotals = useMemo(() => {
    const totals = {
      modelling: { logged: 0, allocated: 0 },
      modelling_checking: { logged: 0, allocated: 0 },
      detailing: { logged: 0, allocated: 0 },
      detailing_checking: { logged: 0, allocated: 0 },
      erection: { logged: 0, allocated: 0 },
      erection_checking: { logged: 0, allocated: 0 }
    }

    const parseAllocSecsLocal = (str) => {
      if (!str || typeof str !== 'string') return 0
      const [h, m] = str.split(':').map(Number)
      return (h || 0) * 3600 + (m || 0) * 60
    }

    projectTasks.forEach((task) => {
      const taskStatus = (task.status || '').toLowerCase().trim()
      if (taskStatus === 'wrong_allocation' || taskStatus === 'absent') return

      const typeKey = normaliseWbsType(task.wbsType)
      if (totals[typeKey] !== undefined) {
        const taskSeconds = (task.workingHourTask || []).reduce(
          (s, w) => s + (w.duration_seconds || 0),
          0
        )
        totals[typeKey].logged += taskSeconds

        const allocSeconds = parseAllocSecsLocal(task.allocationLog?.allocatedHours)
        totals[typeKey].allocated += allocSeconds
      }
    })

    return totals
  }, [projectTasks])

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)
      const [projRes, mileRes, rfiRes, subRes, coordRes, coRes] = await Promise.all([
        Service.GetProjectById(id),
        Service.GetProjectMilestoneById(id),
        Service.GetRFIByProjectId(id),
        Service.GetSubmittalByProjectId(id),
        Service.getCoordinationDrawingsByProjectId(id),
        Service.GetChangeOrder(id),
        fetchProjectTasks()
      ])
      setProject(projRes?.data || null)
      setMilestones(mileRes?.data || [])
      let rfiArray = []
      if (rfiRes) {
        if (Array.isArray(rfiRes)) {
          rfiArray = rfiRes
        } else if (rfiRes['show rfi']) {
          rfiArray = rfiRes['show rfi']
        } else if (rfiRes.data) {
          rfiArray = rfiRes.data
        } else if (typeof rfiRes === 'object') {
          const firstArray = Object.values(rfiRes).find(Array.isArray)
          if (firstArray) rfiArray = firstArray
        }
      }
      setRfiData(rfiArray)
      setSubmittalData(subRes?.data || (Array.isArray(subRes) ? subRes : []))
      setCoordinationDrawings(coordRes?.data || (Array.isArray(coordRes) ? coordRes : []))
      setChangeOrderData(coRes?.data || (Array.isArray(coRes) ? coRes : []))
    } catch (err) {
      setError('Failed to load project details')
      console.error('Error fetching project:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditModel = (projectToEdit) => {
    setEditModel(projectToEdit)
  }

  useEffect(() => {
    if (id) fetchProject()
  }, [id])

  const handleCoSuccess = (createdCO) => {
    fetchProject()
    setChangeOrderView('list')
  }

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
      : '—'

  if (loading)
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading project details...
      </div>
    )

  if (error || !project)
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || 'Project not found'}
      </div>
    )

  return (
    <>
      <div className="w-full relative bg-[#fcfdfc] min-h-[600px] flex flex-col gap-6 p-4">
        {/* Header */}
        <ProjectHeader
          project={project}
          userRole={userRole}
          archiving={archiving}
          handleArchiveProject={handleArchiveProject}
          setShowAssistsModal={setShowAssistsModal}
          handleEditModel={handleEditModel}
          onClose={onClose}
        />

        {/* Main Content Layout with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Sidebar */}
          <ProjectSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userRole={userRole}
          />

          {/* Tab Content Area */}
          <div className="flex-1 min-w-0 bg-white">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <ProjectOverviewTab
                project={project}
                projectId={id}
                userRole={userRole}
                projectStats={projectStats}
                rfiCount={rfiData.length}
                submittalCount={submittalData.length}
                changeOrderCount={changeOrderData.length}
                milestones={milestones}
                filesCount={project.files?.length || project.documents?.length || 0}
                setActiveTab={setActiveTab}
                handleRemoveAssist={handleRemoveAssist}
                formatDate={formatDate}
                otherTasksByBundle={otherTasksByBundle}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                setSelectedTaskId={setSelectedTaskId}
                wbsCategoryTotals={wbsCategoryTotals}
                fetchProject={fetchProject}
              />
            )}

            {/* Files */}
            {activeTab === 'files' && (
              <div className="space-y-4">
                <AllDocument projectId={id} />
              </div>
            )}
            {activeTab === 'milestones' && (
              <AllMileStone project={project} onUpdate={fetchProject} />
            )}

            {/* Team */}
            {activeTab === 'team' && (
              <div className="text-gray-700 text-sm">
                <h4 className="font-black text-black mb-2 flex items-center gap-1 uppercase tracking-widest">
                  <Users className="w-4 h-4" /> Assigned Team
                </h4>
                <p className="font-medium">Team: {project.team?.name || 'No team assigned.'}</p>
                <p>
                  Manager:{' '}
                  {project.manager
                    ? `${project.manager.firstName} ${project.manager.lastName} (${project.manager.username})`
                    : 'Not assigned.'}
                </p>
                {project.assists && project.assists.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">Assists:</span>
                    {project.assists.map((assist) => {
                      const fName = assist.user?.firstName || assist.firstName || ''
                      const mName = assist.user?.middleName || assist.middleName || ''
                      const lName = assist.user?.lastName || assist.lastName || ''
                      const assistId = assist.userId || assist.user?.id || assist.user
                      return (
                        <span
                          key={assistId}
                          className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-xs font-bold text-gray-800 uppercase border border-gray-200"
                        >
                          {`${fName} ${mName} ${lName}`.trim()}
                          {(userRole === 'admin' ||
                            userRole === 'system_admin' ||
                            userRole === 'project_manager') && (
                              <button
                                onClick={() => handleRemoveAssist(assistId)}
                                className="text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-100 transition-colors ml-1"
                                title="Remove Assist"
                              >
                                <X size={12} strokeWidth={3} />
                              </button>
                            )}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {activeTab === 'notes' && <AllNotes projectId={id} />}
            {activeTab === 'wbs' && (userRole !== 'staff' || isAssist) && (
              <div className="space-y-6">
                <WBS id={id} stage={project.stage || ''} />
                <WbsBreakdownPanel wbsTasksByBundle={wbsTasksByBundle} />
              </div>
            )}

            {/* RFI */}
            {activeTab === 'rfi' && (
              <div className="space-y-4">
                <div className="flex justify-start mb-4">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setRfiView('list')}
                      className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${rfiView === 'list'
                          ? 'bg-green-50 text-black border-2 border-green-700/80'
                          : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      All RFIs
                    </button>
                    {canCreate && (
                      <button
                        onClick={() => setRfiView('add')}
                        className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${rfiView === 'add'
                            ? 'bg-green-50 text-black border-2 border-green-700/80'
                            : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                          }`}
                      >
                        Create RFI
                      </button>
                    )}
                  </nav>
                </div>

                {rfiView === 'list' ? (
                  <AllRFI rfiData={rfiData} onUpdate={fetchProject} />
                ) : (
                  <AddRFI
                    project={project}
                    rfiData={rfiData}
                    onSuccess={() => {
                      fetchProject()
                      setRfiView('list')
                    }}
                  />
                )}
              </div>
            )}

            {/* Submittals */}
            {activeTab === 'submittals' && (
              <div className="space-y-4">
                <div className="flex justify-start mb-4">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setSubmittalView('list')}
                      className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${submittalView === 'list'
                          ? 'bg-green-50 text-black border-2 border-green-700/80'
                          : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      All Submittals
                    </button>
                    {canCreate && (
                      <button
                        onClick={() => setSubmittalView('add')}
                        className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${submittalView === 'add'
                            ? 'bg-green-50 text-black border-2 border-green-700/80'
                            : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                          }`}
                      >
                        Create Submittal
                      </button>
                    )}
                  </nav>
                </div>

                {submittalView === 'list' ? (
                  <AllSubmittals submittalData={submittalData} projectId={id} onUpdate={fetchProject} />
                ) : (
                  <AddSubmittal
                    project={project}
                    submittalData={submittalData}
                    onSuccess={() => {
                      fetchProject()
                      setSubmittalView('list')
                    }}
                  />
                )}
              </div>
            )}

            {/* CD RFI */}
            {activeTab === 'CDrfi' && (userRole !== 'staff' || isAssist) && (
              <div className="space-y-4">
                <div className="flex justify-start mb-4">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setRfiView('list')}
                      className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${rfiView === 'list'
                          ? 'bg-green-50 text-black border-2 border-green-700/80'
                          : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      All RFIs
                    </button>
                    {canCreate && (
                      <button
                        onClick={() => setRfiView('add')}
                        className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${rfiView === 'add'
                            ? 'bg-green-50 text-black border-2 border-green-700/80'
                            : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                          }`}
                      >
                        Create RFI
                      </button>
                    )}
                  </nav>
                </div>

                {rfiView === 'list' ? (
                  <AllRFI rfiData={rfiData} onUpdate={fetchProject} />
                ) : (
                  <AddRFI
                    project={project}
                    rfiData={rfiData}
                    onSuccess={() => {
                      fetchProject()
                      setRfiView('list')
                    }}
                  />
                )}
              </div>
            )}

            {/* CD Submittals */}
            {activeTab === 'CDsubmittals' && (userRole !== 'staff' || isAssist) && (
              <div className="space-y-4">
                <div className="flex justify-start mb-4">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setSubmittalView('list')}
                      className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${submittalView === 'list'
                          ? 'bg-green-50 text-black border-2 border-green-700/80'
                          : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      All Submittals
                    </button>
                    {canCreate && (
                      <button
                        onClick={() => setSubmittalView('add')}
                        className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${submittalView === 'add'
                            ? 'bg-green-50 text-black border-2 border-green-700/80'
                            : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                          }`}
                      >
                        Create Submittal
                      </button>
                    )}
                  </nav>
                </div>

                {submittalView === 'list' ? (
                  <AllSubmittals submittalData={submittalData} projectId={id} onUpdate={fetchProject} />
                ) : (
                  <AddSubmittal
                    project={project}
                    submittalData={submittalData}
                    onSuccess={() => {
                      fetchProject()
                      setSubmittalView('list')
                    }}
                  />
                )}
              </div>
            )}

            {/* Change Order */}
            {activeTab === 'changeOrder' && (
              <div className="space-y-4">
                <div className="flex justify-start mb-4">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                      onClick={() => setChangeOrderView('list')}
                      className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${changeOrderView === 'list'
                          ? 'bg-green-50 text-black border-2 border-green-700/80'
                          : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                        }`}
                    >
                      All Change Order
                    </button>
                    {canCreate && userRole !== 'staff' && (
                      <button
                        onClick={() => setChangeOrderView('add')}
                        className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${changeOrderView === 'add'
                            ? 'bg-green-50 text-black border-2 border-green-700/80'
                            : 'bg-gray-100 text-black border border-gray-300 hover:bg-gray-200'
                          }`}
                      >
                        Raise Change Order
                      </button>
                    )}
                  </nav>
                </div>

                {changeOrderView === 'list' ? (
                  <AllCO changeOrderData={changeOrderData} onUpdate={fetchProject} />
                ) : changeOrderView === 'add' ? (
                  <AddCO
                    project={project}
                    onSuccess={handleCoSuccess}
                    changeOrderData={changeOrderData}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold text-black">Change Order Table</h4>
                      <button
                        onClick={() => setChangeOrderView('list')}
                        className="text-sm text-black hover:text-black font-medium"
                      >
                        &larr; Back to List
                      </button>
                    </div>
                    {selectedCoId && (
                      <CoTable coId={selectedCoId} onSuccess={() => setChangeOrderView('add')} />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Analytics */}
            {activeTab === 'analytics' && <ProjectAnalyticsDashboard projectId={id} />}

            {/* Team Analytics */}
            {activeTab === 'teamAnalytics' && (
              <TeamsAnalytics projectId={id} managerId={project.managerID} tasks={projectTasks} />
            )}

            {/* Project Notes */}
            {activeTab === 'projectNotes' && <AllProjectNotes projectId={id} project={project} />}

            {/* Coordination Drawings */}
            {activeTab === 'coordinationDrawings' && <CoordinationDrawings projectId={id} />}

            {/* Standards Chatbot */}
            {activeTab === 'standardsChat' && (
              <StandardsChatbot projectId={id} project={project} />
            )}

            {/* WPR */}
            {activeTab === 'wpr' && (
              <WorkProgressReport
                projectId={id}
                project={project}
                milestones={milestones}
                rfiData={rfiData}
                submittalData={submittalData}
                changeOrderData={changeOrderData}
                coordinationDrawings={coordinationDrawings}
                onUpdate={fetchProject}
              />
            )}
          </div>
        </div>
      </div>

      {selectedTaskId && (
        <GetTaskByID id={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
      {editModel && (
        <EditProject
          projectId={id}
          onCancel={() => setEditModel(null)}
          onSuccess={() => {
            setEditModel(null)
            fetchProject()
          }}
        />
      )}

      {showAssistsModal && (
        <AddAssistsModal
          projectId={id}
          currentAssists={project?.assists || []}
          onClose={() => setShowAssistsModal(false)}
          onSuccess={() => {
            setShowAssistsModal(false)
            fetchProject()
          }}
        />
      )}
    </>
  )
}

export default GetProjectById
