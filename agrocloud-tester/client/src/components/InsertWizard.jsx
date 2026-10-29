import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import DynamicForm from './DynamicForm.jsx';
import Alert from './Alert.jsx';
import { Check, ChevronRight, Layers, Table, Plus, ExternalLink } from 'lucide-react';

export default function InsertWizard({ onNavigateToViewer, preselectedTable }) {
  const [step, setStep] = useState(1);
  const [createdItems, setCreatedItems] = useState([]);
  const [step1Table, setStep1Table] = useState('parcelas'); // parcelas, variedades, sectores
  const [step3Table, setStep3Table] = useState('siembras'); // siembras, cosechas
  const [otherTable, setOtherTable] = useState(''); // suelos, bitacora, cosechas, etc.

  // Verificaciones de existencia para FKs
  const [dependencyStatus, setDependencyStatus] = useState({
    parcelasCount: 0,
    variedadesCount: 0,
    cultivosCount: 0
  });

  useEffect(() => {
    checkCounts();
  }, [step]);

  useEffect(() => {
    if (preselectedTable) {
      if (['parcelas', 'variedades', 'sectores'].includes(preselectedTable)) {
        setStep(1);
        setStep1Table(preselectedTable);
      } else if (preselectedTable === 'cultivos') {
        setStep(2);
      } else if (['siembras', 'cosechas'].includes(preselectedTable)) {
        setStep(3);
        setStep3Table(preselectedTable);
      } else {
        setOtherTable(preselectedTable);
      }
    }
  }, [preselectedTable]);

  async function checkCounts() {
    try {
      const tables = await api.getTables();
      const findCount = (name) => {
        const item = tables.find(t => t.name === name);
        return item ? item.count : 0;
      };
      setDependencyStatus({
        parcelasCount: findCount('parcelas'),
        variedadesCount: findCount('variedades'),
        cultivosCount: findCount('cultivos')
      });
    } catch (_) {}
  }

  const handleCreated = (row, table) => {
    setCreatedItems(prev => [
      ...prev,
      {
        id: row.id || `temp-${Date.now()}`,
        table,
        timestamp: new Date().toLocaleTimeString(),
        data: row
      }
    ]);
    checkCounts();
  };

  const steps = [
    { number: 1, label: 'Maestras' },
    { number: 2, label: 'Cultivo' },
    { number: 3, label: 'Siembra / Cosecha' },
    { number: 4, label: 'Resumen' },
  ];

  return (
    <div className="space-y-4">
      {/* Selector rápido "Otras tablas" */}
      <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-[#9ca3af]">¿Deseas insertar directamente en otra tabla?</span>
        <div className="flex items-center gap-2">
          <select
            value={otherTable}
            onChange={(e) => setOtherTable(e.target.value)}
            className="h-8 bg-[#0f1115] border border-[#262b36] focus:border-[#16a34a] outline-none px-2 text-xs rounded-[4px] text-[#e5e7eb] font-mono"
          >
            <option value="">-- Seleccionar tabla directa --</option>
            <option value="suelos">suelos (hija de parcelas)</option>
            <option value="bitacora">bitacora (hija de parcelas)</option>
            <option value="cosechas">cosechas (hija de cultivos)</option>
            <option value="siembras">siembras (hija de cultivos)</option>
            <option value="sectores">sectores</option>
            <option value="variedades">variedades</option>
            <option value="parcelas">parcelas</option>
            <option value="cultivos">cultivos</option>
          </select>
          {otherTable && (
            <button
              type="button"
              onClick={() => setOtherTable('')}
              className="text-[#9ca3af] hover:text-[#e5e7eb] text-xs underline"
            >
              Cerrar inserción directa
            </button>
          )}
        </div>
      </div>

      {/* Si se seleccionó una tabla directa, mostrar su formulario */}
      {otherTable ? (
        <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#262b36] mb-4">
            <h2 className="text-sm font-semibold text-[#e5e7eb]">
              Inserción directa en: <span className="text-[#16a34a] font-mono">{otherTable}</span>
            </h2>
            <button
              onClick={() => setOtherTable('')}
              className="text-xs text-[#9ca3af] hover:text-[#e5e7eb]"
            >
              Volver al asistente
            </button>
          </div>
          <DynamicForm
            tableName={otherTable}
            onSuccess={(row) => handleCreated(row, otherTable)}
            onCancel={() => setOtherTable('')}
          />
        </div>
      ) : (
        <>
          {/* Stepper Horizontal */}
          <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-4">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((st, i) => {
                const isCurrent = step === st.number;
                const isDone = step > st.number;

                return (
                  <React.Fragment key={st.number}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStep(st.number)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-150 ${
                          isDone
                            ? 'bg-[#16a34a] text-white'
                            : isCurrent
                            ? 'bg-[#16a34a] text-white ring-2 ring-[#16a34a]/30'
                            : 'border border-[#262b36] text-[#9ca3af] bg-[#0f1115]'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : st.number}
                      </button>
                      <span
                        className={`text-xs hidden sm:inline ${
                          isCurrent ? 'text-[#e5e7eb] font-medium' : 'text-[#9ca3af]'
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>

                    {i < steps.length - 1 && (
                      <div
                        className={`flex-1 h-[2px] mx-2 ${
                          step > st.number ? 'bg-[#16a34a]' : 'bg-[#262b36]'
                        }`}
                      ></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Contenido de cada paso */}
          <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-5">
            {/* PASO 1: MAESTRAS */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#262b36]">
                  <div>
                    <h2 className="text-sm font-semibold text-[#e5e7eb]">Paso 1: Tablas Maestras (Sin dependencias)</h2>
                    <p className="text-xs text-[#9ca3af] mt-0.5">
                      Crea entidades base: Parcela, Variedad o Sector.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {['parcelas', 'variedades', 'sectores'].map((tbl) => (
                      <button
                        key={tbl}
                        onClick={() => setStep1Table(tbl)}
                        className={`h-8 px-3 text-xs font-medium rounded-[4px] border transition-colors duration-150 ${
                          step1Table === tbl
                            ? 'bg-[#1f2430] border-[#16a34a] text-[#e5e7eb]'
                            : 'border-[#262b36] text-[#9ca3af] hover:text-[#e5e7eb]'
                        }`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>
                </div>

                <DynamicForm
                  tableName={step1Table}
                  onSuccess={(row) => handleCreated(row, step1Table)}
                />

                <div className="pt-4 border-t border-[#262b36] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-9 px-4 text-sm font-medium text-white bg-[#16a34a] hover:bg-[#15803d] rounded-[6px] transition-colors duration-150 flex items-center gap-1.5"
                  >
                    <span>Ir a Paso 2: Cultivo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: CULTIVO */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#262b36]">
                  <h2 className="text-sm font-semibold text-[#e5e7eb]">Paso 2: Cultivo (Central)</h2>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    Un cultivo asocia una Parcela existente con una Variedad existente.
                  </p>
                </div>

                {dependencyStatus.parcelasCount === 0 || dependencyStatus.variedadesCount === 0 ? (
                  <div className="space-y-3">
                    <Alert
                      type="warning"
                      title="Faltan registros requeridos para crear un cultivo"
                      message="No se pueden crear cultivos porque aún no existen parcelas o variedades registradas en este esquema."
                    />
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-9 px-4 text-sm font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[6px] hover:bg-[#1b1f28] transition-colors duration-150"
                    >
                      Volver al Paso 1: Crear Parcelas y Variedades
                    </button>
                  </div>
                ) : (
                  <>
                    <DynamicForm
                      tableName="cultivos"
                      onSuccess={(row) => handleCreated(row, 'cultivos')}
                    />

                    <div className="pt-4 border-t border-[#262b36] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="h-9 px-4 text-sm font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[6px] hover:bg-[#1b1f28] transition-colors duration-150"
                      >
                        Paso anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="h-9 px-4 text-sm font-medium text-white bg-[#16a34a] hover:bg-[#15803d] rounded-[6px] transition-colors duration-150 flex items-center gap-1.5"
                      >
                        <span>Ir a Paso 3: Siembra / Cosecha</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PASO 3: SIEMBRA O COSECHA */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#262b36]">
                  <div>
                    <h2 className="text-sm font-semibold text-[#e5e7eb]">Paso 3: Siembra o Cosecha (Hijas de Cultivo)</h2>
                    <p className="text-xs text-[#9ca3af] mt-0.5">
                      Registra una siembra o cosecha vinculada a un cultivo existente.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {['siembras', 'cosechas'].map((tbl) => (
                      <button
                        key={tbl}
                        onClick={() => setStep3Table(tbl)}
                        className={`h-8 px-3 text-xs font-medium rounded-[4px] border transition-colors duration-150 ${
                          step3Table === tbl
                            ? 'bg-[#1f2430] border-[#16a34a] text-[#e5e7eb]'
                            : 'border-[#262b36] text-[#9ca3af] hover:text-[#e5e7eb]'
                        }`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>
                </div>

                {dependencyStatus.cultivosCount === 0 ? (
                  <div className="space-y-3">
                    <Alert
                      type="warning"
                      title="No hay cultivos disponibles"
                      message="Se requiere al menos un cultivo registrado para poder asociar una siembra o cosecha."
                    />
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-9 px-4 text-sm font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[6px] hover:bg-[#1b1f28] transition-colors duration-150"
                    >
                      Volver al Paso 2: Crear Cultivo
                    </button>
                  </div>
                ) : (
                  <>
                    <DynamicForm
                      tableName={step3Table}
                      onSuccess={(row) => handleCreated(row, step3Table)}
                    />

                    <div className="pt-4 border-t border-[#262b36] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="h-9 px-4 text-sm font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[6px] hover:bg-[#1b1f28] transition-colors duration-150"
                      >
                        Paso anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="h-9 px-4 text-sm font-medium text-white bg-[#16a34a] hover:bg-[#15803d] rounded-[6px] transition-colors duration-150 flex items-center gap-1.5"
                      >
                        <span>Ver Resumen</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PASO 4: RESUMEN */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#262b36]">
                  <h2 className="text-sm font-semibold text-[#e5e7eb]">Paso 4: Resumen de inserciones en esta sesión</h2>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    Historial de registros creados recientemente con sus identificadores.
                  </p>
                </div>

                {createdItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#9ca3af]">
                    Aún no has creado ningún registro durante esta sesión.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {createdItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#0f1115] border border-[#262b36] rounded-[4px] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#16a34a] font-semibold">[{item.table}]</span>
                          <span className="text-[#e5e7eb]">ID: <span className="font-mono font-medium">{item.id}</span></span>
                          <span className="text-[#9ca3af] text-[11px]">({item.timestamp})</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onNavigateToViewer && onNavigateToViewer(item.table)}
                          className="text-xs text-[#16a34a] hover:underline flex items-center gap-1"
                        >
                          <span>Ver en el visor</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-[#262b36] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-9 px-4 text-sm font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[6px] hover:bg-[#1b1f28] transition-colors duration-150"
                  >
                    Empezar nuevo ciclo
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToViewer && onNavigateToViewer('cultivos')}
                    className="h-9 px-4 text-sm font-medium text-white bg-[#16a34a] hover:bg-[#15803d] rounded-[6px] transition-colors duration-150 flex items-center gap-1.5"
                  >
                    <span>Ir al Visor de tablas</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
