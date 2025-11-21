/*
import { 
  TdcPaymentRequest, 
  TdcPaymentResponse,
} from '@/lib/types/payment-methods';

const API_BASE_URL = 'https://connect-api-y3jc.onrender.com';

// Clase base para manejar errores de API
class PaymentApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public responseData?: any
  ) {
    super(message);
    this.name = 'PaymentApiError';
  }
}

// API para TDC
export class TdcPaymentApi {
  static async processPayment(paymentData: TdcPaymentRequest): Promise<TdcPaymentResponse> {
    console.log('💳 Enviando pago TDC a /pay:', {
      ...paymentData,
      cardNumber: `${paymentData.cardNumber.substring(0, 6)}...${paymentData.cardNumber.substring(12)}`
    });
    
    const response = await fetch(`${API_BASE_URL}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'frontend_lang=es_VE'
      },
      body: JSON.stringify(paymentData),
    });

    const responseText = await response.text();
    console.log('📥 Response TDC raw:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      throw new PaymentApiError(responseText || `Error ${response.status} en el servidor`, response.status);
    }
    
    if (responseData.status === 'error') {
      throw new PaymentApiError(responseData.message || 'Error en el procesamiento del pago', response.status, responseData);
    }
    
    if (!response.ok) {
      throw new PaymentApiError(responseData.message || `Error ${response.status} en el servidor`, response.status, responseData);
    }
    
    return responseData as TdcPaymentResponse;
  }
}
*/