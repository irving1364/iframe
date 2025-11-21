import { 
  TddAuthRequest, 
  TddAuthResponse, 
  TddPaymentRequest, 
  TddPaymentResponse 
} from '@/lib/types/tdd-types';

const API_BASE_URL = 'https://connect-api-y3jc.onrender.com';

class TddApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public responseData?: any
  ) {
    super(message);
    this.name = 'TddApiError';
  }
}

export class TddPaymentApi {
  static async requestAuth(authData: TddAuthRequest): Promise<TddAuthResponse> {
    console.log('🔐 Solicitando autenticación OTP TDD a /auth:', {
      ...authData,
      cardNumber: `${authData.cardNumber.substring(0, 6)}...${authData.cardNumber.substring(12)}`
    });
    
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'frontend_lang=es_VE'
      },
      body: JSON.stringify(authData),
    });

    const responseText = await response.text();
    console.log('📥 Response auth TDD raw:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      throw new TddApiError(responseText || `Error ${response.status} en el servidor`, response.status);
    }
    
    if (responseData.status === 'error') {
      throw new TddApiError(responseData.message || 'Error en la autenticación TDD', response.status, responseData);
    }
    
    if (!response.ok) {
      throw new TddApiError(responseData.message || `Error ${response.status} en el servidor`, response.status, responseData);
    }
    
    return responseData as TddAuthResponse;
  }

  static async processPayment(paymentData: TddPaymentRequest): Promise<TddPaymentResponse> {
    console.log('💳 Enviando pago TDD a /pay:', {
      ...paymentData,
      cardNumber: `${paymentData.cardNumber.substring(0, 6)}...${paymentData.cardNumber.substring(12)}`,
      twofactorAuth: paymentData.twofactorAuth ? '***' : 'undefined'
    });

    // MOCK TEMPORAL - Respuesta exitosa fija
    console.log('🎭 Usando MOCK temporal para payment');
    const mockResponse: TddPaymentResponse = {
      status: 'success',
      message: 'Pago procesado correctamente',
      processing_time: '355 ms',
      bank_response: {
        merchant_identify: {
          integratorId: 31,
          merchantId: 200284,
          terminalId: 'abcde'
        },
        transaction_response: {
          processing_date: new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' }) + ' VET',
          trx_status: 'approved',
          payment_reference: '000000000001479',
          trx_internal_status: '0000',
          trx_type: 'compra',
          payment_method: 'tdd',
          invoice_number: paymentData.invoiceNumber,
          amount: paymentData.amount,
          currency: 'VES'
        }
      }
    };
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1500));
    return mockResponse;

    /* 
    // CÓDIGO ORIGINAL (para restaurar después):
    const response = await fetch(`${API_BASE_URL}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'frontend_lang=es_VE'
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log('📥 Response TDD raw:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      throw new TddApiError(responseText || `Error ${response.status} en el servidor`, response.status);
    }
    
    if (responseData.status === 'error') {
      throw new TddApiError(responseData.message || 'Error en el procesamiento del pago TDD', response.status, responseData);
    }
    
    if (!response.ok) {
      throw new TddApiError(responseData.message || `Error ${response.status} en el servidor`, response.status, responseData);
    }
    
    return responseData as TddPaymentResponse;
    */
  }
}