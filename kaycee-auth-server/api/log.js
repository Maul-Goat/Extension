/**
 * /api/log.js — Terima log dari ekstensi
 */
const { query, handleCors } = require('../lib/db');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { username, userId, action, details, version } = req.body;
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';

        await query(
            `INSERT INTO logs (username, user_id, action, details, version, ip)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [username || 'Anonim', userId || null, action || 'UNKNOWN', details || '', version || '?', ip]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('[LOG ERROR]', err.message);
        res.json({ success: false });
    }
};
