import { Menu, ChevronLeft, Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { navItems } from '../constants/navigation'
import Button from './fields/Button'

const Header = ({ isMinimized, toggleSidebar }) => {
  const location = useLocation()

  const getPageTitle = () => {
    const currentPath = location.pathname
    const activeItem = navItems.find((item) => {
      if (item.to === '/dashboard') {
        return currentPath === '/dashboard'
      }
      return currentPath.includes(item.to)
    })
    return activeItem ? activeItem.label : 'Whiteboard Technologies'
  }

  return (
    <header className="flex flex-row justify-between items-center w-full min-h-[72px] px-8 bg-transparent">
      {/* Left Area: Toggle & Page Title */}
      <div className="flex items-center gap-6">
        <button
          onClick={toggleSidebar}
          className="p-2.5 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-all shadow-sm border border-primary/5"
        >
          {isMinimized ? (
            <Menu size={20} className="stroke-[2.5]" />
          ) : (
            <ChevronLeft size={20} className="stroke-[2.5]" />
          )}
        </button>

        <div className="flex flex-col">
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Area: Notifications Area Only */}
      <div className="flex items-center gap-6">
        <button className="relative p-2.5 text-gray-400 hover:text-primary bg-white/50 hover:bg-white rounded-xl transition-all group border border-transparent hover:border-primary/10 shadow-sm">
          <Bell size={20} strokeWidth={2.5} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
        </button>
      </div>
    </header>
  )
}

export default Header
