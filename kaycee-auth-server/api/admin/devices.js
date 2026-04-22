/**
 * /api/admin/devices.js
 *
 * GET    → list all banned devices
 * POST   → ban / unban device
 * DELETE → unban device
 */
const { query, isAdmin, handleCors } = require('../../lib/db');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    if (!isAdmin(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });

    if (req.method === 'GET') {
        const devices = await query(
            `SELECT device_id, reason, created_at FROM banned_devices ORDER BY created_at DESC`
        );
        return res.json({ success: true, devices: devices.rows });
    }

    if (req.method === 'POST') {
        const { action, device_id, reason } = req.body;
        if (!device_id) return res.json({ success: false, error: 'device_id diperlukan' });

        if (action === 'ban') {
            await query(
                `INSERT INTO banned_devices (device_id, reason)
                 VALUES ($1, $2)
                 ON CONFLICT (device_id) DO UPDATE SET reason = $2`,
                [device_id, reason || 'Diblokir oleh admin']
            );
            return res.json({ success: true, message: `Device ${device_id} diblokir.` });
        }

        if (action === 'unban') {
            await query(`DELETE FROM banned_devices WHERE device_id = $1`, [device_id]);
            return res.json({ success: true, message: `Device ${device_id} di-unban.` });
        }
    }

    if (req.method === 'DELETE') {
        const { device_id } = req.body;
        if (!device_id) return res.json({ success: false, error: 'device_id diperlukan' });
        await query(`DELETE FROM banned_devices WHERE device_id = $1`, [device_id]);
        return res.json({ success: true, message: `Device ${device_id} dihapus dari blacklist.` });
    }

    res.status(405).json({ success: false, error: 'Method not allowed' });
};
