import pg from 'pg';

const { Pool } = pg;

// Read DATABASE_URL or build from connection parameters
const connectionString =
  process.env['DATABASE_URL'] ||
  'postgresql://usr_emergencyresponse_57:BzaxqdaqKBZAJJu2riaKqDiH@db.echo.oqens.me:5432/db_emergencyresponse_57';

let pool: pg.Pool | undefined;

export function getDbPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function queryDb<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  try {
    const client = getDbPool();
    const result = await client.query(text, params);
    return result.rows as T[];
  } catch (err) {
    console.error('[CloudRails direct DB query error]:', err);
    return [];
  }
}
