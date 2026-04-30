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
# Version: 1.6.0

# Colors for output
RED='\\x1b[0;31m'
GREEN='\\x1b[0;32m'
YELLOW='\\x1b[1;33m'
BLUE='\\x1b[0;34m'
NC='\\x1b[0m'

# Check for root early
if [ "$EUID" -ne 0 ]; then 
  echo -e "\${RED}❌ ERROR: This script must be run as root.\${NC}"
  echo -e "\${YELLOW}Try: curl -sSL https://get.bothosting.site | sudo bash\${NC}"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# Optimized dependency tracker
install_essential_deps() {
    echo -e "\${BLUE}🔄 Syncing repositories and installing core tools...\${NC}"
    apt-get update -y -q
    apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx unzip software-properties-common
}

install_node() {
    if ! command -v node &> /dev/null; then
        echo -e "\${YELLOW}📦 Rapidly installing Node.js 20 LTS...\${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        echo -e "\${GREEN}✅ Node.js is already installed (\$(node -v))\${NC}"
    fi
}

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
echo -e "\${YELLOW}       NEBULA SYSTEM INSTALLER (v1.6.0)      \${NC}"
echo -e "\${BLUE}==============================================\${NC}"

echo "1) Full Panel Installation (Optimized)"
echo "2) Node / Compute Deployment (Instant)"
echo "3) System Diagnostics"
echo "4) Exit"
echo -e "\${BLUE}==============================================\${NC}"
read -p "Select choice [1-4]: " MODE < /dev/tty

case \$MODE in
    1)
        read -p "Domain: " DOMAIN < /dev/tty
        read -p "Install MySQL? [y/n]: " DB_CONF < /dev/tty
        read -p "Web Engine: [1] Nginx [2] Cloudflare: " WEB_CONF < /dev/tty

        echo -e "\${YELLOW}--- Turbo-Charging Panel Setup ---\${NC}"
        
        install_essential_deps
        install_node

        if [ "\$DB_CONF" == "y" ]; then
            echo -e "\${BLUE}💾 Installing MySQL Server...\${NC}"
            apt-get install -y mysql-server
            mysql -e "CREATE DATABASE IF NOT EXISTS nebula;"
        fi

        echo -e "\${BLUE}📥 Deploying system files to /var/www/nebula...\${NC}"
        mkdir -p /var/www/nebula
        cd /var/www/nebula
        if [ ! -d ".git" ]; then
            git clone --quiet --depth 1 https://github.com/NebulaHosting/Panel.git .
        fi

        if [ "\$WEB_CONF" == "1" ]; then
            echo -e "\${BLUE}🌐 High-speed Nginx Configuration...\${NC}"
            mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
            cat <<EOF > /etc/nginx/sites-available/nebula.conf
server {
    listen 80;
    server_name \$DOMAIN;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
    }
}
EOF
            ln -sf /etc/nginx/sites-available/nebula.conf /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
            nginx -t && systemctl restart nginx
            
            read -p "Enable SSL (y/n)? " SSL_YN < /dev/tty
            if [ "\$SSL_YN" == "y" ]; then
                certbot --nginx -d \$DOMAIN --non-interactive --agree-tos -m admin@\$DOMAIN
            fi
        elif [ "\$WEB_CONF" == "2" ]; then
            read -p "Cloudflare Tunnel Token: " CF_TOKEN < /dev/tty
            if [ -n "\$CF_TOKEN" ]; then
                curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -s
                dpkg -i /tmp/cloudflared.deb
                cloudflared service install "\$CF_TOKEN" && systemctl start cloudflared
            fi
        fi

        echo -e "\${YELLOW}⚙️ Setting up Nebula Daemon Service...\${NC}"
        cat <<EOF > /etc/systemd/system/nebula.service
[Unit]
Description=Nebula Backend
After=network.target

[Service]
WorkingDirectory=/var/www/nebula
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF
        systemctl daemon-reload
        echo -e "\${GREEN}🏁 SETUP COMPLETE! Access via: http://\$DOMAIN\${NC}"
        read -p "Done. Press Enter." < /dev/tty
        ;;
    2)
        echo -e "\${YELLOW}--- Rapid Node Setup ---\${NC}"
        read -p "Node Nickname: " NNAME < /dev/tty
        if ! command -v docker &> /dev/null; then
            echo -e "\${BLUE}🐳 Installing Docker Engine...\${NC}"
            curl -fsSL https://get.docker.com | sh
        fi
        echo -e "\${GREEN}✅ Node '\$NNAME' initialized.\${NC}"
        read -p "Press Enter." < /dev/tty
        ;;
    3)
        echo -e "\${BLUE}--- System Metrics ---\${NC}"
        free -h
        df -h /
        uptime
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
    if (ua.includes("curl") || ua.includes("wget") || ua.includes("bash")) {
      res.setHeader("Content-Type", "text/x-shellscript");
      return res.send(getInstallerScript());
    }
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "1.6.0" });
  });

  // Vite/Static serve
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Nebula Server running on :" + PORT);
  });
}

startServer().catch(console.error);
