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
    // Outer container matches the Sidebar's Green Theme (Brand Color #6bbd45)
    <div className="flex h-screen w-screen overflow-hidden">
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
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
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

      {/* Main Content Area - White Card effect */}
      <div className="flex flex-col flex-1 min-h-0  p-0 md:p-2 pl-0">
        <div className="flex-1 rounded-md overflow-hidden flex flex-col relative transition-all">

          {/* Optional Header is needed globally, it goes here inside the white card */}
          <div className="px-2 pt-2">
            <Header isMinimized={isMinimized} toggleSidebar={toggleSidebar} />
          </div>

          <main className="flex-1 w-full overflow-y-auto custom-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
