/* eslint-disable react/prop-types */
import { MessagesSquare, Check, Clock } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import RichTextEditor from "../../fields/RichTextEditor";

const Comment = ({ comments, onAddComment, staffData, onAcknowledge }) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    onAddComment(data);
    // reset();
  };
  console.log(comments);

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <div className="p-6 bg-gray-50 rounded-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Add Comment
        </h3>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <Controller
              name="comment"
              control={control}
              rules={{ required: "Comment is required" }}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Write your comment here..."
                />
              )}
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-red-600">Comment is required</p>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-cyan-600 rounded-lg hover:bg-cyan-700"
          >
            <MessagesSquare className="w-4 h-4 mr-2" />
            Add Comment
          </button>
        </form>
      </div>

      {/* Comments List */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Comments</h3>

        {comments?.length > 0 ? (
          <div className="space-y-4">
            {comments?.map((comment, index) => (
              <div
                key={index}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-cyan-600">
                      {(Array.isArray(staffData) ? staffData : [])?.find((staff) => staff?.id === comment?.user_id)
                        ?.f_name?.charAt(0) || "U"}
                    </div>
                    <span className="font-medium text-gray-800">
                      {comment?.user?.firstName} {comment?.user?.middleName} {comment?.user?.lastName}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-500">
                      {new Date(comment?.created_on).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {/* Acknowledge Logic */}
                    {comment.acknowledged ? (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check className="w-3 h-3" />
                        <span>Read</span>
                        {comment.acknowledgedTime && (
                          <span className="text-gray-400 font-normal">
                            at {new Date(comment.acknowledgedTime).toLocaleString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {userRole !== "staff" && (
                          <button
                            onClick={() =>
                              onAcknowledge(comment.id, {
                                acknowledged: true,
                                acknowledgedTime: new Date(),
                              })
                            }
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-600 border border-cyan-600 rounded hover:bg-cyan-50 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Acknowledge
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="pl-10 text-gray-700 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: comment?.data }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl">
            <MessagesSquare className="w-12 h-12 mb-3 text-gray-400" />
            <h4 className="text-lg font-medium text-gray-800">
              No comments yet
            </h4>
            <p className="text-gray-500">
              Be the first to add a comment to this task.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;