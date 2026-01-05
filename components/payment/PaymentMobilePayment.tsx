'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentMobileClientData, PaymentMobileAuthRequest, PaymentMobileAuthResponse, PaymentMobilePaymentRequest, PaymentMobilePaymentResponse } from '../../lib/types/payment-mobile';
import { PaymentMobileApi } from '../../lib/api/payment-mobile-api';
import GradientLogoSpinner from '../../components/ui/GradientLogoSpinner';

interface PaymentMobilePaymentProps {
  PaymentMobileClientData: PaymentMobileClientData;
  onSuccess: (result: any) => void;
  onError: (message: string) => void;
  embedded?: boolean;
  mode?: 'odoo' | 'standalone';
}

type PaymentStatus = 'idle' | 'requesting_code' | 'processing_payment' | 'success' | 'error';
type IdType = 'V' | 'E' | 'J';

// Animaciones con Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5
    }
  },
  idle: {
    x: 0
  }
};

export default function PaymentMobilePayment({ 
  PaymentMobileClientData, 
  onSuccess, 
  onError, 
  embedded = false, 
  mode = 'standalone' 
}: PaymentMobilePaymentProps) {
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
  const [shake, setShake] = useState(false);

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

  const triggerErrorAnimation = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Solicitar código de pago (opcional)
  const requestPaymentCode = async () => {
    setCodeRequestStatus('loading');
    setCodeRequestMessage('');

    try {
      if (!idNumber || !phoneNumber) {
        triggerErrorAnimation();
        throw new Error('Por favor complete la cédula y teléfono del destinatario');
      }

      if (idNumber.length < 6 || idNumber.length > 10) {
        triggerErrorAnimation();
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
      }
      
      if (phoneNumber.length !== 10) {
        triggerErrorAnimation();
        throw new Error('El número telefónico debe tener 10 dígitos');
      }

      const authData: PaymentMobileAuthRequest = {
        encryptedClient: PaymentMobileClientData.encryptedClient,
        encryptedMerchant: PaymentMobileClientData.encryptedMerchant,
        encryptedKey: PaymentMobileClientData.encryptedKey,
        destinationId: buildDestinationId(idType, idNumber),
        destinationMobile: buildPhoneNumber(countryCode, phoneNumber)
      };

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
    }
  };

  // Procesar pago completo
  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('processing_payment');
    setResponseMessage('');

    try {
      if (!idNumber || !phoneNumber || !originPhoneNumber || !twofactorAuth || !invoiceNumber) {
        triggerErrorAnimation();
        throw new Error('Por favor complete todos los campos requeridos');
      }

      if (idNumber.length < 6 || idNumber.length > 10) {
        triggerErrorAnimation();
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
      }

      if (phoneNumber.length !== 10) {
        triggerErrorAnimation();
        throw new Error('El número del destinatario debe tener 10 dígitos');
      }

      if (originPhoneNumber.length !== 10) {
        triggerErrorAnimation();
        throw new Error('Su número telefónico debe tener 10 dígitos');
      }

      if (twofactorAuth.length !== 8) {
        triggerErrorAnimation();
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

  if (paymentStatus === 'success') {
    return (
      <AnimatePresence>
        <motion.div
          variants={successVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-10 h-10 text-green-600"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </motion.svg>
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-green-600 mb-3"
            >
              ¡Pago Exitoso!
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              {responseMessage}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-green-50 p-5 rounded-xl mb-6 border border-green-200"
            >
              <div className="space-y-2 text-left">
                <p className="text-sm text-green-800 flex justify-between">
                  <span className="font-semibold">Referencia:</span>
                  <span>{invoiceNumber}</span>
                </p>
                <p className="text-sm text-green-800 flex justify-between">
                  <span className="font-semibold">Cédula Destino:</span>
                  <span>{buildDestinationId(idType, idNumber)}</span>
                </p>
                <p className="text-sm text-green-800 flex justify-between">
                  <span className="font-semibold">Teléfono:</span>
                  <span>+{countryCode} {phoneNumber}</span>
                </p>
                <p className="text-sm text-green-800 flex justify-between">
                  <span className="font-semibold">Monto:</span>
                  <span className="font-bold">${PaymentMobileClientData.amount.toFixed(2)}</span>
                </p>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetForm}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg"
            >
              Realizar otro pago
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 ${
        embedded ? 'w-full max-w-full p-4' : 'max-w-3xl p-6'
      }`}
    >
      {/* Header más compacto */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-10 h-10 mr-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </motion.div>
          <h2 className={`font-bold text-gray-800 ${mode === 'odoo' ? 'text-lg' : 'text-xl'}`}>
            Pago Móvil
          </h2>
        </div>
        <p className="text-gray-600 text-sm">Complete los datos para realizar el pago por teléfono</p>
      </motion.div>

      {/* Información de la transacción más compacta */}
      <motion.div
        variants={itemVariants}
        className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl mb-6"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">FACTURA</p>
              <p className="text-sm font-bold text-gray-900">{invoiceNumber}</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-blue-200"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-medium">MONTO</p>
              <p className="text-sm font-bold text-gray-900">${PaymentMobileClientData.amount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} className="space-y-6">
        {/* Mensaje de error */}
        <AnimatePresence>
          {paymentStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                x: shake ? [0, -10, 10, -10, 10, 0] : 0 
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={shake ? {
                x: {
                  duration: 0.5,
                  repeat: 0
                }
              } : undefined}
              className="p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-red-800 font-semibold text-sm">Error en el pago</span>
              </div>
              <p className="text-red-600 text-xs mt-1">{responseMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA: Destinatario */}
          <motion.div variants={containerVariants} className="space-y-4">
            <motion.div variants={itemVariants}>
              <h3 className="text-base font-semibold mb-3 text-gray-800 pb-2 border-b">Destinatario</h3>
              
              <div className="space-y-3">
                {/* Cédula del destinatario */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-900">
                    Cédula <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <motion.select
                      whileFocus={{ scale: 1.01 }}
                      value={idType}
                      onChange={(e) => setIdType(e.target.value as IdType)}
                      className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm"
                      disabled={paymentStatus === 'processing_payment'}
                    >
                      <option value="V">V</option>
                      <option value="E">E</option>
                      <option value="J">J</option>
                    </motion.select>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="12345678"
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-gray-900 text-sm"
                      required
                      maxLength={10}
                      disabled={paymentStatus === 'processing_payment'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Entre 6 y 10 dígitos</p>
                </div>

                {/* Teléfono del destinatario */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-900">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <motion.select
                      whileFocus={{ scale: 1.01 }}
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm"
                      disabled={paymentStatus === 'processing_payment'}
                    >
                      <option value="58">+58</option>
                      <option value="1">+1</option>
                    </motion.select>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      placeholder="4123456789"
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-gray-900 text-sm"
                      required
                      maxLength={10}
                      disabled={paymentStatus === 'processing_payment'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">10 dígitos sin formato</p>
                </div>
              </div>
            </motion.div>

            {/* Panel para solicitar código */}
            <AnimatePresence>
              {showRequestCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  variants={itemVariants}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <h4 className="font-bold text-yellow-800 mb-2 text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Solicitar Código de Pago
                  </h4>
                  <p className="text-xs text-yellow-700 mb-2">
                    Se enviará un código de 8 dígitos al teléfono del destinatario.
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={requestPaymentCode}
                    disabled={codeRequestStatus === 'loading' || !idNumber || !phoneNumber}
                    className="w-full px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300 transition-colors font-medium text-xs"
                  >
                    {codeRequestStatus === 'loading' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Solicitando...
                      </div>
                    ) : (
                      'Solicitar Código'
                    )}
                  </motion.button>

                  {/* Mensaje de estado de solicitud */}
                  {codeRequestMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-2 p-2 rounded-lg text-xs ${
                        codeRequestStatus === 'success' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {codeRequestMessage}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* COLUMNA DERECHA: Su Información */}
          <motion.div variants={containerVariants} className="space-y-4">
            <motion.div variants={itemVariants}>
              <h3 className="text-base font-semibold mb-3 text-gray-800 pb-2 border-b">Su Información</h3>
              
              <div className="space-y-3">
                {/* Teléfono de origen */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-900">
                    Su número telefónico <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <motion.select
                      whileFocus={{ scale: 1.01 }}
                      value={originCountryCode}
                      onChange={(e) => setOriginCountryCode(e.target.value)}
                      className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white text-sm"
                      disabled={paymentStatus === 'processing_payment'}
                    >
                      <option value="58">+58</option>
                      <option value="1">+1</option>
                    </motion.select>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="text"
                      value={originPhoneNumber}
                      onChange={(e) => setOriginPhoneNumber(formatPhoneNumber(e.target.value))}
                      placeholder="4123456789"
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-gray-900 text-sm"
                      required
                      maxLength={10}
                      disabled={paymentStatus === 'processing_payment'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">10 dígitos sin formato</p>
                </div>

                {/* Código de verificación */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-900">
                    Código de verificación <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={twofactorAuth}
                    onChange={(e) => setTwofactorAuth(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Ingrese el código de 8 dígitos"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-gray-900 text-sm text-center"
                    required
                    maxLength={8}
                    disabled={paymentStatus === 'processing_payment'}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">
                      Código de 8 dígitos enviado al teléfono del destinatario
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRequestCode(!showRequestCode)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap ml-2"
                    >
                      {showRequestCode ? 'Cancelar' : 'Solicitar código'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Botón de pago - Centrado debajo de ambas columnas */}
        <motion.button 
          variants={itemVariants}
          whileHover={{ scale: paymentStatus === 'processing_payment' ? 1 : 1.02 }}
          whileTap={{ scale: paymentStatus === 'processing_payment' ? 1 : 0.98 }}
          type="submit" 
          onClick={processPayment}
          disabled={paymentStatus === 'processing_payment'}
          className="w-full max-w-md mx-auto px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white rounded-xl transition-all duration-200 font-semibold text-sm shadow-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          {paymentStatus === 'processing_payment' ? (
            <>
              <GradientLogoSpinner size={24} />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm"
              >
                Procesando Pago...
              </motion.span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Realizar Pago Móvil</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}