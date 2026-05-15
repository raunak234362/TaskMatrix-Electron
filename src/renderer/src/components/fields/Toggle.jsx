/* eslint-disable react-refresh/only-export-components */

import React, { useId, useState, forwardRef } from "react";


/* ---------------------------------------------------
   COMPONENT
--------------------------------------------------- */

const Toggle = forwardRef(
  ({ label, className = "", name, onChange, ...props }, ref) => {
    const id = useId();
    // Use the checked prop if provided (controlled), otherwise it falls back to the input's default behavior
    const isChecked = props.checked;

    return (
      <div className={`flex flex-row items-center justify-between w-full group ${className}`}>
        {/* LABEL */}
        {label && (
          <label
            htmlFor={id}
            className={`block text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer transition-all ${isChecked ? "text-black" : "text-black/40 group-hover:text-black/60"
              }`}
          >
            {label}
          </label>
        )}

        {/* TOGGLE */}
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={id}
            name={name}
            onChange={onChange}
            ref={ref}
            checked={isChecked}
            {...props}
            className="peer appearance-none w-4 h-4 border border-black rounded cursor-pointer checked:bg-[#6bbd45] checked:border-[#6bbd45] transition-colors"
          />
          <svg className="absolute w-2.5 h-2.5 pointer-events-none hidden peer-checked:block text-black" viewBox="0 0 14 14" fill="none">
            <path d="M3 7.5L6 10.5L11 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );
  }
);

export default Toggle;
