'use client';
import { useState } from 'react';
import { TransferSearchRequest, TransferSearchResponse } from '../../lib/types/search-types';
import { SearchApi } from '../../lib/api/search-api';
import { venezuelanBanks } from '../../lib/data/banks-data';

interface TransferSearchProps {
  searchData: TransferSearchRequest;
  onSuccess: (result: any) => void;
  onError: (message: string) => void;
  embedded?: boolean;
  mode?: 'odoo' | 'standalone';
}

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

export default function TransferSearchComponent({ 
  searchData, 
  onSuccess, 
  onError, 
  embedded = false, 
  mode = 'standalone' 
}: TransferSearchProps) {
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [accountNumber, setAccountNumber] = useState(searchData.accountNumber || '');
  const [issuerCustomerId, setIssuerCustomerId] = useState(searchData.issuerCustomerId || '');
  const [trxDate, setTrxDate] = useState(searchData.trxDate || '');
  const [issuerBankId, setIssuerBankId] = useState<number>(searchData.issuerBankId || 105);
  const [paymentReference, setPaymentReference] = useState(searchData.paymentReference || '');
  const [amount, setAmount] = useState<number>(searchData.amount || 0);
  const [responseMessage, setResponseMessage] = useState('');
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [rawRequestData, setRawRequestData] = useState<any>(null);
  const [rawResponseData, setRawResponseData] = useState<any>(null);

  // Separar issuerCustomerId en tipo y número
  const [idType, setIdType] = useState<'V' | 'E' | 'J'>('V');
  const [idNumber, setIdNumber] = useState('');

  // Inicializar datos del formulario
  useState(() => {
    if (searchData.issuerCustomerId) {
      const match = searchData.issuerCustomerId.match(/^([VEJ])-?(\d+)$/);
      if (match) {
        setIdType(match[1] as 'V' | 'E' | 'J');
        setIdNumber(match[2]);
      }
    }
  });

  const buildIssuerCustomerId = (type: string, number: string): string => {
    return `${type}-${number}`;
  };

  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 [TRANSFER_SEARCH] Iniciando búsqueda...');
    setSearchStatus('loading');
    setResponseMessage('');

    try {
        // Validaciones
        if (!accountNumber || !idNumber || !trxDate || !paymentReference || amount <= 0) {
        throw new Error('Por favor complete todos los campos requeridos');
        }

        if (idNumber.length < 6 || idNumber.length > 10) {
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
        }

        const customerId = buildIssuerCustomerId(idType, idNumber);

        const searchRequest: TransferSearchRequest = {
        encryptedClient: searchData.encryptedClient,
        encryptedMerchant: searchData.encryptedMerchant,
        encryptedKey: searchData.encryptedKey,
        accountNumber: accountNumber.replace(/\s/g, ''),
        issuerCustomerId: customerId,
        trxDate: trxDate,
        issuerBankId: issuerBankId,
        transactionType: 1,
        paymentReference: paymentReference,
        amount: amount,
        metadata: searchData.metadata
        };

        console.log('🔍 [TRANSFER_SEARCH] Datos de búsqueda:', searchRequest);
        setRawRequestData(searchRequest);

        const response = await SearchApi.searchTransfer(searchRequest);
        console.log('🔍 [TRANSFER_SEARCH] Respuesta del API:', response);
        setRawResponseData(response);

        // ✅ CORRECCIÓN: Usar la estructura REAL de la respuesta
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
        // No llamar onError para respuestas "no encontrado"
        }

    } catch (error) {
        console.error('❌ [TRANSFER_SEARCH] Error real:', error);
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
    setAccountNumber('01050054151054540721');
    setIdType('V');
    setIdNumber('17313258');
    setTrxDate('2025-05-07');
    setIssuerBankId(105);
    setPaymentReference('0025502118655');
    setAmount(4200.00);
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
            <h4 className="font-semibold text-green-800 mb-2">Detalles de la búsqueda:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-green-700">Referencia:</div>
              <div className="text-green-900 font-medium">{paymentReference}</div>
              
              <div className="text-green-700">Cuenta:</div>
              <div className="text-green-900 font-medium">{accountNumber}</div>
              
              <div className="text-green-700">Cédula:</div>
              <div className="text-green-900 font-medium">{buildIssuerCustomerId(idType, idNumber)}</div>
              
              <div className="text-green-700">Monto:</div>
              <div className="text-green-900 font-medium">${amount.toFixed(2)}</div>
              
              <div className="text-green-700">Fecha:</div>
              <div className="text-green-900 font-medium">{trxDate}</div>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
      embedded ? 'w-full max-w-full p-3' : 'max-w-4xl p-6'
    }`}>
      
      <h2 className={`font-bold mb-6 text-black text-center ${
        mode === 'odoo' ? 'text-lg' : 'text-2xl'
      }`}>
        🔍 Búsqueda de Transferencias
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
          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
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
            <div><strong>API:</strong> SearchApi.searchTransfer</div>
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

      {/* Mensaje de error - diferenciar entre "no encontrado" y "error real" */}
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
                ? 'Transferencia no encontrada' 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Columna 1 */}
          <div className="space-y-4">
            {/* Número de Cuenta */}
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-1">
                Número de Cuenta <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="01050054151054540721"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                required
                disabled={searchStatus === 'loading'}
              />
            </div>

            {/* Banco Emisor */}
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-1">
                Banco Emisor <span className="text-red-500">*</span>
              </label>
              <select
                value={issuerBankId}
                onChange={(e) => setIssuerBankId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                required
                disabled={searchStatus === 'loading'}
              >
                {venezuelanBanks.map((bank) => (
                  <option key={bank.code} value={parseInt(bank.code)}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Referencia de Pago */}
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-1">
                Referencia de Pago <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="0025502118655"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                required
                disabled={searchStatus === 'loading'}
              />
            </div>
          </div>

          {/* Columna 2 */}
          <div className="space-y-4">
            {/* Cédula */}
            <div>
              <label className="block text-gray-900 text-sm font-medium mb-1">
                Cédula <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as 'V' | 'E' | 'J')}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  disabled={searchStatus === 'loading'}
                >
                  <option value="V">V</option>
                  <option value="E">E</option>
                  <option value="J">J</option>
                </select>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="17313258"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                  required
                  maxLength={10}
                  disabled={searchStatus === 'loading'}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Entre 6 y 10 dígitos</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
                disabled={searchStatus === 'loading'}
              />
            </div>

            {/* Monto */}
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
                placeholder="4200.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
                disabled={searchStatus === 'loading'}
              />
            </div>
          </div>
        </div>

        {/* Botón de búsqueda */}
        <button 
          type="submit" 
          disabled={searchStatus === 'loading'}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
        >
          {searchStatus === 'loading' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Buscando Transferencia...
            </div>
          ) : (
            '🔍 Buscar Transferencia'
          )}
        </button>
      </form>
    </div>
  );
}