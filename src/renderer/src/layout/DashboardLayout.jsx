import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/SideBar";

const Layout = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-200 font-sans relative">
      {/* Black ambient shadow to tone down */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

      {/* Sidebar Area */}
      <div className="hidden md:flex relative z-10">
        <Sidebar
          isMinimized={isMinimized}
          toggleSidebar={toggleSidebar}
          isMobile={false}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sidebar
          isMinimized={!isMobileOpen}
          toggleSidebar={() => setIsMobileOpen(false)}
          isMobile={true}
        />
      </div>

      {/* Main Content Area - Distinguishable White Card with Black Shadow */}
      <div className="flex flex-col flex-1 min-h-0 relative z-10 p-3 md:p-4 md:pl-0">
        <div className="flex-1 flex flex-col relative transition-all overflow-hidden bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/40">

          {/* Header inside main area */}
          <div className="border-b border-slate-200 bg-slate-50/50 shadow-sm z-20">
            <Header isMinimized={isMinimized} toggleSidebar={toggleSidebar} />
          </div>

          <main className="flex-1 w-full overflow-y-auto custom-scrollbar p-2 bg-gray-50/20">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
