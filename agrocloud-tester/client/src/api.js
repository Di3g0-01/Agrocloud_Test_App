// Cliente de API REST para AgroCloud Tester

async function handleResponse(res) {
  let data = {};
  try {
    data = await res.json();
  } catch (_) {}
  
  if (!res.ok) {
    const errorMsg = data.error || (data.status === 'Error' && data.error) || `Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Conexión
  async getConnection() {
    const res = await fetch('/api/connection');
    return handleResponse(res);
  },

  async setConnection(config) {
    const res = await fetch('/api/connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return handleResponse(res);
  },

  // Health
  async getHealth() {
    const res = await fetch('/api/health');
    return handleResponse(res);
  },

  // Tablas
  async getTables() {
    const res = await fetch('/api/tables');
    return handleResponse(res);
  },

  async getTableMeta(tableName) {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/meta`);
    return handleResponse(res);
  },

  async getTableRows(tableName, limit = 50, offset = 0) {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/rows?limit=${limit}&offset=${offset}`);
    return handleResponse(res);
  },

  async getTableOptions(tableName) {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/options`);
    return handleResponse(res);
  },

  async insertTableRow(tableName, data) {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteTableRow(tableName, id) {
    const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/rows/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Mantenimiento
  async resetTables() {
    const res = await fetch('/api/reset', {
      method: 'POST'
    });
    return handleResponse(res);
  }
};
