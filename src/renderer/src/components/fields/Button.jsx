
import React from 'react';


const Button = ({
  children,
  type = "button",
  className,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${className} text-center md:px-5 px-3 md:py-1 py-0 font-semibold bg-linear-to-r from-emerald-400 to-teal-700 hover:bg-teal-700 transform hover:scale-105 transition-transform duration-200 text-white md:text-md hover:font-bold text-sm rounded-xl`}

      {...props}
    >
      {children}
    </button>
  )
}

export default Button