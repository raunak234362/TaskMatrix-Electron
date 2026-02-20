import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../components/Header";
import Sidebar from "../components/SideBar";

const Layout = () => {
  const location = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isAnyModalOpen = useSelector((state) => state.userInfo.isAnyModalOpen);

  // Close sidebar automatically when resizing from mobile → desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobileOpen(false);
      } else if (window.innerWidth >= 768 && window.innerWidth < 1200) {
        setIsMinimized(true);
      } else {
        setIsMinimized(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsMinimized((prev) => !prev);
    }
  };

  const isChatPage = location.pathname.includes('/chats');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans text-[#1f2933]">
      {/* Sidebar Area - Desktop */}
      {!isAnyModalOpen && (
        <div className="hidden md:flex relative z-20 h-full border-r border-gray-200 bg-white">
          <Sidebar
            isMinimized={isMinimized}
            toggleSidebar={toggleSidebar}
            isMobile={false}
          />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && !isAnyModalOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {!isAnyModalOpen && (
        <div className={`md:hidden fixed inset-y-0 left-0 z-50 bg-white shadow-xl transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar
            isMinimized={false}
            toggleSidebar={() => setIsMobileOpen(false)}
            isMobile={true}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-0 relative z-10 bg-[#f9fafb]">
        {/* Header - Sticky top with border */}
        {!isAnyModalOpen && (
          <div className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
            <Header isMinimized={isMinimized} toggleSidebar={toggleSidebar} />
          </div>
        )}

        <main className={`flex flex-col flex-1 w-full min-h-0 custom-scrollbar ${isAnyModalOpen ? 'p-0' : 'p-6'} ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
