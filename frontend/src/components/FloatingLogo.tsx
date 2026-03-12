import { Link } from 'react-router-dom';
import logo2 from '../assets/logo2.png';

interface FloatingLogoProps {
  className?: string;
  showHover?: boolean;
}

export default function FloatingLogo({ className = "", showHover = false }: FloatingLogoProps) {
  return (
    <Link
      to="https://thayloiloc.com/"
      className={`block ${className}`}
      style={{ zIndex: 999999 }}
      aria-label="Về trang chủ"
      title="Về trang chủ"
    >
      <div className="relative flex items-center justify-end group">
        {/* Logo button - always visible, positioned on left */}
        <div 
          className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110" 
          style={{ zIndex: 2 }}
        >
          <img 
            src={logo2} 
            alt="Logo" 
            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain transition-transform duration-300"
          />
        </div>

        {/* Expandable pill bar with text - expands to the right */}
        <div 
          className={`absolute left-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-end overflow-hidden ${
            showHover ? 'w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px] opacity-100' : 'w-10 sm:w-12 md:w-14 lg:w-16 opacity-0'
          }`} 
          style={{ height: '40px', zIndex: 1 }}
        >
          <div className={`pr-6 sm:pr-7 md:pr-8 lg:pr-10 pl-12 sm:pl-14 md:pl-16 lg:pl-20 py-2 whitespace-nowrap font-bold text-xs sm:text-sm md:text-base transition-opacity duration-300 ${
            showHover ? 'opacity-100 delay-100' : 'opacity-0'
          }`}>
            Dịch vụ lắp đặt
          </div>
        </div>
      </div>
    </Link>
  );
}
