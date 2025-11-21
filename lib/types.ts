export interface EncryptedCredentials {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
}

export interface AuthRequest extends EncryptedCredentials {
  cardNumber: string;
  customerId: string;
}

export interface AuthResponse {
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

export interface PaymentRequest {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  cardNumber: string;
  cvv: string;
  expirationDate: string; // Formato: "MM/AAAA" o "102027"
  customerId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: 'tdc' | 'tdd' | 'pago_movil';
}

export interface ClientData {
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





export interface PaymentResponse {
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













// Agregar esto al final del archivo
export interface AuthResponse {
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