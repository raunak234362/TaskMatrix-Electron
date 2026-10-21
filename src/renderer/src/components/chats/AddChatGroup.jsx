import { useForm } from "react-hook-form";
import { Users } from "lucide-react";
import { toast } from "react-toastify";
import Input from "../fields/input";
import Button from "../fields/Button";
import Service from "../../api/Service";



const AddChatGroup = ({ onClose, onCreated, projectName }) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({ defaultValues: { name: projectName || "" } });

  const onSubmit = async (data) => {
    try {
      const response = await Service.AddGroup(data);
      onCreated?.(response);
      onClose();
    } catch (error) {
      console.error("Failed to create chat group", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to create chat group. Please try again.",
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Users size={20} />
            </div>
            <h2 className="text-lg  text-gray-700">
              {projectName ? "Create Project Chat Group" : "Create New Group"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <p className="text-sm text-gray-700 mb-4">
                {projectName
                  ? "This group will use the project name. You can add members after creating it."
                  : "Give your group a name. You can add members after creating the group."}
              </p>
              <Input
                label={projectName ? "Project Name" : "Group Name"}
                type="text"
                {...register("name", { required: "Group name is required" })}
                placeholder="e.g. Marketing Team, Project Alpha"
                readOnly={Boolean(projectName)}
                className="w-full"
              />
              {errors.name?.message && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:flex-1 bg-green-600 text-white hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddChatGroup;
