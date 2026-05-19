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
      {/* contact-phone equivalent */}
      <div
        className="relative flex items-center justify-center group"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#1bc929ff',
          transition: 'box-shadow 0.3s linear',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 10px 0 #1bc929ff';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        {/* Icon - contact-phone a equivalent */}
        <img
          src={hotlineIcon}
          alt="Hotline"
          style={{ width: 32, height: 32, filter: 'brightness(0) invert(1)' }}
          className="transition-transform duration-300 group-hover:rotate-12"
        />

        {/* phone-number tooltip */}
        <span
          className="phone-number-tooltip"
          style={{
            background: 'rgba(34, 234, 64, 0.8)',
            borderRadius: 8,
            boxShadow: '0 4px 32px hsla(0, 0%, 46%, 0.12)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            position: 'absolute',
            right: '50%',
            top: '50%',
            transform: 'translate(-20%, -50%)',
            transition: '0.3s linear',
            whiteSpace: 'nowrap',
            zIndex: -1,
            opacity: showHover ? 1 : 0,
            padding: '9px 40px 12px 9px',
            pointerEvents: 'none',
          }}
        >
          {phoneNumber}
        </span>
      </div>

      <style>{`
        button:hover .phone-number-tooltip {
          opacity: 1 !important;
          transform: translateY(-50%) !important;
        }
      `}</style>
    </button>
  );
}
