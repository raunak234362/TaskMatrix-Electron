/* eslint-disable react/prop-types */
import { NavLink, useNavigate } from 'react-router-dom'
import LOGO from '../assets/logo.png'
import { LogOut, X, RefreshCw } from 'lucide-react'
import { navItems } from '../constants/navigation'
import { useSelector } from 'react-redux'
import Button from './fields/Button'

const Sidebar = ({ isMinimized, toggleSidebar, isMobile = false }) => {
  const userData = useSelector((state) => state?.userdata?.userDetail)
  console.log(userData,"=========");
  
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
      className={`h-full transition-all duration-300 flex flex-col ${isMinimized ? 'w-24' : 'w-72'
        } ${isMobile ? 'shadow-2xl bg-white' : 'relative'}`}
    >
      {/* Header */}
      <div
        className={`flex items-center pt-6 pb-2 px-6 ${isMobile ? 'justify-between' : isMinimized ? 'justify-center' : 'justify-start'
          }`}
      >
        <div className="flex items-center w-full justify-center">
          {!isMinimized ? (
            <img
              src={LOGO}
              alt="Logo"
              className="bg-white w-56 object-contain rounded-3xl drop-shadow-sm"
            />
          ) : (
            <img
              src={LOGO}
              alt="Logo"
              className="bg-white w-16 object-contain p-1 rounded-3xl drop-shadow-sm"
            />
          )}
        </div>

        {isMobile && (
          <Button
            onClick={toggleSidebar}
            className="p-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            <X size={22} />
          </Button>
        )}
      </div>

      <div className="flex-1 py-2 flex flex-col overflow-y-auto">
        <ul className="flex flex-col gap-0.5 w-full pl-4">
          {navItems.map(
            ({ label, to, roles, icon }) =>
              canView(roles) && (
                <li key={label} className="relative group">
                  <NavLink
                    to={to}
                    end={to === '/dashboard'}
                    onClick={isMobile ? toggleSidebar : undefined}
                    className={({ isActive }) =>
                      `flex items-center rounded-2xl gap-4 py-2.5 transition-all duration-200 font-bold text-md tracking-wide relative 
                      ${isActive
                        ? 'bg-gray-50 text-[#6bbd45] shadow-sm ml-0 pl-6 z-20'
                        : 'text-white/80 hover:text-white hover:bg-white/20 pl-6 ml-0'
                      } ${isMinimized ? 'justify-center px-0 w-14 h-14 mx-auto rounded-xl! ml-0! pl-0!' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Inverted Corners for Active State Effect - Desktop Only */}
                        {!isMinimized && isActive && (
                          <>
                            {/* Top Curve */}
                            {/* <div className="absolute right-0 -top-5 w-5 h-5 bg-transparent rounded-br-3xl shadow-[5px_5px_0_5px_#f9fafb] z-10 pointer-events-none"></div> */}
                            {/* Bottom Curve */}
                            {/* <div className="absolute right-0 -bottom-5 w-5 h-5 bg-transparent rounded-tr-[20px] shadow-[5px_-5px_0_5px_#f9fafb] z-10 pointer-events-none"></div> */}
                          </>
                        )}
                        <div className={`${isMinimized ? '' : ''} relative z-20`}>{icon}</div>
                        {!isMinimized && <span className="relative z-20">{label}</span>}
                      </>
                    )}
                  </NavLink>

                  {/* Tooltip for minimized sidebar */}
                  {isMinimized && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50 hidden group-hover:flex">
                      <span className="bg-background text-white text-sm font-bold py-2 px-4 rounded-xl shadow-xl whitespace-nowrap">
                        {label}
                      </span>
                    </div>
                  )}
                </li>
              )
          )}
        </ul>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2">
        <div className="p-6 mt-auto">
          {!isMinimized && (
            <div className="flex items-center gap-4 mb-4 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#6bbd45] font-extrabold text-lg shadow-sm">
                {sessionStorage.getItem('username')?.[0] || 'U'}
              </div>
              <div className="overflow-hidden text-white">
                <p className="text-sm font-bold truncate">{sessionStorage.getItem('username')}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider truncate opacity-80">
                  {userData?.role || designation}
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2 flex flex-col gap-2">
            <Button
              className={`w-full flex items-center gap-3 py-3 rounded-xl transition-all mb-2 ${isMinimized
                  ? 'justify-center bg-white/10 text-white hover:bg-white/20'
                  : 'justify-start px-6 bg-white/10 text-white hover:bg-white/20'
                }`}
              onClick={handleRefresh}
            >
              <RefreshCw size={20} />
              {!isMinimized && <span className="font-bold text-sm">Refresh</span>}
            </Button>

            <Button
              className={`w-full flex items-center gap-3 py-3 rounded-xl transition-all ${isMinimized
                  ? 'justify-center bg-white/10 text-white hover:bg-white/20'
                  : 'justify-start px-6 bg-white/10 text-white hover:bg-white/20'
                }`}
              onClick={fetchLogout}
            >
              <LogOut size={20} />
              {!isMinimized && <span className="font-bold text-sm">Logout</span>}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
