import { 
  TransferSearchRequest, 
  TransferSearchResponse,
  MobilePaymentSearchRequest,
  MobilePaymentSearchResponse 
} from '@/lib/types/search-types';

export class SearchApi {
  // Búsqueda de transferencias
  static async searchTransfer(requestData: TransferSearchRequest): Promise<TransferSearchResponse> {
    try {
      console.log('🔍 [SEARCH_API] Enviando búsqueda de transferencia:', {
        ...requestData,
        encryptedClient: `${requestData.encryptedClient.substring(0, 10)}...`,
        encryptedMerchant: `${requestData.encryptedMerchant.substring(0, 10)}...`,
        encryptedKey: `${requestData.encryptedKey.substring(0, 10)}...`
      });

      const response = await fetch('http://localhost:3000/mercantil/search_transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 [SEARCH_API] Respuesta de transferencia recibida:', data);
      return data;

    } catch (error) {
      console.error('❌ [SEARCH_API] Error en búsqueda de transferencia:', error);
      throw error;
    }
  }

  // Búsqueda de pagos móviles
  static async searchMobilePayment(requestData: MobilePaymentSearchRequest): Promise<MobilePaymentSearchResponse> {
    try {
      console.log('📱 [SEARCH_API] Enviando búsqueda de pago móvil:', {
        ...requestData,
        encryptedClient: `${requestData.encryptedClient.substring(0, 10)}...`,
        encryptedMerchant: `${requestData.encryptedMerchant.substring(0, 10)}...`,
        encryptedKey: `${requestData.encryptedKey.substring(0, 10)}...`
      });

      // NOTA: Reemplaza con tu URL real del endpoint de pagos móviles
      const response = await fetch('http://localhost:3000/mercantil/search_mobile_payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: MobilePaymentSearchResponse = await response.json();
      console.log('📱 [SEARCH_API] Respuesta de pago móvil recibida:', data);
      return data;

    } catch (error) {
      console.error('❌ [SEARCH_API] Error en búsqueda de pago móvil:', error);
      throw error;
    }
  }

}