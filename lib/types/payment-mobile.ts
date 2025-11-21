export interface PaymentMobileClientData {
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

export interface PaymentMobileAuthRequest {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  destinationId: string;
  destinationMobile: string;
}

export interface PaymentMobileAuthResponse {
  status: 'success' | 'error';
  message: string;
  processing_date: string;
  twofactor: {
    type: 'otp';
    label: string;
    field_type: 'numeric';
    length: string;
  };
  response_time: number;
}

export interface PaymentMobilePaymentRequest {
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  destinationId: string;
  destinationMobile: string;
  originMobile: string;
  amount: number;
  invoiceNumber: string;
  twofactorAuth: string;

  phoneNumber?: string;
  issuerCustomerId?: string;
  issuerBankId?: string;
  transactionType?: string;
}

export interface PaymentMobilePaymentResponse {
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