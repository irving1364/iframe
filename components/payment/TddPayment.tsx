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
  
  // Estados para el panel dev
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [showDevButton, setShowDevButton] = useState(true);
  
  const [rawRequestData, setRawRequestData] = useState<any>(null);
  const [rawResponseData, setRawResponseData] = useState<any>(null);
  const [isAuthRequested, setIsAuthRequested] = useState(false);
  const [accountType, setAccountType] = useState('CA');
  const [cardFocus, setCardFocus] = useState<'number' | 'name' | 'expiry' | 'cvc'>('number');
  const [cardName, setCardName] = useState('');
  const [shake, setShake] = useState(false);
  const [bypassOtpValidation, setBypassOtpValidation] = useState(false);

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
      if (error instanceof Error) errorMessage = error.message;
      setResponseMessage(errorMessage);
    }
  };

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
      if (error instanceof Error) errorMessage = error.message;
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
        <motion.div variants={successVariants} initial="hidden" animate="visible"
          className={`mx-auto ${embedded ? 'w-full max-w-full bg-white p-4' : 'bg-white rounded-2xl shadow-lg border border-gray-200 max-w-4xl p-8'}`}>  
          <div className="text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-3">¡Pago Exitoso!</h3>
            <p className="text-gray-600 mb-6">{responseMessage}</p>
            <div className="bg-green-50 p-5 rounded-xl mb-6 border border-green-200 text-left space-y-2">
                <p className="text-sm text-green-800 flex justify-between"><span className="font-semibold">Referencia:</span><span>{invoiceNumber}</span></p>
                <p className="text-sm text-green-800 flex justify-between"><span className="font-semibold">Cédula:</span><span>{buildCustomerId(idType, idNumber)}</span></p>
                <p className="text-sm text-green-800 flex justify-between"><span className="font-semibold">Monto:</span><span className="font-bold">${clientData.amount.toFixed(2)}</span></p>
            </div>
            <button onClick={resetForm} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg">
              Realizar otro pago
            </button>
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
      className={`mx-auto ${
        embedded 
          ? 'w-full max-w-full bg-white p-3' // <- Aún más sutil, sin bordes en la modal
          : 'bg-white rounded-2xl shadow-lg border border-gray-200 max-w-4xl p-8'
      }`}
    >
      {/* Header Compacto */}
      <motion.div variants={itemVariants} className={`text-center ${embedded ? 'mb-4' : 'mb-6'}`}>
        <div className="flex items-center justify-center mb-1">
          <div className="w-10 h-10 mr-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md">
            <svg viewBox="0 0 281.75 281.72" className="w-5 h-5 text-white">
              <path fill="currentColor" d="M9.25,9.28c0,93.75.51.48.51,94.23H131L9.76,224.72V291H76.05L197.26,169.8V291H291V9.76H103.51" transform="translate(-9.25 -9.28)"/>
            </svg>
          </div>
          <h2 className={`font-bold text-gray-800 ${embedded ? 'text-xl' : 'text-2xl'}`}>
            Pago con Tarjeta de Débito
          </h2>
        </div>
        {!embedded && <p className="text-gray-600 text-sm">Complete los datos de su tarjeta y solicite la clave OTP</p>}
      </motion.div>

      {/* Botón panel dev */}
      <AnimatePresence>
        {showDevButton && (
          <motion.div 
            variants={itemVariants} 
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
            className="mb-4 flex justify-end gap-2"
          >
            <button onClick={() => setShowDevPanel(!showDevPanel)} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-700 border border-gray-300 transition-colors">
              {showDevPanel ? '👨‍💻 Ocultar Panel Dev' : '👨‍💻 Mostrar Panel Dev'}
            </button>
            <button onClick={() => { setShowDevButton(false); setShowDevPanel(false); }} className="text-xs bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-lg text-red-600 border border-red-200 transition-colors flex items-center justify-center" title="Ocultar opciones">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} className="space-y-4">
        {/* Información de la transacción Compacta */}
        <motion.div variants={itemVariants} className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl ${embedded ? 'p-2' : 'p-4'}`}>
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <div>
                <p className="text-[10px] text-purple-600 font-bold uppercase">Factura</p>
                <p className="text-sm font-bold text-gray-900 leading-none">{invoiceNumber}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-purple-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>
              </div>
              <div>
                <p className="text-[10px] text-blue-600 font-bold uppercase">Monto</p>
                <p className="text-sm font-bold text-gray-900 leading-none">${clientData.amount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* LAYOUT LADO A LADO: El salvador del espacio vertical */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          
          {/* IZQUIERDA: Tarjeta visual */}
          <motion.div variants={cardVariants} className="w-full sm:w-5/12 flex justify-center sm:sticky sm:top-0">
            <motion.div
              animate={{ scale: cardNumber ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className={`w-full max-w-[340px] relative ${embedded ? 'transform scale-[0.85] sm:scale-100 origin-top' : ''}`}
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
          </motion.div>

          {/* DERECHA: Formulario Súper Compacto */}
          <motion.div variants={containerVariants} className="w-full sm:w-7/12">
            <AnimatePresence>
              {/* Panel Dev ... */}
              {showDevPanel && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden">
                  <h4 className="font-bold text-yellow-800 mb-2 text-xs">Panel de Desarrollo</h4>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => fillWithData({ cardNumber: '4532310053007854', cvv: '330', expirationDate: '202710', cardName: 'TITULAR DÉBITO', idType: 'V', idNumber: '4600908', accountType: 'CA', otp: '12345678' })} className="text-[10px] bg-purple-500 hover:bg-purple-600 text-white px-2 py-1.5 rounded transition-colors">💳 Débito Test</button>
                    <button type="button" onClick={() => setBypassOtpValidation(!bypassOtpValidation)} className={`text-[10px] px-2 py-1.5 rounded transition-colors ${bypassOtpValidation ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{bypassOtpValidation ? 'Validación OTP: OFF' : 'Validación OTP: ON'}</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mensajes de OTP y Error compactos */}
            {isAuthRequested && authData && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-2 mb-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <span className="text-green-800 text-xs font-semibold">✅ OTP Solicitada: {authData.twofactor.label}</span>
              </motion.div>
            )}
            <AnimatePresence>
              {paymentStatus === 'error' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0, x: shake ? [0,-10,10,-10,10,0] : 0 }} exit={{ opacity: 0, height: 0 }} className="p-2 mb-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-xs font-semibold">❌ {responseMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form variants={containerVariants} onSubmit={handlePayment} className="space-y-3">
              
              {/* Apilamos Nombre y Número en pantallas pequeñas del lado derecho para que no se aprieten */}
              <motion.div variants={itemVariants}>
                <label className="block text-gray-900 text-xs font-semibold mb-1">Nombre del Titular <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  onFocus={() => setCardFocus('name')}
                  placeholder="JUAN PEREZ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 uppercase text-sm"
                  required disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-gray-900 text-xs font-semibold mb-1">Número de Tarjeta <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formatCardNumber(cardNumber)}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setCardFocus('number')}
                  placeholder="4532 3100 5300 7854"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-gray-900 text-sm"
                  required maxLength={19} disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-900 font-semibold mb-1">CVV <span className="text-red-500">*</span></label>
                  <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} onFocus={() => setCardFocus('cvc')} placeholder="330" className="w-full px-2 py-2 border border-gray-300 rounded-lg font-mono text-sm text-center" required maxLength={3} disabled={paymentStatus === 'loading' || paymentStatus === 'processing'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-900">Expira <span className="text-red-500">*</span></label>
                  <input type="text" value={formatExpirationDate(expirationDate)} onChange={(e) => setExpirationDate(e.target.value.replace(/\D/g, ''))} onFocus={() => setCardFocus('expiry')} placeholder="2027/10" className="w-full px-2 py-2 border border-gray-300 rounded-lg font-mono text-sm text-center" required maxLength={7} disabled={paymentStatus === 'loading' || paymentStatus === 'processing'} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-900">Cuenta <span className="text-red-500">*</span></label>
                  <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-1 py-2 border border-gray-300 rounded-lg text-sm bg-white" disabled={paymentStatus === 'loading' || paymentStatus === 'processing'} required>
                    <option value="CA">Ahorro</option>
                    <option value="CC">Corriente</option>
                  </select>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-xs font-semibold mb-1 text-gray-900">Cédula del Titular <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select value={idType} onChange={(e) => setIdType(e.target.value as IdType)} className="w-16 px-1 py-2 border border-gray-300 rounded-lg text-sm bg-white" disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}>
                    <option value="V">V</option><option value="E">E</option><option value="J">J</option>
                  </select>
                  <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="12345678" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" required maxLength={10} disabled={paymentStatus === 'loading' || paymentStatus === 'processing'} />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-900 mb-1 block">Clave OTP <span className="text-red-500">*</span></label>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, authData?.twofactor?.length ? parseInt(authData.twofactor.length) : 8))} placeholder={authData ? `${authData.twofactor.length} dígitos` : "OTP"} className="w-full px-2 py-2 border border-gray-300 rounded-lg font-mono text-center text-sm" required disabled={paymentStatus === 'loading' || paymentStatus === 'processing' || (!isAuthRequested && !bypassOtpValidation)} />
                </div>
                <button type="button" onClick={handleAuthRequest} disabled={paymentStatus === 'loading' || paymentStatus === 'processing' || !cardNumber || !idNumber} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 text-xs font-medium whitespace-nowrap h-[38px]">
                  {paymentStatus === 'loading' ? 'Solicitando...' : 'Solicitar OTP'}
                </button>
              </motion.div>

              <motion.button 
                variants={itemVariants} whileHover={{ scale: paymentStatus === 'processing' ? 1 : 1.02 }} whileTap={{ scale: paymentStatus === 'processing' ? 1 : 0.98 }} type="submit" 
                disabled={paymentStatus === 'loading' || paymentStatus === 'processing' || (!isAuthRequested && !bypassOtpValidation)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-400 text-white rounded-xl font-semibold text-sm shadow-md flex items-center justify-center gap-2 mt-1"
              >
                {paymentStatus === 'processing' ? (
                  <><GradientLogoSpinner size={20} /><span>Procesando...</span></>
                ) : (
                  <span>Realizar Pago</span>
                )}
              </motion.button>
            </motion.form>
          </motion.div>
        </div>

        {/* Info footer oculto en Odoo */}
        {!embedded && (
          <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
             <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl"><p className="text-xs font-semibold text-gray-800">Verificación 2 Pasos</p><p className="text-[10px] text-gray-600">Solicite OTP antes de pagar</p></div>
             <div className="p-3 bg-green-50 border border-green-200 rounded-xl"><p className="text-xs font-semibold text-gray-800">Pago 100% Seguro</p><p className="text-[10px] text-gray-600">Transacción encriptada</p></div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}