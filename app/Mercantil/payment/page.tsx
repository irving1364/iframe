'use client';
import { useEffect, useState } from 'react';

// Importamos todos los componentes de pago
import TdcPayment from '@/components/payment/TdcPayment';
import TddPayment from '@/components/payment/TddPayment';
import PaymentMobilePayment from '@/components/payment/PaymentMobilePayment';

// Importamos los tipos (Asegúrate de que las rutas coincidan con tu proyecto)
import { ClientData } from '@/lib/types';
import { TddClientData } from '@/lib/types/tdd-types';
import { PaymentMobileClientData } from '@/lib/types/payment-mobile';

type PaymentMethod = 'tdc' | 'tdd' | 'c2p';

// Interfaz unificada para los parámetros de URL
interface UrlParams {
  method?: PaymentMethod; // ¡NUEVO PARÁMETRO!
  data?: string;
  return_url?: string;
  origin?: string;
  mode?: 'odoo' | 'standalone';
  language?: string;
}

export default function MercantilGatewayPage() {
  // Usamos 'any' o una unión de tipos para manejar los distintos payloads
  const [clientData, setClientData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [urlParams, setUrlParams] = useState<UrlParams>({});
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);

  useEffect(() => {
    setIsEmbedded(window.parent !== window);

    const loadParamsAndData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        
        const currentParams: UrlParams = {
          method: (params.get('method') as PaymentMethod) || undefined,
          data: params.get('data') || undefined,
          return_url: params.get('return_url') || undefined,
          origin: params.get('origin') || undefined,
          mode: (params.get('mode') as 'odoo' | 'standalone') || 'standalone',
          language: params.get('language') || 'es'
        };

        setUrlParams(currentParams);
        console.log('🔗 Gateway Mercantil - Parámetros recibidos:', currentParams);

        if (!currentParams.method || !['tdc', 'tdd', 'c2p'].includes(currentParams.method)) {
          throw new Error('Método de pago no especificado o inválido (?method=tdc|tdd|c2p)');
        }

        let decodedData: any;

        if (currentParams.data) {
          // Modo Odoo: Decodificamos el base64 sin importar el método aún
          decodedData = JSON.parse(atob(currentParams.data));
        } else {
          // Modo Standalone: Datos mock genéricos para pruebas si no viene data
          if (currentParams.mode === 'odoo') {
             throw new Error('Faltan los datos de pago desde Odoo (parámetro "data").');
          }
          // Aquí podrías asignar mocks dependiendo del currentParams.method si lo deseas
          decodedData = { 
            amount: 100, 
            description: "Pago de prueba unificado" 
            // ... (agrega las llaves encriptadas de prueba que usas en tus mocks)
          };
        }

        // Agregamos la metadata común para todos
        decodedData.metadata = {
          source: currentParams.mode,
          method: currentParams.method,
          returnUrl: currentParams.return_url,
          origin: currentParams.origin,
          language: currentParams.language,
          timestamp: new Date().toISOString()
        };

        setClientData(decodedData);

        // Notificar a Odoo que el iframe general está listo
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'payment_iframe_loaded',
            status: 'ready',
            mode: currentParams.mode,
            method: currentParams.method,
            origin: window.location.origin
          }, currentParams.origin || '*');
        }

      } catch (error: any) {
        console.error('❌ Error inicializando Gateway:', error);
        setErrorConfig(error.message);
        
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'payment_error',
            message: error.message || 'Error inicializando pasarela de pago'
          }, '*'); // Nota: Considera usar el origin específico si lo tienes
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadParamsAndData();
  }, []);

  // Función unificada de Éxito
  const handlePaymentSuccess = (result: any) => {
    console.log(`✅ Pago ${urlParams.method} exitoso, notificando...`, result);
    
    const messageData = {
      type: 'payment_success',
      paymentResult: {
        acquirer_reference: result.bank_response?.transaction_response?.payment_reference,
        transaction_id: result.bank_response?.transaction_response?.trx_internal_status,
        amount: result.bank_response?.transaction_response?.amount,
        currency: result.bank_response?.transaction_response?.currency,
        transaction_date: result.bank_response?.transaction_response?.processing_date,
        merchant_identify: result.bank_response?.merchant_identify,
        payment_method: urlParams.method,
        raw_response: result
      },
      metadata: {
        source: urlParams.mode,
        method: urlParams.method,
        timestamp: new Date().toISOString()
      }
    };

    if (window.parent !== window) {
      window.parent.postMessage(messageData, urlParams.origin || '*');
    }

    if (urlParams.return_url) {
      const returnUrl = new URL(urlParams.return_url);
      returnUrl.searchParams.set('transaction_id', result.bank_response?.transaction_response?.payment_reference || '');
      returnUrl.searchParams.set('status', 'success');
      returnUrl.searchParams.set('method', urlParams.method || '');
      window.location.href = returnUrl.toString();
    }
  };

  // Función unificada de Error
  const handlePaymentError = (message: string) => {
    console.error(`❌ Error en pago ${urlParams.method}:`, message);
    
    const errorData = {
      type: 'payment_error',
      message: message,
      metadata: {
        source: urlParams.mode,
        method: urlParams.method,
        timestamp: new Date().toISOString()
      }
    };

    if (window.parent !== window) {
      window.parent.postMessage(errorData, urlParams.origin || '*');
    }

    if (urlParams.return_url) {
      const returnUrl = new URL(urlParams.return_url);
      returnUrl.searchParams.set('status', 'error');
      returnUrl.searchParams.set('error_message', encodeURIComponent(message));
      returnUrl.searchParams.set('method', urlParams.method || '');
      window.location.href = returnUrl.toString();
    }
  };

  // Renderizado dinámico del componente correcto
  const renderPaymentComponent = () => {
    switch (urlParams.method) {
      case 'tdc':
        return <TdcPayment clientData={clientData as ClientData} onSuccess={handlePaymentSuccess} onError={handlePaymentError} embedded={isEmbedded} mode={urlParams.mode} />;
      case 'tdd':
        return <TddPayment clientData={clientData as TddClientData} onSuccess={handlePaymentSuccess} onError={handlePaymentError} embedded={isEmbedded} mode="odoo" />;
      case 'c2p':
        return <PaymentMobilePayment PaymentMobileClientData={clientData as PaymentMobileClientData} onSuccess={handlePaymentSuccess} onError={handlePaymentError} embedded={isEmbedded} mode={urlParams.mode} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando Pasarela Mercantil...</p>
        </div>
      </div>
    );
  }

  if (errorConfig || !clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {/* SVG de Error */}
          </div>
          <h3 className="text-lg font-bold mb-2">Error de configuración</h3>
          <p className="text-sm">{errorConfig || 'No se pudieron cargar los datos'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-screen flex items-center justify-center p-4`}>
      {renderPaymentComponent()}
    </div>
  );
}