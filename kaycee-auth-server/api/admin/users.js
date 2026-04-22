/**
 * /api/admin/users.js
 *
 * GET    /api/admin/users           → list all users (+ search ?q=)
 * POST   /api/admin/users           → ban / unban / delete
 * DELETE /api/admin/users           → delete user
 */
const { query, normalizeUsername, isAdmin, handleCors } = require('../../lib/db');

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    if (!isAdmin(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // ── GET: List / search users ──────────────────────────────────────────────
    if (req.method === 'GET') {
        try {
            const search = req.query.q || '';
            const page   = parseInt(req.query.page) || 1;
            const limit  = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            let q, params;
            if (search) {
                q = `
                    SELECT id, username, avatar, device_id, is_banned, ban_reason,
                           last_login, created_at
                    FROM users
                    WHERE username ILIKE $1
                    ORDER BY created_at DESC
                    LIMIT $2 OFFSET $3
                `;
                params = [`%${search}%`, limit, offset];
            } else {
                q = `
                    SELECT id, username, avatar, device_id, is_banned, ban_reason,
                           last_login, created_at
                    FROM users
                    ORDER BY created_at DESC
                    LIMIT $1 OFFSET $2
                `;
                params = [limit, offset];
            }

            const [users, total] = await Promise.all([
                query(q, params),
                query(`SELECT COUNT(*) FROM users ${search ? "WHERE username ILIKE $1" : ""}`,
                      search ? [`%${search}%`] : [])
            ]);

            return res.json({
                success: true,
                users: users.rows,
                total: parseInt(total.rows[0].count),
                page,
                limit
            });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // ── POST: Ban / Unban ─────────────────────────────────────────────────────
    if (req.method === 'POST') {
        try {
            const { action, username, reason } = req.body;
            if (!username) return res.json({ success: false, error: 'Username diperlukan' });
            const normalized = normalizeUsername(username);

            if (action === 'ban') {
                await query(
                    `UPDATE users SET is_banned = TRUE, ban_reason = $1
                     WHERE LOWER(username) = LOWER($2)`,
                    [reason || 'Diblokir oleh admin', normalized]
                );
                return res.json({ success: true, message: `${normalized} diblokir.` });
            }

            if (action === 'unban') {
                await query(
                    `UPDATE users SET is_banned = FALSE, ban_reason = NULL
                     WHERE LOWER(username) = LOWER($1)`,
                    [normalized]
                );
                return res.json({ success: true, message: `${normalized} di-unban.` });
            }

            if (action === 'update_avatar') {
                await query(
                    `UPDATE users SET avatar = $1 WHERE LOWER(username) = LOWER($2)`,
                    [req.body.avatar || null, normalized]
                );
                return res.json({ success: true, message: 'Avatar diperbarui.' });
            }

            return res.json({ success: false, error: 'Action tidak dikenal' });

        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // ── DELETE: Hapus user ────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
        try {
            const { username } = req.body;
            if (!username) return res.json({ success: false, error: 'Username diperlukan' });
            const normalized = normalizeUsername(username);

            await query(`DELETE FROM users WHERE LOWER(username) = LOWER($1)`, [normalized]);
            return res.json({ success: true, message: `${normalized} dihapus permanen.` });

        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    res.status(405).json({ success: false, error: 'Method not allowed' });
};
