import { MessagesSquare, Check } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import RichTextEditor from '../../fields/RichTextEditor'

const Comment = ({ comments, onAddComment, staffData, onAcknowledge }) => {
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = (data) => {
    onAddComment(data)
  }

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <div className="p-6 bg-[#f4faf0] border border-black rounded-none">

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <Controller
              name="comment"
              control={control}
              rules={{ required: 'Comment is required' }}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Write your comment here..."
                  className="text-sm font-bold text-black uppercase"
                />
              )}
            />
            {errors.comment && (
              <p className="mt-1 text-sm font-bold text-red-600 uppercase">Comment is required</p>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            <MessagesSquare className="w-4 h-4 mr-2" />
            Add Comment
          </button>
        </form>
      </div>

      {/* Comments List */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-black uppercase">Comments</h3>

        {comments?.length > 0 ? (
          <div className="space-y-4">
            {comments?.map((comment, index) => (
              <div
                key={index}
                className="p-4 bg-[#fcfdfc] border border-black rounded-none shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 text-black border border-black rounded-none bg-green-50 text-sm font-bold uppercase">
                      {(Array.isArray(staffData) ? staffData : [])
                        ?.find((staff) => staff?.id === comment?.user_id)
                        ?.f_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-bold text-black uppercase">
                      {comment?.user?.firstName} {comment?.user?.middleName}{' '}
                      {comment?.user?.lastName}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-black uppercase">
                      {new Date(comment?.created_on).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {/* Acknowledge Logic */}
                    {comment.acknowledged ? (
                      <div className="flex items-center gap-1 text-sm text-green-600 font-bold uppercase">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>Read</span>
                        {comment.acknowledgedTime && (
                          <span className="text-black font-bold ml-1 uppercase">
                            at{' '}
                            {new Date(comment.acknowledgedTime).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        {userRole !== 'staff' && (
                          <button
                            onClick={() =>
                              onAcknowledge(comment.id, {
                                acknowledged: true,
                                acknowledgedTime: new Date()
                              })
                            }
                            className="flex items-center gap-1 px-3 py-1 bg-cyan-50 text-black border-2 border-cyan-700/80 rounded-none hover:bg-cyan-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                          >
                            <Check className="w-3 h-3 text-black" />
                            Acknowledge
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="pl-10 text-black text-sm font-bold uppercase whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: comment?.data }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-[#f4faf0] border border-black rounded-none">
            <MessagesSquare className="w-12 h-12 mb-3 text-black" />
            <h4 className="text-sm font-bold text-black uppercase mb-1">No comments yet</h4>
            <p className="text-sm font-bold text-black uppercase">
              Be the first to add a comment to this task.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Comment
