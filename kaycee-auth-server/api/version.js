/**
 * /api/version.js — Versi ekstensi + daftar device yang di-ban
 * Menggantikan GitHub raw version.json
 */
const { query, handleCors } = require('../lib/db');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;

    try {
        const banned = await query(`SELECT device_id FROM banned_devices`);
        const bannedIds = banned.rows.map(r => r.device_id);

        res.json({
            version: '1.0.0',
            min_version: '1.0.0',
            status: 'active',
            message: '',
            banned_ids: bannedIds,
            ban_reason: 'Pelanggaran Kebijakan Kaycee Extension.'
        });
    } catch (err) {
        res.json({ version: '1.0.0', banned_ids: [], status: 'active' });
    }
};
