import { useForm } from "react-hook-form";
import { X, Users } from "lucide-react";
import Input from "../fields/input";
import Button from "../fields/Button";
import Service from "../../api/Service";



const AddChatGroup = ({ onClose, onCreated }) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await Service.AddGroup(data);
      console.log(response);
      onCreated?.();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
              <Users size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Create New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Give your group a name. You can add members after creating the group.
              </p>
              <Input
                label="Group Name"
                type="text"
                {...register("name", { required: "Group name is required" })}
                placeholder="e.g. Marketing Team, Project Alpha"
                className="w-full"
              />
              {errors.name?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-600 text-white hover:bg-teal-700"
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
