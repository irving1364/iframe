    'use client';
    import { useEffect, useState } from 'react';
    import { TddClientData, TddAuthRequest, TddAuthResponse, TddPaymentRequest } from '../../lib/types/tdd-types';
    import { TddPaymentApi } from '../../lib/api/tdd-api';

    interface TddPaymentProps {
    clientData: TddClientData;
    onSuccess: (result: any) => void;
    onError: (message: string) => void;
    embedded?: boolean;
    mode?: 'odoo' | 'standalone';
    }

    type PaymentStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';
    type IdType = 'V' | 'E' | 'J';

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
    const [accountType, setAccountType] = useState('CC');

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
        if (cleaned.length > 4) {
        return cleaned.slice(0, 4) + '/' + cleaned.slice(4);
        }
        return cleaned;
    };

    const convertToApiDateFormat = (displayDate: string): string => {
        const cleaned = displayDate.replace(/\D/g, '');
        if (cleaned.length === 6) {
        return cleaned.slice(0, 4) + '/' + cleaned.slice(4);
        }
        return displayDate;
    };

    const buildCustomerId = (type: IdType, number: string): string => {
        return `${type}${number}`;
    };

    // Solicitar autenticación OTP
    const handleAuthRequest = async () => {
        setPaymentStatus('loading');
        setResponseMessage('');

        try {
        // Validaciones básicas para auth
        if (!cardNumber || !idNumber) {
            throw new Error('Por favor ingrese el número de tarjeta y cédula para solicitar la OTP');
        }

        if (idNumber.length < 6 || idNumber.length > 10) {
            throw new Error('La cédula debe tener entre 6 y 10 dígitos');
        }

        const customerId = buildCustomerId(idType, idNumber);

        // Preparar datos para autenticación
        const authRequest: TddAuthRequest = {
            encryptedClient: clientData.encryptedClient,
            encryptedMerchant: clientData.encryptedMerchant,
            encryptedKey: clientData.encryptedKey,
            cardNumber: cardNumber.replace(/\s/g, ''),
            customerId: customerId
        };

        setRawRequestData({ authRequest });

        // Solicitar OTP
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
        console.error('❌ Error en autenticación:', error);
        }
    };

    // Procesar pago completo con OTP
        const handlePayment = async (e: React.FormEvent) => {
            e.preventDefault();
            setPaymentStatus('processing');
            setResponseMessage('');

            try {
                // Validaciones completas
                if (!cardNumber || !cvv || !expirationDate || !idNumber || !invoiceNumber || !otp) {
                    throw new Error('Por favor complete todos los campos incluyendo la OTP');
                }
                


                if (idNumber.length < 6 || idNumber.length > 10) {
                throw new Error('La cédula debe tener entre 6 y 10 dígitos');
                }

                const apiExpirationDate = convertToApiDateFormat(expirationDate);
                
                if (!/^\d{4}\/\d{2}$/.test(apiExpirationDate)) {
                throw new Error('Formato de fecha incorrecto. Use AAAA/MM (ej: 2027/10)');
                }

                if (!authData && !bypassOtpValidation) {
                    throw new Error('Primero debe solicitar la clave OTP');
                }

                const customerId = buildCustomerId(idType, idNumber);

                // Preparar datos para el pago completo CON NUEVA ESTRUCTURA
                const paymentData: TddPaymentRequest = {
                encryptedClient: clientData.encryptedClient,
                encryptedMerchant: clientData.encryptedMerchant,
                encryptedKey: clientData.encryptedKey,
                cardNumber: cardNumber.replace(/\s/g, ''),
                cvv: cvv.replace(/\s/g, ''),
                expirationDate: apiExpirationDate,
                customerId: customerId.toLowerCase(), // Asegurar minúsculas como en tu ejemplo
                invoiceNumber: invoiceNumber,
                amount: clientData.amount,
                paymentMethod: 'tdd', // Constante
                accountType: accountType, // Puedes hacer esto constante o agregar selector
                twofactorAuth: otp // Cambiado de 'otp' a 'twofactorAuth'
                };

                setRawRequestData({ paymentData });

                // Procesar pago
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
                console.error('❌ Error en pago:', error);
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
        setAccountType('CA'); // ← Agregar esta línea
        setInvoiceNumber(clientData.invoiceNumber || clientData.orderId || '');
        setAuthData(null);
        setIsAuthRequested(false);
        setRawRequestData(null);
        setRawResponseData(null);
    };

    // Función para rellenar con datos específicos
    const fillWithData = (testData: any) => {
        setCardNumber(testData.cardNumber || '');
        setCvv(testData.cvv || '');
        setExpirationDate(testData.expirationDate?.replace(/\D/g, '') || '');
        setAccountType(testData.accountType || 'CA'); // ← Agregar esta línea
        
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

    return (
        <div className={`mx-auto p-6 bg-white rounded-lg shadow-lg ${
        embedded ? 'w-full max-w-full' : 'max-w-md' }`}>
            
        {/* Header condicional para modo Odoo */}
        {mode === 'odoo' && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
            <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="text-blue-800 font-medium">Pago seguro a través de Odoo</span>
            </div>
            </div>
        )}
        
        <h2 className="text-2xl font-bold mb-6 text-black">
            {mode === 'odoo' ? 'Pago con Tarjeta de Débito' : 'Pago con Tarjeta de Débito'}
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

        {/* Información de la transacción - FACTURA NO EDITABLE */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="mb-3">
            <label className="block text-sm font-medium text-blue-800 mb-1">
                N° de Factura
            </label>
            <div className="w-full px-3 py-2 text-gray-900 border border-blue-300 rounded-md bg-blue-50 font-mono">
                {invoiceNumber}
            </div>
            <p className="text-xs text-blue-600 mt-1">Este campo no puede ser modificado</p>
            </div>
            <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">Monto a pagar:</span>
            <span className="text-lg font-bold text-green-600">
                ${clientData.amount.toFixed(2)}
            </span>
            </div>
        </div>

        {/* Panel de desarrollador */}
        {showDevPanel && (
            <div className="mb-4 p-3 bg-yellow-50 bypassOtpValidation0 border-yellow-200 rounded-lg">
            <h4 className="font-bold text-yellow-800 mb-2">🧪 Panel de Desarrollo - TDD</h4>
            
            <div className="mb-3">
                <label className="block text-sm font-medium text-yellow-700 mb-1">Configuración de Desarrollo:</label>
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

            {/* Datos de prueba rápidos */}
            <div className="mb-3">
                <label className="block text-sm font-medium text-yellow-700 mb-1">Datos de prueba TDD:</label>
                <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => fillWithData({
                        cardNumber: '4532310053007854',
                        cvv: '330',
                        expirationDate: '202710',
                        idType: 'V',
                        idNumber: '4600908',
                        accountType: 'CA', // ← Agregar esta línea
                        otp: '12345678'
                    })}
                    className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                    >
                    TDD Completo
                </button>
                <button
                    type="button"
                    onClick={() => fillWithData({
                    cardNumber: '',
                    cvv: '',
                    expirationDate: '',
                    idType: 'V',
                    idNumber: '',
                    otp: ''
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
                    <div>Cédula: {idType}-{idNumber || '---'}</div>
                    <div>Tipo Cuenta: {accountType || '---'}</div> {/* ← Agregar esta línea */}
                    <div>OTP: {otp || '---'}</div>
                    <div>Auth Requested: {isAuthRequested ? '✅' : '❌'}</div>
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

        {/* Mensaje de autenticación exitosa */}
        {isAuthRequested && authData && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-green-800 font-medium">Clave OTP Solicitada</span>
            </div>
            <p className="text-green-700 text-sm mt-1">{authData.twofactor.label}</p>
            <p className="text-green-600 text-xs mt-1">Longitud: {authData.twofactor.length} dígitos</p>
            </div>
        )}

        {/* Mensaje de error */}
        {paymentStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
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

        <form onSubmit={handlePayment}>
            {/* SECCIÓN AGRUPADA: Tarjeta y Cédula para OTP */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                Datos para Autenticación OTP
            </h3>
            
            {/* Tarjeta y Cédula en misma fila - CORREGIDO */}
            <div className="space-y-4 mb-3">
                {/* Tarjeta - campo completo */}
                <div>
                <label className="block text-sm text-gray-900 font-medium mb-2">
                    Número de Tarjeta <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formatCardNumber(cardNumber)}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="4532 3100 5300 7854"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                    required
                    maxLength={19}
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                />
                </div>

                {/* Cédula - en fila */}
                <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">
                    Cédula <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                    <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as IdType)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
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
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                    required
                    maxLength={10}
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">Entre 6 y 10 dígitos</p>
                </div>
            </div>

            {/* Botón para solicitar OTP */}
            <div className="flex justify-end">
                <button
                type="button"
                onClick={handleAuthRequest}
                disabled={paymentStatus === 'loading' || paymentStatus === 'processing' || !cardNumber || !idNumber}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors text-sm font-medium flex items-center"
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
                    Solicitar Clave OTP
                    </>
                )}
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Ingrese tarjeta y cédula para solicitar la clave temporal OTP
            </p>
            </div>

            {/* SECCIÓN: Detalles de la tarjeta */}
            <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Detalles de la Tarjeta</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                <label className="block text-sm text-gray-900 font-medium mb-2">CVV</label>
                <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="330"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                    required
                    maxLength={4}
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                />
                </div>
                
                <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">Fecha Expiración</label>
                <input
                    type="text"
                    value={formatExpirationDate(expirationDate)}
                    onChange={(e) => setExpirationDate(e.target.value.replace(/\D/g, ''))}
                    placeholder="AAAA/MM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900"
                    required
                    maxLength={7}
                    disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                />
                <p className="text-xs text-gray-500 mt-1">Ej: 2027/10</p>
                </div>

                {/* Campo Account Type */}
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-900">
                        Tipo de Cuenta <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        disabled={paymentStatus === 'loading' || paymentStatus === 'processing'}
                        required
                    >
                        <option value="CA">Cuenta de Ahorro</option>
                        <option value="CC">Cuenta Corriente</option>
                    </select>
                </div>

            </div>
            </div>

            {/* Campo OTP */}
            <div className="mb-6">
            <label className="block text-gray-900 text-sm font-medium mb-2">
                Clave Temporal OTP <span className="text-red-500">*</span>
            </label>
            <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, authData?.twofactor?.length ? parseInt(authData.twofactor.length) : 8))}
                placeholder={authData ? `Ingrese ${authData.twofactor.length} dígitos` : "Solicite OTP primero"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-900 text-center text-lg"
                required
                maxLength={authData?.twofactor?.length ? parseInt(authData.twofactor.length) : 8}
                disabled={paymentStatus === 'loading' || paymentStatus === 'processing' || !isAuthRequested}
            />
            <p className="text-xs text-gray-500 mt-1">
                {authData ? `${authData.twofactor.length} dígitos numéricos` : 'Solicite la OTP primero'}
            </p>
            </div>

            <button 
                type="submit" 
                disabled={
                    paymentStatus === 'loading' || 
                    paymentStatus === 'processing' || 
                    (!isAuthRequested && !bypassOtpValidation) // <-- Condición modificada
                }
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
            >
                {paymentStatus === 'processing' ? (
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
    );
    }