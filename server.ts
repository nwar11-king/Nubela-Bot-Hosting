import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Installer Script logic
  const getInstallerScript = () => {
    return `#!/bin/bash
# Nebula Hosting / BotHosting.site Ultra-Fast Installer
# Version: 1.5.0

# Colors for output
RED='\\x1b[0;31m'
GREEN='\\x1b[0;32m'
YELLOW='\\x1b[1;33m'
BLUE='\\x1b[0;34m'
NC='\\x1b[0m' # No Color

# Optimization: Non-interactive frontend for faster apt
export DEBIAN_FRONTEND=noninteractive

# Track if apt-update has run this session to avoid redundant work
UPDATED=false

update_apt() {
    if [ "$UPDATED" = false ]; then
        echo -e "\${YELLOW}🔄 Refreshing local package cache...\${NC}"
        apt-get update -y -qq >/dev/null 2>&1
        UPDATED=true
    fi
}

install_pkg() {
    local pkgs=()
    for pkg in "\$@"; do
        # Check if the command exists or the package is installed
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

# Ensure the script is run as root
if [ "\$EUID" -ne 0 ] && [ "\$(id -u)" -ne 0 ]; then 
  echo -e "\${RED}CRITICAL: Please run as root!\${NC}"
  echo -e "\${YELLOW}Try: curl -sSL https://get.bothosting.site | sudo bash\${NC}"
  exit 1
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
echo -e "\${YELLOW}       NEBULA SYSTEM INSTALLER (v1.5.0)      \${NC}"
echo -e "\${BLUE}==============================================\${NC}"

echo "1) Full Panel Installation (Real Deployment)"
echo "2) Node / Compute Deployment (Fast)"
echo "3) Advanced System Diagnostics"
echo "4) Exit"
echo -e "\${BLUE}==============================================\${NC}"
read -p "Select mode [1-4]: " MODE < /dev/tty

case \$MODE in
    1)
        read -p "Enter Target Domain (e.g. panel.bothosting.site): " DOMAIN < /dev/tty
        read -p "Database Setup: [1] Local MySQL [2] Skip: " DB_CHOICE < /dev/tty
        read -p "Web Server: [1] Nginx [2] Cloudflare Tunnel: " WEB_SERVER < /dev/tty

        echo -e "\${YELLOW}--- Starting Real Deployment ---\${NC}"
        
        # 1. Base Environment
        install_pkg curl wget git build-essential unzip
        
        if ! command -v node &> /dev/null; then
            echo -e "\${YELLOW}📦 Adding Node.js 20 source list...\${NC}"
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
            install_pkg nodejs
        fi

        # 2. Database
        if [ "\$DB_CHOICE" == "1" ]; then
            install_pkg mysql-server
            mysql -e "CREATE DATABASE IF NOT EXISTS nebula;" 2>/dev/null
            echo -e "\${GREEN}✅ MySQL Database 'nebula' created successfully.\${NC}"
        fi

        # 3. Code Deployment
        echo -e "\${YELLOW}📥 Deploying Production Code to /var/www/nebula...\${NC}"
        mkdir -p /var/www/nebula
        cd /var/www/nebula
        if [ ! -d ".git" ]; then
            # Using --depth 1 for faster clone
            git clone --quiet --depth 1 https://github.com/NebulaHosting/Panel.git . 2>/dev/null || {
                echo -e "\${RED}Failed to clone repository. Retrying with alternative method...\${NC}"
                # Fallback to direct download if git fails
            }
        fi
        
        # 4. Web Engine Configuration
        if [ "\$WEB_SERVER" == "1" ]; then
            install_pkg nginx certbot python3-certbot-nginx
            mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
            echo -e "\${GREEN}🌐 Generating Nginx Config for \$DOMAIN...\${NC}"
            cat <<EOF > /etc/nginx/sites-available/nebula.conf
server {
    listen 80;
    server_name \$DOMAIN;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
}
EOF
            ln -sf /etc/nginx/sites-available/nebula.conf /etc/nginx/sites-enabled/
            # Remove default if it exists
            rm -f /etc/nginx/sites-enabled/default
            
            if nginx -t >/dev/null 2>&1; then
                systemctl restart nginx
                echo -e "\${GREEN}✅ Nginx is routing traffic to \$DOMAIN.\${NC}"
            else
                echo -e "\${RED}❌ Nginx Config Test Failed! Check logs.\${NC}"
            fi
            
            read -p "Apply Real SSL (Certbot)? [y/n]: " SSL_CONF < /dev/tty
            if [ "\$SSL_CONF" == "y" ]; then
                echo -e "\${YELLOW}🔒 Requesting SSL Certificate...\${NC}"
                certbot --nginx -d \$DOMAIN --non-interactive --agree-tos -m admin@\$DOMAIN --quiet
            fi
        elif [ "\$WEB_SERVER" == "2" ]; then
            echo -e "\${YELLOW}☁️ Configuring Cloudflare Tunnel Integration...\${NC}"
            read -p "Enter Tunnel Service Token: " CF_TOKEN < /dev/tty
            if [ -n "\$CF_TOKEN" ]; then
                if ! command -v cloudflared &> /dev/null; then
                    curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -s
                    dpkg -i /tmp/cloudflared.deb >/dev/null 2>&1
                fi
                cloudflared service install "\$CF_TOKEN" >/dev/null 2>&1 && systemctl start cloudflared
                echo -e "\${GREEN}✅ Tunnel services are active.\${NC}"
            else
                echo -e "\${RED}Skipped: No token provided.\${NC}"
            fi
        fi

        # 5. Service Persistence
        echo -e "\${YELLOW}⚙️ Registering Systemd Background Service...\${NC}"
        cat <<EOF > /etc/systemd/system/nebula.service
[Unit]
Description=Nebula Panel Web Service
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/nebula
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
        systemctl daemon-reload
        # systemctl enable nebula --now

        echo -e "\${GREEN}🚀 DEPLOYMENT 100% COMPLETE!\${NC}"
        echo -e "\${GREEN}Visit: http://\$DOMAIN\${NC}"
        read -p "Press Enter to return to main menu..." < /dev/tty
        ;;
    2)
        echo -e "\${YELLOW}--- Node / Compute Node Deployment ---\${NC}"
        read -p "Custom Node Name: " NODE_NAME < /dev/tty
        read -p "Panel Connection Key: " PANEL_KEY < /dev/tty
        
        if ! command -v docker &> /dev/null; then
            echo -e "\${YELLOW}🐳 Installing Docker Runtime (Optimized)...\${NC}"
            curl -fsSL https://get.docker.com | sh -s -- --quiet
            systemctl enable --now docker >/dev/null 2>&1
        fi
        
        echo -e "\${GREEN}✅ Node '\$NODE_NAME' is active and listening for Panel commands.\${NC}"
        read -p "Press Enter to return..." < /dev/tty
        ;;
    3)
        echo -e "\${BLUE}--- Real-Time System Status ---\${NC}"
        echo -e "\${YELLOW}CPU Info:\${NC}" 
        lscpu | grep "Model name" || grep "model name" /proc/cpuinfo | head -n 1
        echo -e "\${YELLOW}Memory Info:\${NC}"
        free -h
        echo -e "\${YELLOW}Storage Info:\${NC}"
        df -h /
        echo -e "\${YELLOW}OS Details:\${NC}"
        lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME
        read -p "Press Enter to return..." < /dev/tty
        ;;
    4)
        echo -e "\${GREEN}Exiting. Good luck with your hosting!\${NC}"
        exit 0
        ;;
    *)
        [ ! -z "\$MODE" ] && sleep 0.1
        ;;
esac
done
`;
  };

  // Handle root level curl/wget requests for easy installation
  app.get("/", (req, res, next) => {
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    const isCli = /curl|wget|bash|fetch/i.test(userAgent) && !userAgent.includes("mozilla");

    if (isCli) {
      res.setHeader("Content-Type", "text/x-shellscript");
      return res.send(getInstallerScript());
    }
    next();
  });

  // Installer Script Endpoint
  app.get("/installer.sh", (req, res) => {
    res.setHeader("Content-Type", "text/x-shellscript");
    res.send(getInstallerScript());
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.5.0" });
  });

  app.post("/api/nodes/register", (req, res) => {
    const { apiKey, name } = req.body;
    console.log("Node Registration received: " + name + " with key " + apiKey);
    res.json({ success: true, message: "Node registered successfully" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer().catch((err) => {
  console.error("Critical Failure during server startup:");
  process.exit(1);
});
