'use client';
import { useEffect, useState } from 'react';
import TransferSearchComponent from '../../../../components/search/TransferSearchComponent';
import { TransferSearchRequest } from '../../../../lib/types/search-types';

// Interfaz para los parámetros de URL
interface UrlParams {
  data?: string;
  return_url?: string;
  origin?: string;
  mode?: 'odoo' | 'standalone';
  language?: string;
}

export default function TransferSearchPage() {
  const [searchData, setSearchData] = useState<TransferSearchRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [urlParams, setUrlParams] = useState<UrlParams>({});
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Detectar si está embebido en iframe
    setIsEmbedded(window.parent !== window);

    const loadParamsAndData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Extraer todos los parámetros de la URL
        const params: UrlParams = {
          data: urlParams.get('data') || undefined,
          return_url: urlParams.get('return_url') || undefined,
          origin: urlParams.get('origin') || undefined,
          mode: (urlParams.get('mode') as 'odoo' | 'standalone') || 'standalone',
          language: urlParams.get('language') || 'es'
        };

        setUrlParams(params);
        console.log('🔍 [TRANSFER_SEARCH] Parámetros de URL recibidos:', params);

        let requestData: TransferSearchRequest;

        if (params.data) {
          // Modo Odoo/ERP: datos desde URL parameters
          const decodedData = JSON.parse(atob(params.data)) as TransferSearchRequest;
          requestData = decodedData;
        } else {
          // Modo desarrollo/standalone: usar datos mock
          requestData = {
            encryptedClient: "pqk0J2fmE5V7ws0jgyGStsV8UIQWF/+O7ybM7873Vo6NH7kdaw8tH6n4kUF87q1k",
            encryptedMerchant: "9eCugut1AKH18YUMHSU82w==",
            encryptedKey: "AUk4GeJjEtd95rB87efAM8LdhFOopK7WXg91W6yybokbUcB81elxXQ3tFXsjwZVe",
            accountNumber: "01050054151054540721",
            issuerCustomerId: "V-17313258",
            trxDate: "2025-05-07",
            issuerBankId: 105,
            transactionType: 1,
            paymentReference: "0025502118655",
            amount: 4200.00
          };
        }

        // Agregar metadata
        const enhancedData: TransferSearchRequest = {
          ...requestData,
          metadata: {
            source: params.mode,
            returnUrl: params.return_url,
            origin: params.origin,
            language: params.language,
            timestamp: new Date().toISOString()
          }
        };

        setSearchData(enhancedData);

        // Notificar al parent que el iframe está listo
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'transfer_search_iframe_loaded',
            status: 'ready',
            mode: params.mode,
            origin: window.location.origin
          }, params.origin || '*');
        }

      } catch (error) {
        console.error('❌ [TRANSFER_SEARCH] Error cargando parámetros:', error);
        
        // Notificar error al parent
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'transfer_search_error',
            message: 'Error inicializando búsqueda de transferencias'
          }, urlParams.origin || '*');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadParamsAndData();
  }, []);

  const handleSearchSuccess = (result: any) => {
    console.log('✅ [TRANSFER_SEARCH] Búsqueda exitosa, notificando...', result);
    
    const messageData = {
      type: 'transfer_search_success',
      searchResult: result,
      metadata: {
        source: urlParams.mode,
        timestamp: new Date().toISOString()
      }
    };

    // Comunicarse con el parent (Odoo/ERP)
    if (window.parent !== window) {
      window.parent.postMessage(messageData, urlParams.origin || '*');
    }

    // Si hay return_url, redirigir
    if (urlParams.return_url) {
      const returnUrl = new URL(urlParams.return_url);
      returnUrl.searchParams.set('search_result', JSON.stringify(result));
      returnUrl.searchParams.set('status', 'success');
      window.location.href = returnUrl.toString();
    }
  };

  const handleSearchError = (message: string) => {
    console.error('❌ [TRANSFER_SEARCH] Error en búsqueda:', message);
    
    const errorData = {
      type: 'transfer_search_error',
      message: message,
      metadata: {
        source: urlParams.mode,
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
      window.location.href = returnUrl.toString();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isEmbedded ? 'Inicializando búsqueda de transferencias...' : 'Cargando...'}
          </p>
          {urlParams.mode === 'odoo' && (
            <p className="text-sm text-gray-500 mt-2">Conectando con Odoo</p>
          )}
        </div>
      </div>
    );
  }

  if (!searchData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">Error de configuración</h3>
          <p className="text-sm">No se pudieron cargar los datos de búsqueda</p>
          {!isEmbedded && (
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-screen flex items-center justify-center p-4`}>
      <TransferSearchComponent 
        searchData={searchData}
        onSuccess={handleSearchSuccess}
        onError={handleSearchError}
        embedded={isEmbedded}
        mode={urlParams.mode}
      />
    </div>
  );
}