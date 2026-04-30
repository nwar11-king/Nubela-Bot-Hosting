# 🌌 Nebula Hosting Panel
### Professional Discord Bot & Application Hosting Infrastructure

Nebula is a modern, high-performance hosting control panel designed for Discord bots and web applications. It features an automated "Zero-Touch" installer script that configures everything from Docker to Cloudflare Tunnels with a single command.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Stack: React/Vite/Express](https://img.shields.io/badge/Stack-React_|_Express_|_Firebase-61dafb.svg)]()

---

## 🚀 One-Line Installer

Deploy your panel or a new compute node to any Ubuntu/Debian server using the official installer:

```bash
curl -sSL https://get.bothosting.site/installer.sh | bash
```

### What it does:
- **Panel Mode:** Installs the Web UI, Nginx Reverse Proxy, Auto-SSL (Certbot), and MySQL.
- **Node Mode:** Installs Docker, Daemon, and bridges the server to your Panel via API key.
- **Security:** Configures UFW and optional Cloudflare Tunnels for NAT-bypassing.

---

## ✨ Features

- **Automated Fleet Management:** Add nodes via `curl` and manage them from one dashboard.
- **Dynamic Branding:** Change your panel name, colors, and logo directly from the settings.
- **Resource Monitoring:** Real-time CPU, RAM, and Network usage tracking.
- **Bot Instances:** Deploy bots using isolated Docker containers with custom subdomains.
- **Cloudflare Integration:** Built-in support for `cloudflared` tunnels.

---

## 🛠️ Developer Setup

If you want to contribute to the panel code or run it locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alexfn761/nebula-panel.git
   cd nebula-panel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file based on `.env.example`.

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture

- **Frontend:** React 19 + Tailwind CSS 4 + Motion.
- **Backend:** Node.js Express server.
- **Database:** Firebase/Firestore (Global State) + MySQL (Local Node Data).
- **Automation:** Bash / Shell scripts.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## ⚖️ Copyright

Copyright © 2026 Nebula Hosting. All Rights Reserved.
Built by alexfn761.
