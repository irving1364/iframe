export interface TddAuthRequest {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  cardNumber: string;
  customerId: string;
}

export interface TddAuthResponse {
  status: 'success' | 'error';
  message: string;
  processing_date: string;
  trx_status: 'approved' | 'rejected';
  trx_type: string;
  payment_method: 'tdc' | 'tdd' | 'pago_movil';
  twofactor: {
    type: 'otp';
    label: string;
    field_type: 'numeric';
    length: string;
  };
  response_time: number;
}

export interface TddPaymentRequest {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  cardNumber: string;
  cvv: string;
  expirationDate: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: 'tdd'; 
  accountType: string; 
  twofactorAuth: string; 
}

export interface TddPaymentResponse {
  status: 'success' | 'error';
  message: string;
  processing_time: string;
  bank_response: {
    merchant_identify: {
      integratorId: number;
      merchantId: number;
      terminalId: string;
    };
    transaction_response: {
      processing_date: string;
      trx_status: 'approved' | 'rejected';
      payment_reference: string;
      trx_internal_status: string;
      trx_type: string;
      payment_method: string;
      invoice_number: string;
      amount: number;
      currency: string;
    };
  };
}

export interface TddClientData {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  invoiceNumber: string;
  amount: number;
  customerId?: string;
  description?: string;
  orderId?: string;
  metadata?: {
    source?: string;
    returnUrl?: string;
    origin?: string;
    language?: string;
    timestamp?: string;
  };
}