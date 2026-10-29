import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configuración actual en memoria
let currentConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '15432', 10),
  database: process.env.DB_NAME || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  schema: process.env.DB_SCHEMA || 'inst_parcela_de_peces_8b16fd',
  ssl: String(process.env.DB_SSL).toLowerCase() === 'true'
};

const SCHEMA_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const KNOWN_TABLES = [
  'sectores',
  'variedades',
  'parcelas',
  'suelos',
  'bitacora',
  'cultivos',
  'siembras',
  'cosechas'
];

let pool = null;

function createPgPool(cfg) {
  if (!SCHEMA_REGEX.test(cfg.schema)) {
    throw new Error('Nombre de esquema inválido. Solo letras, números y guiones bajos.');
  }

  const poolConfig = {
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    ssl: cfg.ssl ? { rejectUnauthorized: false } : false,
    options: `-c search_path=${cfg.schema},public`
  };

  return new pg.Pool(poolConfig);
}

// Inicializar pool
try {
  pool = createPgPool(currentConfig);
} catch (err) {
  console.error('Error inicializando pool:', err.message);
}

// Helper para validar nombres de tabla
async function validateTableName(tableName) {
  if (!pool) throw new Error('No hay conexión activa a la base de datos');
  const res = await pool.query(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = current_schema() AND table_name = $1`,
    [tableName]
  );
  return res.rows.length > 0;
}

// GET /api/connection
app.get('/api/connection', (req, res) => {
  res.json({
    host: currentConfig.host,
    port: currentConfig.port,
    database: currentConfig.database,
    user: currentConfig.user,
    password: '',
    schema: currentConfig.schema,
    ssl: currentConfig.ssl
  });
});

// POST /api/connection
app.post('/api/connection', async (req, res) => {
  const { host, port, database, user, password, schema, ssl } = req.body;

  if (schema && !SCHEMA_REGEX.test(schema)) {
    return res.status(400).json({ error: 'Nombre de esquema inválido. Debe cumplir ^[a-zA-Z_][a-zA-Z0-9_]*$' });
  }

  const newConfig = {
    host: host !== undefined ? host : currentConfig.host,
    port: port !== undefined ? parseInt(port, 10) : currentConfig.port,
    database: database !== undefined ? database : currentConfig.database,
    user: user !== undefined ? user : currentConfig.user,
    password: (password !== undefined && password !== '') ? password : currentConfig.password,
    schema: schema !== undefined ? schema : currentConfig.schema,
    ssl: ssl !== undefined ? Boolean(ssl) : currentConfig.ssl
  };

  try {
    const oldPool = pool;
    const newPool = createPgPool(newConfig);

    // Probar conexión antes de reemplazar permanentemente
    await newPool.query('SELECT 1');

    pool = newPool;
    currentConfig = newConfig;

    if (oldPool) {
      oldPool.end().catch(e => console.error('Error cerrando pool anterior:', e.message));
    }

    res.json({
      message: 'Conexión reconfigurada con éxito',
      config: {
        host: currentConfig.host,
        port: currentConfig.port,
        database: currentConfig.database,
        user: currentConfig.user,
        password: '',
        schema: currentConfig.schema,
        ssl: currentConfig.ssl
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Fallo al conectar con la nueva configuración' });
  }
});

// GET /api/health
app.get('/api/health', async (req, res) => {
  const start = Date.now();
  if (!pool) {
    return res.status(503).json({ error: 'Pool de base de datos no configurado' });
  }

  try {
    const result = await pool.query('SELECT current_schema() AS schema, version() AS version;');
    const latency = Date.now() - start;
    res.json({
      status: 'Conectado',
      schema: result.rows[0]?.schema || currentConfig.schema,
      version: result.rows[0]?.version || '',
      latencyMs: latency
    });
  } catch (err) {
    const latency = Date.now() - start;
    res.status(500).json({
      status: 'Error',
      error: err.message,
      latencyMs: latency
    });
  }
});

// GET /api/tables (8 tablas con conteo)
app.get('/api/tables', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'No hay conexión activa a la base de datos' });

  try {
    // Verificar tablas existentes en el esquema actual
    const existing = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = current_schema()`
    );
    const existingNames = new Set(existing.rows.map(r => r.table_name));

    const results = [];
    for (const tbl of KNOWN_TABLES) {
      if (existingNames.has(tbl)) {
        try {
          const countRes = await pool.query(`SELECT COUNT(*)::int AS count FROM "${tbl}"`);
          results.push({
            name: tbl,
            count: countRes.rows[0].count,
            exists: true
          });
        } catch (e) {
          results.push({ name: tbl, count: 0, exists: true, error: e.message });
        }
      } else {
        results.push({ name: tbl, count: 0, exists: false });
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tables/:name/meta
app.get('/api/tables/:name/meta', async (req, res) => {
  const { name } = req.params;
  try {
    const valid = await validateTableName(name);
    if (!valid) return res.status(404).json({ error: `Tabla "${name}" no encontrada en el esquema actual` });

    // Columnas
    const colsRes = await pool.query(
      `SELECT 
        column_name, 
        data_type, 
        udt_name,
        is_nullable, 
        column_default
       FROM information_schema.columns 
       WHERE table_schema = current_schema() AND table_name = $1
       ORDER BY ordinal_position`,
      [name]
    );

    // Foreign Keys
    const fkRes = await pool.query(
      `SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = current_schema()
        AND tc.table_name = $1`,
      [name]
    );

    const fks = {};
    for (const fk of fkRes.rows) {
      fks[fk.column_name] = {
        foreignTable: fk.foreign_table_name,
        foreignColumn: fk.foreign_column_name
      };
    }

    const columns = colsRes.rows.map(c => {
      const isAuto = c.column_name === 'id' || 
        (c.column_default && (
          c.column_default.includes('nextval') || 
          c.column_default.includes('gen_random_uuid') || 
          c.column_default.includes('now()') || 
          c.column_default.includes('CURRENT_TIMESTAMP')
        ));

      return {
        name: c.column_name,
        dataType: c.data_type,
        udtName: c.udt_name,
        isNullable: c.is_nullable === 'YES',
        defaultValue: c.column_default,
        isAutoGenerated: Boolean(isAuto),
        fk: fks[c.column_name] || null
      };
    });

    res.json({
      table: name,
      columns
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tables/:name/rows?limit=50&offset=0
app.get('/api/tables/:name/rows', async (req, res) => {
  const { name } = req.params;
  const limit = Math.max(1, parseInt(req.query.limit || '50', 10));
  const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

  try {
    const valid = await validateTableName(name);
    if (!valid) return res.status(404).json({ error: `Tabla "${name}" no encontrada` });

    const countRes = await pool.query(`SELECT COUNT(*)::int AS count FROM "${name}"`);
    const total = countRes.rows[0].count;

    let rowsQuery = `SELECT * FROM "${name}"`;
    // Intentar ordenar por id desc si tiene columna id
    try {
      const idCheck = await pool.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = current_schema() AND table_name = $1 AND column_name = 'id'`,
        [name]
      );
      if (idCheck.rows.length > 0) {
        rowsQuery += ` ORDER BY "id" DESC`;
      }
    } catch (_) {}

    rowsQuery += ` LIMIT $1 OFFSET $2`;
    const rowsRes = await pool.query(rowsQuery, [limit, offset]);

    res.json({
      table: name,
      total,
      limit,
      offset,
      rows: rowsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tables/:name/options (para selects de FK: { value, label })
app.get('/api/tables/:name/options', async (req, res) => {
  const { name } = req.params;
  try {
    const valid = await validateTableName(name);
    if (!valid) return res.status(404).json({ error: `Tabla "${name}" no encontrada` });

    // Determinar columnas de la tabla para elegir la mejor etiqueta
    const colsRes = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema = current_schema() AND table_name = $1
       ORDER BY ordinal_position`,
      [name]
    );

    const cols = colsRes.rows.map(c => c.column_name);
    // Buscar primera columna de texto (nombre, codigo, titulo, etc.)
    const preferredNames = ['nombre', 'codigo', 'name', 'code', 'descripcion', 'especie', 'lote'];
    let labelCol = cols.find(c => preferredNames.includes(c.toLowerCase()));
    
    if (!labelCol) {
      // Buscar cualquier columna de texto que no sea id
      const textCol = colsRes.rows.find(c => 
        c.column_name !== 'id' && 
        (c.data_type.includes('char') || c.data_type === 'text')
      );
      if (textCol) labelCol = textCol.column_name;
    }

    let query = '';
    if (labelCol && cols.includes('id')) {
      query = `SELECT "id", "${labelCol}" AS label_col FROM "${name}" ORDER BY "id" ASC LIMIT 200`;
    } else if (cols.includes('id')) {
      query = `SELECT "id" FROM "${name}" ORDER BY "id" ASC LIMIT 200`;
    } else {
      query = `SELECT * FROM "${name}" LIMIT 200`;
    }

    const rowsRes = await pool.query(query);
    const options = rowsRes.rows.map(r => {
      const val = r.id !== undefined ? r.id : Object.values(r)[0];
      let lbl = '';
      if (r.label_col !== undefined && r.label_col !== null) {
        lbl = `${r.label_col} (#${val})`;
      } else if (r.id !== undefined) {
        lbl = `#${r.id}`;
      } else {
        lbl = String(val);
      }
      return { value: val, label: lbl };
    });

    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tables/:name/rows
app.post('/api/tables/:name/rows', async (req, res) => {
  const { name } = req.params;
  const data = req.body;

  try {
    const valid = await validateTableName(name);
    if (!valid) return res.status(404).json({ error: `Tabla "${name}" no encontrada` });

    // Filtrar columnas que existen realmente en la tabla
    const colsRes = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_schema = current_schema() AND table_name = $1`,
      [name]
    );

    const validColNames = new Set(colsRes.rows.map(c => c.column_name));
    const keys = Object.keys(data).filter(k => validColNames.has(k) && data[k] !== undefined && data[k] !== '');

    if (keys.length === 0) {
      // Intentar DEFAULT VALUES si no hay columnas
      const insertQuery = `INSERT INTO "${name}" DEFAULT VALUES RETURNING *;`;
      const result = await pool.query(insertQuery);
      return res.status(201).json({
        message: 'Fila creada con valores por defecto',
        row: result.rows[0]
      });
    }

    const colList = keys.map(k => `"${k}"`).join(', ');
    const valPlaceholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => data[k]);

    const insertQuery = `INSERT INTO "${name}" (${colList}) VALUES (${valPlaceholders}) RETURNING *;`;
    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      message: 'Fila insertada con éxito',
      row: result.rows[0]
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Error al insertar registro' });
  }
});

// DELETE /api/tables/:name/rows/:id
app.delete('/api/tables/:name/rows/:id', async (req, res) => {
  const { name, id } = req.params;

  try {
    const valid = await validateTableName(name);
    if (!valid) return res.status(404).json({ error: `Tabla "${name}" no encontrada` });

    const deleteQuery = `DELETE FROM "${name}" WHERE "id" = $1 RETURNING *;`;
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Registro con id ${id} no encontrado en "${name}"` });
    }

    res.json({
      message: 'Registro eliminado con éxito',
      deleted: result.rows[0]
    });
  } catch (err) {
    // Si viola llave foránea, detallar de forma legible
    if (err.code === '23503') {
      return res.status(400).json({
        error: `No se puede eliminar el registro id ${id}: otros registros dependen de él (${err.detail || err.message}).`
      });
    }
    res.status(400).json({ error: err.message || 'Error al eliminar el registro' });
  }
});

// POST /api/reset (TRUNCATE TABLE ... RESTART IDENTITY CASCADE)
app.post('/api/reset', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'No hay conexión activa a la base de datos' });

  try {
    // Obtener todas las tablas existentes en el esquema actual
    const existing = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = current_schema()`
    );

    const existingNames = existing.rows
      .map(r => r.table_name)
      .filter(t => KNOWN_TABLES.includes(t));

    if (existingNames.length === 0) {
      return res.json({ message: 'No se encontraron tablas para truncar', counts: {} });
    }

    const tableList = existingNames.map(t => `"${t}"`).join(', ');
    await pool.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);

    // Obtener los conteos resultantes
    const counts = {};
    for (const tbl of existingNames) {
      const cRes = await pool.query(`SELECT COUNT(*)::int AS count FROM "${tbl}"`);
      counts[tbl] = cRes.rows[0].count;
    }

    res.json({
      message: `Se vaciaron ${existingNames.length} tablas con éxito`,
      counts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend de AgroCloud Tester activo en http://localhost:${PORT}`);
});
