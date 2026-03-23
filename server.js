const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session for admin login
app.use(session({
  secret: process.env.SESSION_SECRET || 'v-infinity-wisp-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// Config from environment variables (set on Render.com)
const MIKROTIK_IP   = process.env.MIKROTIK_IP   || '192.168.99.1';
const MIKROTIK_USER = process.env.MIKROTIK_USER || 'admin';
const MIKROTIK_PASS = process.env.MIKROTIK_PASS || '';
const ADMIN_USER    = process.env.ADMIN_USER    || 'admin';
const ADMIN_PASS    = process.env.ADMIN_PASS    || 'wisp2024';

const MIKROTIK_BASE = `http://${MIKROTIK_IP}/rest`;
const MIKROTIK_AUTH = 'Basic ' + Buffer.from(`${MIKROTIK_USER}:${MIKROTIK_PASS}`).toString('base64');

// ── AUTH MIDDLEWARE ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect('/login');
}

// ── LOGIN PAGE ─────────────────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  if (req.session.loggedIn) return res.redirect('/');
  res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>V-INFINITY Admin Login</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#050810;font-family:'Outfit',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;
background-image:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(99,102,241,.15),transparent);}
.card{background:#0d1117;border:1px solid rgba(99,102,241,.2);border-radius:20px;padding:40px;width:380px;text-align:center;}
h1{font-size:1.8rem;font-weight:900;background:linear-gradient(135deg,#6366f1,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;}
p{color:#64748b;font-size:.9rem;margin-bottom:28px;}
input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(99,102,241,.2);border-radius:10px;padding:12px 16px;
color:#e2e8f0;font-family:'Outfit',sans-serif;font-size:.95rem;margin-bottom:12px;}
input:focus{outline:none;border-color:#6366f1;}
button{width:100%;padding:13px;background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;border-radius:10px;
color:#fff;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;cursor:pointer;margin-top:6px;}
.err{color:#ef4444;font-size:.85rem;margin-top:10px;}
</style>
</head>
<body>
<div class="card">
  <h1>🦾 V-INFINITY</h1>
  <p>WISP Admin Panel — Worldwide Access</p>
  <form method="POST" action="/login">
    <input type="text" name="user" placeholder="Admin Username" required />
    <input type="password" name="pass" placeholder="Password" required />
    <button type="submit">🔑 Login</button>
    ${req.query.err ? '<div class="err">❌ Wrong username or password</div>' : ''}
  </form>
</div>
</body>
</html>`);
});

app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect('/');
  }
  res.redirect('/login?err=1');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ── MIKROTIK PROXY API ─────────────────────────────────────────────────────────
// Proxies all requests to the MikroTik from the server side (no CORS issues)
app.all('/api/mikrotik/*', requireAuth, async (req, res) => {
  const endpoint = req.params[0];
  const queryString = new URLSearchParams(req.query).toString();
  const url = `${MIKROTIK_BASE}/${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    const options = {
      method: req.method,
      headers: {
        'Authorization': MIKROTIK_AUTH,
        'Content-Type': 'application/json'
      }
    };

    if (['PUT', 'PATCH', 'POST'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.text();

    res.status(response.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    console.error('MikroTik proxy error:', err.message);
    res.status(503).json({ error: 'Cannot reach router', detail: err.message });
  }
});

// ── ROUTER STATUS ──────────────────────────────────────────────────────────────
app.get('/api/status', requireAuth, async (req, res) => {
  try {
    const r = await fetch(`${MIKROTIK_BASE}/system/resource`, {
      headers: { 'Authorization': MIKROTIK_AUTH }
    });
    const data = await r.json();
    res.json({ ok: true, version: data.version, uptime: data.uptime, cpu: data['cpu-load'] });
  } catch {
    res.json({ ok: false, error: 'Router unreachable' });
  }
});

// ── MAIN APP (serve index.html) ─────────────────────────────────────────────
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🦾 V-INFINITY WISP Admin Cloud running on port ${PORT}`);
  console.log(`   MikroTik: ${MIKROTIK_BASE}`);
  console.log(`   Admin user: ${ADMIN_USER}`);
});
