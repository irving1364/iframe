import Link from 'next/link';

export default function HomePage() {
  // Datos de ejemplo para los bancos y sus servicios
  const banks = [
    {
      id: 1,
      name: "Banco Mercantil",
      logo: "/images/mercantil-logo.png",
      services: [
        // Servicios de pago
        {
          name: "Tarjeta de Crédito",
          description: "Procesar pago con TDC",
          path: "Mercantil/payment/tdc",
          icon: "💳", 
          type: "payment"
        },
        {
          name: "Tarjeta de Débito",
          description: "Procesar pago con TDD",
          path: "Mercantil/payment/tdd",
          icon: "💳",
          type: "payment"
        },
        {
          name: "Pago Móvil",
          description: "Procesar pago móvil",
          path: "Mercantil/payment/payment-mobile",
          icon: "📱",
          type: "payment"
        },
        // Servicios de búsqueda
        {
          name: "Búsqueda de Transferencias",
          description: "Consulta y filtra transferencias",
          path: "Mercantil/search/transfers",
          icon: "🔍",
          type: "search",
          endpoint: "/api/search/transfers"
        },
        {
          name: "Búsqueda de Pago Móvil",
          description: "Consulta pagos móviles realizados",
          path: "Mercantil/search/mobile-payments",
          icon: "📱",
          type: "search",
          endpoint: "/api/search/mobile-payments"
        }
      ]
    }
  ];

  // Servicios adicionales de Connector (conciliaciones)
  const additionalServices = [
    {
      name: "Conciliaciones",
      description: "Conciliación automática de transacciones",
      path: "/reconciliation",
      icon: "📊",
      endpoint: "/api/reconciliation",
      color: "from-blue-500 to-cyan-500"
    }
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Logo Connector SVG */}
              <div className="w-10 h-10 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="40" 
                  height="40" 
                  viewBox="0 0 281.75 281.72"
                  className="text-purple-700"
                >
                  <path 
                    fill="currentColor" 
                    fillRule="evenodd" 
                    d="M9.25,9.28c0,93.75.51.48.51,94.23H131L9.76,224.72V291H76.05L197.26,169.8V291H291V9.76H103.51" 
                    transform="translate(-9.25 -9.28)"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Connector</h1>
                <p className="text-sm text-gray-500">Plataforma de pagos multi-banco</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 bg-purple-50 px-3 py-1 rounded-full">
              V1.0 - Conectando bancos
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center p-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="80" 
                height="80" 
                viewBox="0 0 281.75 281.72"
                className="text-purple-700"
              >
                <path 
                  fill="currentColor" 
                  fillRule="evenodd" 
                  d="M9.25,9.28c0,93.75.51.48.51,94.23H131L9.76,224.72V291H76.05L197.26,169.8V291H291V9.76H103.51" 
                  transform="translate(-9.25 -9.28)"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connector Payment Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Tu solución única para integrar pagos, automatizar conciliaciones y conectar múltiples bancos en un solo lugar
          </p>
          <div className="bg-white inline-flex rounded-lg border border-gray-200 p-1 shadow-sm">
            <span className="px-4 py-2 text-sm font-medium text-gray-700">Pagos</span>
            <span className="px-4 py-2 text-sm font-medium text-gray-700">Búsquedas</span>
            <span className="px-4 py-2 text-sm font-medium text-gray-700">Conciliaciones</span>
            <span className="px-4 py-2 text-sm font-medium text-gray-700">Multi-banco</span>
          </div>
        </div>
      </section>

      {/* Bancos Disponibles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bancos Conectados
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Selecciona un banco para acceder a sus servicios de pago disponibles
            </p>
          </div>
          
          {banks.map((bank) => (
            <div key={bank.id} className="mb-16">
              {/* Tarjeta del Banco */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8 shadow-lg mb-10">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center mb-6 md:mb-0">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mr-6 shadow-md">
                      <span className="text-purple-600 font-bold text-xl">BM</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{bank.name}</h2>
                      <p className="text-purple-100 mt-2">Servicios de pago y búsqueda disponibles</p>
                    </div>
                  </div>
                  <div className="bg-white text-purple-600 px-4 py-2 rounded-full font-semibold">
                    Banco Activo
                  </div>
                </div>
              </div>
              
              {/* Servicios de Pago */}
              <div className="mb-12">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600 text-lg">💳</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Servicios de Pago</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {bank.services
                    .filter(service => service.type === "payment")
                    .map((service, index) => (
                    <Link 
                      key={index} 
                      target="_blank" 
                      href={service.path} 
                      className="block bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:border-purple-500 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-50 to-blue-50 rounded-bl-full"></div>
                      
                      <div className="flex items-start mb-6 relative z-10">
                        <div className="text-3xl mr-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-xl">
                          {service.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-gray-600 mt-2">{service.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 relative z-10">
                        <span className="text-purple-600 font-medium">Procesar pago</span>
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Servicios de Búsqueda */}
              <div className="mb-12">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-lg">🔍</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Servicios de Búsqueda</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {bank.services
                    .filter(service => service.type === "search")
                    .map((service, index) => (
                    <Link 
                      key={index} 
                      href={service.path} 
                      className="block bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:border-blue-500 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-bl-full"></div>
                      
                      <div className="flex items-start mb-6 relative z-10">
                        <div className="text-3xl mr-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 rounded-xl">
                          {service.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-gray-600 mt-2">{service.description}</p>
                          <div className="mt-3 flex items-center text-sm text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Endpoint: {service.endpoint}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 relative z-10">
                        <span className="text-blue-600 font-medium">Consultar</span>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Servicios de Connector */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Servicios Connector
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Herramientas avanzadas para gestión y automatización
            </p>
          </div>


          
          


          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-2xl mx-auto">

            <Link href="/generate-qr" target='_blank' className="block bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:border-purple-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-bl-full"></div>
                
                <div className="flex items-start mb-6 relative z-10">
                  <div className="text-3xl mr-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      Generador de QR
                    </h3>
                    <p className="text-gray-600 mt-2">Crea códigos QR para tus pasarelas de pago</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 relative z-10">
                  <span className="text-purple-600 font-medium">Generar QR</span>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </Link>  


            {/* additionalServices.map((service, index) => (

              

              <Link 
                key={index} 
                href={service.path} 
                className="block bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:border-blue-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-bl-full"></div>
                
                <div className="flex items-start mb-6 relative z-10">
                  <div className={`text-3xl mr-4 bg-gradient-to-r ${service.color} text-white p-3 rounded-xl`}>
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 mt-2">{service.description}</p>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Endpoint: {service.endpoint}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 relative z-10">
                  <span className="text-blue-600 font-medium">Acceder al servicio</span>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </Link>
            ))*/}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="32" 
                  height="32" 
                  viewBox="0 0 281.75 281.72"
                  className="text-purple-700"
                >
                  <path 
                    fill="currentColor" 
                    fillRule="evenodd" 
                    d="M9.25,9.28c0,93.75.51.48.51,94.23H131L9.76,224.72V291H76.05L197.26,169.8V291H291V9.76H103.51" 
                    transform="translate(-9.25 -9.28)"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Connector</h3>
                <p className="text-sm text-gray-500">Plataforma de pagos multi-banco</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Connector - Conectando el ecosistema financiero
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Pagos • Búsquedas • Conciliaciones • Automatización • Multi-banco
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}