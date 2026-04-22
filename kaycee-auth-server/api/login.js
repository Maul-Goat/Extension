/**
 * /api/login.js
 *
 * ALUR:
 *  1. Terima username TikTok (tanpa password)
 *  2. Cek ban device
 *  3. Jika user BELUM ADA → auto-fetch profil dari TikTok API → simpan ke DB
 *  4. Jika user SUDAH ADA → langsung masuk, update last_login
 *  5. Cek ban user
 *  6. Return: username, avatar, is_new
 *
 * Set env var TIKTOK_API_URL ke URL deploy tiktok-api kamu di Vercel.
 * Contoh: https://kaycee-tiktok-api.vercel.app
 */

const { query, normalizeUsername, handleCors } = require('../lib/db');

const TIKTOK_API_URL = process.env.TIKTOK_API_URL || '';

async function fetchTikTokProfile(username) {
    if (!TIKTOK_API_URL) return { avatar: null };
    try {
        const fetch = require('node-fetch');
        const clean = username.replace('@', '');
        const res = await fetch(
            `${TIKTOK_API_URL}/api/user?username=${encodeURIComponent(clean)}`,
            { timeout: 10000 }
        );
        const json = await res.json();
        if (json.success) return { avatar: json.avatar || null };
    } catch (_) {}
    return { avatar: null };
}

module.exports = async (req, res) => {
    if (handleCors(req, res)) return;
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { username, device_id } = req.body;

        if (!username || username.trim().length < 2) {
            return res.json({ success: false, error: 'Username TikTok diperlukan.' });
        }

        const normalized = normalizeUsername(username);
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';

        // ── 1. Cek device ban ──────────────────────────────────────────────
        if (device_id) {
            const devBan = await query(
                `SELECT reason FROM banned_devices WHERE device_id = $1`,
                [device_id]
            );
            if (devBan.rows.length > 0) {
                return res.json({
                    success: false,
                    error: `BAN: Device diblokir. Alasan: ${devBan.rows[0].reason || 'Pelanggaran kebijakan'}`
                });
            }
        }

        // ── 2. Cari user di DB ─────────────────────────────────────────────
        const existing = await query(
            `SELECT * FROM users WHERE LOWER(username) = LOWER($1)`,
            [normalized]
        );

        let userRow;
        let is_new = false;

        if (existing.rows.length === 0) {
            // USER BARU: auto-fetch avatar dari TikTok lalu simpan
            const profile = await fetchTikTokProfile(normalized);
            const created = await query(
                `INSERT INTO users (username, avatar, device_id)
                 VALUES ($1, $2, $3) RETURNING *`,
                [normalized, profile.avatar, device_id || null]
            );
            userRow = created.rows[0];
            is_new  = true;
            console.log(`[NEW USER] ${normalized} | IP: ${ip}`);
        } else {
            userRow = existing.rows[0];
        }

        // ── 3. Cek ban user ────────────────────────────────────────────────
        if (userRow.is_banned) {
            return res.json({
                success: false,
                error: `BAN: ${userRow.ban_reason || 'Akses ditolak oleh administrator.'}`
            });
        }

        // ── 4. Jika avatar belum ada, coba fetch ulang ─────────────────────
        let finalAvatar = userRow.avatar;
        if (!finalAvatar) {
            const profile = await fetchTikTokProfile(normalized);
            finalAvatar = profile.avatar;
        }

        // ── 5. Update last_login, device_id, avatar ────────────────────────
        await query(
            `UPDATE users
             SET last_login = NOW(),
                 device_id  = COALESCE($1, device_id),
                 avatar     = COALESCE($2, avatar)
             WHERE LOWER(username) = LOWER($3)`,
            [device_id || null, finalAvatar || null, normalized]
        );

        // ── 6. Log ─────────────────────────────────────────────────────────
        await query(
            `INSERT INTO logs (username, user_id, action, details, version, ip)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [normalized, device_id||null,
             is_new ? 'AUTO-CREATE' : 'LOGIN',
             is_new ? 'User baru dibuat otomatis' : 'Login berhasil',
             req.body.version||'?', ip]
        ).catch(() => {});

        return res.json({
            success:  true,
            username: userRow.username,
            avatar:   finalAvatar || '',
            is_new
        });

    } catch (err) {
        console.error('[LOGIN ERROR]', err.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};
