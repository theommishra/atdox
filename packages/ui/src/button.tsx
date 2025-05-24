import React from "react";
import clsx from "clsx";

type ButtonProps = {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

const Button = ({
  variant = "primary",
  size = "md",
  children,
  onClick,
  className = "",
}: ButtonProps) => {
  const base = "rounded-lg font-medium transition";

  const variants = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "text-gray-700 hover:underline",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-8 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      className={clsx(base, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
};

export default Button;
