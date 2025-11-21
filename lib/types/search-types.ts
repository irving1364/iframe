// Tipos para búsqueda de pagos móviles
export interface MobilePaymentSearchRequest {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  amount: number;
  currency: string;
  originMobileNumber: string;
  destinationMobileNumber: string;
  paymentReference: string;
  trxDate: string; // formato "YYYY-MM-DD"
  
  metadata?: {
    source?: string;
    returnUrl?: string;
    origin?: string;
    language?: string;
    timestamp?: string;
  };
}

export interface MobilePaymentSearchResponse {
  status: 'success' | 'error';
  message: string;
  bank_response?: {
    processing_date?: string;
    merchant_identify?: {
      integratorId: number;
      merchantId: number;
      terminalId: string;
    };
    mobile_payment_search_list?: Array<{
      paymentReference: string;
      trxTime?: string;
      currency?: string;
      trxStatus?: string;
      originMobileNumber?: string;
      destinationMobileNumber?: string;
      amount?: number;
      // ... otros campos que puedas recibir
    }>;
    error_list?: Array<{
      error_code: string;
      description: string;
    }>;
  };
  response_time?: number;
}

export interface TransferSearchRequest {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  accountNumber: string;
  issuerCustomerId: string;
  trxDate: string; // formato "YYYY-MM-DD"
  issuerBankId: number;
  transactionType: number;
  paymentReference: string;
  amount: number;
  metadata?: {
    source?: string;
    returnUrl?: string;
    origin?: string;
    language?: string;
    timestamp?: string;
  };
}

export interface TransferSearchResponse {
  success: boolean;
  status: string;
  message: string;
  data?: {
    transactionFound: boolean;
    transactionDetails?: {
      
      reference: string;
      amount: number;
      date: string;
      account: string;
      status: string;
      [key: string]: any;
    };
    bankResponse?: {
      code: string;
      message: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export interface MobilePaymentSearchRequest {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  amount: number;
  currency: string; // AÑADIR esta propiedad
  originMobileNumber: string; // AÑADIR esta propiedad  
  destinationMobileNumber: string; // AÑADIR esta propiedad
  paymentReference: string;
  trxDate: string;
  
  // HACER OPCIONALES o ELIMINAR las que no usas:
  phoneNumber?: string;
  issuerCustomerId?: string;
  issuerBankId?: number;
  transactionType?: number;
  
  metadata?: {
    source?: string;
    returnUrl?: string;
    origin?: string;
    language?: string;
    timestamp?: string;
  };
}

export interface MobilePaymentSearchResponse {
  success: boolean;
  message: string;
  data?: {
    transactionFound: boolean;
    transactionDetails?: any;
    bankResponse?: any;
    [key: string]: any;
  };
}

// Tipo genérico para resultados de búsqueda
export interface SearchResult {
  id: string;
  reference: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method: 'transfer' | 'mobile_payment';
  details?: any;
}