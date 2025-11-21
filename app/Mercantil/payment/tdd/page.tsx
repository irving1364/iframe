'use client';
import { useEffect, useState } from 'react';
import TddPayment from '../../../../components/payment/TddPayment';
import { TddClientData } from '../../../../lib/types/tdd-types';

// Interfaz para los parámetros de URL
interface UrlParams {
  data?: string; // Datos codificados en base64
  return_url?: string; // URL de retorno para Odoo
  origin?: string; // Dominio de origen (para seguridad)
  mode?: 'odoo' | 'standalone';
  language?: string; // Idioma
}

export default function TddPage() {
  const [clientData, setClientData] = useState<TddClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [urlParams, setUrlParams] = useState<UrlParams>({});
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    setIsEmbedded(window.parent !== window);

    const loadParamsAndData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        
        const params: UrlParams = {
          data: urlParams.get('data') || undefined,
          return_url: urlParams.get('return_url') || undefined,
          origin: urlParams.get('origin') || undefined,
          mode: 'odoo', // Siempre modo Odoo
          language: urlParams.get('language') || 'es'
        };

        setUrlParams(params);
        console.log('🔗 Parámetros TDD recibidos:', params);

        // Validar que vengan datos desde Odoo
        if (!params.data) {
          throw new Error('Datos de pago no proporcionados. Este componente solo funciona integrado con Odoo.');
        }

        let clientData: TddClientData;

        // Solo modo Odoo/ERP: datos desde URL parameters
        const decodedData = JSON.parse(atob(params.data)) as TddClientData;
        clientData = decodedData;

        // Agregar metadata de la transacción
        clientData.metadata = {
          source: 'odoo',
          returnUrl: params.return_url,
          origin: params.origin,
          language: params.language,
          timestamp: new Date().toISOString()
        };

        setClientData(clientData);

        // Notificar al parent que el iframe está listo
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'payment_iframe_loaded',
            status: 'ready',
            mode: 'odoo',
            method: 'tdd',
            origin: window.location.origin
          }, params.origin || '*');
        }

      } catch (error) {
        console.error('❌ Error cargando parámetros TDD:', error);
        
        // Notificar error al parent
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'payment_error',
            message: 'Error inicializando pasarela de pago TDD'
          }, urlParams.origin || '*');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadParamsAndData();
  }, []);

  const handlePaymentSuccess = (result: any) => {
    console.log('✅ Pago TDD exitoso, notificando...', result);
    
    const messageData = {
      type: 'payment_success',
      paymentResult: {
        acquirer_reference: result.bank_response?.transaction_response?.payment_reference,
        transaction_id: result.bank_response?.transaction_response?.trx_internal_status,
        amount: result.bank_response?.transaction_response?.amount,
        currency: result.bank_response?.transaction_response?.currency,
        transaction_date: result.bank_response?.transaction_response?.processing_date,
        merchant_identify: result.bank_response?.merchant_identify,
        raw_response: result
      },
      metadata: {
        source: 'odoo',
        method: 'tdd',
        timestamp: new Date().toISOString()
      }
    };

    // Comunicarse con el parent (Odoo/ERP)
    if (window.parent !== window) {
      window.parent.postMessage(messageData, urlParams.origin || '*');
    }

    // Si hay return_url, redirigir (para casos de ventana popup)
    if (urlParams.return_url) {
      const returnUrl = new URL(urlParams.return_url);
      returnUrl.searchParams.set('transaction_id', result.bank_response?.transaction_response?.payment_reference);
      returnUrl.searchParams.set('status', 'success');
      returnUrl.searchParams.set('method', 'tdd');
      window.location.href = returnUrl.toString();
    }
  };

  const handlePaymentError = (message: string) => {
    console.error('❌ Error en pago TDD:', message);
    
    const errorData = {
      type: 'payment_error',
      message: message,
      metadata: {
        source: 'odoo',
        method: 'tdd',
        timestamp: new Date().toISOString()
      }
    };

    if (window.parent !== window) {
      window.parent.postMessage(errorData, urlParams.origin || '*');
    }

    // Si hay return_url, redirigir con error
    if (urlParams.return_url) {
      const returnUrl = new URL(urlParams.return_url);
      returnUrl.searchParams.set('status', 'error');
      returnUrl.searchParams.set('error_message', encodeURIComponent(message));
      returnUrl.searchParams.set('method', 'tdd');
      window.location.href = returnUrl.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Inicializando pasarela de pago TDD...
          </p>
          <p className="text-sm text-gray-500 mt-2">Conectando con Odoo</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Error de configuración</h3>
          <p className="text-sm">Este componente solo funciona integrado con Odoo</p>
          <p className="text-xs text-gray-500 mt-2">
            No se recibieron datos de pago válidos desde el sistema
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-screen flex items-center justify-center p-4`}>
      <TddPayment 
        clientData={clientData}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        embedded={isEmbedded}
        mode="odoo"
      />
    </div>
  );
}