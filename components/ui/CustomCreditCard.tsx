'use client';
import React from 'react';
import Cards, { Focused } from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';

interface CustomCreditCardProps {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  focused?: Focused;
  issuer?: string;
}

// Función para convertir AAAA/MM a MM/AA
const formatExpiryForLibrary = (expiry: string) => {
  const cleaned = expiry.replace(/\D/g, '');
  if (cleaned.length >= 6) {
    const month = cleaned.slice(4, 6); // Mes (posiciones 4-5)
    const year = cleaned.slice(2, 4); // Año corto (posiciones 2-3)
    return month + year; // Formato MMAA para la librería
  }
  return expiry;
};

// Estilos CSS mejorados para Zinli
const customStyles = `
  .rccs__card--unknown[data-custom-issuer="zinli"],
  .rccs__card[data-custom-issuer="zinli"] {
    background: linear-gradient(135deg, #7B3FE4 0%, #9D69F3 100%) !important;
    color: white !important;
  }
  
  .rccs__card--unknown[data-custom-issuer="zinli"] .rccs__number,
  .rccs__card[data-custom-issuer="zinli"] .rccs__number {
    color: white !important;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
  }
  
  .rccs__card--unknown[data-custom-issuer="zinli"] .rccs__name,
  .rccs__card[data-custom-issuer="zinli"] .rccs__name {
    color: white !important;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
  }
  
  .rccs__card--unknown[data-custom-issuer="zinli"] .rccs__expiry,
  .rccs__card[data-custom-issuer="zinli"] .rccs__expiry {
    color: white !important;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
  }
  
  .rccs__card--unknown[data-custom-issuer="zinli"] .rccs__issuer,
  .rccs__card[data-custom-issuer="zinli"] .rccs__issuer {
    background-image: none !important;
    background: rgba(255, 255, 255, 0.95) !important;
    border-radius: 6px !important;
    padding: 4px 8px !important;
    font-weight: bold !important;
    color: #7B3FE4 !important;
    font-size: 12px !important;
    font-family: Arial, sans-serif !important;
  }
`;

export default function CustomCreditCard({ issuer, expiry, ...props }: CustomCreditCardProps) {
  const isZinli = issuer === 'zinli';
  const formattedExpiry = formatExpiryForLibrary(expiry);
  
  return (
    <>
      <style>{customStyles}</style>
      <div data-custom-issuer={isZinli ? 'zinli' : undefined} className="relative">
        <Cards
          {...props}
          expiry={formattedExpiry}
          acceptedCards={['visa', 'mastercard', 'amex', 'dinersclub', 'discover', 'jcb', 'unionpay']}
        />
        
        {/* Overlay del logo Zinli */}
        {isZinli && (
          <div className="absolute top-4 right-4 pointer-events-none">
            <div className="bg-white bg-opacity-95 rounded-lg px-3 py-1 shadow-sm">
              <span className="text-purple-600 font-bold text-sm tracking-wide">ZINLI</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}