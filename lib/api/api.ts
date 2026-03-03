import { PaymentRequest, PaymentResponse } from '@/lib/types';

const API_BASE_URL = 'https://connect-api-y3jc.onrender.com';
//const API_BASE_URL = 'http://localhost:3000';

export class PaymentApi {
  static async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    console.log('💳 Enviando pago a /pay:', {
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
    console.log('📥 Response raw:', responseText);
    console.log('📊 Response status:', response.status);
    
    // Intentar parsear la respuesta sin importar el status
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      // Si no es JSON válido, lanzar error con el texto original
      throw new Error(responseText || `Error ${response.status} en el servidor`);
    }
    
    // Si la respuesta tiene status: 'error', lanzar el mensaje específico
    if (responseData.status === 'error') {
      throw new Error(responseData.message || 'Error en el procesamiento del pago');
    }
    
    // Si el status HTTP no es 200-299, pero el JSON se pudo parsear
    if (!response.ok) {
      throw new Error(responseData.message || `Error ${response.status} en el servidor`);
    }
    
    // Si todo está bien, retornar la respuesta
    return responseData as PaymentResponse;
  }
}
