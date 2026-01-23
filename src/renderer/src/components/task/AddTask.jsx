import { useEffect, useState } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import {
  Plus,
  Trash2,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Flag
} from 'lucide-react'
import Service from '../../api/Service'
import Input from '../fields/input'
import Button from '../fields/Button'
import Select from '../fields/Select'
import SectionTitle from '../ui/SectionTitle'
import { setProjectData, updateProject } from '../../store/projectSlice'
import { setMilestonesForProject } from '../../store/milestoneSlice'

const AddTask = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedWbs, setSelectedWbs] = useState(null)

  const dispatch = useDispatch()
  const projects = useSelector((state) => state.projectInfo?.projectData || [])
  const milestonesByProject = useSelector((state) => state.milestoneInfo?.milestonesByProject || {})

  useEffect(() => {
    if (projects.length === 0) {
      Service.GetAllProjects().then((res) => {
        dispatch(setProjectData(res.data))
      })
    }
  }, [dispatch, projects.length])

  const employees = useSelector((state) => state.userInfo?.staffData || [])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      priority: 2,
      Stage: 'IFA',
      assignments: [{ employeeId: '', hours: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'assignments'
  })

  const selectedProjectId = watch('project_id')
  const selectedMilestoneId = watch('mileStone_id')
  const selectedWbsType = watch('wbsType')
  const selectedStage = watch('Stage')
  const selectedWbsId = watch('wbs_id')

  const milestones = selectedProjectId ? milestonesByProject[selectedProjectId] || [] : []
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const wbsItems = selectedProject?.projectWbs || []

  // Fetch Project Details and Milestones when project changes
  useEffect(() => {
    if (selectedProjectId) {
      // Reset selections when project changes
      setValue('mileStone_id', '')
      setValue('wbsType', '')
      setValue('wbs_id', '')
      setSelectedWbs(null)

      // Fetch full project details if projectWbs is missing
      if (!selectedProject?.projectWbs) {
        Service.GetProjectById(selectedProjectId).then((res) => {
          if (res?.data) {
            dispatch(updateProject(res.data))
          }
        })
      }

      if (!milestonesByProject[selectedProjectId]) {
        Service.GetProjectMilestoneById(selectedProjectId).then((res) => {
          dispatch(
            setMilestonesForProject({
              projectId: selectedProjectId,
              milestones: res?.data || []
            })
          )
        })
      }
    } else {
      setValue('mileStone_id', '')
      setValue('wbsType', '')
      setValue('wbs_id', '')
      setValue('departmentId', '')
      setSelectedWbs(null)
    }
  }, [selectedProjectId, milestonesByProject, selectedProject?.projectWbs, dispatch, setValue])

  // Auto-populate department from project team
  useEffect(() => {
    const deptId = selectedProject?.team?.departmentID || selectedProject?.department?.id
    if (deptId) {
      setValue('departmentId', deptId)
    }
  }, [selectedProject, setValue])

  // After milestone selection, reset WBS selections
  useEffect(() => {
    if (selectedProjectId && selectedMilestoneId) {
      // Reset WBS selections when milestone changes
      setValue('wbsType', '')
      setValue('wbs_id', '')
      setSelectedWbs(null)
    }
  }, [selectedMilestoneId, setValue])

  // Update selected WBS data
  useEffect(() => {
    if (selectedWbsId) {
      const wbs = wbsItems.find((w) => w.id === selectedWbsId)
      setSelectedWbs(wbs || null)
    } else {
      setSelectedWbs(null)
    }
  }, [selectedWbsId, wbsItems])

  const filteredWbsItems = wbsItems.filter((w) => {
    const typeOk =
      !selectedWbsType || (w.type && w.type.toLowerCase() === selectedWbsType.toLowerCase())
    const stageOk =
      !selectedStage || (w.stage && w.stage.toLowerCase() === selectedStage.toLowerCase())
    return typeOk && stageOk
  })

  const assignments = watch('assignments') || []

  const totalAssignedHours = assignments.reduce((sum, a) => sum + Number(a.hours || 0), 0)
  const availableHours = selectedWbs
    ? (selectedWbs.totalExecHr || 0) + (selectedWbs.totalCheckHr || 0)
    : 0

  const onSubmit = async (data) => {
    if (totalAssignedHours > availableHours && availableHours > 0) {
      toast.error('Total assigned hours exceed available WBS hours')
      return
    }

    try {
      setIsSubmitting(true)

      // Create a task for each assignment
      const promises = data.assignments.map((assignment) => {
        const payload = {
          name: data.name,
          description: data.description,
          status: 'ASSIGNED',
          priority: Number(data.priority),
          due_date: data.due_date,
          duration: data.duration,
          project_id: data.project_id,
          user_id: assignment.employeeId,
          mileStone_id: data.mileStone_id,
          start_date: data.start_date,
          Stage: data.Stage,
          departmentId: data.departmentId,
          wbs_id: data.wbs_id // Including wbs_id as it's in the form but wasn't in the user's snippet
        }
        return Service.AddTask(payload)
      })

      await Promise.all(promises)
      toast.success('Tasks assigned successfully!')
    } catch (error) {
      toast.error('Failed to assign tasks')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const projectOptions = projects.map((p) => ({
    label: p.name,
    value: p.id
  }))

  const milestoneOptions = milestones.map((m) => ({
    label: m.subject || m.name || 'Unnamed Milestone',
    value: m.id
  }))

  const wbsTypeOptions = [
    { label: 'Modeling', value: 'modeling' },
    { label: 'Erection', value: 'erection' },
    { label: 'Detailing', value: 'detailing' }
  ]

  const wbsOptions = filteredWbsItems.map((w) => ({
    label: w.name,
    value: w.id
  }))

  const employeeOptions = employees.map((e) => ({
    label: `${e.firstName} ${e.lastName}`,
    value: e.id
  }))

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-10">
            {/* Project & Milestone Section */}
            <section className="space-y-6">
              <SectionTitle title="Project Context" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-500" /> Project *
                  </label>
                  <Controller
                    name="project_id"
                    control={control}
                    rules={{ required: 'Project is required' }}
                    render={({ field }) => (
                      <Select
                        name="project_id"
                        options={projectOptions}
                        value={field.value}
                        onChange={(_, val) => field.onChange(val)}
                        placeholder="Select Project"
                      />
                    )}
                  />
                  {errors.project_id && (
                    <p className="text-xs text-red-500">{errors.project_id.message}</p>
                  )}
                </div>

                {selectedProjectId && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-indigo-500" /> Milestone *
                    </label>
                    <Controller
                      name="mileStone_id"
                      control={control}
                      rules={{ required: 'Milestone is required' }}
                      render={({ field }) => (
                        <Select
                          name="mileStone_id"
                          options={milestoneOptions}
                          value={field.value}
                          onChange={(_, val) => field.onChange(val)}
                          placeholder="Select Milestone"
                        />
                      )}
                    />
                    {errors.mileStone_id && (
                      <p className="text-xs text-red-500">{errors.mileStone_id.message}</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {selectedProjectId && selectedMilestoneId && (
              <>
                {/* WBS Section */}
                <section className="space-y-6">
                  <SectionTitle title="Work Breakdown Structure" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" /> WBS Type
                      </label>
                      <Controller
                        name="wbsType"
                        control={control}
                        render={({ field }) => (
                          <Select
                            name="wbsType"
                            options={wbsTypeOptions}
                            value={field.value}
                            onChange={(_, val) => {
                              field.onChange(val)
                              setValue('wbs_id', '')
                            }}
                            placeholder="Select Type"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" /> WBS Item *
                      </label>
                      <Controller
                        name="wbs_id"
                        control={control}
                        rules={{ required: 'WBS Item is required' }}
                        render={({ field }) => (
                          <Select
                            name="wbs_id"
                            options={wbsOptions}
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            placeholder="Select WBS Item"
                          />
                        )}
                      />
                      {errors.wbs_id && (
                        <p className="text-xs text-red-500">{errors.wbs_id.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" /> Stage *
                      </label>
                      <Controller
                        name="Stage"
                        control={control}
                        render={({ field }) => (
                          <Select
                            name="Stage"
                            options={[
                              { label: 'IFA', value: 'IFA' },
                              { label: 'IFC', value: 'IFC' },
                              { label: 'RE-IFA', value: 'RE-IFA' }
                            ]}
                            value={field.value}
                            onChange={(_, val) => {
                              field.onChange(val)
                              // Reset WBS selection when stage changes
                              setValue('wbs_id', '')
                              setSelectedWbs(null)
                            }}
                            placeholder="Select Stage"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* WBS Timing Display */}
                  {selectedWbs && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            Execution Hours
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {selectedWbs.totalExecHr || 0}h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                          <Clock className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                            Checking Hours
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {selectedWbs.totalCheckHr || 0}h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                            Total Available
                          </p>
                          <p className="text-xl font-black text-slate-900">{availableHours}h</p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Task Details */}
                <section className="space-y-6">
                  <SectionTitle title="Task Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Task Name *"
                      placeholder="e.g., Prepare GA Drawings"
                      {...register('name', { required: 'Name is required' })}
                    />

                    <div className="md:col-span-2">
                      <Input
                        label="Description"
                        type="textarea"
                        placeholder="Provide detailed instructions..."
                        {...register('description')}
                      />
                    </div>
                    <Input
                      label="Start Date *"
                      type="datetime-local"
                      {...register('start_date', {
                        required: 'Start date is required'
                      })}
                    />
                    <Input
                      label="Due Date *"
                      type="datetime-local"
                      {...register('due_date', {
                        required: 'Due date is required'
                      })}
                    />
                    <Input
                      label="Duration (e.g., 2w, 3d)"
                      placeholder="2w"
                      {...register('duration')}
                    />
                    <Input
                      label="Priority (1-5)"
                      type="number"
                      min={1}
                      max={5}
                      {...register('priority')}
                    />
                  </div>
                </section>

                {/* Employee Assignment Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <SectionTitle title="Team Assignment" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                      <span className="text-sm font-medium text-slate-600">Assigned:</span>
                      <span
                        className={`text-sm font-bold ${
                          totalAssignedHours > availableHours ? 'text-red-600' : 'text-indigo-600'
                        }`}
                      >
                        {totalAssignedHours}h / {availableHours}h
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-end gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                      >
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Employee
                          </label>
                          <Controller
                            name={`assignments.${index}.employeeId`}
                            control={control}
                            rules={{ required: 'Employee is required' }}
                            render={({ field }) => (
                              <Select
                                name={`user_id`}
                                options={employeeOptions}
                                value={field.value}
                                onChange={(_, val) => field.onChange(val)}
                                placeholder="Select Employee"
                              />
                            )}
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Hours
                          </label>
                          <Input
                            type="number"
                            placeholder="0"
                            {...register(`assignments.${index}.hours`, {
                              required: true,
                              min: 0
                            })}
                          />
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => append({ employeeId: '', hours: 0 })}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Employee
                    </button>
                  </div>

                  {totalAssignedHours > availableHours && availableHours > 0 && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm font-medium">
                        Total assigned hours exceed the available WBS hours!
                      </p>
                    </div>
                  )}
                </section>

                {/* Footer */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Assigning...' : 'Confirm & Assign Tasks'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddTask
