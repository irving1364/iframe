'use client';
import { motion } from 'framer-motion';

const GradientLogoSpinner = ({ 
  size = 24, 
  className = '' 
}: { 
  size?: number; 
  className?: string; 
}) => {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{ 
        width: size, 
        height: size,
        borderRadius: '8px' // Para que coincida con el estilo del botón
      }}
    >
      {/* Fondo con gradiente animado */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        animate={{
          background: [
            'conic-gradient(from 0deg, #8B5CF6, #EC4899, #8B5CF6)',
            'conic-gradient(from 90deg, #8B5CF6, #EC4899, #8B5CF6)',
            'conic-gradient(from 180deg, #8B5CF6, #EC4899, #8B5CF6)',
            'conic-gradient(from 270deg, #8B5CF6, #EC4899, #8B5CF6)',
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          borderRadius: '6px'
        }}
      />
      
      {/* Logo blanco encima */}
      <div className="absolute inset-[2px] bg-white rounded flex items-center justify-center">
        <svg 
          width={size * 0.6} 
          height={size * 0.6} 
          viewBox="0 0 281.75 281.72"
          className="text-purple-600"
        >
          <path 
            fill="currentColor" 
            d="M9.25,9.28c0,93.75.51.48.51,94.23H131L9.76,224.72V291H76.05L197.26,169.8V291H291V9.76H103.51" 
            transform="translate(-9.25 -9.28)"
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default GradientLogoSpinner;