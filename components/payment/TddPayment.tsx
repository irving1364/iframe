'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TddClientData, TddAuthRequest, TddAuthResponse, TddPaymentRequest } from '../../lib/types/tdd-types';
import { TddPaymentApi } from '../../lib/api/tdd-api';
import CustomCreditCard from '../../components/ui/CustomCreditCard';
import GradientLogoSpinner from '../../components/ui/GradientLogoSpinner';

interface TddPaymentProps {
  clientData: TddClientData;
  onSuccess: (result: any) => void;
  onError: (message: string) => void;
  embedded?: boolean;
  mode?: 'odoo' | 'standalone';
}

type PaymentStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
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

export default function TddPayment({ clientData, onSuccess, onError, embedded = false, mode = 'odoo' }: TddPaymentProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [idType, setIdType] = useState<IdType>('V');
  const [idNumber, setIdNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(clientData.invoiceNumber || clientData.orderId || '');
  const [otp, setOtp] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [authData, setAuthData] = useState<TddAuthResponse | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [rawRequestData, setRawRequestData] = useState<any>(null);
  const [rawResponseData, setRawResponseData] = useState<any>(null);
  const [isAuthRequested, setIsAuthRequested] = useState(false);
  const [accountType, setAccountType] = useState('CA');
  const [cardFocus, setCardFocus] = useState<'number' | 'name' | 'expiry' | 'cvc'>('number');
  const [cardName, setCardName] = useState('');
  const [shake, setShake] = useState(false);
  const [bypassOtpValidation, setBypassOtpValidation] = useState(false);

  // Extraer customerId existente si viene del clientData
  useEffect(() => {
    if (clientData.customerId && typeof clientData.customerId === 'string') {
      const match = clientData.customerId.match(/^([VEJ])(\d+)$/);
      if (match) {
        setIdType(match[1] as IdType);
        setIdNumber(match[2]);
      } else {
        setIdType('V');
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
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpirationDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    let result = cleaned;
    if (cleaned.length > 4) {
      result = cleaned.slice(0, 4) + '/' + cleaned.slice(4, 6);
    }
    return result;
  };

  const formatDisplayExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let result = cleaned;
    if (cleaned.length >= 4) {
      result = cleaned.slice(0, 4) + '/' + cleaned.slice(4, 6);
    }
    return result;
  };

  const convertToApiDateFormat = (displayDate: string): string => {
    const cleaned = displayDate.replace(/\D/g, '');
    let result = displayDate;
    if (cleaned.length === 6) {
      result = cleaned.slice(0, 4) + '/' + cleaned.slice(4);
    }
    return result;
  };

  const buildCustomerId = (type: IdType, number: string): string => {
    return `${type}${number}`;
  };

  const triggerErrorAnimation = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Solicitar autenticación OTP
  const handleAuthRequest = async () => {
    setPaymentStatus('loading');
    setResponseMessage('');

    try {
      if (!cardNumber || !idNumber) {
        triggerErrorAnimation();
        throw new Error('Por favor ingrese el número de tarjeta y cédula para solicitar la OTP');
      }

      if (idNumber.length < 6 || idNumber.length > 10) {
        triggerErrorAnimation();
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
      }

      const customerId = buildCustomerId(idType, idNumber);

      const authRequest: TddAuthRequest = {
        encryptedClient: clientData.encryptedClient,
        encryptedMerchant: clientData.encryptedMerchant,
        encryptedKey: clientData.encryptedKey,
        cardNumber: cardNumber.replace(/\s/g, ''),
        customerId: customerId
      };

      setRawRequestData({ authRequest });

      const authResponse: TddAuthResponse = await TddPaymentApi.requestAuth(authRequest);
      
      setAuthData(authResponse);
      setIsAuthRequested(true);
      setPaymentStatus('idle');
      setResponseMessage(authResponse.message);
      
    } catch (error) {
      setPaymentStatus('error');
      setRawResponseData(error instanceof Error ? { error: error.message } : error);
      
      let errorMessage = 'Error solicitando la clave OTP';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setResponseMessage(errorMessage);
    }
  };

  // Procesar pago completo con OTP
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('processing');
    setResponseMessage('');

    try {
      if (!cardNumber || !cvv || !expirationDate || !idNumber || !invoiceNumber || !otp) {
        triggerErrorAnimation();
        throw new Error('Por favor complete todos los campos incluyendo la OTP');
      }

      if (idNumber.length < 6 || idNumber.length > 10) {
        triggerErrorAnimation();
        throw new Error('La cédula debe tener entre 6 y 10 dígitos');
      }

      const apiExpirationDate = convertToApiDateFormat(expirationDate);
      
      if (!/^\d{4}\/\d{2}$/.test(apiExpirationDate)) {
        triggerErrorAnimation();
        throw new Error('Formato de fecha incorrecto. Use AAAA/MM (ej: 2027/10)');
      }

      if (!authData && !bypassOtpValidation) {
        triggerErrorAnimation();
        throw new Error('Primero debe solicitar la clave OTP');
      }

      const customerId = buildCustomerId(idType, idNumber);

      const paymentData: TddPaymentRequest = {
        encryptedClient: clientData.encryptedClient,
        encryptedMerchant: clientData.encryptedMerchant,
        encryptedKey: clientData.encryptedKey,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cvv: cvv.replace(/\s/g, ''),
        expirationDate: apiExpirationDate,
        customerId: customerId.toLowerCase(),
        invoiceNumber: invoiceNumber,
        amount: clientData.amount,
        paymentMethod: 'tdd',
        accountType: accountType,
        twofactorAuth: otp
      };

      setRawRequestData({ paymentData });

      const response = await TddPaymentApi.processPayment(paymentData);
      
      setRawResponseData(response);
      setPaymentStatus('success');
      setResponseMessage(response.message);
      
      setTimeout(() => {
        onSuccess(response);
      }, 2000);
      
    } catch (error) {
      setPaymentStatus('error');
      setRawResponseData(error instanceof Error ? { error: error.message } : error);
      
      let errorMessage = 'Error procesando el pago';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setResponseMessage(errorMessage);
    }
  };

  const resetForm = () => {
    setPaymentStatus('idle');
    setResponseMessage('');
    setCardNumber('');
    setCvv('');
    setExpirationDate('');
    setIdType('V');
    setIdNumber('');
    setOtp('');
    setAccountType('CA');
    setInvoiceNumber(clientData.invoiceNumber || clientData.orderId || '');
    setAuthData(null);
    setIsAuthRequested(false);
    setRawRequestData(null);
    setRawResponseData(null);
    setCardFocus('number');
    setCardName('');
  };

  const fillWithData = (testData: any) => {
    setCardNumber(testData.cardNumber || '');
    setCvv(testData.cvv || '');
    setExpirationDate(testData.expirationDate?.replace(/\D/g, '') || '');
    setAccountType(testData.accountType || 'CA');
    setCardName(testData.cardName || 'TITULAR DE DÉBITO');
    
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
    setOtp(testData.otp || '');
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
                  <span className="font-semibold">Cédula:</span>
                  <span>{buildCustomerId(idType, idNumber)}</span>
                </p>
                <p className="text-sm text-green-800 flex justify-between">
                  <span className="font-semibold">Tipo de Cuenta:</span>
                  <span>{accountType === 'CA' ? 'Ahorro' : 'Corriente'}</span>
                </p>
                <p className="text-sm text-green-800 flex justify-between">
                  <span className="font-semibold">Monto:</span>
                  <span className="font-bold">${clientData.amount.toFixed(2)}</span>
                </p>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetForm}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg"
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
        embedded ? 'w-full max-w-full p-4' : 'max-w-4xl p-8'
      }`}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-12 h-12 mr-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg"
          >
            <svg viewBox="0 0 281.75 281.72" className="w-6 h-6 text-white">
              <path fill="currentColor" d="M9.25,9.28c0,93.75.51.48.51,94.23H131L9.76,224.72V291H76.05L197.26,169.8V291H291V9.76H103.51" transform="translate(-9.25 -9.28)"/>
            </svg>
          </motion.div>
          <h2 className={`font-bold text-gray-800 ${mode === 'odoo' ? 'text-xl' : 'text-2xl'}`}>
            Pago con Tarjeta de Débito
          </h2>
        </div>
        <p className="text-gray-600 text-lg">Complete los datos de su tarjeta y solicite la clave OTP</p>
      </motion.div>

      {/* Botón panel dev */}
      <motion.div variants={itemVariants} className="mb-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setShowDevPanel(!showDevPanel)}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-gray-700 border border-gray-300 transition-colors"
        >
          {showDevPanel ? '👨‍💻 Ocultar Panel Dev' : '👨‍💻 Mostrar Panel Dev'}
        </motion.button>
      </motion.div>

      <motion.div variants={containerVariants} className="space-y-8">
        {/* Información de la transacción */}
        <motion.div
          variants={itemVariants}
          className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl"
        >
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs text-purple-600 font-medium">N° DE FACTURA</p>
                <p className="text-sm font-bold text-gray-900">{invoiceNumber}</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-purple-200"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">MONTO A PAGAR</p>
                <p className="text-sm font-bold text-gray-900">${clientData.amount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna 1: Tarjeta visual */}
          <motion.div variants={cardVariants} className="space-y-6">
            <div className="flex justify-center">
              <motion.div
                animate={{
                  scale: cardNumber ? [1, 1.02, 1] : 1
                }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-[340px] relative"
              >
                <CustomCreditCard
                  number={cardNumber}
                  name={cardName || "TITULAR DE LA TARJETA"}
                  expiry={formatDisplayExpiry(expirationDate)}
                  cvc={cvv}
                  focused={cardFocus}
                  issuer="tdd"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Columna 2: Formulario */}
          <motion.div variants={containerVariants} className="space-y-6">
            <AnimatePresence>
              {showDevPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl overflow-hidden"
                >
                  <h4 className="font-bold text-yellow-800 mb-3 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                    Panel de Desarrollo - TDD
                  </h4>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-yellow-700 mb-1">Configuración:</label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="bypassOtpValidation"
                        checked={bypassOtpValidation}
                        onChange={(e) => setBypassOtpValidation(e.target.checked)}
                        className="mr-2 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                      <label htmlFor="bypassOtpValidation" className="text-sm text-gray-900">
                        Saltar validación de OTP
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => fillWithData({
                        cardNumber: '4532310053007854',
                        cvv: '330',
                        expirationDate: '202710',
                        cardName: 'TITULAR DÉBITO',
                        idType: 'V',
                        idNumber: '4600908',
                        accountType: 'CA',
                        otp: '12345678'
                      })}
                      className="text-xs bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      💳 Débito Test
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => fillWithData({
                        cardNumber: '',
                        cvv: '',
                        expirationDate: '',
                        cardName: '',
                        idType: 'V',
                        idNumber: '',
                        accountType: 'CA',
                        otp: ''
                      })}
                      className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      Limpiar
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mensaje de autenticación exitosa */}
            {isAuthRequested && authData && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-2xl"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-green-800 font-semibold">Clave OTP Solicitada</span>
                </div>
                <p className="text-green-700 text-sm mt-1">{authData.twofactor.label}</p>
                <p className="text-green-600 text-xs mt-1">Longitud: {authData.twofactor.length} dígitos</p>
              </motion.div>
            )}

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
                  className="p-4 bg-red-50 border border-red-200 rounded-2xl"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-red-800 font-semibold">Error en el pago</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{responseMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form variants={containerVariants} onSubmit={handlePayment} className="space-y-5">
              {/* Campos del formulario */}
              <motion.div variants={itemVariants}>
                <label className="block text-gray-900 text-sm font-semibold mb-2">
                  Nombre del Titular <span className="text-red-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  onFocus={() => setCardFocus('name')}
                  placeholder="JUAN PEREZ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 uppercase text-sm transition-colors"
                  required
                  disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-gray-900 text-sm font-semibold mb-2">
                  Número de Tarjeta <span className="text-red-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={formatCardNumber(cardNumber)}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setCardFocus('number')}
                  placeholder="4532 3100 5300 7854"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-gray-900 text-sm transition-colors"
                  required
                  maxLength={19}
                  disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-900 font-semibold mb-2">
                    CVV <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    onFocus={() => setCardFocus('cvc')}
                    placeholder="330"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-gray-900 text-sm transition-colors"
                    required
                    maxLength={3}
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">
                    Expiración <span className="text-red-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={formatExpirationDate(expirationDate)}
                    onChange={(e) => setExpirationDate(e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setCardFocus('expiry')}
                    placeholder="2027/10"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-gray-900 text-sm transition-colors"
                    required
                    maxLength={7}
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">
                    Tipo de Cuenta <span className="text-red-500">*</span>
                  </label>
                  <motion.select
                    whileFocus={{ scale: 1.01 }}
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white text-sm transition-colors"
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                    required
                  >
                    <option value="CA">Ahorro</option>
                    <option value="CC">Corriente</option>
                  </motion.select>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Cédula <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <motion.select
                    whileFocus={{ scale: 1.01 }}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as IdType)}
                    className="w-24 px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white text-sm transition-colors"
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
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
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-gray-900 text-sm transition-colors"
                    required
                    maxLength={10}
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Entre 6 y 10 dígitos</p>
              </motion.div>

              {/* Sección OTP */}
              <motion.div variants={itemVariants} className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-gray-900">
                    Clave Temporal OTP <span className="text-red-500">*</span>
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleAuthRequest}
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing' || !cardNumber || !idNumber}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition-colors text-sm font-medium flex items-center"
                  >
                    {paymentStatus === 'loading' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                        Solicitando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Solicitar OTP
                      </>
                    )}
                  </motion.button>
                </div>
                
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, authData?.twofactor?.length ? parseInt(authData.twofactor.length) : 8))}
                  placeholder={authData ? `Ingrese ${authData.twofactor.length} dígitos` : "Solicite OTP primero"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-gray-900 text-center text-lg transition-colors"
                  required
                  maxLength={authData?.twofactor?.length ? parseInt(authData.twofactor.length) : 8}
                  disabled={paymentStatus === 'loading' || paymentStatus === 'processing' || (!isAuthRequested && !bypassOtpValidation)}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {authData ? `${authData.twofactor.length} dígitos numéricos` : 'Ingrese tarjeta y cédula, luego solicite la OTP'}
                </p>
              </motion.div>

              <motion.button 
                variants={itemVariants}
                whileHover={{ scale: paymentStatus === 'processing' ? 1 : 1.02 }}
                whileTap={{ scale: paymentStatus === 'processing' ? 1 : 0.98 }}
                type="submit" 
                disabled={
                  paymentStatus === 'loading' || 
                  paymentStatus === 'processing' || 
                  (!isAuthRequested && !bypassOtpValidation)
                }
                className="w-full px-4 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-400 disabled:to-purple-500 text-white rounded-xl transition-all duration-200 font-semibold text-sm shadow-lg flex items-center justify-center gap-3 disabled:cursor-not-allowed"
              >
                {paymentStatus === 'processing' ? (
                  <>
                    <GradientLogoSpinner size={28} />
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      Procesando Pago...
                    </motion.span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    <span>Realizar Pago con Débito</span>
                  </>
                )}
              </motion.button>
            </motion.form>
          </motion.div>
        </div>

        {/* Sección de información - MOVIDA AL FINAL */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
          <motion.div variants={itemVariants} className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Verificación en dos pasos</p>
                <p className="text-xs text-gray-600">Debe solicitar la clave OTP antes de pagar</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Pago 100% seguro</p>
                <p className="text-xs text-gray-600">Todas las transacciones están encriptadas</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}