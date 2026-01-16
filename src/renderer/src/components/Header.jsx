import React from "react";
import { Menu, ChevronLeft, Bell } from "lucide-react";
import Button from "./fields/Button";



const Header = ({ isMinimized, toggleSidebar }) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full py-2 px-6 bg-white rounded-xl shadow-[0_4px_15px_rgb(0,0,0,0.03)] mb-2">
      {/* Left: Sidebar Toggle & Title */}
      <div className="flex items-center gap-4">
        <Button
          onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center bg-[#6bbd45] text-white rounded-lg hover:bg-[#5aa33a] transition-all shadow-[0_4px_10px_-2px_rgba(107,189,69,0.4)]"
        >
          {isMinimized ? (
            <Menu size={18} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={20} strokeWidth={3} />
          )}
        </Button>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-[#6bbd45] uppercase tracking-tight leading-none drop-shadow-sm">
            Whiteboard Technologies
          </h1>
        </div>
      </div>

      {/* Right: Greeting & Notifications */}
      <div className="flex items-center gap-3">
        <div className="flex-col items-end hidden sm:flex">
          <span className="text-md font-extrabold text-gray-800 tracking-tight">
            Welcome Back,
            <span className="ml-1 text-md font-bold text-[#6bbd45] tracking-wide uppercase">
              {sessionStorage.getItem("username") || "User"}
            </span>
          </span>
        </div>
        <button className="relative p-2 bg-green-50 text-[#6bbd45] hover:bg-green-100 rounded-[0.75rem] transition-all shadow-sm group">
          <Bell
            size={18}
            strokeWidth={2.5}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
