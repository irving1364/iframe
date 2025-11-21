'use client';
import { useEffect, useState } from 'react';
import { PaymentMobileClientData, PaymentMobileAuthRequest, PaymentMobileAuthResponse, PaymentMobilePaymentRequest, PaymentMobilePaymentResponse } from '../../lib/types/payment-mobile';
import { PaymentMobileApi } from '../../lib/api/payment-mobile-api';

interface PaymentMobilePaymentProps {
  PaymentMobileClientData: PaymentMobileClientData;
  onSuccess: (result: any) => void;
  onError: (message: string) => void;
  embedded?: boolean;
  mode?: 'odoo' | 'standalone';
}

type PaymentStatus = 'idle' | 'requesting_code' | 'processing_payment' | 'success' | 'error';
type IdType = 'V' | 'E' | 'J';

export default function PaymentMobilePayment({ PaymentMobileClientData, onSuccess, onError, embedded = false, mode = 'standalone' }: PaymentMobilePaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [idType, setIdType] = useState<IdType>('V');
  const [idNumber, setIdNumber] = useState('');
  const [countryCode, setCountryCode] = useState('58');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [originCountryCode, setOriginCountryCode] = useState('58');
  const [originPhoneNumber, setOriginPhoneNumber] = useState('');
  const [twofactorAuth, setTwofactorAuth] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(PaymentMobileClientData.invoiceNumber || PaymentMobileClientData.orderId || '');
  const [responseMessage, setResponseMessage] = useState('');
  const [showRequestCode, setShowRequestCode] = useState(false);
  const [codeRequestStatus, setCodeRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [codeRequestMessage, setCodeRequestMessage] = useState('');

  // Formateadores
  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const buildDestinationId = (type: IdType, number: string): string => {
    return `${type}${number}`;
  };

  const buildPhoneNumber = (countryCode: string, number: string): string => {
    return `${countryCode}${number}`;
  };

  // Solicitar código de pago (opcional)
  const requestPaymentCode = async () => {
    setCodeRequestStatus('loading');
    setCodeRequestMessage('');

    try {
      // Validaciones
      if (!idNumber || !phoneNumber) {
        throw new Error('Por favor complete la cédula y teléfono del destinatario');
      }

      if (idNumber.length < 6 || idNumber.length > 10) {
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
      }

      if (phoneNumber.length !== 10) {
        throw new Error('El número telefónico debe tener 10 dígitos');
      }

      const authData: PaymentMobileAuthRequest = {
        encryptedClient: PaymentMobileClientData.encryptedClient,
        encryptedMerchant: PaymentMobileClientData.encryptedMerchant,
        encryptedKey: PaymentMobileClientData.encryptedKey,
        destinationId: buildDestinationId(idType, idNumber),
        destinationMobile: buildPhoneNumber(countryCode, phoneNumber)
      };

      console.log('📱 Solicitando código Pago Móvil:', authData);
      
      const response: PaymentMobileAuthResponse = await PaymentMobileApi.requestAuth(authData);
      
      if (response.status === 'success') {
        setCodeRequestStatus('success');
        setCodeRequestMessage('✓ Código enviado exitosamente. Revise su teléfono.');
        setShowRequestCode(false);
      } else {
        throw new Error(response.message || 'Error solicitando código de pago');
      }

    } catch (error) {
      setCodeRequestStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Error solicitando código de pago';
      setCodeRequestMessage(errorMessage);
      console.error('❌ Error solicitando código:', error);
    }
  };

  // Procesar pago completo
  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('processing_payment');
    setResponseMessage('');

    try {
      // Validaciones completas
      if (!idNumber || !phoneNumber || !originPhoneNumber || !twofactorAuth || !invoiceNumber) {
        throw new Error('Por favor complete todos los campos requeridos');
      }

      if (idNumber.length < 6 || idNumber.length > 10) {
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
      }

      if (phoneNumber.length !== 10) {
        throw new Error('El número del destinatario debe tener 10 dígitos');
      }

      if (originPhoneNumber.length !== 10) {
        throw new Error('Su número telefónico debe tener 10 dígitos');
      }

      if (twofactorAuth.length !== 8) {
        throw new Error('El código de verificación debe tener 8 dígitos');
      }
      
      const paymentData: PaymentMobilePaymentRequest = {
        encryptedClient: PaymentMobileClientData.encryptedClient,
        encryptedMerchant: PaymentMobileClientData.encryptedMerchant,
        encryptedKey: PaymentMobileClientData.encryptedKey,
        destinationId: buildDestinationId(idType, idNumber),
        destinationMobile: buildPhoneNumber(countryCode, phoneNumber),
        originMobile: buildPhoneNumber(originCountryCode, originPhoneNumber),
        amount: PaymentMobileClientData.amount,
        invoiceNumber: invoiceNumber,
        twofactorAuth: twofactorAuth
      };

      console.log('📱 Procesando pago móvil:', paymentData);
      
      const response: PaymentMobilePaymentResponse = await PaymentMobileApi.confirmPayment(paymentData);
      
      if (response.status === 'success') {
        setPaymentStatus('success');
        setResponseMessage(response.message);
        
        setTimeout(() => {
          onSuccess(response);
        }, 2000);
      } else {
        throw new Error(response.message || 'Error procesando el pago');
      }

    } catch (error) {
      setPaymentStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Error procesando el pago';
      setResponseMessage(errorMessage);
      console.error('❌ Error procesando pago:', error);
    }
  };

  const resetForm = () => {
    setPaymentStatus('idle');
    setResponseMessage('');
    setIdType('V');
    setIdNumber('');
    setCountryCode('58');
    setPhoneNumber('');
    setOriginCountryCode('58');
    setOriginPhoneNumber('');
    setTwofactorAuth('');
    setShowRequestCode(false);
    setCodeRequestStatus('idle');
    setCodeRequestMessage('');
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
              Destino: {buildDestinationId(idType, idNumber)}
            </p>
            <p className="text-sm text-green-800">
              Teléfono: {buildPhoneNumber(countryCode, phoneNumber)}
            </p>
            <p className="text-sm text-green-800">
              Monto: ${PaymentMobileClientData.amount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Realizar otro pago
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto p-6 bg-white rounded-lg shadow-lg ${
      embedded ? 'w-full max-w-full' : 'max-w-md'
    }`}>
      
      {mode === 'odoo' && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="text-blue-800 font-medium">Pago Móvil seguro a través de Odoo</span>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-black">Pago Móvil</h2>

      {/* Información de la transacción */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="mb-3">
          <label className="block text-sm font-medium text-blue-800 mb-1">
            N° de Factura <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Ingrese el número de factura"
            className="w-full px-3 py-2 text-gray-900 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            disabled={paymentStatus === 'processing_payment'}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-800">Monto a pagar:</span>
          <span className="text-lg font-bold text-green-600">
            ${PaymentMobileClientData.amount.toFixed(2)}
          </span>
        </div>
      </div>

      <form onSubmit={processPayment}>
        {/* Información del Destinatario */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Información del Destinatario</h3>
          
          {/* Cédula del destinatario */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Cédula <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as IdType)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                disabled={paymentStatus === 'processing_payment'}
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                required
                maxLength={10}
                disabled={paymentStatus === 'processing_payment'}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Entre 6 y 10 dígitos</p>
          </div>

          {/* Teléfono del destinatario */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Teléfono del Destinatario <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                disabled={paymentStatus === 'processing_payment'}
              >
                <option value="58">+58</option>
                <option value="1">+1</option>
              </select>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="4123456789"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                required
                maxLength={10}
                disabled={paymentStatus === 'processing_payment'}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">10 dígitos sin formato</p>
          </div>

          {/* Botón para solicitar código (opcional) */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setShowRequestCode(!showRequestCode)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showRequestCode ? 'Cancelar solicitud' : '¿No tienes código? Solicítalo aquí'}
            </button>
          </div>

          {/* Panel para solicitar código */}
          {showRequestCode && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">Solicitar Código de Pago</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Se enviará un código de 8 dígitos al teléfono del destinatario.
              </p>
              
              <button
                type="button"
                onClick={requestPaymentCode}
                disabled={codeRequestStatus === 'loading' || !idNumber || !phoneNumber}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:bg-yellow-300 transition-colors font-medium"
              >
                {codeRequestStatus === 'loading' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Solicitando...
                  </div>
                ) : (
                  'Solicitar Código'
                )}
              </button>

              {/* Mensaje de estado de solicitud */}
              {codeRequestMessage && (
                <div className={`mt-3 p-2 rounded text-sm ${
                  codeRequestStatus === 'success' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {codeRequestMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información del Remitente */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">Su Información</h3>
          
          {/* Teléfono de origen */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Su número telefónico <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={originCountryCode}
                onChange={(e) => setOriginCountryCode(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                disabled={paymentStatus === 'processing_payment'}
              >
                <option value="58">+58</option>
                <option value="1">+1</option>
              </select>
              <input
                type="text"
                value={originPhoneNumber}
                onChange={(e) => setOriginPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="4123456789"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                required
                maxLength={10}
                disabled={paymentStatus === 'processing_payment'}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">10 dígitos sin formato</p>
          </div>

          {/* Código de verificación */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Código de verificación <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={twofactorAuth}
              onChange={(e) => setTwofactorAuth(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="Ingrese el código de 8 dígitos"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900 text-center text-lg"
              required
              maxLength={8}
              disabled={paymentStatus === 'processing_payment'}
            />
            <p className="text-xs text-gray-500 mt-1">
              Código de 8 dígitos. Si no lo tienes, solicítalo arriba.
            </p>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={paymentStatus === 'processing_payment'}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
        >
          {paymentStatus === 'processing_payment' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Procesando Pago...
            </div>
          ) : (
            'Realizar Pago'
          )}
        </button>
      </form>

      {/* Mensaje de error general */}
      {paymentStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-red-800 font-medium">Error en el pago</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{responseMessage}</p>
        </div>
      )}
    </div>
  );
}