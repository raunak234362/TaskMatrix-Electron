import React, { useId, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

// Define the props interface for TypeScript


const Input = React.forwardRef(
  (
    { label, type = "text", className = "", variant = "default", ...props },
    ref
  ) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Base styles for inputs
    const baseStyles =
      "w-full px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200";

    // Variant styles
    const variantStyles = {
      default: "border border-gray-300 rounded-md bg-white focus:ring-blue-500",
      outline:
        "border border-gray-300 rounded-md bg-transparent focus:ring-blue-500",
      filled: "border-0 rounded-md bg-gray-100 focus:ring-blue-500",
    };

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        {type === "textarea" ? (
          <textarea
            className={`${baseStyles} ${variantStyles[variant]} resize-y min-h-[80px] ${className}`}
            ref={ref}
            {...props}
            id={id}
          />
        ) : (
          <div className="relative">
            <input
              type={showPassword && type === "password" ? "text" : type}
              className={`${baseStyles} ${variantStyles[variant]} ${className}`}
              ref={ref}
              {...props}
              id={id}
            />
            {type === "password" && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
