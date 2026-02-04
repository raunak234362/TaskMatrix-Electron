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
      <div className={`flex flex-row items-center w-full ${className}`}>
        {/* LABEL */}
        {label && (
          <label
            htmlFor={id}
            className={`block mb-1 w-fit min-w-28 font-normal text-sm text-gray-700 cursor-pointer ${isChecked ? "font-semibold" : ""
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
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
        />

        {/* SELECTED TEXT */}
        {isChecked && <span className="ml-2 font-bold text-green-500 animate-in fade-in zoom-in duration-200">Selected</span>}
      </div>
    );
  }
);

export default Toggle;
