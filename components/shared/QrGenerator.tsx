
'use client';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react'; 

interface QrGeneratorProps {
  serviceType: 'tdc' | 'tdd' | 'payment-mobile' | 'search-transfers' | 'search-mobile-payments';
  encryptedClient: string;
  encryptedMerchant: string;
  encryptedKey: string;
  merchantName?: string;
  baseUrl?: string;
}

export default function QrGenerator({ 
  serviceType,
  encryptedClient,
  encryptedMerchant,
  encryptedKey,
  merchantName = 'Mi Comercio',
  baseUrl = 'https://lixie-payment-iframe-mercantil-o4ep.vercel.app/'
}: QrGeneratorProps) {
  const [showQr, setShowQr] = useState(false);
  const [qrSize, setQrSize] = useState(256);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [amount, setAmount] = useState<number>(100.50); // ✅ Agregar campo amount
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Generar número de factura automáticamente
  useEffect(() => {
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
  }, []);

  // Mover la generación de URL a useEffect
  useEffect(() => {
    const generatePaymentUrl = () => {
      // ✅ INCLUIR TODOS LOS CAMPOS REQUERIDOS
      const paymentData = {
        encryptedClient,
        encryptedMerchant, 
        encryptedKey,
        amount: amount, // ✅ REQUERIDO
        invoiceNumber: invoiceNumber, // ✅ REQUERIDO
        description: `Pago ${merchantName} - ${getServiceName(serviceType)}`, // ✅ RECOMENDADO
        customerId: "v8019884", // ✅ OPCIONAL pero recomendado
        timestamp: new Date().toISOString(),
        merchant: merchantName
      };

      // Codificar los datos en base64
      const encodedData = btoa(JSON.stringify(paymentData));
      
      // Determinar la ruta según el tipo de servicio
      const routes = {
        'tdc': '/Mercantil/payment/tdc',
        'tdd': '/Mercantil/payment/tdd', 
        'payment-mobile': '/Mercantil/payment/payment-mobile',
        'search-transfers': '/Mercantil/search/transfers',
        'search-mobile-payments': '/Mercantil/search/mobile-payments'
      };

      const route = routes[serviceType];
      return `${baseUrl}${route}?data=${encodedData}&mode=standalone`;
    };

    setPaymentUrl(generatePaymentUrl());
  }, [serviceType, encryptedClient, encryptedMerchant, encryptedKey, merchantName, baseUrl, amount, invoiceNumber]);

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = qrSize;
        canvas.height = qrSize;
        ctx?.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-pago-${serviceType}-${merchantName}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
        🎯 QR de Pago - {merchantName}
      </h3>

      <div className="space-y-4">
        {/* Información del servicio */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Servicio:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div><strong>Tipo:</strong> {getServiceName(serviceType)}</div>
            <div><strong>Comercio:</strong> {merchantName}</div>
            <div><strong>Monto:</strong> ${amount.toFixed(2)}</div>
            <div><strong>Factura:</strong> {invoiceNumber}</div>
            <div>
              <strong>URL:</strong> 
              {paymentUrl ? (
                <span className="text-xs font-mono block truncate mt-1">
                  {paymentUrl}
                </span>
              ) : (
                <span className="text-xs text-gray-500 mt-1">Generando URL...</span>
              )}
            </div>
          </div>
        </div>

        {/* Controles adicionales para pagos */}
        {serviceType.includes('payment') && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Configuración de Pago</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Monto del Pago
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-green-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">
                  Número de Factura
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-123456"
                  className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-green-900 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Controles del QR */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Tamaño QR:
            </label>
            <select
              value={qrSize}
              onChange={(e) => setQrSize(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={128}>Pequeño (128px)</option>
              <option value={256}>Mediano (256px)</option>
              <option value={384}>Grande (384px)</option>
            </select>
          </div>

          <button
            onClick={() => setShowQr(!showQr)}
            disabled={!paymentUrl}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
          >
            {showQr ? '👁️ Ocultar QR' : '📱 Mostrar QR'}
          </button>
        </div>

        {/* QR Code */}
        {showQr && paymentUrl && (
          <div className="flex flex-col items-center space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <QRCodeSVG
                id="qr-code"
                value={paymentUrl}
                size={qrSize}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="Q"
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Escanee este código QR para acceder al pago
              </p>
              <button
                onClick={downloadQR}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                ⬇️ Descargar QR
              </button>
            </div>
          </div>
        )}

        {/* Información de uso */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">ℹ️ Campos incluidos en el QR:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Credenciales de comercio</li>
            <li>• Monto: ${amount.toFixed(2)}</li>
            <li>• Factura: {invoiceNumber}</li>
            <li>• Descripción del pago</li>
            <li>• Timestamp de generación</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Función helper para nombres de servicios
function getServiceName(serviceType: string): string {
  const names: { [key: string]: string } = {
    'tdc': 'Tarjeta de Crédito',
    'tdd': 'Tarjeta de Débito',
    'payment-mobile': 'Pago Móvil',
    'search-transfers': 'Búsqueda de Transferencias',
    'search-mobile-payments': 'Búsqueda de Pagos Móviles'
  };
  return names[serviceType] || serviceType;
}