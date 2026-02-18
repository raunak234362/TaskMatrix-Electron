import { NavLink, useNavigate } from 'react-router-dom'
import LOGO from '../assets/logo.png'
import ICON from '../assets/icon.png'
import { LogOut, X, RefreshCw } from 'lucide-react'
import { navItems } from '../constants/navigation'
import { useSelector } from 'react-redux'

const Sidebar = ({ isMinimized, toggleSidebar, isMobile = false }) => {
  const userData = useSelector((state) => state?.userdata?.userDetail)
  const navigate = useNavigate()
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
  const designation = sessionStorage.getItem('designation')?.toLowerCase() || ''

  const canView = (roles) => roles.includes(userRole.toLowerCase())

  const handleRefresh = () => {
    window.location.reload()
  }

  const fetchLogout = () => {
    try {
      sessionStorage.clear()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <aside
      className={`h-full flex flex-col bg-white transition-all duration-300 border-r border-gray-200
        ${isMinimized ? 'w-20' : 'w-72'}
        ${isMobile ? 'w-72 shadow-none' : ''}
      `}
    >
      {/* Header / Logo */}
      <div
        className={`flex items-center ${isMinimized ? 'pt-6 pb-2' : 'pt-8 pb-4'} px-4 ${isMobile ? 'justify-between' : 'justify-center'
          }`}
      >
        <div className="flex items-center w-full justify-center group">
          {!isMinimized ? (
            <img
              src={LOGO}
              alt="Logo"
              className="bg-white w-64 object-contain rounded-xl transition-transform duration-500"
            />
          ) : (
            <img
              src={ICON}
              alt="Icon"
              className="w-12 h-12 object-contain transition-all duration-300 hover:scale-110"
            />
          )}
        </div>

        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className={`flex-1 ${isMinimized ? 'py-1' : 'py-4'} flex flex-col overflow-y-auto custom-scrollbar`}>
        <nav className={`flex flex-col ${isMinimized ? 'gap-0.5' : 'gap-1'} w-full px-3`}>
          {navItems.map(({ label, to, roles, icon }) =>
            canView(roles) && (
              <div key={label} className="group relative">
                <NavLink
                  to={to}
                  end={to === '/dashboard'}
                  onClick={isMobile ? toggleSidebar : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-4 ${isMinimized ? 'py-3' : 'py-3 px-4'} rounded-lg transition-all duration-200 text-sm font-medium tracking-wide
                    ${isActive
                      ? 'bg-white border-l-4 border-[#6bbd45] text-[#1f2933] font-bold shadow-sm'
                      : 'text-black border-l-4 border-transparent hover:bg-gray-50 hover:text-black'
                    } 
                    ${isMinimized ? 'justify-center px-0' : ''}`
                  }
                >
                  <div className={`shrink-0 transition-colors duration-200`}>
                    {icon}
                  </div>

                  {!isMinimized && (
                    <span className="truncate">{label}</span>
                  )}
                </NavLink>

                {/* Tooltip for minimized state */}
                {isMinimized && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap">
                    {label}
                  </div>
                )}
              </div>
            )
          )}
        </nav>
      </div>

      {/* User & Actions Footer */}
      <div className={`${isMinimized ? 'p-2' : 'p-4'} border-t border-gray-100 bg-gray-50/30`}>
        {!isMinimized && (
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg border border-gray-300">
              {sessionStorage.getItem('firstName')?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">
                {sessionStorage.getItem('firstName') + ' ' + sessionStorage.getItem('lastName')}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold truncate">
                {userData?.role || designation}
              </p>
            </div>
          </div>
        )}

        <div className={`space-y-2 ${isMinimized ? 'flex flex-col items-center' : ''}`}>
          <button
            className={`w-full flex items-center gap-3 py-2.5 rounded-lg bg-[#ebf5ea] text-black border border-black shadow-sm hover:bg-[#dcecdb] hover:shadow-md transition-all text-xs font-bold uppercase tracking-wider
              ${isMinimized ? 'justify-center px-0 w-10 h-10' : 'justify-start px-4'}`}
            onClick={handleRefresh}
            title={isMinimized ? "Refresh" : ""}
          >
            <RefreshCw size={18} />
            {!isMinimized && <span>Refresh</span>}
          </button>

          <button
            className={`w-full flex items-center gap-3 py-2.5 rounded-lg bg-white text-black border border-black shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-all text-xs font-bold uppercase tracking-wider
              ${isMinimized ? 'justify-center px-0 w-10 h-10' : 'justify-start px-4'}`}
            onClick={fetchLogout}
            title={isMinimized ? "Logout" : ""}
          >
            <LogOut size={18} />
            {!isMinimized && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
