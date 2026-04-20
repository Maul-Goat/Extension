// =================== KONFIGURASI ===================
// GANTI INI dengan URL server kamu setelah deploy ke Render
const API_URL = 'https://NAMA-APP-KAMU.onrender.com';

// =================== STATE ===================
let currentUser = null;

// =================== INIT ===================
document.addEventListener("DOMContentLoaded", async () => {
    const overlay = document.getElementById('loading-overlay');

    try {
        const data = await chrome.storage.local.get(['authToken', 'userData', 'fpsEnabled']);

        if (data.authToken && data.userData) {
            // Ada token → verifikasi ke server
            const valid = await verifyToken(data.authToken);
            if (valid) {
                currentUser = data.userData;
                showMainPage(data.fpsEnabled || false);
            } else {
                // Token expired → hapus, tampilkan login
                await chrome.storage.local.remove(['authToken', 'userData']);
                showAuthPage();
            }
        } else {
            showAuthPage();
        }
    } catch (err) {
        console.error('Init error:', err);
        showAuthPage();
    } finally {
        overlay.style.display = 'none';
    }
});

// =================== VERIFY TOKEN ===================
async function verifyToken(token) {
    try {
        const res = await fetch(`${API_URL}/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return false;
        const json = await res.json();
        return json.success;
    } catch {
        // Server tidak bisa dicapai → tetap pakai data lokal
        return true;
    }
}

// =================== LOGIN ===================
async function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    const btn = document.getElementById('btn-login');

    if (!email || !pass) return showError('Isi email dan password');

    btn.disabled = true;
    btn.textContent = 'Memproses...';
    hideError();

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            showError(json.error || 'Login gagal');
            return;
        }

        await chrome.storage.local.set({
            authToken: json.token,
            userData: json.user
        });

        currentUser = json.user;
        showMainPage(false);

    } catch (err) {
        showError('Tidak bisa terhubung ke server. Coba lagi.');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Masuk';
    }
}

// =================== REGISTER ===================
async function doRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const btn = document.getElementById('btn-register');

    if (!username || !email || !pass) return showError('Isi semua kolom');
    if (pass.length < 6) return showError('Password minimal 6 karakter');

    btn.disabled = true;
    btn.textContent = 'Mendaftar...';
    hideError();

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass, username })
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            showError(json.error || 'Pendaftaran gagal');
            return;
        }

        await chrome.storage.local.set({
            authToken: json.token,
            userData: json.user
        });

        currentUser = json.user;
        showMainPage(false);

    } catch (err) {
        showError('Tidak bisa terhubung ke server. Coba lagi.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Buat Akun';
    }
}

// =================== LOGOUT ===================
async function doLogout() {
    await chrome.storage.local.remove(['authToken', 'userData', 'fpsEnabled']);

    // Matikan 60FPS di tab aktif
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('tiktok.com')) {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                world: 'MAIN',
                func: () => { if (typeof window.reset60FPS === 'function') window.reset60FPS(); }
            });
        }
    } catch {}

    currentUser = null;
    showAuthPage();
}

// =================== TOGGLE FPS ===================
document.getElementById('fps-toggle').addEventListener('change', async function() {
    const enabled = this.checked;

    await chrome.storage.local.set({ fpsEnabled: enabled });
    updateToggleUI(enabled);

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.includes('tiktok.com')) {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                world: 'MAIN',
                func: (state) => {
                    if (state) {
                        if (typeof window.activate60FPS === 'function') window.activate60FPS();
                    } else {
                        if (typeof window.reset60FPS === 'function') window.reset60FPS();
                    }
                },
                args: [enabled]
            });
        }
    } catch (err) {
        console.error('Script error:', err);
    }
});

// =================== UI HELPERS ===================
function showAuthPage() {
    document.getElementById('page-auth').classList.add('active');
    document.getElementById('page-main').classList.remove('active');
}

function showMainPage(fpsEnabled) {
    document.getElementById('page-auth').classList.remove('active');
    document.getElementById('page-main').classList.add('active');

    if (currentUser) {
        const initials = (currentUser.username || currentUser.email || '?').slice(0, 2).toUpperCase();
        document.getElementById('user-avatar').textContent = initials;
        document.getElementById('user-name').textContent = currentUser.username || '–';
        document.getElementById('user-email').textContent = currentUser.email || '–';

        const badge = document.getElementById('plan-badge');
        badge.textContent = (currentUser.plan || 'free').toUpperCase();
        if (currentUser.plan === 'pro') badge.classList.add('pro');
    }

    const toggle = document.getElementById('fps-toggle');
    toggle.checked = fpsEnabled;
    updateToggleUI(fpsEnabled);
}

function updateToggleUI(active) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (active) {
        dot.classList.add('on');
        text.classList.add('on');
        text.textContent = 'Aktif — 60FPS menyala';
    } else {
        dot.classList.remove('on');
        text.classList.remove('on');
        text.textContent = 'Nonaktif';
    }
}

function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.add('show');
}

function hideError() {
    document.getElementById('auth-error').classList.remove('show');
}

function switchTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('form-login').style.display = isLogin ? 'flex' : 'none';
    document.getElementById('form-register').style.display = isLogin ? 'none' : 'flex';
    document.getElementById('tab-login-btn').classList.toggle('active', isLogin);
    document.getElementById('tab-reg-btn').classList.toggle('active', !isLogin);
    hideError();
}
