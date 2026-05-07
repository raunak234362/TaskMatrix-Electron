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
        <input
          type="checkbox"
          id={id}
          name={name}
          onChange={onChange}
          ref={ref}
          {...props}
          className="w-4 h-4 accent-black border-2 border-black rounded cursor-pointer"
        />
      </div>
    );
  }
);

export default Toggle;
