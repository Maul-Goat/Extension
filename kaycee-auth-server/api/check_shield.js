/**
 * /api/check_shield.js
 * Dipanggil oleh content.js untuk cek apakah user/device di-ban
 */
const { query, normalizeUsername, handleCors } = require('../lib/db');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ isBanned: false });
    }

    try {
        const { username, device_id } = req.body;

        // Cek device ban
        if (device_id) {
            const devBan = await query(
                `SELECT reason FROM banned_devices WHERE device_id = $1`,
                [device_id]
            );
            if (devBan.rows.length > 0) {
                return res.json({
                    isBanned: true,
                    reason: devBan.rows[0].reason || 'Device diblokir.'
                });
            }
        }

        // Cek user ban
        if (username && username.trim().length > 1) {
            const normalized = normalizeUsername(username);
            const user = await query(
                `SELECT is_banned, ban_reason FROM users WHERE LOWER(username) = LOWER($1)`,
                [normalized]
            );
            if (user.rows.length > 0 && user.rows[0].is_banned) {
                return res.json({
                    isBanned: true,
                    reason: user.rows[0].ban_reason || 'Akun diblokir.'
                });
            }
        }

        return res.json({ isBanned: false });

    } catch (err) {
        console.error('[SHIELD ERROR]', err.message);
        return res.json({ isBanned: false });
    }
};
