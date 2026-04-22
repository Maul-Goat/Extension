/**
 * /api/analyze.js
 * Proxy ke TikTok API (repo tiktok-api) yang di-deploy terpisah di Vercel.
 * Set env var: TIKTOK_API_URL=https://kaycee-tiktok-api.vercel.app
 *
 * GET /api/analyze?username=@kaycee
 */
const { handleCors } = require('../lib/db');

const TIKTOK_API_URL = process.env.TIKTOK_API_URL || '';

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;

    const { username } = req.query;
    if (!username) return res.json({ success: false, error: 'Username required' });

    if (!TIKTOK_API_URL) {
        return res.json({ success: false, error: 'TIKTOK_API_URL not configured' });
    }

    try {
        const fetch = require('node-fetch');
        const clean = username.replace('@', '').trim();
        const upstream = `${TIKTOK_API_URL}/api/analyze?username=${encodeURIComponent(clean)}`;

        const response = await fetch(upstream, { timeout: 30000 });
        const json = await response.json();

        // Forward response as-is (FastAPI sudah return format yang sama)
        return res.json(json);

    } catch (err) {
        console.error('[ANALYZE ERROR]', err.message);
        res.json({ success: false, error: 'SERVER_OFFLINE' });
    }
};
