/**
 * /api/admin/logs.js
 * GET /api/admin/logs?limit=100&username=@user
 */
const { query, isAdmin, handleCors } = require('../../lib/db');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    if (!isAdmin(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (req.method !== 'GET') return res.status(405).end();

    try {
        const limit    = Math.min(parseInt(req.query.limit) || 100, 500);
        const username = req.query.username;
        const action   = req.query.action;

        let conditions = [];
        let params     = [];
        let i          = 1;

        if (username) { conditions.push(`username ILIKE $${i++}`); params.push(`%${username}%`); }
        if (action)   { conditions.push(`action   ILIKE $${i++}`); params.push(`%${action}%`); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        params.push(limit);

        const logs = await query(
            `SELECT id, username, user_id, action, details, version, ip, created_at
             FROM logs
             ${where}
             ORDER BY created_at DESC
             LIMIT $${i}`,
            params
        );

        const totalRes = await query(`SELECT COUNT(*) FROM logs ${where}`,
            params.slice(0, params.length - 1));

        res.json({
            success: true,
            logs: logs.rows,
            total: parseInt(totalRes.rows[0].count)
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
