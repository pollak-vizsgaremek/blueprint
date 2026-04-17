import { ButtonHTMLAttributes, ReactNode } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const GlassButton = ({
  children,
  className = "",
  ...props
}: GlassButtonProps) => {
  return (
    <button
      className={`group relative px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base font-semibold text-black rounded-full overflow-hidden transition-all duration-300 ease-out hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl cursor-pointer ${className}`}
      {...props}
    >
      {/* Enhanced glass background layers */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-white/15 to-white/10 backdrop-blur-xl border-2 border-white/40 rounded-full"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-black/20 rounded-full"></div>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out rounded-full"></div>

      {/* Enhanced outer glow */}
      <div className="absolute inset-0 rounded-full shadow-lg shadow-white/20 group-hover:shadow-white/30 transition-all duration-300"></div>

      {/* Inner glow */}
      <div className="absolute inset-0 rounded-full shadow-inner shadow-white/20"></div>

      {/* Content with text shadow for better readability */}
      <span className="relative z-10 drop-shadow-sm">{children}</span>
    </button>
  );
};
