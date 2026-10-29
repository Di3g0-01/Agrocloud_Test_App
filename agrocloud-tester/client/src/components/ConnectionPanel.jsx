import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import Alert from './Alert.jsx';
import { RefreshCw, Play, CheckCircle2, XCircle } from 'lucide-react';

export default function ConnectionPanel({ onConnectionChanged, connectionStatus }) {
  const [formData, setFormData] = useState({
    host: 'localhost',
    port: 15432,
    database: '',
    user: '',
    password: '',
    schema: 'inst_parcela_de_peces_8b16fd',
    ssl: false
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  // Cargar configuración actual
  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const data = await api.getConnection();
      setFormData(prev => ({
        ...prev,
        host: data.host || 'localhost',
        port: data.port || 15432,
        database: data.database || '',
        user: data.user || '',
        password: '',
        schema: data.schema || 'inst_parcela_de_peces_8b16fd',
        ssl: Boolean(data.ssl)
      }));
    } catch (err) {
      setAlertMsg({ type: 'error', message: 'No se pudo cargar la configuración: ' + err.message });
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    setTesting(true);
    setAlertMsg(null);
    setTestResult(null);

    try {
      // 1. Reconfigurar pool en backend
      await api.setConnection(formData);
      
      // 2. Probar conexión inmediata con health
      const health = await api.getHealth();
      setTestResult({
        success: true,
        schema: health.schema,
        version: health.version,
        latencyMs: health.latencyMs
      });
      setAlertMsg({ type: 'success', message: 'Conexión reconfigurada y verificada con éxito' });
      if (onConnectionChanged) onConnectionChanged();
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      });
      setAlertMsg({ type: 'error', message: err.message });
      if (onConnectionChanged) onConnectionChanged();
    } finally {
      setTesting(false);
    }
  };

  const handleTestOnly = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const health = await api.getHealth();
      setTestResult({
        success: true,
        schema: health.schema,
        version: health.version,
        latencyMs: health.latencyMs
      });
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {alertMsg && (
        <Alert type={alertMsg.type} message={alertMsg.message} />
      )}

      {/* Tarjeta de Formulario de Conexión */}
      <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#262b36] mb-4">
          <h2 className="text-sm font-semibold text-[#e5e7eb]">Parámetros de conexión a PostgreSQL</h2>
          {loading && <RefreshCw className="w-4 h-4 text-[#9ca3af] animate-spin" />}
        </div>

        <form onSubmit={handleSaveAndTest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9ca3af] mb-1">Host (DB_HOST)</label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                required
                placeholder="localhost o host.render.com"
                className="w-full h-9 bg-[#0f1115] border border-[#262b36] focus:border-[#16a34a] outline-none px-3 text-sm rounded-[4px] text-[#e5e7eb] font-mono transition-colors duration-150"
              />
              <span className="text-[12px] text-[#9ca3af] mt-1 block">localhost para Docker, endpoint remoto para Render</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9ca3af] mb-1">Puerto (DB_PORT)</label>
              <input
                type="number"
                name="port"
                value={formData.port}
                onChange={handleChange}
                required
                className="w-full h-9 bg-[#0f1115] border border-[#262b36] focus:border-[#16a34a] outline-none px-3 text-sm rounded-[4px] text-[#e5e7eb] font-mono transition-colors duration-150"
              />
              <span className="text-[12px] text-[#9ca3af] mt-1 block">15432 para Docker local, 5432 para Render</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9ca3af] mb-1">Base de datos (DB_NAME)</label>
              <input
                type="text"
                name="database"
                value={formData.database}
                onChange={handleChange}
                required
                placeholder="agrocloud_db"
                className="w-full h-9 bg-[#0f1115] border border-[#262b36] focus:border-[#16a34a] outline-none px-3 text-sm rounded-[4px] text-[#e5e7eb] font-mono transition-colors duration-150"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9ca3af] mb-1">Usuario (DB_USER)</label>
              <input
                type="text"
                name="user"
                value={formData.user}
                onChange={handleChange}
                required
                placeholder="postgres"
                className="w-full h-9 bg-[#0f1115] border border-[#262b36] focus:border-[#16a34a] outline-none px-3 text-sm rounded-[4px] text-[#e5e7eb] font-mono transition-colors duration-150"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9ca3af] mb-1">Contraseña (DB_PASSWORD)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-9 bg-[#0f1115] border border-[#262b36] focus:border-[#16a34a] outline-none px-3 text-sm rounded-[4px] text-[#e5e7eb] font-mono transition-colors duration-150"
              />
              <span className="text-[12px] text-[#9ca3af] mt-1 block">Dejar vacío para conservar la actual</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9ca3af] mb-1">Esquema (DB_SCHEMA)</label>
              <input
                type="text"
                name="schema"
                value={formData.schema}
                onChange={handleChange}
                required
                pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                title="Debe empezar con letra o guion bajo y contener solo alfanuméricos o guiones bajos"
                placeholder="inst_parcela_de_peces_8b16fd"
                className="w-full h-9 bg-[#0f1115] border border-[#262b36] focus:border-[#16a34a] outline-none px-3 text-sm rounded-[4px] text-[#e5e7eb] font-mono transition-colors duration-150"
              />
              <span className="text-[12px] text-[#9ca3af] mt-1 block">Regex validada: ^[a-zA-Z_][a-zA-Z0-9_]*$</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#262b36]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="ssl"
                checked={formData.ssl}
                onChange={handleChange}
                className="w-4 h-4 bg-[#0f1115] border border-[#262b36] rounded text-[#16a34a] focus:ring-0"
              />
              <span className="text-sm text-[#e5e7eb]">Habilitar SSL (obligatorio para Render, rejectUnauthorized: false)</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestOnly}
                disabled={testing}
                className="h-9 px-4 text-sm font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[6px] hover:bg-[#1b1f28] transition-colors duration-150 flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-[#9ca3af]" />}
                Probar conexión actual
              </button>

              <button
                type="submit"
                disabled={testing}
                className="h-9 px-4 text-sm font-medium text-white bg-[#16a34a] hover:bg-[#15803d] rounded-[6px] transition-colors duration-150 flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Guardar y reconectar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tarjeta de Diagnóstico / Resultado de Prueba */}
      {testResult && (
        <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#262b36] mb-4">
            <h2 className="text-sm font-semibold text-[#e5e7eb]">Resultado de prueba de conexión</h2>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  testResult.success ? 'bg-[#16a34a]' : 'bg-[#dc2626]'
                }`}
              ></span>
              <span className="text-xs font-mono text-[#e5e7eb]">
                {testResult.success ? 'Conectado' : 'Error'}
              </span>
            </div>
          </div>

          {testResult.success ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-[#0f1115] border border-[#262b36] rounded-[4px]">
                <span className="text-xs text-[#9ca3af] block mb-1">Esquema activo</span>
                <span className="font-mono text-[#e5e7eb] font-medium">{testResult.schema}</span>
              </div>
              <div className="p-3 bg-[#0f1115] border border-[#262b36] rounded-[4px]">
                <span className="text-xs text-[#9ca3af] block mb-1">Latencia</span>
                <span className="font-mono text-[#16a34a] font-medium">{testResult.latencyMs} ms</span>
              </div>
              <div className="p-3 bg-[#0f1115] border border-[#262b36] rounded-[4px] md:col-span-3">
                <span className="text-xs text-[#9ca3af] block mb-1">Versión del motor PostgreSQL</span>
                <span className="font-mono text-xs text-[#9ca3af] break-all">{testResult.version}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#0f1115] border border-[#dc2626] rounded-[4px]">
              <div className="flex items-center gap-2 text-[#dc2626] text-sm font-medium mb-1">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Mensaje textual de error devuelto por PostgreSQL:</span>
              </div>
              <pre className="text-xs font-mono text-[#fca5a5] whitespace-pre-wrap break-all mt-2 p-2 bg-[#171a21] rounded">
                {testResult.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
