import hotlineIcon from '../assets/hotline.png';

interface FloatingHotlineProps {
  phoneNumber?: string;
  className?: string;
  showHover?: boolean;
}

export default function FloatingHotline({ 
  phoneNumber = "038 690 2668", 
  className = "",
  showHover = false
}: FloatingHotlineProps) {
  const handleCall = () => {
    window.open(`tel:${phoneNumber.replace(/\s/g, '')}`, '_self');
  };

  return (
    <button
      onClick={handleCall}
      className={`block ${className}`}
      style={{ zIndex: 999999 }}
      aria-label={`Gọi hotline ${phoneNumber}`}
      title={`Gọi hotline ${phoneNumber}`}
    >
      <div className="relative flex items-center justify-end group">
        {/* Phone icon button - always visible, positioned on left */}
        <div 
          className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110" 
          style={{ zIndex: 2 }}
        >
          <img 
            src={hotlineIcon} 
            alt="Hotline" 
            className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 transition-transform duration-300 group-hover:rotate-12"
          />
        </div>

        {/* Expandable pill bar with phone number - expands to the right */}
        <div 
          className={`absolute right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-end overflow-hidden ${
            showHover ? 'w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px] opacity-100' : 'w-10 sm:w-12 md:w-14 lg:w-16 opacity-0'
          }`} 
          style={{ height: '40px', zIndex: 1 }}
        >
          <div className={`pr-6 sm:pr-7 md:pr-8 lg:pr-10 pl-12 sm:pl-14 md:pl-16 lg:pl-20 py-2 whitespace-nowrap font-bold text-xs sm:text-sm md:text-base transition-opacity duration-300 ${
            showHover ? 'opacity-100 delay-100' : 'opacity-0'
          }`}>
            {phoneNumber}
          </div>
        </div>
      </div>
    </button>
  );
}
