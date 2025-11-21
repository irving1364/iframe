'use client';
import { useState } from 'react';
import QrGenerator from '../../components/shared/QrGenerator';

type ServiceType = 'tdc' | 'tdd' | 'payment-mobile' | 'search-transfers' | 'search-mobile-payments';

export default function GenerateQrPage() {
  const [serviceType, setServiceType] = useState<ServiceType>('tdc');
  const [merchantName, setMerchantName] = useState('Mi Comercio');
  const [baseUrl, setBaseUrl] = useState('https://lixie-payment-iframe-mercantil-o4ep.vercel.app');
  
  // Tus credenciales de ejemplo - en producción esto vendría de una base de datos o configuración
  const [credentials, setCredentials] = useState({
    encryptedClient: "pXsM1bjazk/Gc7ASLqJLje4Hc8VR3MPD4Q+D8t46NMvTnPDDCz3ItgPpOby/5Rop",
    encryptedMerchant: "XAhbCqpM4LIWlGq+eA85Tg==",
    encryptedKey: "i9lmbuSvM95bN1EERt78dLEKuEzbnmlCspcs3erDSQ8="
  });

  const serviceTypes: { value: ServiceType; label: string }[] = [
    { value: 'tdc', label: '💳 Tarjeta de Crédito' },
    { value: 'tdd', label: '💳 Tarjeta de Débito' },
    { value: 'payment-mobile', label: '📱 Pago Móvil' },
    //{ value: 'search-transfers', label: '🔍 Búsqueda de Transferencias' },
    //{ value: 'search-mobile-payments', label: '🔍 Búsqueda de Pagos Móviles' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎯 Generador de Códigos QR
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Genera códigos QR personalizados para tus pasarelas de pago. 
            Tus clientes podrán escanear y pagar directamente.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de configuración */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                ⚙️ Configuración
              </h2>

              <div className="space-y-6">
                {/* Tipo de servicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Servicio
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                  >
                    {serviceTypes.map((service) => (
                      <option key={service.value} value={service.value}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nombre del comercio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Comercio
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Mi Comercio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                  />
                </div>

                {/* URL Base */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Base de tu App
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://tu-dominio.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cambia por tu dominio real en producción
                  </p>
                </div>

                {/* Credenciales (solo lectura para ejemplo) */}
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-800 text-sm mb-2">
                    🔐 Credenciales de Ejemplo
                  </h3>
                  <div className="text-xs space-y-1 text-yellow-700">
                    <div><strong>Client:</strong> {credentials.encryptedClient.substring(0, 20)}...</div>
                    <div><strong>Merchant:</strong> {credentials.encryptedMerchant}</div>
                    <div><strong>Key:</strong> {credentials.encryptedKey.substring(0, 20)}...</div>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    En producción, estas credenciales se cargarían automáticamente según el comercio.
                  </p>
                </div>

                {/* Información */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 text-sm mb-2">
                    💡 Como usar
                  </h3>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>1. Selecciona el tipo de servicio</li>
                    <li>2. Personaliza el nombre del comercio</li>
                    <li>3. Configura tu URL base</li>
                    <li>4. Genera y descarga el QR</li>
                    <li>5. Comparte con tus clientes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Panel del QR */}
          <div className="lg:col-span-2">
            <QrGenerator
              serviceType={serviceType}
              encryptedClient={credentials.encryptedClient}
              encryptedMerchant={credentials.encryptedMerchant}
              encryptedKey={credentials.encryptedKey}
              merchantName={merchantName}
              baseUrl={baseUrl}
            />

            {/* Ejemplos de uso */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3">🏪 Para Comercios Físicos</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Imprimir QR en mostradores</li>
                  <li>• Pegar en ventanillas de pago</li>
                  <li>• Incluir en facturas</li>
                  <li>• Mostrar en pantallas</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3">🌐 Para Comercios Digitales</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Insertar en emails</li>
                  <li>• Compartir en redes sociales</li>
                  <li>• Incluir en apps móviles</li>
                  <li>• Agregar a sitios web</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}