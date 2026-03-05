import hotlineIcon from '../assets/hotline.png';

interface FloatingHotlineProps {
  phoneNumber?: string;
  className?: string;
}

export default function FloatingHotline({ 
  phoneNumber = "0123456789", 
  className = "" 
}: FloatingHotlineProps) {
  const handleCall = () => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  return (
    <button
      onClick={handleCall}
      className={`fixed bottom-8 right-8 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group animate-pulse hover:animate-none ${className}`}
      aria-label={`Gọi hotline ${phoneNumber}`}
      title={`Gọi hotline ${phoneNumber}`}
    >
      <img 
        src={hotlineIcon} 
        alt="Hotline" 
        className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"
      />
    </button>
  );
}