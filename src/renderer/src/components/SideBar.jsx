/* eslint-disable react/prop-types */
import { NavLink, useNavigate } from 'react-router-dom'
import LOGO from '../assets/logo.png'
import { LogOut, X, RefreshCw } from 'lucide-react'
import { navItems } from '../constants/navigation'
import { useSelector } from 'react-redux'
import Button from './fields/Button'

const Sidebar = ({ isMinimized, toggleSidebar, isMobile = false }) => {
  const userData = useSelector((state) => state?.userdata?.userDetail)
  console.log(userData, "=========");

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
      className={`h-full transition-all duration-500 flex flex-col ${isMinimized ? 'w-24' : 'w-72'
        } ${isMobile ? 'shadow-2xl bg-slate-800' : 'relative z-20'}`}
    >
      {/* Header / Logo */}
      <div
        className={`flex items-center pt-8 pb-4 px-6 ${isMobile ? 'justify-between' : isMinimized ? 'justify-center' : 'justify-start'
          }`}
      >
        <div className="flex items-center w-full justify-center group">
          {!isMinimized ? (
            <img
              src={LOGO}
              alt="Logo"
              className="bg-white w-56 object-contain rounded-3xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <img
              src={LOGO}
              alt="Logo"
              className="bg-white w-16 h-16 object-contain p-2 rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.2)] group-hover:rotate-12 transition-all duration-500"
            />
          )}
        </div>

        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-white hover:bg-white/10 transition-colors"
          >
            <X size={22} />
          </button>
        )}
      </div>

      <div className="flex-1 py-6 flex flex-col overflow-y-auto">
        <nav className="flex flex-col gap-1 w-full px-4">
          {navItems.map(
            ({ label, to, roles, icon }) =>
              canView(roles) && (
                <div key={label} className="group relative">
                  <NavLink
                    to={to}
                    end={to === '/dashboard'}
                    onClick={isMobile ? toggleSidebar : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-4 py-3.5 transition-all duration-500 text-sm font-black tracking-tight relative overflow-hidden
                      ${isActive
                        ? 'bg-[#22c55e] text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)] rounded-2xl px-6 scale-105 z-10'
                        : 'text-gray-900 hover:bg-white/10 hover:text-black px-6 rounded-2xl hover:translate-x-1'
                      } ${isMinimized ? 'justify-center w-14 h-14 mx-auto rounded-2xl shadow-md px-0!' : ''}`
                    }
                  >
                    {/* Rolling Hover Background Effect */}
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 -z-10" />
                    <div className={`${isMinimized ? 'scale-125' : ''} shrink-0 transition-transform duration-500 group-hover:rotate-12`}>
                      {icon}
                    </div>
                    {!isMinimized && <span className="truncate uppercase tracking-wider">{label}</span>}
                  </NavLink>

                  {isMinimized && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-4 py-2 bg-[#22c55e] text-white text-[10px] font-black rounded-xl shadow-[5px_5px_15px_rgba(0,0,0,0.2)] opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap z-50 uppercase tracking-widest">
                      {label}
                    </div>
                  )}
                </div>
              )
          )}
        </nav>
      </div>

      {/* User & Actions Footer */}
      <div className="p-6 mt-auto">
        {!isMinimized && (
          <div className="flex items-center gap-4 mb-8 bg-black/20 p-4 rounded-3xl border border-white/5 backdrop-blur-md shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#22c55e] font-black text-xl shadow-[0_5px_15px_rgba(0,0,0,0.15)]">
              {sessionStorage.getItem('username')?.[0] || 'U'}
            </div>
            <div className="overflow-hidden text-gray-900">
              <p className="text-sm font-black truncate uppercase tracking-tight">{sessionStorage.getItem('username')}</p>
              <p className="text-[10px] uppercase tracking-widest truncate opacity-80 font-bold">
                {userData?.role || designation}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            className={`w-full flex items-center gap-3 py-3 rounded-2xl transition-all text-gray-900 hover:bg-white/20 hover:text-black text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md
              ${isMinimized ? 'justify-center px-0' : 'justify-start px-6'}`}
            onClick={handleRefresh}
          >
            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
            {!isMinimized && <span>Refresh</span>}
          </button>

          <button
            className={`w-full flex items-center gap-3 py-3 rounded-2xl transition-all text-gray-900 hover:bg-red-500/30 hover:text-red-900 text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md
              ${isMinimized ? 'justify-center px-0' : 'justify-start px-6'}`}
            onClick={fetchLogout}
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
