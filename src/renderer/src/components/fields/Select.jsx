"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";



const Select = ({
  options = [],
  label,
  name = "",
  className = "",
  onChange,
  placeholder,
  value,
  showSearch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] =
    useState(options);
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyles, setMenuStyles] = useState({});

  // Sync filtered options when options prop changes
  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  // Sync selected option when controlled value changes
  useEffect(() => {
    if (typeof value !== "undefined") {
      const match =
        options.find((o) => String(o.value) === String(value)) || null;
      setSelectedOption(match);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideWrapper =
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target);
      const isOutsideMenu =
        menuRef.current && !menuRef.current.contains(event.target);

      if (isOutsideWrapper && isOutsideMenu) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic menu placement and portal positioning
  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 240; // max-h-60 is 15rem = 240px
      const shouldPlaceTop = spaceBelow < menuHeight && rect.top > menuHeight;

      setMenuStyles({
        position: "fixed",
        top: shouldPlaceTop ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        transform: shouldPlaceTop ? "translateY(-100%)" : "none",
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  // Handle search input
  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = options.filter(
      (option) => option && option.label.toLowerCase().includes(term),
    );
    setFilteredOptions(filtered);
  };

  // Handle option selection
  const handleSelect = (option) => {
    setSelectedOption(option);
    setSearchTerm("");
    setIsOpen(false);
    if (onChange) {
      onChange(name, String(option.value));
    }
  };

  // Highlight matching text in options
  const highlightMatch = (text, highlight) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 text-gray-700">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Dropdown Trigger */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          if (showSearch) {
            setTimeout(() => {
              searchRef.current?.focus();
            }, 100);
          }
        }}
        className={`flex items-center justify-between p-2.5 text-xs font-bold border rounded-lg bg-white cursor-pointer transition-all ${isOpen ? "border-sky-400 ring-4 ring-sky-50 shadow-sm" : "border-gray-200"
          } ${className}`}
      >
        <div className="flex-1">
          {isOpen && showSearch ? (
            <div className="flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className="w-full bg-transparent outline-none placeholder:font-normal placeholder:text-gray-400"
                placeholder="Search..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <span
              className={`uppercase tracking-wide ${selectedOption ? "text-slate-600" : "text-gray-400"}`}
            >
              {selectedOption
                ? selectedOption.label
                : placeholder || "ALL"}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyles}
            className="text-sm bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2.5 cursor-pointer hover:bg-sky-50 hover:text-sky-700 transition-colors uppercase font-bold tracking-wider text-[11px]"
                  onClick={() => handleSelect(option)}
                >
                  {highlightMatch(option.label, searchTerm)}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 italic">
                No options found
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Select;
