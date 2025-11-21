import { 
  PaymentMobileAuthRequest,
  PaymentMobileAuthResponse,
  PaymentMobilePaymentRequest,
  PaymentMobilePaymentResponse
} from '@/lib/types/payment-mobile';

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

// API for Mobile Payment
export class PaymentMobileApi {
  // Step 1: Request payment code
  static async requestAuth(authData: PaymentMobileAuthRequest): Promise<PaymentMobileAuthResponse> {
    console.log('📱 Requesting Payment Mobile code:', authData);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pay-mobile/request-payment-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'frontend_lang=es_VE',
          'Accept': 'application/json',
          'User-Agent': 'NextJS-PaymentGateway/1.0'
        },
        credentials: 'include',
        body: JSON.stringify(authData),
      });

      console.log('📊 Response status:', response.status);
      const responseText = await response.text();
      console.log('📥 Response raw:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        throw new PaymentApiError(responseText || `Error ${response.status} on server`, response.status);
      }
      
      console.log('📥 Response parsed:', responseData);
      
      if (responseData.status === 'error') {
        throw new PaymentApiError(responseData.message || 'Error in authentication', response.status, responseData);
      }
      
      if (!response.ok) {
        throw new PaymentApiError(responseData.message || `Error ${response.status} on server`, response.status, responseData);
      }
      
      return responseData as PaymentMobileAuthResponse;
    } catch (error) {
      console.error('❌ Error in requestAuth:', error);
      throw error;
    }
  }

  // Step 2: Confirm payment with code
  static async confirmPayment(paymentData: PaymentMobilePaymentRequest): Promise<PaymentMobilePaymentResponse> {
    console.log('📱 Confirming mobile payment:', paymentData);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/pay-mobile/c2p`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'frontend_lang=es_VE',
          'Accept': 'application/json',
          'User-Agent': 'NextJS-PaymentGateway/1.0'
        },
        credentials: 'include',
        body: JSON.stringify(paymentData),
      });

      console.log('📊 Response status:', response.status);
      const responseText = await response.text();
      console.log('📥 Mobile payment response raw:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        throw new PaymentApiError(responseText || `Error ${response.status} on server`, response.status);
      }
      
      console.log('📥 Response parsed:', responseData);
      
      if (responseData.status === 'error') {
        throw new PaymentApiError(responseData.message || 'Error processing mobile payment', response.status, responseData);
      }
      
      if (!response.ok) {
        throw new PaymentApiError(responseData.message || `Error ${response.status} on server`, response.status, responseData);
      }
      
      return responseData as PaymentMobilePaymentResponse;
    } catch (error) {
      console.error('❌ Error in confirmPayment:', error);
      throw error;
    }
  }
}

// Export error class if needed
export { PaymentApiError };