import React, { useState } from 'react';
import { api } from '../api.js';
import Alert from './Alert.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import { Trash2, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function Maintenance({ activeSchema, onResetSuccess }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [typedSchema, setTypedSchema] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultCounts, setResultCounts] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const handleOpenModal = () => {
    setTypedSchema('');
    setAlertMsg(null);
    setResultCounts(null);
    setModalOpen(true);
  };

  const handleConfirmReset = async () => {
    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await api.resetTables();
      setResultCounts(res.counts || {});
      setAlertMsg({ type: 'success', message: res.message || 'Todas las tablas han sido vaciadas con éxito.' });
      setModalOpen(false);
      if (onResetSuccess) onResetSuccess();
    } catch (err) {
      setAlertMsg({ type: 'error', message: err.message || 'Error al vaciar las tablas' });
    } finally {
      setLoading(false);
    }
  };

  const isSchemaMatch = typedSchema.trim() === (activeSchema || '').trim() && typedSchema.length > 0;

  return (
    <div className="space-y-4">
      {alertMsg && <Alert type={alertMsg.type} message={alertMsg.message} />}

      {/* Tarjeta de acción peligrosa */}
      <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#262b36] mb-4 text-[#dc2626]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h2 className="text-sm font-semibold text-[#e5e7eb]">Zona de Peligro: Reinicio de Tablas</h2>
        </div>

        <p className="text-sm text-[#9ca3af] mb-4">
          Esta acción ejecutará una instrucción SQL destructiva en el esquema actual:
          <code className="block mt-2 p-2 bg-[#0f1115] border border-[#262b36] rounded text-xs font-mono text-[#fca5a5]">
            TRUNCATE TABLE ... RESTART IDENTITY CASCADE;
          </code>
          Todas las filas de las 8 tablas serán eliminadas permanentemente y los generadores de IDs volverán a 1.
        </p>

        <div className="p-3 bg-[#0f1115] border border-[#262b36] rounded-[4px] mb-4 text-xs">
          <span className="text-[#9ca3af]">Esquema objetivo actual: </span>
          <span className="font-mono text-[#e5e7eb] font-semibold">{activeSchema || 'Desconocido'}</span>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="h-9 px-4 text-sm font-medium text-white bg-[#dc2626] hover:bg-red-700 rounded-[6px] transition-colors duration-150 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Vaciar todas las tablas</span>
        </button>
      </div>

      {/* Resultados de vaciado si se ejecutó */}
      {resultCounts && (
        <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#262b36] mb-4 text-[#16a34a]">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-[#e5e7eb]">Conteo de filas resultante</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(resultCounts).map(([tableName, count]) => (
              <div key={tableName} className="p-3 bg-[#0f1115] border border-[#262b36] rounded-[4px] text-center">
                <span className="text-xs text-[#9ca3af] block">{tableName}</span>
                <span className="font-mono text-sm font-semibold text-[#16a34a]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmación que exige escribir el esquema */}
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Confirmar vaciado total del esquema"
        confirmText={loading ? 'Vaciando...' : 'Confirmar vaciado'}
        danger={true}
        isConfirmDisabled={!isSchemaMatch || loading}
      >
        <div className="space-y-3">
          <p className="text-xs text-[#9ca3af]">
            Para evitar pérdidas accidentales de datos, escribe el nombre exacto del esquema activo:{' '}
            <strong className="text-[#e5e7eb] font-mono select-all">{activeSchema}</strong>
          </p>

          <input
            type="text"
            value={typedSchema}
            onChange={(e) => setTypedSchema(e.target.value)}
            placeholder={`Escribe "${activeSchema}"`}
            autoFocus
            className="w-full h-9 bg-[#0f1115] border border-[#262b36] focus:border-[#dc2626] outline-none px-3 text-sm rounded-[4px] text-[#e5e7eb] font-mono transition-colors duration-150"
          />

          {!isSchemaMatch && typedSchema.length > 0 && (
            <span className="text-[11px] text-[#dc2626] block">
              El nombre no coincide exactamente.
            </span>
          )}
        </div>
      </ConfirmModal>
    </div>
  );
}
