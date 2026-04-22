/**
 * /api/admin/dashboard.js
 * GET /api/admin/dashboard
 * Header: X-Admin-Key: YOUR_KEY
 */
const { query, isAdmin, handleCors } = require('../../lib/db');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    if (!isAdmin(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });

    try {
        const [stats, users, banned_devices, recent_logs] = await Promise.all([
            query(`
                SELECT
                    COUNT(*) FILTER (WHERE TRUE)                   AS total_users,
                    COUNT(*) FILTER (WHERE is_banned = TRUE)       AS banned_users,
                    COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '24 hours') AS active_today,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS new_this_week
                FROM users
            `),
            query(`
                SELECT id, username, avatar, device_id, is_banned, ban_reason,
                       last_login, created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 100
            `),
            query(`SELECT device_id, reason, created_at FROM banned_devices ORDER BY created_at DESC`),
            query(`
                SELECT id, username, user_id, action, details, version, ip, created_at
                FROM logs
                ORDER BY created_at DESC
                LIMIT 50
            `)
        ]);

        res.json({
            success: true,
            stats: stats.rows[0],
            users: users.rows,
            banned_devices: banned_devices.rows,
            recent_logs: recent_logs.rows
        });

    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};
