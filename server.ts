import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

// Safeguard against ReferenceErrors in shell script templates
const RED = "", GREEN = "", YELLOW = "", BLUE = "", CYAN = "", NC = "", HAS_SYSTEMD = "";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Installer Script logic
  const getInstallerScript = () => {
    return `#!/bin/bash
# Nebula Hosting / BotHosting.site Ultra-Fast Installer
# Version: 1.9.9

# Colors
RED='\\x1b[0;31m'
GREEN='\\x1b[0;32m'
YELLOW='\\x1b[1;33m'
BLUE='\\x1b[0;34m'
CYAN='\\x1b[0;36m'
NC='\\x1b[0m'

# Root Check
if [ "$EUID" -ne 0 ]; then 
  echo -e "\${RED}❌ ERROR: Root access required.\${NC}"
  echo -e "\${YELLOW}Please switch to root user (su -) and run again.\${NC}"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# Cache package lists once
UPDATED=false
update_apt() {
    if [ "$UPDATED" = false ]; then
        echo -e "\${BLUE}🔄 Syncing repositories (Turbo Mode)...\${NC}"
        apt-get update -y -qq >/dev/null 2>&1
        UPDATED=true
    fi
}

install_pkg() {
    local pkgs=()
    for pkg in "\$@"; do
        if ! command -v "\$pkg" &> /dev/null && ! dpkg -l "\$pkg" &> /dev/null; then
            pkgs+=("\$pkg")
        fi
    done
    if [ \${#pkgs[@]} -gt 0 ]; then
        update_apt
        echo -e "\${YELLOW}⚡ Installing dependencies: \${pkgs[*]}...\${NC}"
        apt-get install -y -qq --no-install-recommends "\${pkgs[@]}" >/dev/null 2>&1
    fi
}

# Advanced Init Detection
HAS_SYSTEMD=false
# Check if systemd is truly active (PID 1)
if [ -d /run/systemd/system ] || [ "$(ps -p 1 -o comm= 2>/dev/null)" = "systemd" ]; then
    if command -v systemctl &> /dev/null; then
        HAS_SYSTEMD=true
    fi
fi

while true; do
clear
echo -e "\${GREEN}
 ███▄    █ ▓█████  ▄▄▄▄   █    ██  ██▓    ▄▄▄      
 ██ ▀█   █ ▓█   ▀ ▓█████▄ ██  ▓██▒▓██▒   ▒████▄    
▓██  ▀█ ██▒▒███   ▒██▒ ▄██▓██  ▒██░▒██░   ▒██  ▀█▄  
▓██▒  ▐▌██▒▒▓█  ▄ ▒██░█▀  ▓██  ░██░▒██░   ░██▄▄▄▄██ 
 ▒██░   ▓██░░▒████▒░▓█  ▀█▓░▒█████▓ ░██████▒▓█   ▓██▒
\${NC}"

echo -e "\${BLUE}==============================================\${NC}"
echo -e "\${YELLOW}       NEBULA TURBO INSTALLER (v1.9.9)       \${NC}"
echo -e "       Init System: \$([ "\$HAS_SYSTEMD" = true ] && echo "systemd" || echo "non-systemd")\${NC}"
echo -e "\${BLUE}==============================================\${NC}"

echo "1) Full Panel Deployment (Real)"
echo "2) Node / Daemon Setup"
echo "3) System Information"
echo "4) Exit"
echo -e "\${BLUE}==============================================\${NC}"
read -p "Option [1-4]: " MODE < /dev/tty

case \$MODE in
    1)
        read -p "Your Domain (e.g. panel.example.com): " DOMAIN < /dev/tty
        read -p "Web Option: [1] Nginx [2] Cloudflare Tunnel: " WEB_CONF < /dev/tty

        echo -e "\${YELLOW}--- Environment Preparation ---\${NC}"
        
        # RAM Check
        TOTAL_RAM=\$(free -m | awk '/^Mem:/{print \$2}')
        if [ "\$TOTAL_RAM" -lt 1024 ]; then
            echo -e "\${RED}⚠️ LOW RAM DETECTED (\$TOTAL_RAM MB).\${NC}"
            echo -e "\${YELLOW}Panel installation might hang during npm install.\${NC}"
            read -p "Create 2GB Swap file for stability? (y/n): " SWAP_YN < /dev/tty
            if [ "\$SWAP_YN" == "y" ]; then
                fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
                echo "/swapfile none swap sw 0 0" >> /etc/fstab
                echo -e "\${GREEN}✅ Swap file active.\${NC}"
            fi
        fi

        install_pkg curl wget git build-essential nginx certbot python3-certbot-nginx

        # Node.js 20 check
        if ! command -v node &> /dev/null; then
            echo -e "\${YELLOW}📦 Fast-tracking Node.js 20...\${NC}"
            curl -sSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
            apt-get install -y -qq nodejs >/dev/null 2>&1
        fi

        # Get Server IP
        SERVER_IP=\$(curl -s https://ident.me || curl -s https://ifconfig.me)

        echo -e "\${BLUE}📥 Deploying Panel Files...\${NC}"
        mkdir -p /var/www/nebula
        cd /var/www/nebula
        
        # Robust Clone
        if [ ! -d ".git" ]; then
            git clone --quiet --depth 1 https://github.com/NebulaHosting/Panel.git . || {
                echo -e "\${RED}❌ Git clone failed! Check internet connection.\${NC}"
                read -p "Press Enter to exit." < /dev/tty
                continue
            }
        fi

        echo -e "\${YELLOW}📦 Fetching dependencies (npm install)...\${NC}"
        npm install --production --no-audit --no-fund >/dev/null 2>&1 || {
            echo -e "\${RED}❌ npm install failed. System might be out of RAM.\${NC}"
        }

        # Nginx Config
        if [ "\$WEB_CONF" == "1" ]; then
            echo -e "\${BLUE}🌐 Setting up Nginx VHost...\${NC}"
            cat <<EOF > /etc/nginx/sites-available/nebula.conf
server {
    listen 80;
    server_name \$DOMAIN;
    
    # Fast proxy headers
    proxy_buffer_size          128k;
    proxy_buffers              4 256k;
    proxy_busy_buffers_size    256k;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        
        proxy_read_timeout 600;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
    }
}
EOF
            ln -sf /etc/nginx/sites-available/nebula.conf /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
            if [ "\$HAS_SYSTEMD" = true ]; then
                nginx -t >/dev/null 2>&1 && systemctl restart nginx
            else
                service nginx restart
            fi
            
            read -p "Apply SSL now? (y/n): " SSL_YN < /dev/tty
            if [ "\$SSL_YN" == "y" ]; then
                certbot --nginx -d \$DOMAIN --non-interactive --agree-tos -m admin@\$DOMAIN --quiet
                W_PROTO="https"
            else
                W_PROTO="http"
            fi
        elif [ "\$WEB_CONF" == "2" ]; then
            echo -e "\${YELLOW}☁️ Cloudflare Tunnel Setup...\${NC}"
            read -p "Paste Your Tunnel Token: " CF_TOKEN < /dev/tty
            if [ -n "\$CF_TOKEN" ]; then
                if ! command -v cloudflared &> /dev/null; then
                    curl -sL --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
                    dpkg -i /tmp/cloudflared.deb >/dev/null 2>&1
                fi
                if [ "\$HAS_SYSTEMD" = true ]; then
                    cloudflared service install "\$CF_TOKEN" >/dev/null 2>&1 && systemctl start cloudflared
                else
                    cloudflared tunnel run --token "\$CF_TOKEN" &
                fi
                echo -e "\${GREEN}✅ Cloudflare Tunnel is now Active.\${NC}"
            fi
            W_PROTO="https" # Tunnels are usually HTTPS on the edge
        fi

        # Persistence & Startup
        if [ "\$HAS_SYSTEMD" = true ]; then
            echo -e "\${BLUE}⚙️ Configuring Systemd Service...\${NC}"
        else
            echo -e "\${BLUE}⚙️ Configuring Process Manager...\${NC}"
        fi
        
        # Detect absolute path of npm
        NPM_PATH=\$(command -v npm)
        if [ -z "\$NPM_PATH" ]; then NPM_PATH="/usr/bin/npm"; fi

        # Ensure correct permissions
        chown -R root:root /var/www/nebula
        chmod -R 755 /var/www/nebula

        if [ "\$HAS_SYSTEMD" = true ]; then
            cat <<EOF > /etc/systemd/system/nebula.service
[Unit]
Description=Nebula Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/nebula
ExecStart=\$NPM_PATH start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
            echo -e "\${YELLOW}🚀 Starting Nebula Panel via Systemd...\${NC}"
            systemctl daemon-reload
            systemctl stop nebula >/dev/null 2>&1
            systemctl enable nebula --now >/dev/null 2>&1
        elif command -v pm2 &> /dev/null; then
            echo -e "\${YELLOW}🚀 Starting Nebula Panel via PM2...\${NC}"
            cd /var/www/nebula && pm2 start npm --name "nebula" -- start >/dev/null 2>&1
            pm2 save >/dev/null 2>&1
        else
            echo -e "\${YELLOW}⚠️ No advanced process manager found. Running via nohup...\${NC}"
            cd /var/www/nebula && nohup npm start > panel.log 2>&1 &
        fi

        # Final Verification
        echo -e "\${YELLOW}🔍 Verifying deployment (checking port 3000)...\${NC}"
        # Give it a bit more time for initial start
        sleep 5
        READY=false
        if command -v lsof &> /dev/null; then
            if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
                READY=true
            fi
        fi

        # Summary Screen
        clear
        if [ "\$READY" = true ]; then
            echo -e "\${GREEN}🚀 DEPLOYMENT 100% SUCCESSFUL!\${NC}"
        else
            echo -e "\${YELLOW}⚠️ SERVICE REGISTERED. (Waiting for port 3000)...\${NC}"
        fi
        echo -e "\${BLUE}==============================================\${NC}"
        echo -e "URL: \${YELLOW}\$W_PROTO://\$DOMAIN\${NC}"
        echo -e "Server IP: \${YELLOW}\$SERVER_IP\${NC}"
        echo -e "\${BLUE}==============================================\${NC}"
        echo -e "\${GREEN}Management Info:\${NC}"
        if [ "\$HAS_SYSTEMD" = true ]; then
            echo -e "Logs: \${CYAN}journalctl -u nebula -f\${NC}"
            echo -e "Status: \${CYAN}systemctl status nebula\${NC}"
        elif command -v pm2 &> /dev/null; then
            echo -e "Logs: \${CYAN}pm2 logs nebula\${NC}"
            echo -e "Status: \${CYAN}pm2 status\${NC}"
        else
            echo -e "Logs: \${CYAN}tail -f /var/www/nebula/panel.log\${NC}"
            echo -e "Note: Process is running in background (nohup).\${NC}"
        fi
        echo -e "\${BLUE}==============================================\${NC}"
        read -p "Press Enter to return to menu." < /dev/tty
        ;;
    2)
        echo -e "\${YELLOW}--- Node Runner Setup ---\${NC}"
        if ! command -v docker &> /dev/null; then
            echo -e "\${BLUE}🐳 Deploying Docker Engine...\${NC}"
            curl -sSL https://get.docker.com | sh >/dev/null 2>&1
            if [ "\$HAS_SYSTEMD" = true ]; then
                systemctl enable --now docker >/dev/null 2>&1
            fi
        fi
        echo -e "\${GREEN}✅ Node is ready to be linked.\${NC}"
        echo -e "Run nodes with Docker to ensure isolated environments."
        read -p "Press Enter." < /dev/tty
        ;;
    3)
        echo -e "\${BLUE}--- Server Specs ---\${NC}"
        echo -e "Public IP: \$(curl -s ident.me || echo 'Unknown')"
        free -h | awk '/^Mem:/ {print "RAM: "\$3"/"\$2}'
        echo -e "Systemd Available: \$HAS_SYSTEMD"
        read -p "Press Enter." < /dev/tty
        ;;
    4)
        exit 0
        ;;
esac
done
`;
  };

  // CLI Handler
  app.get("/", (req, res, next) => {
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    const isCli = /curl|wget|bash|fetch/i.test(ua) && !ua.includes("mozilla");
    if (isCli) {
      res.setHeader("Content-Type", "text/x-shellscript");
      return res.send(getInstallerScript());
    }
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.9.9" });
  });

  // Serve static UI
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Nebula 1.9.9 running on :" + PORT);
  });
}

startServer().catch(console.error);
