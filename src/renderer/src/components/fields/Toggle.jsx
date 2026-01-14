/* eslint-disable react-refresh/only-export-components */

import React, { useId, useState, forwardRef } from "react";

const Toggle = forwardRef(
  ({ label, className = "", name, onChange, ...props }, ref) => {
    const id = useId();
    const [checked, setChecked] = useState(false);

    const handleChange = (e) => {
      const newValue = e.target.checked;
      setChecked(newValue);
      onChange?.(e);
    };

    return (
      <div className="flex flex-row items-center w-full">
        {/* LABEL */}
        {label && (
          <label
            htmlFor={id}
            className={`block mb-1 w-fit min-w-28 font-normal text-sm text-gray-700 ${checked ? "font-semibold" : ""
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
          onChange={handleChange}
          ref={ref}
          {...props}
        />

        {/* SELECTED TEXT */}
        {checked && <span className="font-bold text-green-500">Selected</span>}
      </div>
    );
  }
);

export default Toggle;
