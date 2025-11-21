import { ReactNode } from 'react';

interface PaymentLayoutProps {
  children: ReactNode;
}

export default function PaymentLayout({ children }: PaymentLayoutProps) {
  // Solo devuelve los children SIN html/body
  return (
    <div className="payment-layout">
      {children}
    </div>
  );
}