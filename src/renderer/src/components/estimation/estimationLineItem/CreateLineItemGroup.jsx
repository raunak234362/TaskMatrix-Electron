/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import { Loader2, Plus } from "lucide-react";
import RichTextEditor from "../../fields/RichTextEditor";

const CreateLineItemGroup = ({ estimationId, onGroupCreated }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            description: "",
            estimationId: estimationId || "",
        },
    });

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await Service.CreateLineItemGroup(data) // Using CreateLineItemGroup as per user instruction for creation
      toast.success('Line Item Group created successfully')
      reset()
      setIsExpanded(false)
      if (onGroupCreated) onGroupCreated()
    } catch (error) {
      console.error('Error creating line item group:', error)
      toast.error('Failed to create Line Item Group')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!estimationId) {
    return null
  }

  return (
    <div className="w-full mt-6 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div
        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-700">Line Item Groups</h3>
        <button className="flex items-center gap-2 text-green-600 font-medium hover:text-green-700">
          <Plus size={18} />
          {isExpanded ? 'Cancel' : 'Create New Group'}
        </button>
      </div>

      {isExpanded && (
        <div className="p-6 border-t border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('estimationId')} value={estimationId} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Group name is required' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter group name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Enter description (optional)"
                  />
                )}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default CreateLineItemGroup
