/* eslint-disable react/prop-types */
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearActiveDetail } from '../../store/uiSlice'
import { setModalOpen } from '../../store/userSlice'

// Import all detail components
import GetRFQByID from '../rfq/GetRFQByID'
import GetRFIByID from '../rfi/GetRFIByID'
import GetTaskByID from '../task/GetTaskByID'
import GetSubmittalByID from '../submittals/GetSubmittalByID'
import GetMilestoneByID from '../project/mileStone/GetMilestoneByID'
import GetProjectById from '../project/GetProjectById'
import GetCOByID from '../co/GetCOByID'

/**
 * GlobalModalManager listens to the Redux state (ui.activeDetail)
 * and renders the corresponding detail component as a modal.
 * This allows deep-linking to specific items from notifications or search.
 */
const GlobalModalManager = () => {
  const dispatch = useDispatch()
  const { activeDetail } = useSelector((state) => state.ui)

  React.useEffect(() => {
    if (activeDetail?.type && activeDetail?.id) {
       console.log("🛠️ GlobalModalManager detected activeDetail:", activeDetail);
       dispatch(setModalOpen(true));
    }
  }, [activeDetail, dispatch]);

  // Only render if we have a type and id
  if (!activeDetail || !activeDetail.type || !activeDetail.id) return null

  const handleClose = () => {
    dispatch(clearActiveDetail())
    dispatch(setModalOpen(false))
  }

  const { type, id } = activeDetail

  const renderModal = () => {
    // Standardize type to lowercase for easier matching
    const sanitizedType = type.toLowerCase()

    switch (sanitizedType) {
      case 'rfq':
        return <GetRFQByID id={id} onClose={handleClose} />
      case 'rfi':
        return <GetRFIByID id={id} onClose={handleClose} />
      case 'task':
        return <GetTaskByID id={id} onClose={handleClose} />
      case 'submittal':
      case 'submittals':
        return <GetSubmittalByID id={id} onClose={handleClose} />
      case 'milestone':
        // GetMilestoneByID expects row object with id
        return <GetMilestoneByID row={{ id }} close={handleClose} />
      case 'co':
      case 'changeorder':
      case 'changeorders':
      case 'change_order':
        return <GetCOByID id={id} projectId={activeDetail.projectId} onClose={handleClose} />
      case 'project':
      case 'projects':
        return (
          <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden w-full h-full flex flex-col relative p-6 custom-scrollbar overflow-y-auto">
               <GetProjectById id={id} onClose={handleClose} />
            </div>
          </div>
        )
      default:
        console.warn(`[GlobalModalManager] Unknown detail type: ${type}`)
        return null
    }
  }

  return (
    <>
      {renderModal()}
    </>
  )
}

export default GlobalModalManager
