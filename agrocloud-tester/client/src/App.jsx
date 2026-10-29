import React, { useState, useEffect } from 'react';
import { api } from './api.js';
import Sidebar from './components/Sidebar.jsx';
import ConnectionPanel from './components/ConnectionPanel.jsx';
import TableViewer from './components/TableViewer.jsx';
import InsertWizard from './components/InsertWizard.jsx';
import Maintenance from './components/Maintenance.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('connection');
  const [preselectedTable, setPreselectedTable] = useState('');
  
  // Estado global de conexión
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    schema: '',
    version: '',
    loading: true
  });

  const checkHealth = async () => {
    try {
      const data = await api.getHealth();
      setConnectionStatus({
        connected: true,
        schema: data.schema || '',
        version: data.version || '',
        loading: false
      });
    } catch (_) {
      setConnectionStatus({
        connected: false,
        schema: '',
        version: '',
        loading: false
      });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateToInsert = (tableName) => {
    setPreselectedTable(tableName);
    setActiveTab('insert');
  };

  const handleNavigateToViewer = (tableName) => {
    setActiveTab('tables');
  };

  const titles = {
    connection: 'Configuración de Conexión',
    tables: 'Visor de Tablas y Datos',
    insert: 'Asistente de Inserción Relacional',
    maintenance: 'Mantenimiento y Reinicio'
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e5e7eb] flex flex-col md:flex-row">
      {/* Barra lateral */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior de 56px */}
        <header className="h-14 bg-[#171a21] border-b border-[#262b36] px-6 flex items-center justify-between flex-shrink-0">
          <h1 className="text-sm font-semibold tracking-wide text-[#e5e7eb]">
            {titles[activeTab]}
          </h1>

          {/* Indicador de conexión */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-150 ${
                connectionStatus.loading
                  ? 'bg-gray-500 animate-pulse'
                  : connectionStatus.connected
                  ? 'bg-[#16a34a]'
                  : 'bg-[#dc2626]'
              }`}
            ></span>
            <span className="text-xs font-mono text-[#9ca3af]">
              {connectionStatus.loading
                ? 'Comprobando...'
                : connectionStatus.connected
                ? `Conectado a ${connectionStatus.schema}`
                : 'Sin conexión'}
            </span>
          </div>
        </header>

        {/* Contenido con max-w-[1200px] y padding de 24px */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto">
            {activeTab === 'connection' && (
              <ConnectionPanel
                onConnectionChanged={checkHealth}
                connectionStatus={connectionStatus}
              />
            )}

            {activeTab === 'tables' && (
              <TableViewer
                onNavigateToInsert={handleNavigateToInsert}
              />
            )}

            {activeTab === 'insert' && (
              <InsertWizard
                onNavigateToViewer={handleNavigateToViewer}
                preselectedTable={preselectedTable}
              />
            )}

            {activeTab === 'maintenance' && (
              <Maintenance
                activeSchema={connectionStatus.schema}
                onResetSuccess={checkHealth}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
