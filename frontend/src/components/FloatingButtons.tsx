import { useState } from 'react'
import FloatingLogo from './FloatingLogo'
import FloatingHotline from './FloatingHotline'
import zaloIcon from '../assets/logo2.png'

interface FloatingButtonsProps {
  phoneNumber?: string
  className?: string
}

export default function FloatingButtons({
  phoneNumber = "038 690 2668",
  className = ""
}: FloatingButtonsProps) {

  const [hoveredButton, setHoveredButton] =
    useState<'logo' | 'hotline' | null>(null)

  const handleZaloClick = () => {
    window.open('https://thayloiloc.com/', '_blank')
  }

  const handlePhoneClick = () => {
    window.open(`tel:${phoneNumber.replace(/\s/g, '')}`, '_self')
  }

  return (
    <>
      {/* Desktop Floating Buttons */}
      <div
        className={`
        hidden md:flex
        fixed bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8
        right-2 sm:right-3 md:right-4 lg:right-8
        flex-col items-end
        z-50
        ${className}
        `}
      >
        
        {/* Logo */}
        <div
          className="mb-2 sm:mb-3 md:mb-4"
          onMouseEnter={() => setHoveredButton('logo')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <FloatingLogo showHover={hoveredButton === 'logo'} />
        </div>

        {/* Hotline */}
        <div
          onMouseEnter={() => setHoveredButton('hotline')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <FloatingHotline
            phoneNumber={phoneNumber}
            showHover={hoveredButton === 'hotline'}
          />
        </div>
      </div>

      {/* Mobile Liquid Glass Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="relative mx-auto mb-3 ml-3 pointer-events-auto" style={{   maxHeight: '97px' }}>
          {/* Main Glass Container */}
          <div className="liquid-glass-container">
            {/* Shimmer effect overlay */}
            <div className="liquid-glass-shimmer"></div>
            
            {/* Edge highlight (top edge glow) */}
            <div className="liquid-glass-edge-top"></div>
            
            {/* Content */}
            <div className="relative flex items-center justify-center gap-10 px-8 py-5">
              {/* tll Button */}
              <button
                onClick={handleZaloClick}
                className="liquid-glass-button group"
              >
                <div className="liquid-glass-icon-wrapper liquid-glass-icon-orange">
                  {/* Refraction effect layers */}
                  <div className="liquid-glass-refraction"></div>
                  <div className="liquid-glass-inner-glow"></div>
                  
                  <img 
                    src={zaloIcon} 
                    alt="Zalo" 
                    className="relative w-9 h-9 object-contain z-10 drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
                  />
                </div>
                <span className="liquid-glass-label"></span>
              </button>

              {/* Phone Button */}
              <button
                onClick={handlePhoneClick}
                className="liquid-glass-button group"
              >
                <div className="liquid-glass-icon-wrapper liquid-glass-icon-green-dark">
                  {/* Refraction effect layers */}
                  <div className="liquid-glass-refraction"></div>
                  <div className="liquid-glass-inner-glow"></div>
                  
                  <svg 
                    className="relative w-8 h-8 text-white z-10 drop-shadow-[0_2px_8px_rgba(37,99,235,0.6)]" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="liquid-glass-label"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
