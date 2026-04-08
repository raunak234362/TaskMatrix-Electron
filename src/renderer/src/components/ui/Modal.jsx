import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

const Modal = ({ isOpen, onClose, title, children,  hideHeader = false }) => {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-white w-full max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200`}
      >
        {/* Modal Header */}
        {!hideHeader && (
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-lg  text-gray-700">{title}</h3>
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
            >
              Close
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default Modal
