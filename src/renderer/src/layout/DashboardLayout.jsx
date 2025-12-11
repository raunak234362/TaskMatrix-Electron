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
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 780) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsMinimized((prev) => !prev);
    }
  };

  return (
    <div className="flex px-1 h-screen w-screen overflow-hidden bg-linear-to-tr from-emerald-200 to-teal-950">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex">
        <Sidebar
          isMinimized={isMinimized}
          toggleSidebar={toggleSidebar}
          isMobile={false}
        />
      </div>

      {/* Sidebar Overlay for Mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsMobileOpen(false)}
      ></div>

      <div
        className={`fixed top-0 left-0 h-full bg-white z-50 transform transition-transform duration-300 lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          isMinimized={false}
          toggleSidebar={() => setIsMobileOpen(false)}
          isMobile={true}
        />
      </div>

      {/* Main Content */}
      <div className="pl-0 md:pl-1 flex flex-col flex-1 overflow-hidden min-h-0">
        <Header
          isMinimized={isMinimized}
          toggleSidebar={toggleSidebar}
        />
        <main className="flex-1 w-full overflow-y-auto p-2 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
