# V-INFINITY WISP Admin Cloud

A worldwide-accessible admin panel for your WISP business.  
Built with Node.js + Express. Deploys free on Render.com.

## What it does
- 🌍 Access from **anywhere in the world** via HTTPS URL
- 🔐 **Login protected** — only you can access it
- 📡 **Proxies all MikroTik API calls** from the server (solves CORS)
- 💎 Manage all **14 Premium Services** per PPPoE client
- 📊 Live router stats: CPU, uptime, active clients

## Deploy to Render.com (Free)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "V-INFINITY WISP Admin Cloud"
git remote add origin https://github.com/YOUR-USERNAME/wisp-admin-cloud
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Set these Environment Variables:

| Variable | Value |
|---|---|
| `MIKROTIK_IP` | Your router's PUBLIC IP (from ISP modem port-forward) |
| `MIKROTIK_USER` | `komalianimratorr` (your router username) |
| `MIKROTIK_PASS` | Your router password |
| `ADMIN_USER` | Your panel login username |
| `ADMIN_PASS` | Your panel login password |

6. Click **Deploy**
7. Your URL: `https://wisp-admin-cloud.onrender.com`

## MikroTik Setup Required
The router's REST API must be accessible from the internet:

**On your ISP modem:**  
Port forward: `WAN:8728` → `192.168.99.1:80` (or port 80)
Or use your existing OpenVPN/WireGuard tunnel IP to reach the router.

**On MikroTik:**  
Make sure `/ip/services` has `api-ssl` or `www` enabled.
