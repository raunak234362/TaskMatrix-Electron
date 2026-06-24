import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { FileText, Layers, Flag } from 'lucide-react'
import Service from '../../api/Service'
import Input from '../fields/input'
import Select from '../fields/Select'
import RichTextEditor from '../fields/RichTextEditor'
import { setMilestonesForProject } from '../../store/milestoneSlice'

const LocalSectionTitle = ({ title }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-1.5 h-6 bg-green-600 rounded-none" />
    <h2 className="text-lg font-bold text-black tracking-wider uppercase">{title}</h2>
  </div>
)

const EditTask = ({ id, onClose, refresh }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState(null)

  const dispatch = useDispatch()

  const employees = useSelector((state) => state.userInfo?.staffData || [])

  const milestonesByProject = useSelector((state) => state.milestoneInfo?.milestonesByProject || {})

  const milestones = projectId ? milestonesByProject[projectId] || [] : []

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { dirtyFields }
  } = useForm()

  /* ---------------- FETCH TASK ---------------- */
  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true)
        const response = await Service.GetTaskById(id.toString())

        if (response?.data) {
          const task = response.data

          if (task.project_id) {
            setProjectId(task.project_id)
            if (!milestonesByProject[task.project_id]) {
              Service.GetProjectMilestoneById(task.project_id).then((res) => {
                dispatch(
                  setMilestonesForProject({
                    projectId: task.project_id,
                    milestones: res?.data || []
                  })
                )
              })
            }
          }

          const rawDuration = task.allocationLog?.allocatedHours || task.duration || ''
          let decimalHours = 0
          if (rawDuration) {
            const parts = String(rawDuration).split(/[:\s]+/)
            let hVal = 0
            let mVal = 0
            if (parts.length >= 1) hVal = parseFloat(parts[0].replace(/[^\d.]/g, '')) || 0
            if (parts.length >= 2) mVal = parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0
            decimalHours = hVal + mVal / 60
          }

          const totalMinutes = Math.round(decimalHours * 60)
          const initialHours = totalMinutes > 0 ? String(Math.floor(totalMinutes / 60)) : ''
          const initialMinutes = totalMinutes > 0 ? String(totalMinutes % 60) : ''

          reset({
            name: task.name || '',
            description: task.description || '',
            priority: task.priority || 2,
            start_date: task.start_date ? new Date(task.start_date).toISOString().slice(0, 16) : '',
            due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
            hours: initialHours,
            minutes: initialMinutes,
            Stage: task.Stage || 'IFA',
            user_id: task.user_id || task.user?.id || '',
            wbsType: task.wbsType || '',
            mileStone_id: task.mileStone_id || ''
          })
        }
      } catch (error) {
        console.error('Error fetching task:', error)
        toast.error('Failed to load task details')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchTask()
  }, [id, reset, dispatch, milestonesByProject])

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)

      const payload = {}

      // Add only modified fields
      Object.keys(dirtyFields).forEach((key) => {
        payload[key] = data[key]
      })

      // Handle duration ONLY if hours or minutes were edited
      if (dirtyFields.hours || dirtyFields.minutes) {
        const hh = parseInt(data.hours) || 0
        const mm = parseInt(data.minutes) || 0

        payload.duration = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
        payload.hours = hh * 60 + mm
      }

      // Ensure priority is numeric
      if (dirtyFields.priority) {
        payload.priority = Number(data.priority)
      }

      // If no changes → do nothing
      if (Object.keys(payload).length === 0) {
        toast.info('No changes to update')
        setIsSubmitting(false)
        return
      }

      await Service.UpdateTaskById(id.toString(), payload)

      toast.success('Task updated successfully!')
      window.dispatchEvent(new Event('task-updated'))
      refresh?.()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update task')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---------------- OPTIONS ---------------- */
  const employeeOptions = employees.map((e) => ({
    label: `${e.firstName} ${e.lastName}`,
    value: e.id
  }))

  const stageOptions = [
    { label: 'IFA', value: 'IFA' },
    { label: 'IFC', value: 'IFC' },
    { label: 'R-IFA', value: 'RIFA' },
    { label: 'COR', value: 'COR' }
  ]

  const milestoneOptions = milestones.map((m) => {
    const milestoneName = m.subject || m.name || 'Unnamed Milestone'
    const subSubjectName = m.subSubject || ''
    const stageName = m.stage || ''
    const labelParts = [milestoneName, subSubjectName, stageName].filter(Boolean)
    return {
      label: labelParts.join(' - '),
      value: m.id
    }
  })

  const wbsTypeOptions = [
    { label: 'Modeling', value: 'modeling' },
    { label: 'Model Checking', value: 'modeling_checking' },
    { label: 'Detailing', value: 'detailing' },
    { label: 'Detail Checking', value: 'detailing_checking' },
    { label: 'Erection', value: 'erection' },
    { label: 'Erection Checking', value: 'erection_checking' },
    { label: 'OTHERS', value: 'others' }
  ]

  /* ---------------- UI ---------------- */
  const modalContent = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 edit-task-modal">
      <style>{`
        .edit-task-modal input,
        .edit-task-modal select,
        .edit-task-modal textarea,
        .edit-task-modal .jodit-wysiwyg,
        .edit-task-modal .jodit-wysiwyg *,
        .edit-task-modal .jodit-wysiwyg p,
        .edit-task-modal .jodit-wysiwyg ul,
        .edit-task-modal .jodit-wysiwyg ol,
        .edit-task-modal .jodit-wysiwyg li {
          font-size: 14px !important;
          color: black !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
        }
        .edit-task-modal .jodit-toolbar__box,
        .edit-task-modal .jodit-status-bar {
          color: black !important;
        }
      `}</style>
      <div className="bg-[#fcfdfc] rounded-none shadow-xl w-full max-w-[95vw] lg:max-w-6xl h-[90vh] border-2 border-black overflow-hidden flex flex-col relative mx-auto my-auto py-0">
        <div className="bg-[#fcfdfc] px-8 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 shrink-0 z-10">
          <h2 className="text-xl font-semibold text-black tracking-tight uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#6bbd45]" /> Edit Task
          </h2>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6bbd45]"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
              {/* Task Details */}
              <section className="space-y-6">
                <LocalSectionTitle title="Task Details" />
                <div>
                  <label className="text-sm font-bold text-black uppercase tracking-wider block mb-2">
                    Task Name
                  </label>
                  <Input
                    className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black !placeholder-black/50"
                    {...register('name')}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-black uppercase tracking-wider block mb-2">
                    Description
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="text-sm font-bold text-black"
                      />
                    )}
                  />
                </div>
              </section>

              {/* Assignment & Stage */}
              <section className="space-y-6">
                <LocalSectionTitle title="Assignment, Stage & Classification" />
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-black uppercase tracking-wider block mb-2">
                      Stage
                    </label>
                    <Controller
                      name="Stage"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={stageOptions}
                          value={field.value}
                          onChange={(_, v) => field.onChange(v)}
                          className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                          menuClassName="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                          optionClassName="!text-sm !font-bold !text-black !uppercase !rounded-none"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-black uppercase tracking-wider block mb-2">
                      Assignee
                    </label>
                    <Controller
                      name="user_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={employeeOptions}
                          value={field.value}
                          onChange={(_, v) => field.onChange(v)}
                          className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                          menuClassName="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                          optionClassName="!text-sm !font-bold !text-black !uppercase !rounded-none"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Flag className="w-4 h-4 text-black" /> Milestone
                    </label>
                    <Controller
                      name="mileStone_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={milestoneOptions}
                          value={field.value}
                          onChange={(_, v) => field.onChange(v)}
                          placeholder="Select Milestone"
                          className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                          menuClassName="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                          optionClassName="!text-sm !font-bold !text-black !uppercase !rounded-none"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-black uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-black" /> WBS Type
                    </label>
                    <Controller
                      name="wbsType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={wbsTypeOptions}
                          value={field.value}
                          onChange={(_, v) => field.onChange(v)}
                          placeholder="Select Type"
                          className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                          menuClassName="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                          optionClassName="!text-sm !font-bold !text-black !uppercase !rounded-none"
                        />
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Schedule & Priority */}
              <section className="space-y-6">
                <LocalSectionTitle title="Schedule & Priority" />
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6 py-2">
                    <div>
                      <label className="text-sm font-bold text-black uppercase tracking-wider block mb-2">
                        Start Date
                      </label>
                      <Input
                        type="datetime-local"
                        className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                        {...register('start_date')}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-black uppercase tracking-wider block mb-2">
                        Due Date
                      </label>
                      <Input
                        type="datetime-local"
                        className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                        {...register('due_date')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-bold text-black uppercase tracking-wider block mb-2">
                        Duration
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="HH"
                          className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black !placeholder-black/50"
                          {...register('hours')}
                        />
                        <Input
                          type="number"
                          placeholder="MM"
                          className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black !placeholder-black/50"
                          {...register('minutes')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-black uppercase tracking-wider block mb-2">
                        Priority
                      </label>
                      <div>
                        <Controller
                          name="priority"
                          control={control}
                          render={({ field }) => (
                            <Select
                              options={[
                                { label: 'Low', value: 1 },
                                { label: 'Medium', value: 2 },
                                { label: 'High', value: 3 },
                                { label: 'Critical', value: 4 }
                              ]}
                              value={String(field.value)}
                              onChange={(_, v) => field.onChange(Number(v))}
                              className="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                              menuClassName="!text-sm !font-bold !text-black !uppercase !rounded-none !border-black"
                              optionClassName="!text-sm !font-bold !text-black !uppercase !rounded-none"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="flex justify-center pt-6 mt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-64 py-1.5 bg-green-50 hover:bg-green-100 text-black border-2 border-green-700/80 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default EditTask
