import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/SideBar'

const Layout = () => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close sidebar automatically when resizing from mobile → desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    if (window.innerWidth < 780) {
      setIsMobileOpen((prev) => !prev)
    } else {
      setIsMinimized((prev) => !prev)
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#6bbd45]">
      {/* Sidebar Area */}
      <div className="hidden md:flex relative z-10">
        <Sidebar isMinimized={isMinimized} toggleSidebar={toggleSidebar} isMobile={false} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white z-50 transform transition-transform duration-300 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar isMinimized={false} toggleSidebar={() => setIsMobileOpen(false)} isMobile={true} />
      </div>

      {/* Main Content Area - White Card effect */}
      <div className="flex flex-col flex-1 min-h-0 bg-[#6bbd45] p-2 pl-0">
        <div className="flex-1 bg-gray-50 rounded-xl shadow-2xl overflow-hidden flex flex-col relative transition-all">
          <div className="px-2 pt-2">
            <Header isMinimized={isMinimized} toggleSidebar={toggleSidebar} />
          </div>
          <main className="flex-1 w-full overflow-y-auto custom-scrollbar p-2">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
