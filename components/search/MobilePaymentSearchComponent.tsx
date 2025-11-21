'use client';
import { useState } from 'react';
import { MobilePaymentSearchRequest, MobilePaymentSearchResponse } from '../../lib/types/search-types';
import { SearchApi } from '../../lib/api/search-api';

interface MobilePaymentSearchProps {
  searchData: MobilePaymentSearchRequest;
  onSuccess: (result: any) => void;
  onError: (message: string) => void;
  embedded?: boolean;
  mode?: 'odoo' | 'standalone';
}

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

export default function MobilePaymentSearchComponent({ 
  searchData, 
  onSuccess, 
  onError, 
  embedded = false, 
  mode = 'standalone' 
}: MobilePaymentSearchProps) {
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [amount, setAmount] = useState<number>(searchData.amount || 0);
  const [currency, setCurrency] = useState<string>(searchData.currency || 'ves');
  const [originMobileNumber, setOriginMobileNumber] = useState(searchData.originMobileNumber || '');
  const [destinationMobileNumber, setDestinationMobileNumber] = useState(searchData.destinationMobileNumber || '');
  const [paymentReference, setPaymentReference] = useState(searchData.paymentReference || '');
  const [trxDate, setTrxDate] = useState(searchData.trxDate || '');
  const [responseMessage, setResponseMessage] = useState('');
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [rawRequestData, setRawRequestData] = useState<any>(null);
  const [rawResponseData, setRawResponseData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📱 [MOBILE_PAYMENT_SEARCH] Iniciando búsqueda...');
    setSearchStatus('loading');
    setResponseMessage('');

    try {
      // Validaciones
      if (!amount || !originMobileNumber || !destinationMobileNumber || !paymentReference || !trxDate) {
        throw new Error('Por favor complete todos los campos requeridos');
      }

      // Validar formato de números móviles (opcional)
      const phoneRegex = /^58\d{10}$/;
      if (!phoneRegex.test(originMobileNumber)) {
        throw new Error('Número móvil de origen debe tener formato 58XXXXXXXXXX');
      }
      if (!phoneRegex.test(destinationMobileNumber)) {
        throw new Error('Número móvil de destino debe tener formato 58XXXXXXXXXX');
      }

      const searchRequest: MobilePaymentSearchRequest = {
        encryptedClient: searchData.encryptedClient,
        encryptedMerchant: searchData.encryptedMerchant,
        encryptedKey: searchData.encryptedKey,
        amount: amount,
        currency: currency,
        originMobileNumber: originMobileNumber,
        destinationMobileNumber: destinationMobileNumber,
        paymentReference: paymentReference,
        trxDate: trxDate,
        metadata: searchData.metadata
      };

      console.log('📱 [MOBILE_PAYMENT_SEARCH] Datos de búsqueda:', searchRequest);
      setRawRequestData(searchRequest);

      const response: MobilePaymentSearchResponse = await SearchApi.searchMobilePayment(searchRequest);
      console.log('📱 [MOBILE_PAYMENT_SEARCH] Respuesta del API:', response);
      setRawResponseData(response);

      // Usar la estructura real de la respuesta
      const isSuccess = response.status === 'success';
      
      if (isSuccess) {
        setSearchStatus('success');
        setResponseMessage(response.message);
        setTimeout(() => {
          onSuccess(response);
        }, 2000);
      } else {
        setSearchStatus('error');
        setResponseMessage(response.message);
      }

    } catch (error) {
      console.error('❌ [MOBILE_PAYMENT_SEARCH] Error:', error);
      setSearchStatus('error');
      
      let errorMessage = 'Error realizando la búsqueda';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setResponseMessage(errorMessage);
      onError(errorMessage);
    }
  };

  const resetForm = () => {
    setSearchStatus('idle');
    setResponseMessage('');
    setRawRequestData(null);
    setRawResponseData(null);
  };

  const fillWithTestData = () => {
    setAmount(710.00);
    setCurrency('ves');
    setOriginMobileNumber('584142591177');
    setDestinationMobileNumber('584241513063');
    setPaymentReference('023189');
    setTrxDate('2025-06-10');
  };

  // Función para formatear número de teléfono
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('58')) {
      return cleaned;
    }
    return `58${cleaned}`;
  };

  // Estado de éxito
  if (searchStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-600 mb-2">¡Búsqueda Exitosa!</h3>
          <p className="text-gray-600 mb-4">{responseMessage}</p>
          
          <div className="bg-green-50 p-4 rounded-lg mb-4 text-left">
            <h4 className="font-semibold text-green-800 mb-2">Detalles del Pago Móvil:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-green-700">Referencia:</div>
              <div className="text-green-900 font-medium">{paymentReference}</div>
              
              <div className="text-green-700">Monto:</div>
              <div className="text-green-900 font-medium">${amount.toFixed(2)} {currency.toUpperCase()}</div>
              
              <div className="text-green-700">Origen:</div>
              <div className="text-green-900 font-medium">{originMobileNumber}</div>
              
              <div className="text-green-700">Destino:</div>
              <div className="text-green-900 font-medium">{destinationMobileNumber}</div>
              
              <div className="text-green-700">Fecha:</div>
              <div className="text-green-900 font-medium">{trxDate}</div>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Nueva Búsqueda
          </button>
        </div>

        {/* Panel de desarrollador */}
        {showDevPanel && rawResponseData && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold mb-2 text-sm">📊 Respuesta del API:</h4>
            <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(rawResponseData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`mx-auto bg-white rounded-lg shadow-lg ${
      embedded ? 'w-full max-w-full p-3' : 'max-w-2xl p-6'
    }`}>
      
      <h2 className={`font-bold mb-6 text-black text-center ${
        mode === 'odoo' ? 'text-lg' : 'text-2xl'
      }`}>
        📱 Búsqueda de Pagos Móviles
      </h2>

      {/* Botón para panel de desarrollo */}
      <div className="mb-4 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowDevPanel(!showDevPanel)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-black"
        >
          {showDevPanel ? '👨‍💻 Ocultar Dev' : '👨‍💻 Mostrar Dev'}
        </button>
        
        <button
          type="button"
          onClick={fillWithTestData}
          className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded"
        >
          🧪 Datos de Prueba
        </button>
      </div>

      {/* Panel de desarrollador */}
      {showDevPanel && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2 text-sm">🧪 Panel de Desarrollo</h4>
          <div className="text-xs space-y-1 text-gray-900">
            <div><strong>Credenciales cargadas:</strong> ✓</div>
            <div><strong>Modo:</strong> {mode}</div>
            <div><strong>Embedded:</strong> {embedded ? 'Sí' : 'No'}</div>
            <div><strong>API:</strong> SearchApi.searchMobilePayment</div>
          </div>
          
          {rawRequestData && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-yellow-700">
                Último Request ↆ
              </summary>
              <pre className="text-xs bg-black text-green-400 p-2 rounded mt-1 overflow-auto max-h-32">
                {JSON.stringify(rawRequestData, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Mensaje de error */}
      {searchStatus === 'error' && (
        <div className={`mb-6 p-3 rounded-lg ${
          responseMessage.includes('No hay transacciones') || 
          responseMessage.includes('no encontrada') || 
          responseMessage.includes('No se encontró')
            ? 'bg-yellow-50 border border-yellow-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {responseMessage.includes('No hay transacciones') || 
             responseMessage.includes('no encontrada') || 
             responseMessage.includes('No se encontró') ? (
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            )}
            <span className={
              responseMessage.includes('No hay transacciones') || 
              responseMessage.includes('no encontrada') || 
              responseMessage.includes('No se encontró')
                ? 'text-yellow-800 font-medium' 
                : 'text-red-800 font-medium'
            }>
              {responseMessage.includes('No hay transacciones') || 
               responseMessage.includes('no encontrada') || 
               responseMessage.includes('No se encontró')
                ? 'Pago móvil no encontrado' 
                : 'Error en la búsqueda'}
            </span>
          </div>
          <p className={
            responseMessage.includes('No hay transacciones') || 
            responseMessage.includes('no encontrada') || 
            responseMessage.includes('No se encontró')
              ? 'text-yellow-600 text-sm mt-1' 
              : 'text-red-600 text-sm mt-1'
          }>
            {responseMessage}
          </p>
          <button
            onClick={() => setSearchStatus('idle')}
            className={
              responseMessage.includes('No hay transacciones') || 
              responseMessage.includes('no encontrada') || 
              responseMessage.includes('No se encontró')
                ? 'text-yellow-600 hover:text-yellow-800 text-sm underline mt-2' 
                : 'text-red-600 hover:text-red-800 text-sm underline mt-2'
            }
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      <form onSubmit={handleSearch} className="space-y-6">
        <div className="space-y-4">
          {/* Referencia de Pago */}
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-1">
              Referencia de Pago <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="023189"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-gray-900"
              required
              disabled={searchStatus === 'loading'}
            />
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-1">
                Monto <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                placeholder="710.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                required
                disabled={searchStatus === 'loading'}
              />
            </div>
            
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-1">
                Moneda <span className="text-red-500">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                required
                disabled={searchStatus === 'loading'}
              >
                <option value="ves">VES</option>
                <option value="usd">USD</option>
              </select>
            </div>
          </div>

          {/* Números móviles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-1">
                Teléfono Origen <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={originMobileNumber}
                onChange={(e) => setOriginMobileNumber(formatPhoneNumber(e.target.value))}
                placeholder="584142591177"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-gray-900"
                required
                maxLength={12}
                disabled={searchStatus === 'loading'}
              />
              <p className="text-xs text-gray-500 mt-1">Formato: 58XXXXXXXXXX</p>
            </div>
            
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-1">
                Teléfono Destino <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={destinationMobileNumber}
                onChange={(e) => setDestinationMobileNumber(formatPhoneNumber(e.target.value))}
                placeholder="584241513063"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-gray-900"
                required
                maxLength={12}
                disabled={searchStatus === 'loading'}
              />
              <p className="text-xs text-gray-500 mt-1">Formato: 58XXXXXXXXXX</p>
            </div>
          </div>

          {/* Fecha de Transacción */}
          <div>
            <label className="block text-gray-900 text-sm font-medium mb-1">
              Fecha de Transacción <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={trxDate}
              onChange={(e) => setTrxDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
              required
              disabled={searchStatus === 'loading'}
            />
          </div>
        </div>

        {/* Botón de búsqueda */}
        <button 
          type="submit" 
          disabled={searchStatus === 'loading'}
          className="w-full px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 transition-colors font-medium"
        >
          {searchStatus === 'loading' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Buscando Pago Móvil...
            </div>
          ) : (
            '📱 Buscar Pago Móvil'
          )}
        </button>
      </form>
    </div>
  );
}