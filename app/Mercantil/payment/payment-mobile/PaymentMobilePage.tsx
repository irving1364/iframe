'use client';
import { useEffect, useState } from 'react';
import PaymentMobilePayment from '@/components/payment/PaymentMobilePayment';
import { PaymentMobileClientData } from '@/lib/types/payment-mobile';

interface UrlParams {
  data?: string;
  return_url?: string;
  origin?: string;
  mode?: 'odoo' | 'standalone';
  language?: string;
}

export default function PaymentMobilePage() {
  const [clientData, setClientData] = useState<PaymentMobileClientData | null>(null); // ← Tipo específico
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
          mode: (urlParams.get('mode') as 'odoo' | 'standalone') || 'standalone',
          language: urlParams.get('language') || 'es'
        };

        setUrlParams(params);
        console.log('🔗 URL parameters received (Mobile Payment):', params);

        let clientData: PaymentMobileClientData; // ← Tipo específico

        if (params.data) {
          const decodedData = JSON.parse(atob(params.data)) as PaymentMobileClientData;
          clientData = decodedData;
        } else {
          clientData = {
            encryptedClient: "pXsM1bjazk/Gc7ASLqJLje4Hc8VR3MPD4Q+D8t46NMvTnPDDCz3ItgPpOby/5Rop",
            encryptedMerchant: "JZb38y6vm/CKkGvZ2i+rxQ==",
            encryptedKey: "l7GpQTyXBWnym0Q9mmATdwzisIqCSZlFPbkFs9azdmM=",
            invoiceNumber: "PM-" + Date.now().toString().slice(-6),
            amount: 100.50,
            description: "Mobile Payment - Development mode"
          };
        }

        clientData.metadata = {
          source: params.mode,
          returnUrl: params.return_url,
          origin: params.origin,
          language: params.language,
          timestamp: new Date().toISOString()
        };

        setClientData(clientData);

        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'payment_iframe_loaded',
            status: 'ready',
            mode: params.mode,
            method: 'payment_mobile',
            origin: window.location.origin
          }, params.origin || '*');
        }

      } catch (error) {
        console.error('❌ Error loading parameters (Mobile Payment):', error);
        
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'payment_error',
            message: 'Error initializing mobile payment gateway'
          }, urlParams.origin || '*');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadParamsAndData();
  }, []);

  const handlePaymentSuccess = (result: any) => {
    console.log('✅ Mobile payment successful, notifying...', result);
    
    const messageData = {
      type: 'payment_success',
      paymentResult: {
        acquirer_reference: result.bank_response?.transaction_response?.payment_reference,
        transaction_id: result.bank_response?.transaction_response?.trx_internal_status,
        amount: result.bank_response?.transaction_response?.amount,
        currency: result.bank_response?.transaction_response?.currency,
        transaction_date: result.bank_response?.transaction_response?.processing_date,
        merchant_identify: result.bank_response?.merchant_identify,
        payment_method: 'payment_mobile',
        raw_response: result
      },
      metadata: {
        source: urlParams.mode,
        timestamp: new Date().toISOString()
      }
    };

    if (window.parent !== window) {
      window.parent.postMessage(messageData, urlParams.origin || '*');
    }

    if (urlParams.return_url) {
      const returnUrl = new URL(urlParams.return_url);
      returnUrl.searchParams.set('transaction_id', result.bank_response?.transaction_response?.payment_reference);
      returnUrl.searchParams.set('status', 'success');
      returnUrl.searchParams.set('method', 'payment_mobile');
      window.location.href = returnUrl.toString();
    }
  };

  const handlePaymentError = (message: string) => {
    console.error('❌ Error in mobile payment:', message);
    
    const errorData = {
      type: 'payment_error',
      message: message,
      metadata: {
        source: urlParams.mode,
        method: 'payment_mobile',
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
      returnUrl.searchParams.set('method', 'payment_mobile');
      window.location.href = returnUrl.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isEmbedded ? 'Initializing Mobile Payment...' : 'Loading Mobile Payment...'}
          </p>
          {urlParams.mode === 'odoo' && (
            <p className="text-sm text-gray-500 mt-2">Connecting with Odoo</p>
          )}
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
          <h3 className="text-lg font-bold mb-2">Configuration Error</h3>
          <p className="text-sm">Could not load mobile payment data</p>
          {!isEmbedded && (
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-screen flex items-center justify-center p-4`}>
      <PaymentMobilePayment 
        PaymentMobileClientData={clientData}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        embedded={isEmbedded}
        mode={urlParams.mode}
      />
    </div>
  );
}