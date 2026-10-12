import React, { useId, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(
  (
    { label, labelClassName = "", type = "text", className = "", variant = "default", ...props },
    ref
  ) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Base styles for inputs
    const baseStyles =
      "w-full px-3 py-2 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-200";

    // Variant styles
    const variantStyles = {
      default: "border border-black rounded-md bg-white focus:ring-blue-500",
      outline:
        "border border-black rounded-md bg-transparent focus:ring-blue-500",
      filled: "border-0 rounded-md bg-gray-100 focus:ring-blue-500",
    };

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className={cn("text-sm font-medium text-gray-700", labelClassName)}>
            {label}
          </label>
        )}
        {type === "textarea" ? (
          <textarea
            className={cn(baseStyles, variantStyles[variant], className)}
            ref={ref}
            {...props}
            id={id}
          />
        ) : (
          <div className="relative">
            <input
              type={showPassword && type === "password" ? "text" : type}
              className={cn(baseStyles, variantStyles[variant], className)}
              ref={ref}
              {...props}
              id={id}
            />
            {type === "password" && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900 focus:outline-none cursor-pointer"
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
