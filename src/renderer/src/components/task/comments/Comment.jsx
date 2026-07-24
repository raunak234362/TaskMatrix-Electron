import { MessagesSquare, Check, Calendar } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import RichTextEditor from '../../fields/RichTextEditor'

const Comment = ({ comments, onAddComment, staffData, onAcknowledge, cardRounded = 'rounded-none' }) => {
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
                className={`bg-white ${cardRounded} border border-gray-200 shadow-sm transition-all duration-300 overflow-hidden flex flex-col p-5`}
                style={{
                  borderLeftWidth: '6px',
                  borderLeftColor: '#2563eb'
                }}
              >
                <div className="flex-1 min-w-0">
                  {/* Main Comment Text */}
                  <div
                    className="text-lg font-bold text-black uppercase tracking-tight mb-3 font-mono"
                    dangerouslySetInnerHTML={{ __html: comment?.data }}
                  />

                  {/* Footer with User, Timestamp, and Acknowledge */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-2 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-4 text-xs font-normal text-black uppercase tracking-widest">
                      {(comment?.user || comment?.user_id) && (
                        <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-0.5 rounded-full text-black font-semibold">
                          {comment?.user
                            ? `${comment.user.firstName || ''} ${comment.user.middleName || ''} ${comment.user.lastName || ''}`.replace(/\s+/g, ' ').trim()
                            : (() => {
                                const staff = (Array.isArray(staffData) ? staffData : []).find(
                                  (s) => s?.id === comment?.user_id
                                )
                                return staff ? `${staff.f_name || ''} ${staff.m_name || ''} ${staff.l_name || ''}`.replace(/\s+/g, ' ').trim() : 'User'
                              })()}
                        </span>
                      )}
                      {comment?.created_on && (
                        <span className="flex items-center gap-1 text-black">
                          <Calendar size={12} className="text-black" />
                          {new Intl.DateTimeFormat('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(new Date(comment.created_on))}
                        </span>
                      )}
                    </div>

                    {/* Acknowledge Logic */}
                    <div>
                      {comment.acknowledged ? (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-bold uppercase tracking-wider">
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span>Read</span>
                          {comment.acknowledgedTime && (
                            <span className="text-black font-bold ml-1">
                              at{' '}
                              {new Intl.DateTimeFormat('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).format(new Date(comment.acknowledgedTime))}
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
                              className="flex items-center gap-1 px-3 py-1 bg-cyan-50 text-black border border-cyan-700/80 rounded-none hover:bg-cyan-100 transition-all font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                            >
                              <Check className="w-3 h-3 text-black" />
                              Acknowledge
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
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
