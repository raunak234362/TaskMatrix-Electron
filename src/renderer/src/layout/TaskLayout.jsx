import { useState } from 'react'

// import { useSelector } from "react-redux";
import AllTasks from '../components/task/AllTasks'
import AddTask from '../components/task/AddTask'
import AllActiveTask from '../components/task/AllActiveTask'
import PendingTrainings from '../components/training/PendingTrainings'
import MyTrainings from '../components/training/MyTrainings'
import TrainingReport from '../components/training/TrainingReport'
import { ChevronDown } from 'lucide-react'

const TaskLayout = () => {
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
  const [isTrainingDropdownOpen, setIsTrainingDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(
    userRole === 'connection_designer_engineer' ||
      userRole === 'estimation_head' ||
      userRole === 'project_manager' ||
      userRole === 'dept_manager'
      ? 'allTask'
      : 'activeTask'
  )
  //   const task = useSelector((state) => state.RFQInfos.RFQData);
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="relative z-[100] px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-none flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab('activeTask')}
            className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'activeTask'
                ? 'bg-green-200 text-black border-green-700/80'
                : 'bg-green-50 text-black border-green-700/80 hover:bg-green-100'
            }`}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab('allTask')}
            className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'allTask'
                ? 'bg-green-200 text-black border-green-700/80'
                : 'bg-green-50 text-black border-green-700/80 hover:bg-green-100'
            }`}
          >
            All Task
          </button>
          {userRole === 'admin' ||
          userRole === 'operation_executive' ||
          userRole === 'project_manager' ||
          userRole === 'department_manager' ||
          userRole === 'dept_manager' ? (
            <button
              onClick={() => setActiveTab('addTask')}
              className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'addTask'
                  ? 'bg-green-200 text-black border-green-700/80'
                  : 'bg-green-50 text-black border-green-700/80 hover:bg-green-100'
              }`}
            >
              Add Task
            </button>
          ) : null}
          {/* Training Dropdown */}
          <div className="relative group">
            <button
              onClick={() => setIsTrainingDropdownOpen(!isTrainingDropdownOpen)}
              onBlur={() => setTimeout(() => setIsTrainingDropdownOpen(false), 200)}
              className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                ['pendingTraining', 'myTraining', 'trainingReport'].includes(activeTab)
                  ? 'bg-green-200 text-black border-green-700/80'
                  : 'bg-green-50 text-black border-green-700/80 hover:bg-green-100'
              }`}
            >
              🎓 Training <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            
            {/* Dropdown Menu */}
            {isTrainingDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-gray-200 shadow-xl rounded-none flex flex-col z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                {['admin', 'operation_executive', 'deputy_manager', 'human_resource'].includes(userRole) && (
                  <button
                    onClick={() => setActiveTab('pendingTraining')}
                    className={`px-4 py-3 text-sm font-bold text-left uppercase hover:bg-green-50 transition-colors border-b border-gray-100 ${activeTab === 'pendingTraining' ? 'bg-green-100 text-green-800' : 'text-gray-700'}`}
                  >
                    Pending Training
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('myTraining')}
                  className={`px-4 py-3 text-sm font-bold text-left uppercase hover:bg-green-50 transition-colors border-b border-gray-100 ${activeTab === 'myTraining' ? 'bg-green-100 text-green-800' : 'text-gray-700'}`}
                >
                  My Trainings
                </button>
                {['admin','deputy_manager', 'operation_executive', 'project_manager', 'dept_manager'].includes(userRole) && (
                  <button
                    onClick={() => setActiveTab('trainingReport')}
                    className={`px-4 py-3 text-sm font-bold text-left uppercase hover:bg-green-50 transition-colors ${activeTab === 'trainingReport' ? 'bg-green-100 text-green-800' : 'text-gray-700'}`}
                  >
                    Training Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === 'activeTask' && (
          <div>
            <AllActiveTask />
          </div>
        )}
        {activeTab === 'allTask' && (
          <div>
            <AllTasks />
          </div>
        )}
        {activeTab === 'addTask' && (
          <div>
            <AddTask />
          </div>
        )}
        {activeTab === 'pendingTraining' && (
          <div className="p-4">
            <PendingTrainings />
          </div>
        )}
        {activeTab === 'myTraining' && (
          <div className="p-4 h-full">
            <MyTrainings />
          </div>
        )}
        {activeTab === 'trainingReport' && (
          <div className="p-4 h-full">
            <TrainingReport />
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskLayout
