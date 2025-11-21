'use client';
import React from 'react';

interface ZinliCardProps {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  focused?: 'number' | 'name' | 'expiry' | 'cvc';
}

export default function ZinliCard({ number, name, expiry, cvc, focused = 'number' }: ZinliCardProps) {
  const formatNumber = (num: string) => {
    const cleaned = num.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
  };

  // Nueva función para formatear la fecha de AAAA/MM a MM/AA
  const formatExpiryForDisplay = (exp: string) => {
    const cleaned = exp.replace(/\D/g, '');
    if (cleaned.length >= 6) {
      // Convertir de AAAA/MM a MM/AA
      const year = cleaned.slice(2, 4); // Últimos 2 dígitos del año
      const month = cleaned.slice(4, 6); // Mes
      return month + '/' + year;
    }
    return cleaned.padEnd(4, '•').replace(/(.{2})/, '$1/');
  };

  const displayNumber = number ? formatNumber(number) : '•••• •••• •••• ••••';
  const displayName = name || 'TITULAR DE LA TARJETA';
  const displayExpiry = expiry ? formatExpiryForDisplay(expiry) : '••/••';
  const displayCvc = cvc ? '•'.repeat(Math.min(cvc.length, 3)) : '•••'; // Máximo 3 dígitos

  // Logo de Zinli mejorado con icono
  const ZinliLogo = () => (
    <div className="flex items-center space-x-1 bg-white bg-opacity-95 rounded-lg px-2 py-1 shadow-sm">
      {/* Icono Z */}
      <div className="w-4 h-4 bg-purple-600 rounded-sm flex items-center justify-center">
        <span className="text-white text-xs font-bold">Z</span>
      </div>
      {/* Texto */}
      <span className="text-purple-600 font-bold text-sm tracking-wide">ZINLI</span>
    </div>
  );

  return (
    <div className="relative w-full max-w-[340px] h-[200px] rounded-xl shadow-lg overflow-hidden">
      {/* Fondo gradiente Zinli */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, #7B3FE4 0%, #9D69F3 100%)',
          border: focused === 'number' ? '2px solid #FFD700' : '2px solid transparent'
        }}
      >
        {/* Chip */}
        <div className="absolute top-6 left-6 w-10 h-8 bg-gradient-to-br from-yellow-300 to-yellow-100 rounded-md shadow-sm"></div>
        
        {/* Número de tarjeta */}
        <div 
          className={`absolute top-16 left-6 right-6 font-mono text-lg font-bold text-white ${
            focused === 'number' ? 'text-yellow-300' : 'text-white'
          }`}
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
        >
          {displayNumber}
        </div>
        
        {/* Nombre del titular */}
        <div 
          className={`absolute bottom-16 left-6 text-sm font-medium uppercase truncate right-6 ${
            focused === 'name' ? 'text-yellow-300' : 'text-white'
          }`}
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
        >
          {displayName}
        </div>
        
        {/* Fecha de expiración */}
        <div className="absolute bottom-6 left-6 text-white">
          <div className="text-xs opacity-80">VÁLIDA HASTA</div>
          <div 
            className={`font-mono ${focused === 'expiry' ? 'text-yellow-300' : 'text-white'}`}
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
          >
            {displayExpiry}
          </div>
        </div>
        
        {/* Logo Zinli */}
        <div className="absolute top-6 right-6">
          <ZinliLogo />
        </div>
        
        {/* CVV (solo se muestra cuando está enfocado) */}
        {focused === 'cvc' && (
          <div className="absolute top-16 right-6 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm font-mono">
            CVV: {displayCvc}
          </div>
        )}

        {/* Texto "Prepago" */}
        <div className="absolute bottom-6 right-6 text-white text-xs opacity-80">
          Prepago
        </div>
      </div>
    </div>
  );
}