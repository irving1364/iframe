'use client';
import { useEffect, useState } from 'react';
import { ClientData, PaymentRequest, PaymentResponse } from '../../lib/types';
import { PaymentApi } from '../../lib/api/api';
import CustomCreditCard from '../../components/ui/CustomCreditCard';
import ZinliCard from '../../components/ui/ZinliCard';

interface TdcPaymentProps {
  clientData: ClientData;
  onSuccess: (result: any) => void;
  onError: (message: string) => void;
  embedded?: boolean;
  mode?: 'odoo' | 'standalone';
}

type PaymentStatus = 'idle' | 'loading' | 'success' | 'error';
type IdType = 'V' | 'E' | 'J';

// Configuración de tipos de tarjeta
interface CardTypeConfig {
  name: string;
  pattern: RegExp;
  issuer: string;
}

export default function TdcPayment({ clientData, onSuccess, onError, embedded = false, mode = 'standalone' }: TdcPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [idType, setIdType] = useState<IdType>('V');
  const [idNumber, setIdNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(clientData.invoiceNumber || clientData.orderId || '');
  const [responseMessage, setResponseMessage] = useState('');
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [rawRequestData, setRawRequestData] = useState<any>(null);
  const [rawResponseData, setRawResponseData] = useState<any>(null);
  
  // Estados para react-credit-cards-2
  const [cardFocus, setCardFocus] = useState<'number' | 'name' | 'expiry' | 'cvc'>('number');
  const [cardName, setCardName] = useState('');
  const [detectedCardType, setDetectedCardType] = useState<string>('unknown');

  console.log('🔍 [RENDER] detectedCardType:', detectedCardType);
  console.log('🔍 [RENDER] cardNumber:', cardNumber);
  console.log('🔍 [RENDER] cardName:', cardName);

  // Configuración de tipos de tarjeta (incluyendo Zinli) - ORDEN CORREGIDO
  const cardTypes: Record<string, CardTypeConfig> = {
    // ZINLI PRIMERO - porque algunos BINs de Zinli empiezan con 4 y coincidirían con Visa
    zinli: {
      name: 'Zinli',
      pattern: /^(402251|402276|404599|405632|406136|408137)/,
      issuer: 'zinli'
    },
    // LUEGO LOS DEMÁS
    visa: {
      name: 'Visa',
      pattern: /^4/,
      issuer: 'visa'
    },
    mastercard: {
      name: 'Mastercard',
      pattern: /^(5[1-5]|2[2-7])/,
      issuer: 'mastercard'
    }
  };

  console.log('🔍 [CONFIG] cardTypes config loaded:', Object.keys(cardTypes));

  // Detectar tipo de tarjeta
  useEffect(() => {
    console.log('🔍 [USE_EFFECT] cardNumber changed:', cardNumber);
    const detected = detectCardType(cardNumber);
    console.log('🔍 [USE_EFFECT] detected card type:', detected);
    setDetectedCardType(detected);
  }, [cardNumber]);

  const detectCardType = (number: string): string => {
    console.log('🔍 [DETECT_CARD_TYPE] input number:', number);
    const cleanNumber = number.replace(/\s/g, '');
    console.log('🔍 [DETECT_CARD_TYPE] cleaned number:', cleanNumber);
    
    if (!cleanNumber) {
      console.log('🔍 [DETECT_CARD_TYPE] empty number, returning unknown');
      return 'unknown';
    }

    // Para debugging: mostrar qué BIN estamos probando
    const firstSix = cleanNumber.substring(0, 6);
    console.log('🔍 [DETECT_CARD_TYPE] first 6 digits:', firstSix);

    // Probar Zinli primero (más específico)
    console.log('🔍 [DETECT_CARD_TYPE] testing ZINLI first');
    const zinliMatch = cardTypes.zinli.pattern.test(cleanNumber);
    console.log('🔍 [DETECT_CARD_TYPE] ZINLI match result:', zinliMatch);
    
    if (zinliMatch) {
      console.log('🔍 [DETECT_CARD_TYPE] ZINLI MATCH FOUND!');
      return 'zinli';
    }

    // Luego probar los demás
    for (const [type, config] of Object.entries(cardTypes)) {
      if (type === 'zinli') continue; // Ya probamos Zinli
      
      console.log('🔍 [DETECT_CARD_TYPE] testing type:', type, 'pattern:', config.pattern);
      const isMatch = config.pattern.test(cleanNumber);
      console.log('🔍 [DETECT_CARD_TYPE]', type, 'match result:', isMatch);
      
      if (isMatch) {
        console.log('🔍 [DETECT_CARD_TYPE] MATCH FOUND:', type);
        return type;
      }
    }
    
    console.log('🔍 [DETECT_CARD_TYPE] no match found, returning unknown');
    return 'unknown';
  };

  const getIssuer = (): string => {
    const issuer = detectedCardType === 'unknown' ? '' : cardTypes[detectedCardType]?.issuer || '';
    console.log('🔍 [GET_ISSUER] detectedCardType:', detectedCardType, 'issuer:', issuer);
    return issuer;
  };

  // Extraer customerId existente si viene del clientData
  useEffect(() => {
    console.log('🔍 [USE_EFFECT] clientData.customerId:', clientData.customerId);
    if (clientData.customerId && typeof clientData.customerId === 'string') {
      const match = clientData.customerId.match(/^([VEJ])(\d+)$/);
      console.log('🔍 [USE_EFFECT] customerId match:', match);
      if (match) {
        setIdType(match[1] as IdType);
        setIdNumber(match[2]);
      } else {
        const numbersOnly = clientData.customerId.replace(/[^0-9]/g, '');
        setIdNumber(numbersOnly);
      }
    } else {
      setIdType('V');
      setIdNumber('');
    }
  }, [clientData.customerId]);

  // Funciones de formateo
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g);
    const result = groups ? groups.join(' ') : cleaned;
    console.log('🔍 [FORMAT_CARD_NUMBER] input:', value, 'output:', result);
    return result;
  };

  const formatExpirationDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    let result = cleaned;
    if (cleaned.length > 4) {
      result = cleaned.slice(0, 4) + '/' + cleaned.slice(4, 6);
    }
    console.log('🔍 [FORMAT_EXPIRATION_DATE] input:', value, 'output:', result);
    return result;
  };

  const formatDisplayExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let result = cleaned;
    if (cleaned.length >= 4) {
      result = cleaned.slice(0, 4) + '/' + cleaned.slice(4, 6);
    }
    console.log('🔍 [FORMAT_DISPLAY_EXPIRY] input:', value, 'output:', result);
    return result;
  };

  const convertToApiDateFormat = (displayDate: string): string => {
    const cleaned = displayDate.replace(/\D/g, '');
    let result = displayDate;
    if (cleaned.length === 6) {
      result = cleaned.slice(0, 4) + '/' + cleaned.slice(4);
    }
    console.log('🔍 [CONVERT_TO_API_DATE] input:', displayDate, 'output:', result);
    return result;
  };

  const buildCustomerId = (type: IdType, number: string): string => {
    const result = `${type}${number}`;
    console.log('🔍 [BUILD_CUSTOMER_ID] type:', type, 'number:', number, 'result:', result);
    return result;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 [HANDLE_PAYMENT] starting payment process');
    setPaymentStatus('loading');
    setResponseMessage('');
    setRawResponseData(null);

    try {
      if (!cardNumber || !cvv || !expirationDate || !idNumber || !invoiceNumber || !cardName) {
        console.log('🔍 [HANDLE_PAYMENT] validation failed - missing fields');
        throw new Error('Por favor complete todos los campos');
      }

      if (idNumber.length < 6 || idNumber.length > 10) {
        console.log('🔍 [HANDLE_PAYMENT] validation failed - invalid id length');
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
      }

      const apiExpirationDate = convertToApiDateFormat(expirationDate);
      
      if (!/^\d{4}\/\d{2}$/.test(apiExpirationDate)) {
        console.log('🔍 [HANDLE_PAYMENT] validation failed - invalid date format');
        throw new Error('Formato de fecha incorrecto. Use AAAA/MM (ej: 2027/10)');
      }

      const customerId = buildCustomerId(idType, idNumber);

      const paymentData: PaymentRequest = {
        encryptedClient: clientData.encryptedClient,
        encryptedMerchant: clientData.encryptedMerchant,
        encryptedKey: clientData.encryptedKey,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cvv: cvv.replace(/\s/g, ''),
        expirationDate: apiExpirationDate,
        customerId: customerId,
        invoiceNumber: invoiceNumber,
        amount: clientData.amount,
        paymentMethod: 'tdc'
      };

      console.log('🔍 [HANDLE_PAYMENT] payment data prepared:', {
        ...paymentData,
        cardNumber: `${paymentData.cardNumber.substring(0, 6)}...${paymentData.cardNumber.substring(12)}`
      });

      setRawRequestData(paymentData);
      const response: PaymentResponse = await PaymentApi.processPayment(paymentData);
      console.log('🔍 [HANDLE_PAYMENT] API response:', response);
      setRawResponseData(response);
      setPaymentStatus('success');
      setResponseMessage(response.message);
      
      setTimeout(() => {
        onSuccess(response);
      }, 2000);
      
    } catch (error) {
      console.error('🔍 [HANDLE_PAYMENT] error:', error);
      setPaymentStatus('error');
      setRawResponseData(error instanceof Error ? { error: error.message } : error);
      
      let errorMessage = 'Error procesando el pago';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('complete todos los campos')) {
          errorMessage = 'Por favor complete todos los campos requeridos';
        } else if (error.message.includes('Formato de fecha incorrecto')) {
          errorMessage = 'Formato de fecha incorrecto. Use AAAA/MM (ej: 2027/10)';
        } else if (error.message.includes('cédula debe tener')) {
          errorMessage = error.message;
        } else if (error.message.includes('Número de factura no disponible')) {
          errorMessage = 'Número de factura no disponible';
        }
      }
      
      setResponseMessage(errorMessage);
      console.error('❌ Error técnico completo:', error);
    }
  };

  const resetForm = () => {
    console.log('🔍 [RESET_FORM] resetting form');
    setPaymentStatus('idle');
    setResponseMessage('');
    setCardNumber('');
    setCvv('');
    setExpirationDate('');
    setIdType('V');
    setIdNumber('');
    setInvoiceNumber(clientData.invoiceNumber || clientData.orderId || '');
    setRawRequestData(null);
    setRawResponseData(null);
    setCardFocus('number');
    setCardName('');
  };

  const fillWithData = (testData: any) => {
    console.log('🔍 [FILL_WITH_DATA] filling with test data:', testData);
    setCardNumber(testData.cardNumber || '');
    setCvv(testData.cvv || '');
    setExpirationDate(testData.expirationDate?.replace(/\D/g, '') || '');
    setCardName(testData.cardName || 'TITULAR ZINLI');
    
    if (testData.customerId) {
      const match = testData.customerId.match(/^([VEJ])(\d+)$/);
      if (match) {
        setIdType(match[1] as IdType);
        setIdNumber(match[2]);
      }
    } else {
      setIdType(testData.idType || 'V');
      setIdNumber(testData.idNumber || '');
    }
    
    setInvoiceNumber(testData.invoiceNumber || clientData.invoiceNumber || clientData.orderId || '');
  };

  // Estado de éxito
  if (paymentStatus === 'success') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-600 mb-2">¡Pago Exitoso!</h3>
          <p className="text-gray-600 mb-4">{responseMessage}</p>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-green-800">
              Referencia: {invoiceNumber}
            </p>
            <p className="text-sm text-green-800">
              Cédula: {buildCustomerId(idType, idNumber)}
            </p>
            <p className="text-sm text-green-800">
              Monto: ${clientData.amount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Realizar otro pago
          </button>
        </div>

        {/* Panel de desarrollador en estado de éxito */}
        {showDevPanel && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold mb-2">📊 Respuesta del API:</h4>
            <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(rawResponseData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  console.log('🔍 [RENDER] Rendering main component, detectedCardType:', detectedCardType);
  console.log('🔍 [RENDER] Using ZinliCard?', detectedCardType === 'zinli');

  return (
    <div className={`mx-auto bg-white rounded-lg shadow-lg ${
      embedded ? 'w-full max-w-full p-3' : 'max-w-4xl p-6' }`}>
         
      {/* Header condicional para modo Odoo */}
     
      <h2 className={`font-bold mb-4 text-black text-center ${
        mode === 'odoo' ? 'text-lg' : 'text-xl' }`}>
        Pago con Tarjeta de Crédito
      </h2>
      
      {/* Botón para mostrar/ocultar panel de desarrollador */}
      <div className="mb-4 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowDevPanel(!showDevPanel)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-black"
        >
          {showDevPanel ? '👨‍💻 Ocultar Dev' : '👨‍💻 Mostrar Dev'}
        </button>
      </div>

      {/* Layout responsive */}
      <div className="space-y-6">
        
        {/* Información de la transacción - Siempre arriba */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800"> N° de Factura:</span>
            <span className="text-lg font-bold text-black">
              {invoiceNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">Monto a pagar:</span>
            <span className="text-lg font-bold text-black">
              ${clientData.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Contenido principal en columnas responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Columna 1: Tarjeta visual */}
          <div className="space-y-4">
            {/* Vista de la tarjeta */}
            <div className="flex justify-center">
              <div className="w-full max-w-[300px] relative">
                {detectedCardType === 'zinli' ? (
                  <ZinliCard
                    number={cardNumber}
                    name={cardName || "TITULAR DE LA TARJETA"}
                    expiry={expirationDate}
                    cvc={cvv}
                    focused={cardFocus}
                  />
                ) : (
                  <CustomCreditCard
                    number={cardNumber}
                    name={cardName || "TITULAR DE LA TARJETA"}
                    expiry={formatDisplayExpiry(expirationDate)}
                    cvc={cvv}
                    focused={cardFocus}
                    issuer={getIssuer()}
                  />
                )}
              </div>
            </div>

            {/* Indicador del tipo de tarjeta detectado */}
            {detectedCardType !== 'unknown' && (
              <div className="text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  detectedCardType === 'zinli' ? 'bg-purple-100 text-purple-800' :
                  detectedCardType === 'visa' ? 'bg-blue-100 text-blue-800' :
                  detectedCardType === 'mastercard' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {cardTypes[detectedCardType]?.name || 'Tarjeta'} detectada
                </span>
              </div>
            )}
          </div>

          {/* Columna 2: Formulario */}
          <div className="space-y-4">
            {/* Panel de desarrollador */}
            {showDevPanel && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-bold text-yellow-800 mb-2 text-sm">🧪 Panel de Desarrollo - DEBUG</h4>
                
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <h5 className="font-bold text-red-800 text-xs">🔍 DEBUG INFO:</h5>
                  <div className="text-xs space-y-1 text-gray-900">
                    <div>detectedCardType: <strong>{detectedCardType}</strong></div>
                    <div>cardNumber: {cardNumber || '---'}</div>
                    <div>Using Component: <strong>{detectedCardType === 'zinli' ? 'ZinliCard' : 'CustomCreditCard'}</strong></div>
                  </div>
                </div>

                {/* Datos de prueba rápidos */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-yellow-700 mb-1">Datos de prueba:</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fillWithData({
                        cardNumber: '4110960300817842',
                        cvv: '330',
                        expirationDate: '202710',
                        cardName: 'TITULAR VISA',
                        idType: 'V',
                        idNumber: '8019884',
                        invoiceNumber: 'VISA-' + Date.now().toString().slice(-6)
                      })}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Visa Test
                    </button>
                    <button
                      type="button"
                      onClick={() => fillWithData({
                        cardNumber: '4022760000000001',
                        cvv: '123',
                        expirationDate: '202710',
                        cardName: 'TITULAR ZINLI',
                        idType: 'V',
                        idNumber: '12345678',
                        invoiceNumber: 'ZINLI-' + Date.now().toString().slice(-6)
                      })}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded"
                    >
                      Zinli Test
                    </button>
                    <button
                      type="button"
                      onClick={() => fillWithData({
                        cardNumber: '5112345678901234',
                        cvv: '456',
                        expirationDate: '202512',
                        cardName: 'TITULAR MASTERCARD',
                        idType: 'V',
                        idNumber: '87654321',
                        invoiceNumber: 'MC-' + Date.now().toString().slice(-6)
                      })}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Mastercard Test
                    </button>
                    <button
                      type="button"
                      onClick={() => fillWithData({
                        cardNumber: '',
                        cvv: '',
                        expirationDate: '',
                        cardName: '',
                        idType: 'V',
                        idNumber: '',
                        invoiceNumber: clientData.invoiceNumber || clientData.orderId || ''
                      })}
                      className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Datos actuales del formulario */}
                <div className="mb-2">
                  <label className="block text-sm font-medium text-yellow-700 mb-1">Datos actuales:</label>
                  <div className="text-xs space-y-1 text-gray-900">
                    <div>Factura: {invoiceNumber || '---'}</div>
                    <div>Tarjeta: {cardNumber || '---'}</div>
                    <div>CVV: {cvv || '---'} | Expira: {expirationDate || '---'}</div>
                    <div>Nombre: {cardName || '---'}</div>
                    <div>Cédula: {idType}-{idNumber || '---'}</div>
                    <div>Customer ID (API): {buildCustomerId(idType, idNumber) || '---'}</div>
                    <div>Tipo detectado: {cardTypes[detectedCardType]?.name || '---'}</div>
                    <div>Issuer: {getIssuer() || '---'}</div>
                  </div>
                </div>

                {/* Request/Response anteriores */}
                {rawRequestData && (
                  <div className="mt-2">
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-yellow-700">
                        Último Request ↆ
                      </summary>
                      <pre className="text-xs bg-black text-green-400 p-2 rounded mt-1 overflow-auto max-h-32">
                        {JSON.stringify(rawRequestData, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje de error */}
            {paymentStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-red-800 font-medium">Error en el pago</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{responseMessage}</p>
                <button
                  onClick={() => setPaymentStatus('idle')}
                  className="text-red-600 hover:text-red-800 text-sm underline mt-2"
                >
                  Intentar nuevamente
                </button>
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-3">
                {/* Nombre del titular */}
                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-1">
                    Nombre del Titular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    onFocus={() => setCardFocus('name')}
                    placeholder="JUAN PEREZ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 uppercase text-sm"
                    required
                    disabled={paymentStatus === 'loading'}
                  />
                </div>

                {/* Número de tarjeta */}
                <div>
                  <label className="block text-gray-900 text-sm font-medium mb-1">
                    Número de Tarjeta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formatCardNumber(cardNumber)}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setCardFocus('number')}
                    placeholder="4110 9603 0081 7842"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900 text-sm"
                    required
                    maxLength={19}
                    disabled={paymentStatus === 'loading'}
                  />
                </div>
                
                {/* CVV y Fecha en grid responsive */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-900 font-medium mb-1">
                      CVV <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      onFocus={() => setCardFocus('cvc')}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900 text-sm"
                      required
                      maxLength={3}
                      disabled={paymentStatus === 'loading'}
                    />
                    <p className="text-xs text-gray-500 mt-1">3 dígitos</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900">
                      Fecha Expiración <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formatExpirationDate(expirationDate)}
                      onChange={(e) => setExpirationDate(e.target.value.replace(/\D/g, ''))}
                      onFocus={() => setCardFocus('expiry')}
                      placeholder="2025/10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900 text-sm"
                      required
                      maxLength={7}
                      disabled={paymentStatus === 'loading'}
                    />
                    <p className="text-xs text-gray-500 mt-1">Formato: AAAA/MM</p>
                  </div>
                </div>
                
                {/* Campo de Cédula */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">
                    Cédula <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value as IdType)}
                      className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm"
                      disabled={paymentStatus === 'loading'}
                    >
                      <option value="V">V</option>
                      <option value="E">E</option>
                      <option value="J">J</option>
                    </select>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="12345678"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900 text-sm"
                      required
                      maxLength={10}
                      disabled={paymentStatus === 'loading'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Entre 6 y 10 dígitos</p>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={paymentStatus === 'loading'}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium text-sm"
              >
                {paymentStatus === 'loading' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando Pago...
                  </div>
                ) : (
                  'Realizar Pago'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}