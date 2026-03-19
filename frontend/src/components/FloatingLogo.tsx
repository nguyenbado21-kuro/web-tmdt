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
      aria-label="Dịch vụ lắp đặt"
      title="Dịch vụ lắp đặt"
    >
      <div
        className="relative flex items-center justify-center group"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#ff951bff',
          transition: 'box-shadow 0.3s linear',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 10px 0 #ff951bff';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        <img
          src={logo2}
          alt="Logo"
          style={{ width: 32, height: 32 }}
          className="object-contain transition-transform duration-300"
        />

        <span
          className="floating-logo-tooltip"
          style={{
            background: 'rgba(255, 150, 21, 1)',
            borderRadius: 8,
            boxShadow: '0 4px 32px hsla(0, 0%, 46%, 0.12)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            position: 'absolute',
            right: '50%',
            top: '50%',
            transform: showHover ? 'translateY(-50%)' : 'translate(-20%, -50%)',
            transition: '0.3s linear',
            whiteSpace: 'nowrap',
            zIndex: -1,
            opacity: showHover ? 1 : 0,
            padding: '9px 40px 12px 9px',
            pointerEvents: 'none',
          }}
        >
          Dịch vụ lắp đặt
        </span>
      </div>

      <style>{`
        a:hover .floating-logo-tooltip {
          opacity: 1 !important;
          transform: translateY(-50%) !important;
        }
      `}</style>
    </Link>
  );
}
