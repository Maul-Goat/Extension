require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Token required' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' });
    if (password.length < 6)
        return res.status(400).json({ error: 'Password min. 6 characters' });

    try {
        const { data: existing } = await supabase
            .from('users').select('id').eq('username', username).single();
        if (existing)
            return res.status(409).json({ error: 'Username already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({ username, password: hashedPassword, is_active: true, plan: 'free', created_at: new Date().toISOString() })
            .select('id, username, plan')
            .single();
        if (error) throw error;

        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, plan: newUser.plan },
            process.env.JWT_SECRET, { expiresIn: '7d' }
        );
        res.json({ success: true, token, user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed. Try again.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' });

    try {
        const { data: user, error } = await supabase
            .from('users').select('*').eq('username', username).single();
        if (error || !user)
            return res.status(401).json({ error: 'Username or password incorrect' });
        if (!user.is_active)
            return res.status(403).json({ error: 'Account disabled' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: 'Username or password incorrect' });

        await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

        const token = jwt.sign(
            { id: user.id, username: user.username, plan: user.plan },
            process.env.JWT_SECRET, { expiresIn: '7d' }
        );
        res.json({ success: true, token, user: { id: user.id, username: user.username, plan: user.plan } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed. Try again.' });
    }
});

app.get('/api/verify', authMiddleware, async (req, res) => {
    try {
        const { data: user } = await supabase
            .from('users').select('id, username, plan, is_active').eq('id', req.user.id).single();
        if (!user || !user.is_active)
            return res.status(403).json({ error: 'Account not valid' });
        res.json({ success: true, user });
    } catch {
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = app;
