/**
 * lib/db.js
 * PostgreSQL connection pool — works with Vercel Postgres, Supabase, Neon, etc.
 * Set DATABASE_URL in your Vercel environment variables.
 */
const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL?.includes('localhost')
                ? false
                : { rejectUnauthorized: false }
        });
    }
    return pool;
}

// ─── Helper: run a query ─────────────────────────────────────────────────────
async function query(text, params = []) {
    const client = getPool();
    const result = await client.query(text, params);
    return result;
}

// ─── Normalize TikTok username: always "@username" lowercase ─────────────────
function normalizeUsername(raw = '') {
    let u = raw.trim().toLowerCase();
    if (!u.startsWith('@')) u = '@' + u;
    return u;
}

// ─── Middleware: check admin key ─────────────────────────────────────────────
function isAdmin(req) {
    const key = req.headers['x-admin-key'] || req.query?.key;
    return key === process.env.ADMIN_KEY;
}

// ─── CORS preflight helper ───────────────────────────────────────────────────
function handleCors(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

module.exports = { query, normalizeUsername, isAdmin, handleCors };
