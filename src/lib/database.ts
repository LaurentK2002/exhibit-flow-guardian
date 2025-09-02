// Local PostgreSQL database connection
import { createClient } from '@supabase/supabase-js'

// For local deployment, use your local PostgreSQL instance
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:3000'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'local-development-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Alternative: Direct PostgreSQL connection for server-side operations
import { Pool } from 'pg'

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'forensics_db',
  user: process.env.DB_USER || 'forensics_admin',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Database query helper
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Transaction helper
export async function transaction(callback: (client: any) => Promise<any>) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}