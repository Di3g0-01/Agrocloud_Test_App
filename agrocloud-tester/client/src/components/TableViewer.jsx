import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import Alert from './Alert.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import { RefreshCw, Trash2, ChevronLeft, ChevronRight, Plus, Database } from 'lucide-react';

export default function TableViewer({ onNavigateToInsert }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState({ rows: [], total: 0, limit: 50, offset: 0 });
  const [columns, setColumns] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Modal para eliminar
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, rowId: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableMetaAndRows(selectedTable, 0);
    }
  }, [selectedTable]);

  async function fetchTables() {
    setLoadingTables(true);
    try {
      const data = await api.getTables();
      setTables(data);
      if (data.length > 0 && !selectedTable) {
        // Seleccionar la primera que exista o la primera de la lista
        const first = data.find(t => t.exists) || data[0];
        setSelectedTable(first.name);
      }
    } catch (err) {
      setAlertMsg({ type: 'error', message: 'Error cargando tablas: ' + err.message });
    } finally {
      setLoadingTables(false);
    }
  }

  async function fetchTableMetaAndRows(tableName, offset = 0) {
    setLoadingRows(true);
    setAlertMsg(null);
    try {
      // 1. Obtener columnas
      const meta = await api.getTableMeta(tableName);
      setColumns(meta.columns || []);

      // 2. Obtener filas
      const rowsRes = await api.getTableRows(tableName, 50, offset);
      setTableData(rowsRes);
    } catch (err) {
      setAlertMsg({ type: 'error', message: `Error cargando "${tableName}": ${err.message}` });
      setTableData({ rows: [], total: 0, limit: 50, offset: 0 });
    } finally {
      setLoadingRows(false);
    }
  }

  const handleRefresh = () => {
    if (selectedTable) {
      fetchTables();
      fetchTableMetaAndRows(selectedTable, tableData.offset);
    }
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, tableData.offset - tableData.limit);
    fetchTableMetaAndRows(selectedTable, newOffset);
  };

  const handleNextPage = () => {
    const newOffset = tableData.offset + tableData.limit;
    if (newOffset < tableData.total) {
      fetchTableMetaAndRows(selectedTable, newOffset);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ isOpen: true, rowId: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.rowId) return;
    setDeleting(true);
    try {
      await api.deleteTableRow(selectedTable, deleteModal.rowId);
      setAlertMsg({ type: 'success', message: `Registro #${deleteModal.rowId} eliminado con éxito` });
      setDeleteModal({ isOpen: false, rowId: null });
      // Recargar filas y contadores
      fetchTables();
      fetchTableMetaAndRows(selectedTable, tableData.offset);
    } catch (err) {
      setAlertMsg({ type: 'error', message: err.message });
      setDeleteModal({ isOpen: false, rowId: null });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {alertMsg && <Alert type={alertMsg.type} message={alertMsg.message} />}

      {/* Barra de control superior */}
      <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">Tabla:</label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            disabled={loadingTables}
            className="h-9 bg-[#0f1115] border border-[#262b36] focus:border-[#16a34a] outline-none px-3 text-sm rounded-[4px] text-[#e5e7eb] font-mono transition-colors duration-150 min-w-[200px]"
          >
            {tables.map(t => (
              <option key={t.name} value={t.name}>
                {t.name} ({t.count}) {!t.exists ? '[no creada]' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loadingRows || loadingTables}
            className="h-9 px-3 text-sm font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[4px] hover:bg-[#1b1f28] transition-colors duration-150 flex items-center gap-1.5"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRows ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToInsert && (
            <button
              type="button"
              onClick={() => onNavigateToInsert(selectedTable)}
              className="h-9 px-3 text-sm font-medium text-white bg-[#16a34a] hover:bg-[#15803d] rounded-[4px] transition-colors duration-150 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo registro</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenedor de Tabla de Datos */}
      <div className="bg-[#171a21] border border-[#262b36] rounded-[6px] overflow-hidden">
        {loadingRows ? (
          <div className="p-12 flex flex-col items-center justify-center text-[#9ca3af] gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#16a34a]" />
            <span className="text-sm">Cargando datos de {selectedTable}...</span>
          </div>
        ) : tableData.rows.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Database className="w-8 h-8 text-[#9ca3af] opacity-50" />
            <div className="text-sm text-[#9ca3af]">Esta tabla no tiene registros</div>
            {onNavigateToInsert && (
              <button
                type="button"
                onClick={() => onNavigateToInsert(selectedTable)}
                className="h-9 px-4 text-sm font-medium text-white bg-[#16a34a] hover:bg-[#15803d] rounded-[6px] transition-colors duration-150 flex items-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar registro</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#e5e7eb] border-collapse">
              <thead>
                <tr className="bg-[#1f2430] border-b border-[#262b36] text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-16 text-center">Acciones</th>
                  {columns.map(col => (
                    <th key={col.name} className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>{col.name}</span>
                        {col.fk && <span className="text-[10px] text-[#16a34a] font-mono lowercase">(fk)</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262b36]">
                {tableData.rows.map((row, idx) => {
                  const rowId = row.id;
                  return (
                    <tr key={rowId || idx} className="hover:bg-[#1b1f28] transition-colors duration-150">
                      <td className="py-2 px-3 text-center">
                        {rowId !== undefined ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(rowId)}
                            className="p-1 text-[#9ca3af] hover:text-[#dc2626] transition-colors duration-150 rounded"
                            title={`Eliminar fila #${rowId}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[#9ca3af]">-</span>
                        )}
                      </td>
                      {columns.map(col => {
                        const val = row[col.name];
                        let renderedVal;

                        if (val === null || val === undefined) {
                          renderedVal = <span className="text-[#9ca3af] italic">null</span>;
                        } else if (typeof val === 'boolean') {
                          renderedVal = (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${val ? 'bg-[#16a34a]/20 text-[#86efac]' : 'bg-[#dc2626]/20 text-[#fca5a5]'}`}>
                              {val ? 'true' : 'false'}
                            </span>
                          );
                        } else if (typeof val === 'object') {
                          renderedVal = <span className="font-mono">{JSON.stringify(val)}</span>;
                        } else {
                          const isMono = col.name === 'id' || col.fk !== null;
                          renderedVal = <span className={isMono ? 'font-mono' : ''}>{String(val)}</span>;
                        }

                        return (
                          <td key={col.name} className="py-2 px-3 whitespace-nowrap">
                            {renderedVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación simple */}
        <div className="p-3 bg-[#171a21] border-t border-[#262b36] flex items-center justify-between text-xs text-[#9ca3af]">
          <div>
            Mostrando {tableData.total === 0 ? 0 : tableData.offset + 1} a{' '}
            {Math.min(tableData.offset + tableData.limit, tableData.total)} de {tableData.total} registros
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={tableData.offset === 0 || loadingRows}
              className="h-8 px-2.5 text-xs font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[4px] hover:bg-[#1b1f28] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={tableData.offset + tableData.limit >= tableData.total || loadingRows}
              className="h-8 px-2.5 text-xs font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[4px] hover:bg-[#1b1f28] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-1"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, rowId: null })}
        onConfirm={confirmDelete}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar el registro #${deleteModal.rowId} de la tabla "${selectedTable}"? Si existen registros que dependen de esta llave foránea, la operación será rechazada por PostgreSQL.`}
        confirmText={deleting ? 'Eliminando...' : 'Eliminar fila'}
        danger={true}
        isConfirmDisabled={deleting}
      />
    </div>
  );
}
